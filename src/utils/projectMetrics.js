import { countsForProjectProgress } from './taskStatus'

// Deriva o status do projeto a partir do progresso das tarefas.
// 100% => Concluído | 80-99% => Em Finalização | 1-79% => Em Andamento | 0% => Todo
export const deriveProjectStatus = ({ totalTasks, progress }) => {
  if (!totalTasks || progress <= 0) return 'todo'
  if (progress >= 100) return 'completed'
  if (progress >= 80) return 'review'
  return 'in_progress'
}

// Tarefas que pertencem a um projeto (por id ou por título, como no código atual).
export const tasksOfProject = (project, tasks = []) =>
  tasks.filter(t => t.projectId === project.id || t.project_id === project.id || t.project === project.title)

// Métricas centrais de um projeto, reaproveitadas na galeria, no workspace e no Dashboard.
export const computeProjectStats = (project, tasks = []) => {
  const projectTasks = tasksOfProject(project, tasks).filter(countsForProjectProgress)
  const totalTasks = projectTasks.length
  const doneTasks = projectTasks.filter(t => t.completed).length
  const pendingTasks = totalTasks - doneTasks
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0
  const autoStatus = deriveProjectStatus({ totalTasks, progress })
  return { totalTasks, doneTasks, pendingTasks, progress, autoStatus, projectTasks }
}

export const PROJECT_STATUS_META = {
  todo: { label: 'A Fazer', tone: 'todo' },
  in_progress: { label: 'Em Andamento', tone: 'doing' },
  review: { label: 'Em Finalização', tone: 'closing' },
  completed: { label: 'Concluído', tone: 'done' },
}
