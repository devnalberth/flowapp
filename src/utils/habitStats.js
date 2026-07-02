// Métricas e agregações da área de Hábitos.
// Fonte da verdade: completed_dates (alias `completions`, array de chaves "YYYY-MM-DD" locais).
// Streaks são SEMPRE deriváveis do histórico (não confiar na aritmética manual antiga).

export const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

// Chave de data LOCAL (mesma fórmula offset usada em AppContext/focusLogService —
// corrige o bug de fuso que adiantava o dia à noite). Nunca usar toISOString() direto.
export function localDateKey(date = new Date()) {
  const offset = date.getTimezoneOffset()
  return new Date(date.getTime() - offset * 60 * 1000).toISOString().split('T')[0]
}

// Normaliza custom_days vindo em qualquer formato legado: array, JSON string ou CSV.
export function parseCustomDays(habit) {
  let days = habit?.customDays ?? habit?.selectedDays ?? habit?.custom_days ?? []
  if (typeof days === 'string') {
    if (!days.trim()) {
      days = []
    } else {
      try {
        days = JSON.parse(days)
      } catch (e) {
        days = days.split(',').map((d) => parseInt(d.trim(), 10))
      }
    }
  }
  if (!Array.isArray(days)) return []
  return days.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n <= 6)
}

function completionsOf(habit) {
  if (Array.isArray(habit?.completions)) return habit.completions
  if (Array.isArray(habit?.completed_dates)) return habit.completed_dates
  return []
}

// Piso do hábito: dias anteriores à criação não contam como "falha" nas taxas.
// Se houver conclusão anterior ao created_at (dado migrado), o piso recua até ela.
function habitStartKey(habit) {
  const completions = completionsOf(habit)
  const firstDone = completions.length
    ? completions.reduce((a, b) => (a < b ? a : b))
    : null
  let createdKey = null
  const created = habit?.created_at || habit?.createdAt
  if (created) {
    const d = new Date(created)
    if (!Number.isNaN(d.getTime())) createdKey = localDateKey(d)
  }
  if (createdKey && firstDone) return createdKey < firstDone ? createdKey : firstDone
  return createdKey || firstDone
}

// Pré-computa o que precisamos por hábito para varrer muitos dias com custo O(1)/dia.
function buildHabitInfo(habit) {
  const frequency = habit?.frequency || 'daily'
  const isDaily = frequency === 'daily'
  return {
    habit,
    isDaily,
    days: isDaily ? null : parseCustomDays(habit),
    doneSet: new Set(completionsOf(habit)),
    startKey: habitStartKey(habit),
  }
}

function isActiveInfo(info, dateObj, dateKey) {
  if (info.startKey && dateKey < info.startKey) return false
  if (info.isDaily) return true
  if (!info.days || info.days.length === 0) return false
  return info.days.includes(dateObj.getDay())
}

// Hábito está agendado (e já existia) nesta data?
export function isHabitActiveOnDate(habit, dateObj) {
  return isActiveInfo(buildHabitInfo(habit), dateObj, localDateKey(dateObj))
}

export function isHabitDoneOn(habit, dateKey) {
  return completionsOf(habit).includes(dateKey)
}

// Estatística de um dia: hábitos agendados vs concluídos.
// rate = null quando não há hábitos agendados (dia "neutro", não 0%).
export function getDayStats(habits, dateObj = new Date()) {
  const dateKey = localDateKey(dateObj)
  let scheduled = 0
  let completed = 0
  for (const habit of habits || []) {
    const info = buildHabitInfo(habit)
    if (!isActiveInfo(info, dateObj, dateKey)) continue
    scheduled += 1
    if (info.doneSet.has(dateKey)) completed += 1
  }
  return { scheduled, completed, rate: scheduled > 0 ? completed / scheduled : null }
}

// Recomputa streaks a partir do histórico, respeitando frequency/custom_days:
// - current: caminha de hoje para trás só sobre dias agendados; dia agendado sem
//   conclusão quebra — exceto HOJE pendente (a sequência continua valendo).
// - best: varre do piso (created_at/primeira conclusão) até hoje.
const STREAK_SCAN_CAP = 3660 // ~10 anos; proteção contra loops em dados corrompidos

