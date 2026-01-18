import { useEffect, useMemo, useRef, useState } from 'react'

import './CreateHabitModal.css'

const DESCRIPTION_LIMIT = 200

const HABIT_CATEGORIES = [
  { id: 'saude', label: 'Saúde & Energia', icon: '⚡' },
  { id: 'trabalho', label: 'Trabalho', icon: '💼' },
  { id: 'aprendizado', label: 'Aprendizado', icon: '📚' },
  { id: 'mindfulness', label: 'Mindfulness', icon: '🧘' },
]

const FREQUENCY_OPTIONS = [
  { value: 'daily', label: 'Diário' },
  { value: 'weekly', label: 'Semanal' },
  { value: 'custom', label: 'Personalizado' },
]

const WEEKDAYS = [
  { value: 0, label: 'Dom', name: 'Domingo' },
  { value: 1, label: 'Seg', name: 'Segunda' },
  { value: 2, label: 'Ter', name: 'Terça' },
  { value: 3, label: 'Qua', name: 'Quarta' },
  { value: 4, label: 'Qui', name: 'Quinta' },
  { value: 5, label: 'Sex', name: 'Sexta' },
  { value: 6, label: 'Sáb', name: 'Sábado' },
]

export default function CreateHabitModal({ habit, onClose, onSubmit, onDelete }) {
  const [formData, setFormData] = useState({
    label: '',
    category: HABIT_CATEGORIES[0].id,
    description: '',
    time: '',
    frequency: 'daily',
    selectedDays: [],
  })
  const labelRef = useRef(null)

  const charCount = useMemo(() => `${formData.description.length}/${DESCRIPTION_LIMIT}`, [formData.description.length])

  useEffect(() => {
    if (habit) {
      // Modo de edição
      setFormData({
        label: habit.label || '',
        category: habit.category || HABIT_CATEGORIES[0].id,
        description: habit.description || '',
        time: habit.time || '',
        frequency: habit.frequency || 'daily',
        selectedDays: habit.selectedDays || [],
      })
    } else {
      // Modo de criação
      setFormData({
        label: '',
        category: HABIT_CATEGORIES[0].id,
        description: '',
        time: '',
        frequency: 'daily',
        selectedDays: [],
      })
    }
    requestAnimationFrame(() => labelRef.current?.focus())
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [habit])

  useEffect(() => {
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const updateField = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const toggleDay = (day) => {
    setFormData((prev) => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter((d) => d !== day)
        : [...prev.selectedDays, day],
    }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit?.(formData)
  }

  const selectedCategory = HABIT_CATEGORIES.find((cat) => cat.id === formData.category)

  return (
    <div className="createHabitModal" role="dialog" aria-modal="true">
      <div className="createHabitModal__backdrop" onClick={onClose} />
      <section className="createHabitModal__panel">
        <header className="createHabitModal__header">
          <div>
            <p className="createHabitModal__eyebrow">Novo hábito</p>
            <h3>Construa rotinas consistentes</h3>
          </div>
          <button type="button" className="createHabitModal__close" onClick={onClose} aria-label="Fechar modal">
            ✕
          </button>
        </header>

        <form className="createHabitModal__form" onSubmit={handleSubmit}>
          <label className="createHabitModal__field">
            <span>Nome do hábito*</span>
            <input
              ref={labelRef}
              type="text"
              placeholder="Ex: Treino Muay Thai"
              value={formData.label}
              onChange={updateField('label')}
              required
            />
          </label>

          <label className="createHabitModal__field">
            <span>Categoria</span>
            <div className="createHabitModal__categoryGrid">
              {HABIT_CATEGORIES.map((category) => (
                <button
                  key={category.id}
                  type="button"
                  className={`categoryChip ${formData.category === category.id ? 'categoryChip--active' : ''}`}
                  onClick={() => setFormData((prev) => ({ ...prev, category: category.id }))}
                >
                  <span className="categoryChip__icon">{category.icon}</span>
                  <span>{category.label}</span>
                </button>
              ))}
            </div>
          </label>

          <label className="createHabitModal__field">
            <span>Horário ideal</span>
            <input type="time" value={formData.time} onChange={updateField('time')} />
          </label>

          <label className="createHabitModal__field">
            <span>Frequência</span>
            <select value={formData.frequency} onChange={updateField('frequency')}>
              {FREQUENCY_OPTIONS.map((freq) => (
                <option key={freq.value} value={freq.value}>
                  {freq.label}
                </option>
              ))}
            </select>
          </label>

          {formData.frequency === 'custom' && (
            <div className="createHabitModal__field">
              <span>Dias da semana</span>
              <div className="createHabitModal__weekdayGrid">
                {WEEKDAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    className={`weekdayChip ${formData.selectedDays.includes(day.value) ? 'weekdayChip--active' : ''}`}
                    onClick={() => toggleDay(day.value)}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <label className="createHabitModal__field">
            <span>Descrição (opcional)</span>
            <div className="createHabitModal__textareaWrap">
              <textarea
                placeholder="Por que este hábito é importante? O que você quer alcançar?"
                maxLength={DESCRIPTION_LIMIT}
                value={formData.description}
                onChange={updateField('description')}
              />
              <small>{charCount}</small>
            </div>
          </label>

          <footer className="createHabitModal__footer">
            <button type="button" onClick={onClose} className="btn btn--ghost">
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary">
              Criar hábito
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
