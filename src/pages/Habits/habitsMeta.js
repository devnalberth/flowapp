// Metadados compartilhados da área de Hábitos (categorias, ícones).
// Vive num módulo próprio para ser usado por Habits.jsx, HabitsStats.jsx e
// HabitDetailModal.jsx sem import circular.
import { Sparkles, Dumbbell, Brain, BookOpen, Book } from 'lucide-react'

export const CATEGORIES = [
  { id: 'all', label: 'Todos', color: '#ff4800' },
  { id: 'saude', label: 'Saúde', color: '#0a9463' },
  { id: 'produtividade', label: 'Produtividade', color: '#16a34a' },
  { id: 'estudos', label: 'Estudos', color: '#ff7a00' },
  { id: 'mindfulness', label: 'Mindfulness', color: '#7c5cff' },
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