export function computeStreaks(habit, today = new Date()) {
  const info = buildHabitInfo(habit)
  if (!info.startKey && info.doneSet.size === 0) return { current: 0, best: 0 }

  const todayKey = localDateKey(today)
  const floorKey = info.startKey || todayKey

  // Streak atual (de hoje para trás)
  let current = 0
  const cursor = new Date(today)
  for (let i = 0; i < STREAK_SCAN_CAP; i++) {
    const key = localDateKey(cursor)
    if (key < floorKey) break
    if (isActiveInfo(info, cursor, key)) {
      if (info.doneSet.has(key)) {
        current += 1
      } else if (key !== todayKey) {
        break
      }
      // hoje pendente não quebra: segue contando a partir de ontem
    }
    cursor.setDate(cursor.getDate() - 1)
  }

  // Melhor streak (do piso até hoje)
  let best = 0
  let run = 0
  const fwd = (() => {
    const [y, m, d] = floorKey.split('-').map(Number)
    return new Date(y, m - 1, d)
  })()
  for (let i = 0; i < STREAK_SCAN_CAP; i++) {
    const key = localDateKey(fwd)
    if (key > todayKey) break
    if (isActiveInfo(info, fwd, key)) {
      if (info.doneSet.has(key)) {
        run += 1
        if (run > best) best = run
      } else if (key !== todayKey) {
        run = 0
      }
    }
    fwd.setDate(fwd.getDate() + 1)
  }

  return { current, best: Math.max(best, current) }
}

// Agregado num intervalo de dias (inclusivo): taxas, dias 100% e dias com agenda.
export function getRangeStats(habits, startDate, endDate = new Date()) {
  const infos = (habits || []).map(buildHabitInfo)
  const endKey = localDateKey(endDate)
  let scheduled = 0
  let completed = 0
  let perfectDays = 0
  let activeDays = 0
  const cursor = new Date(startDate)
  for (let i = 0; i < STREAK_SCAN_CAP; i++) {
    const key = localDateKey(cursor)
    if (key > endKey) break
    let daySched = 0
    let dayDone = 0
    for (const info of infos) {
      if (!isActiveInfo(info, cursor, key)) continue
      daySched += 1
      if (info.doneSet.has(key)) dayDone += 1
    }
    if (daySched > 0) {
      activeDays += 1
      scheduled += daySched
      completed += dayDone
      if (dayDone === daySched) perfectDays += 1
    }
    cursor.setDate(cursor.getDate() + 1)
  }
  return {
    scheduled,
    completed,
    rate: scheduled > 0 ? completed / scheduled : null,
    perfectDays,
    activeDays,
  }
}

