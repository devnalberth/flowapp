// Métricas e agregações da área de Estudos.
// Hierarquia: study → módulos → matérias (submodules) → aulas (lessons).
// O progresso é SEMPRE derivado da conclusão das aulas (não de um campo manual).

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

// Conta aulas (total/concluídas) recursivamente em módulos + matérias.
export function countLessonsRecursively(modules = []) {
  return (modules || []).reduce(
    (acc, mod) => {
      const lessons = Array.isArray(mod.lessons) ? mod.lessons : []
      const done = lessons.filter((l) => l.isCompleted).length
      const nested = countLessonsRecursively(mod.submodules || [])
      acc.total += lessons.length + nested.total
      acc.completed += done + nested.completed
      return acc
    },
    { total: 0, completed: 0 },
  )
}

export const pct = ({ total, completed }) => (total ? Math.round((completed / total) * 100) : 0)

export const studyProgress = (study) => pct(countLessonsRecursively(study?.modules || []))
export const moduleProgress = (module) => pct(countLessonsRecursively([module]))

// Achata todas as aulas de um estudo num array plano (com referência ao módulo/matéria).
export function flattenLessons(study) {
  const out = []
  const walk = (modules, moduleTitle, materiaTitle) => {
    for (const mod of modules || []) {
      for (const lesson of mod.lessons || []) {
        out.push({
          ...lesson,
          studyId: study.id,
          studyTitle: study.title,
          moduleTitle: materiaTitle ? moduleTitle : mod.title,
          materiaTitle: materiaTitle ? mod.title : null,
        })
      }
      if (mod.submodules?.length) walk(mod.submodules, materiaTitle ? moduleTitle : mod.title, mod.title)
    }
  }
  walk(study?.modules || [], null, null)
  return out
}

// Conta nós por tipo (sub-módulos e matérias) em toda a árvore, fora o nível raiz.
export function tallyKinds(modules = []) {
  let submodules = 0
  let subjects = 0
  const walk = (mods) => {
    for (const m of mods || []) {
      if (m.kind === 'submodule') submodules += 1
      else if (m.kind === 'subject') subjects += 1
      walk(m.submodules || [])
    }
  }
  for (const top of modules || []) walk(top.submodules || [])
  return { submodules, subjects }
}

// Status derivado: respeita PAUSED manual, senão deriva do progresso.
export function deriveStudyStatus(study) {
  const progress = studyProgress(study)
  if (study?.status === 'PAUSED') return 'PAUSED'
  if (progress >= 100 && countLessonsRecursively(study?.modules || []).total > 0) return 'COMPLETED'
  if (progress > 0) return 'IN_PROGRESS'
  return 'NOT_STARTED'
}

const startOfWeek = (d = new Date()) => {
  const date = new Date(d)
  date.setHours(0, 0, 0, 0)
  const day = date.getDay() // 0=Dom
  date.setDate(date.getDate() - day)
  return date
}

// Resumo de um estudo (dashboard interno).
export function studyOverview(study) {
  const counts = countLessonsRecursively(study?.modules || [])
  const modulesCount = (study?.modules || []).length
  const kinds = tallyKinds(study?.modules || [])
  const materiasCount = kinds.subjects
  const submodulesCount = kinds.submodules
  const lessons = flattenLessons(study)

  const scheduled = lessons.filter((l) => l.scheduledDate)
  const todayKey = new Date().toISOString().slice(0, 10)
  const upcoming = scheduled
    .filter((l) => !l.isCompleted && l.scheduledDate >= todayKey)
    .sort((a, b) => a.scheduledDate.localeCompare(b.scheduledDate))

  const rated = lessons.filter((l) => l.rating > 0)
  const avgRating = rated.length
    ? Math.round((rated.reduce((acc, l) => acc + l.rating, 0) / rated.length) * 10) / 10
    : 0

  return {
    progress: pct(counts),
    totalLessons: counts.total,
    completedLessons: counts.completed,
    modulesCount,
    materiasCount,
    submodulesCount,
    scheduledCount: scheduled.length,
    upcoming,
    nextLesson: upcoming[0] || null,
    avgRating,
    status: deriveStudyStatus(study),
  }
}

// Agregação geral (dashboard do topo da aba Estudos).
export function aggregateStudies(studies = []) {
  const list = Array.isArray(studies) ? studies : []
  const totals = { total: 0, completed: 0 }
  const byType = {}
  let allUpcoming = []
  const ratings = []
  const statusCount = { NOT_STARTED: 0, IN_PROGRESS: 0, PAUSED: 0, COMPLETED: 0 }
  const weekStart = startOfWeek()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 7)
  let lessonsThisWeek = 0

  const studyCards = list.map((study) => {
    const ov = studyOverview(study)
    totals.total += ov.totalLessons
    totals.completed += ov.completedLessons
    statusCount[ov.status] = (statusCount[ov.status] || 0) + 1

    const typeKey = study.type || 'COURSE'
    if (!byType[typeKey]) byType[typeKey] = { count: 0, completed: 0, total: 0 }
    byType[typeKey].count += 1
    byType[typeKey].total += ov.totalLessons
    byType[typeKey].completed += ov.completedLessons

    flattenLessons(study).forEach((l) => {
      if (l.rating > 0) ratings.push(l.rating)
      if (l.scheduledDate) {
        const d = new Date(`${l.scheduledDate}T00:00:00`)
        if (d >= weekStart && d < weekEnd) lessonsThisWeek += 1
      }
    })

    allUpcoming = allUpcoming.concat(ov.upcoming.map((l) => ({ ...l, studyTitle: study.title })))
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
    completedLessons: totals.completed,
    overallProgress: pct(totals),
    avgRating: ratings.length
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : 0,
    lessonsThisWeek,
    upcoming: allUpcoming.slice(0, 5),
    byType,
  }
}
