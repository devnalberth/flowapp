// Agenda da meta: calcula em qual trimestre ela deve aparecer HOJE, fazendo a
// meta "andar" pelo kanban conforme o tempo real, de acordo com a duração.

export const TRIMESTER_LABELS = ['1º Trimestre', '2º Trimestre', '3º Trimestre', '4º Trimestre']

export const quarterOfMonth = (monthIndexZeroBased) => Math.floor(monthIndexZeroBased / 3) + 1 // 1..4
export const quarterLabel = (q) => TRIMESTER_LABELS[Math.min(Math.max(q, 1), 4) - 1]

// Intervalo de datas de um trimestre de um ano
export const quarterDateRange = (year, q) => {
  const startMonth = (q - 1) * 3
  const start = new Date(year, startMonth, 1)
  const end = new Date(year, startMonth + 3, 0) // último dia do trimestre
  end.setHours(23, 59, 59, 999)
  return { start, end }
}

const DURATION_BY_TYPE = { trimestral: 1, semestral: 2, anual: 4 }

const parseDateSafe = (value) => {
  if (!value) return null
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  return Number.isNaN(d.getTime()) ? null : d
}

const clamp = (n, min, max) => Math.min(Math.max(n, min), max)

// Deriva o trimestre inicial a partir dos campos disponíveis
const resolveStart = (goal) => {
  const sd = parseDateSafe(goal.startDate || goal.start_date)
  if (sd) return { year: sd.getFullYear(), startQuarter: quarterOfMonth(sd.getMonth()) }

  // trimester_values é um array (ex.: [2,3]); pega o primeiro
  const tv = goal.trimester_values || goal.trimesterValues
  if (Array.isArray(tv) && tv.length) {
    const q = Number(tv[0])
    if (q >= 1 && q <= 4) return { year: deriveYear(goal), startQuarter: q }
  }

  // label "2º Trimestre"
  const label = goal.trimesters
  if (typeof label === 'string') {
    const idx = TRIMESTER_LABELS.indexOf(label)
    if (idx >= 0) return { year: deriveYear(goal), startQuarter: idx + 1 }
  }

  return { year: deriveYear(goal), startQuarter: 1 }
}

const deriveYear = (goal) => {
  const created = parseDateSafe(goal.created_at) || parseDateSafe(goal.createdAt)
  return created ? created.getFullYear() : new Date().getFullYear()
}

export const getGoalSchedule = (goal, now = new Date()) => {
  const { year, startQuarter } = resolveStart(goal)

  let durationQuarters = DURATION_BY_TYPE[goal.type] || 1
  // custom: deriva pela diferença entre start e end
  if (goal.type === 'custom') {
    const sd = parseDateSafe(goal.startDate || goal.start_date)
    const ed = parseDateSafe(goal.endDate || goal.end_date)
    if (sd && ed) {
      const sQ = quarterOfMonth(sd.getMonth())
      const eQ = quarterOfMonth(ed.getMonth())
      durationQuarters = clamp((eQ - sQ) + 1 + (ed.getFullYear() - sd.getFullYear()) * 4, 1, 4)
    }
  }

  const endQuarter = clamp(startQuarter + durationQuarters - 1, 1, 4)

  // Trimestre atual (onde a meta aparece hoje), limitado ao intervalo da meta
  let currentQuarter
  if (now.getFullYear() < year) currentQuarter = startQuarter
  else if (now.getFullYear() > year) currentQuarter = endQuarter
  else currentQuarter = clamp(quarterOfMonth(now.getMonth()), startQuarter, endQuarter)

  const startRange = quarterDateRange(year, startQuarter)
  const endRange = quarterDateRange(year, endQuarter)
  const range = { start: startRange.start, end: endRange.end }

  const isFuture = now < startRange.start
  const isOverdue = now > endRange.end

  // Dias restantes no período da meta
  const msLeft = endRange.end - now
  const daysLeft = Math.ceil(msLeft / 86400000)

  return {
    year,
    startQuarter,
    endQuarter,
    durationQuarters,
    currentQuarter,
    currentLabel: quarterLabel(currentQuarter),
    isFuture,
    isOverdue,
    range,
    daysLeft,
  }
}