// Tendência semanal (dom→sáb), semanas mais antigas primeiro; semana atual parcial.
// Semanas sem nenhum hábito agendado saem com rate = null (omitir do gráfico).
export function getWeeklyTrend(habits, weeksBack = 12) {
  const infos = (habits || []).map(buildHabitInfo)
  const today = new Date()
  const todayKey = localDateKey(today)
  const weeks = []

  const currentWeekStart = new Date(today)
  currentWeekStart.setDate(currentWeekStart.getDate() - currentWeekStart.getDay())

  for (let w = weeksBack - 1; w >= 0; w--) {
    const weekStart = new Date(currentWeekStart)
    weekStart.setDate(weekStart.getDate() - w * 7)
    let scheduled = 0
    let completed = 0
    const cursor = new Date(weekStart)
    for (let d = 0; d < 7; d++) {
      const key = localDateKey(cursor)
      if (key > todayKey) break
      for (const info of infos) {
        if (!isActiveInfo(info, cursor, key)) continue
        scheduled += 1
        if (info.doneSet.has(key)) completed += 1
      }
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push({
      label: `${String(weekStart.getDate()).padStart(2, '0')}/${String(weekStart.getMonth() + 1).padStart(2, '0')}`,
      weekStartKey: localDateKey(weekStart),
      scheduled,
      completed,
      rate: scheduled > 0 ? completed / scheduled : null,
    })
  }
  return weeks
}

// Dados para o heatmap estilo GitHub: colunas = semanas (dom no topo), futuro = null.
// singleHabit: restringe ao heatmap individual (modal de detalhe).
export function getHeatmapData(habits, daysBack = 126, singleHabit = null) {
  const list = singleHabit ? [singleHabit] : habits || []
  const infos = list.map(buildHabitInfo)
  const today = new Date()
  const todayKey = localDateKey(today)

  // Início: daysBack atrás, arredondado para trás até um domingo
  const start = new Date(today)
  start.setDate(start.getDate() - (daysBack - 1))
  start.setDate(start.getDate() - start.getDay())

  const weeks = []
  const monthLabels = []
  let lastMonth = -1
  const cursor = new Date(start)

  while (localDateKey(cursor) <= todayKey) {
    const column = []
    for (let d = 0; d < 7; d++) {
      const key = localDateKey(cursor)
      if (key > todayKey) {
        column.push(null)
      } else {
        if (d === 0 && cursor.getMonth() !== lastMonth) {
          lastMonth = cursor.getMonth()
          monthLabels.push({
            index: weeks.length,
            label: cursor.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
          })
        }
        let scheduled = 0
        let completed = 0
        for (const info of infos) {
          if (!isActiveInfo(info, cursor, key)) continue
          scheduled += 1
          if (info.doneSet.has(key)) completed += 1
        }
        column.push({
          dateKey: key,
          dateObj: new Date(cursor),
          scheduled,
          completed,
          rate: scheduled > 0 ? completed / scheduled : null,
          isToday: key === todayKey,
        })
      }
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(column)
  }

  return { weeks, monthLabels }
}

// Consistência por hábito na janela: ordenado por taxa desc (sem dados vai pro fim).
export function getHabitConsistency(habits, daysBack = 30) {
  const today = new Date()
  const todayKey = localDateKey(today)
  const windowStart = new Date(today)
  windowStart.setDate(windowStart.getDate() - (daysBack - 1))

  const rows = (habits || []).map((habit) => {
    const info = buildHabitInfo(habit)
    let scheduled = 0
    let completed = 0
    const cursor = new Date(windowStart)
    for (let d = 0; d < daysBack; d++) {
      const key = localDateKey(cursor)
      if (key > todayKey) break
      if (isActiveInfo(info, cursor, key)) {
        scheduled += 1
        if (info.doneSet.has(key)) completed += 1
      }
      cursor.setDate(cursor.getDate() + 1)
    }
    return {
      id: habit.id,
      label: habit.label || habit.name || 'Hábito',
      category: habit.category || null,
      scheduled,
      completed,
      rate: scheduled > 0 ? completed / scheduled : null,
    }
  })

  return rows.sort((a, b) => {
    if (a.rate === null && b.rate === null) return 0
    if (a.rate === null) return 1
    if (b.rate === null) return -1
    return b.rate - a.rate
  })
}

// Taxa agregada por categoria na janela (para o breakdown da view Estatísticas).
export function getCategoryBreakdown(habits, daysBack = 30) {
  const byHabit = getHabitConsistency(habits, daysBack)
  const groups = {}
  for (const row of byHabit) {
    const cat = row.category || 'outros'
    if (!groups[cat]) groups[cat] = { categoryId: cat, scheduled: 0, completed: 0, habits: 0 }
    groups[cat].scheduled += row.scheduled
    groups[cat].completed += row.completed
    groups[cat].habits += 1
  }
  return Object.values(groups)
    .map((g) => ({ ...g, rate: g.scheduled > 0 ? g.completed / g.scheduled : null }))
    .sort((a, b) => (b.rate ?? -1) - (a.rate ?? -1))
}

// Dia da semana com maior taxa de conclusão do hábito (modal de detalhe).
export function getBestWeekday(habit, daysBack = 90) {
  const info = buildHabitInfo(habit)
  const today = new Date()
  const todayKey = localDateKey(today)
  const buckets = Array.from({ length: 7 }, () => ({ scheduled: 0, completed: 0 }))

  const cursor = new Date(today)
  cursor.setDate(cursor.getDate() - (daysBack - 1))
  for (let d = 0; d < daysBack; d++) {
    const key = localDateKey(cursor)
    if (key > todayKey) break
    if (isActiveInfo(info, cursor, key)) {
      const bucket = buckets[cursor.getDay()]
      bucket.scheduled += 1
      if (info.doneSet.has(key)) bucket.completed += 1
    }
    cursor.setDate(cursor.getDate() + 1)
  }

  let bestIdx = -1
  let bestRate = -1
  buckets.forEach((b, i) => {
    if (b.scheduled === 0) return
    const rate = b.completed / b.scheduled
    if (rate > bestRate) {
      bestRate = rate
      bestIdx = i
    }
  })
  if (bestIdx === -1) return null
  return { dow: bestIdx, label: WEEKDAY_LABELS[bestIdx], rate: bestRate }
}

export function totalCompletions(habits) {
  return (habits || []).reduce((acc, h) => acc + completionsOf(h).length, 0)
}

// "125" min → "2h05" · "45" → "45m" · "120" → "2h"
export function formatMinutes(min) {
  const m = Math.max(0, Math.round(min || 0))
  if (m < 60) return `${m}m`
  const h = Math.floor(m / 60)
  const rest = m % 60
  return rest > 0 ? `${h}h${String(rest).padStart(2, '0')}` : `${h}h`
}
