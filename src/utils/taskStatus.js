// Fonte única de verdade para o status normalizado de uma tarefa.
// Reaproveitado em Tasks.jsx, Projects.jsx e ProjectOverviewCard.jsx para
// manter a lógica de status/arquivamento consistente em todo o app.

export const normalizeTaskStatus = (task) => {
  if (task?.completed) return 'done'

  const rawStatus = String(task?.status || '').trim().toLowerCase()
  if (!rawStatus) return 'todo'

  if (['todo', 'a fazer', 'capturar', 'pending'].includes(rawStatus)) return 'todo'
  if (['in_progress', 'em andamento', 'doing'].includes(rawStatus)) return 'in_progress'
  if (['done', 'concluída', 'concluida', 'completed'].includes(rawStatus)) return 'done'
  if (['archived', 'arquivada', 'arquivado'].includes(rawStatus)) return 'archived'

  return 'todo'
}

// Tarefa arquivada (pausada/guardada pelo usuário).
export const isArchivedTask = (task) => normalizeTaskStatus(task) === 'archived'

// Tarefa que deve entrar no cálculo de progresso do projeto (numerador e
// denominador). Arquivadas ficam fora do escopo ativo do projeto.
export const countsForProjectProgress = (task) => !isArchivedTask(task)
