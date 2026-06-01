// Categoriza uma tarefa para o Flow:
// - 'study'  → veio de uma aula (curso/faculdade/mentoria/livro)
// - 'work'   → projeto ou tarefa avulsa (produtividade)
export function categorizeTask(task) {
  if (!task) return 'work'
  if (task.studyLessonId || task.study_lesson_id) return 'study'
  return 'work'
}

export const CATEGORY_META = {
  work: { id: 'work', label: 'Produtividade', short: 'Trabalho', color: '#16a34a', emoji: '💼' },
  study: { id: 'study', label: 'Estudos', short: 'Estudos', color: '#ff7a00', emoji: '📚' },
}
