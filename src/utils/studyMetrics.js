// Métricas e agregações da área de Estudos.
//
// Hierarquia: study → módulos → sub-módulos. Nada abaixo disso.
// Um sub-módulo NUNCA tem filhos; só módulo tem filhos.
//
// O progresso vem do CONTADOR de cada bloco (lessonsDone / lessonsTotal), não
// de linhas individuais de aula. Módulo com sub-módulos não tem contador
// próprio: o dele é a soma dos filhos.

export const STUDY_TYPE_META = {
  COURSE: { label: 'Curso', icon: '🎓', color: '#ff4800' },
  UNIVERSITY: { label: 'Faculdade', icon: '🏛️', color: '#7c5cff' },
  BOOK: { label: 'Livro', icon: '📕', color: '#16a34a' },
  MENTORSHIP: { label: 'Mentoria', icon: '🧭', color: '#0ea5e9' },
}

export const STUDY_STATUS_META = {
  NOT_STARTED: { label: 'Não iniciado', color: '#9aa0aa' },
  IN_PROGRESS: { label: 'Em andamento', color: '#ff8a00' },
  PAUSED: { label: 'Pausado', color: '#7c5cff' },
  COMPLETED: { label: 'Concluído', color: '#16a34a' },
}

export const BLOCK_PRIORITIES = [
  { id: 'Baixa', label: 'Baixa', color: '#10b981' },
  { id: 'Normal', label: 'Normal', color: '#6b7280' },
  { id: 'Alta', label: 'Alta', color: '#f59e0b' },
  { id: 'Urgente', label: 'Urgente', color: '#ef4444' },
]

// Prioridades que jogam a tarefa direto no Flow da aba Tarefas.
export const isFlowPriority = (p) => p === 'Alta' || p === 'Urgente'

const int = (v) => {
  const n = Number(v)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

export const childBlocks = (mod) => (Array.isArray(mod?.submodules) ? mod.submodules : [])
export const hasChildren = (mod) => childBlocks(mod).length > 0

// Contador próprio do bloco, sempre saneado (done nunca passa total).
export function ownCounts(mod) {
  const total = int(mod?.lessonsTotal ?? mod?.lessons_total)
  const done = Math.min(int(mod?.lessonsDone ?? mod?.lessons_done), total)
  return { total, done }
}

// Contador efetivo: módulo com filhos delega aos filhos; senão usa o próprio.
export function blockCounts(mod) {
  if (!mod) return { total: 0, done: 0 }
  if (hasChildren(mod)) {
    return childBlocks(mod).reduce(
      (acc, child) => {
        const c = blockCounts(child)
        acc.total += c.total
        acc.done += c.done
        return acc
      },
      { total: 0, done: 0 },
    )
  }
  return ownCounts(mod)
}

export function countModules(modules = []) {
  return (modules || []).reduce(
    (acc, mod) => {
      const c = blockCounts(mod)
      acc.total += c.total
      acc.done += c.done
      return acc
    },
    { total: 0, done: 0 },
  )
}

export const pct = ({ total, done }) => (total ? Math.round((done / total) * 100) : 0)

export const studyProgress = (study) => pct(countModules(study?.modules || []))
export const moduleProgress = (mod) => pct(blockCounts(mod))

// Um bloco está concluído quando fechou o contador (e o contador existe).
export const isBlockDone = (mod) => {
  const c = blockCounts(mod)
  return c.total > 0 && c.done >= c.total
}

// Onde o agendamento mora, dada a regra: no módulo quando ele não tem
// sub-módulos; nos sub-módulos quando tem.
export const isSchedulable = (mod) => !hasChildren(mod)

// Achata todos os blocos agendáveis de um estudo, com o contexto do módulo pai.
export function flattenBlocks(study) {
  const out = []
  for (const mod of study?.modules || []) {
    const children = childBlocks(mod)
    if (children.length === 0) {
      out.push({ ...mod, studyId: study.id, studyTitle: study.title, moduleTitle: null })
      continue
    }
    for (const child of children) {
      out.push({ ...child, studyId: study.id, studyTitle: study.title, moduleTitle: mod.title })
    }
  }
  return out
}

// Mapa blockId → contexto, usado na aba Tarefas para rotular a tarefa-espelho
// com "Curso / Módulo" em vez de um título solto.
export function buildBlockContextMap(studies = []) {
  const map = {}
  for (const study of studies || []) {
    for (const mod of study.modules || []) {
      // Bloco de nível módulo: o curso já é o chip anterior, não repete.
      map[mod.id] = {
        studyTitle: study.title,
        containerTitle: null,
        containerKind: 'module',
        blockTitle: mod.title,
      }
      for (const child of childBlocks(mod)) {
        map[child.id] = {
          studyTitle: study.title,
          containerTitle: mod.title,
          containerKind: 'submodule',
          blockTitle: child.title,
        }
      }
    }
  }
  return map
}

// Status derivado: respeita PAUSED manual, senão deriva do progresso.
export function deriveStudyStatus(study) {
  const counts = countModules(study?.modules || [])
  if (study?.status === 'PAUSED') return 'PAUSED'
  if (counts.total > 0 && counts.done >= counts.total) return 'COMPLETED'
  if (counts.done > 0) return 'IN_PROGRESS'
  return 'NOT_STARTED'
}

const startOfWeek = (d = new Date()) => {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  date.setDate(date.getDate() - date.getDay()) // 0=Dom
  return date
}

const todayKey = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Resumo de um estudo (painel dentro do detalhe).
export function studyOverview(study) {
  const counts = countModules(study?.modules || [])
  const modules = study?.modules || []
  const blocks = flattenBlocks(study)
  const submodulesCount = modules.reduce((acc, m) => acc + childBlocks(m).length, 0)

  const scheduled = blocks.filter((b) => b.scheduledDate)
  const today = todayKey()
  const upcoming = scheduled
    .filter((b) => !isBlockDone(b) && b.scheduledDate >= today)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))

  const rated = blocks.filter((b) => b.rating > 0)
  const avgRating = rated.length
    ? Math.round((rated.reduce((acc, b) => acc + b.rating, 0) / rated.length) * 10) / 10
    : 0

  return {
    progress: pct(counts),
    totalLessons: counts.total,
    completedLessons: counts.done,
    modulesCount: modules.length,
    submodulesCount,
    blocksCount: blocks.length,
    doneBlocks: blocks.filter(isBlockDone).length,
    scheduledCount: scheduled.length,
    upcoming,
    nextBlock: upcoming[0] || null,
    avgRating,
    status: deriveStudyStatus(study),
  }
}

