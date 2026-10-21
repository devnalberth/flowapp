// Metadados compartilhados da área de Hábitos (categorias, ícones).
// Vive num módulo próprio para ser usado por Habits.jsx, HabitsStats.jsx e
// HabitDetailModal.jsx sem import circular.
import { Sparkles, Dumbbell, Brain, BookOpen, Book } from 'lucide-react'

export const CATEGORIES = [
  {
    id: 'all',
    label: 'Todos',
    color: 'var(--fa-bg-accent)',
    background: 'var(--fa-bg-accent-soft)',
  },
  {
    id: 'saude',
    label: 'Saúde',
    color: 'var(--fa-area-saude)',
    background: 'var(--fa-area-saude-bg)',
  },
  {
    id: 'produtividade',
    label: 'Produtividade',
    color: 'var(--fa-area-profissional)',
    background: 'var(--fa-area-profissional-bg)',
  },
  {
    id: 'estudos',
    label: 'Estudos',
    color: 'var(--fa-area-estudos)',
    background: 'var(--fa-area-estudos-bg)',
  },
  {
    id: 'mindfulness',
    label: 'Mindfulness',
    color: 'var(--fa-area-relacionamento)',
    background: 'var(--fa-area-relacionamento-bg)',
  },
]

export const ICON_OPTIONS = [
  { id: 'sparkles', icon: Sparkles, label: 'Sparkles' },
  { id: 'dumbbell', icon: Dumbbell, label: 'Dumbbell' },
  { id: 'brain', icon: Brain, label: 'Brain' },
  { id: 'bookopen', icon: BookOpen, label: 'Book Open' },
  { id: 'book', icon: Book, label: 'Book' },
]

export const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export function getHabitIcon(iconId) {
  const option = ICON_OPTIONS.find((opt) => opt.id === iconId)
  return option ? option.icon : Sparkles
}

export function getCategoryMeta(categoryId) {
  return CATEGORIES.find((c) => c.id === categoryId) || CATEGORIES[0]
}

export const TIMER_CATEGORY_LABEL = { work: 'foco', study: 'estudo' }