// Agregação geral (painel do topo da aba Estudos).
export function aggregateStudies(studies = []) {
  const list = Array.isArray(studies) ? studies : []
  const totals = { total: 0, done: 0 }
  const byType = {}
  let allUpcoming = []
  const ratings = []
  const statusCount = { NOT_STARTED: 0, IN_PROGRESS: 0, PAUSED: 0, COMPLETED: 0 }
  const weekStart = startOfWeek()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)
  let blocksThisWeek = 0

  const studyCards = list.map((study) => {
    const ov = studyOverview(study)
    totals.total += ov.totalLessons
    totals.done += ov.completedLessons
    statusCount[ov.status] = (statusCount[ov.status] || 0) + 1

    const typeKey = study.type || 'COURSE'
    if (!byType[typeKey]) byType[typeKey] = { count: 0, done: 0, total: 0 }
    byType[typeKey].count += 1
    byType[typeKey].total += ov.totalLessons
    byType[typeKey].done += ov.completedLessons

    flattenBlocks(study).forEach((b) => {
      if (b.rating > 0) ratings.push(b.rating)
      if (b.scheduledDate) {
        const d = new Date(`${b.scheduledDate}T00:00:00`)
        if (d >= weekStart && d < weekEnd) blocksThisWeek += 1
      }
    })

    allUpcoming = allUpcoming.concat(ov.upcoming.map((b) => ({ ...b, studyTitle: study.title })))
    return { study, overview: ov }
  })

  allUpcoming.sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))

  return {
    studyCards,
    totalStudies: list.length,
    inProgress: statusCount.IN_PROGRESS,
    completed: statusCount.COMPLETED,
    notStarted: statusCount.NOT_STARTED,
    paused: statusCount.PAUSED,
    totalLessons: totals.total,
    completedLessons: totals.done,
    overallProgress: pct(totals),
    avgRating: ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : 0,
    blocksThisWeek,
    upcoming: allUpcoming.slice(0, 5),
    byType,
  }
}
