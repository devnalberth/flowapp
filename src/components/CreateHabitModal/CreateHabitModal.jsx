import { useEffect, useMemo, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
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
      // Tenta recuperar os dias do formato novo (customDays) ou antigo (selectedDays)
      let days = [];
      if (Array.isArray(habit.customDays)) days = habit.customDays;
      else if (Array.isArray(habit.selectedDays)) days = habit.selectedDays;
      else if (typeof habit.customDays === 'string') {
          try { days = JSON.parse(habit.customDays) } catch(e){}
      }

      // Modo de edição
      setFormData({
        label: habit.label || habit.name || '',
        category: habit.category || HABIT_CATEGORIES[0].id,
        description: habit.description || '',
        time: habit.time || '',
        frequency: (days.length > 0) ? 'custom' : (habit.frequency || 'daily'),
        selectedDays: days,
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
    
    // Foco automático
    setTimeout(() => labelRef.current?.focus(), 50)
    
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [habit])

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
    
    // Prepara o payload
    const payload = {
        label: formData.label,
        name: formData.label, // Garante compatibilidade
        category: formData.category,
        description: formData.description,
        time: formData.time,
        frequency: formData.frequency,
        // Envia 'customDays' para o banco, mesmo que o form use selectedDays
        customDays: formData.frequency === 'custom' ? formData.selectedDays : [],
        selectedDays: formData.frequency === 'custom' ? formData.selectedDays : []
    }
    
    onSubmit?.(payload)
  }

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

          <div className="createHabitModal__grid">
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
            <label className="createHabitModal__field">
                <span>Horário ideal</span>
                <input type="time" value={formData.time} onChange={updateField('time')} />
            </label>
          </div>

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
                placeholder="Por que este hábito é importante?"
                maxLength={DESCRIPTION_LIMIT}
                value={formData.description}
                onChange={updateField('description')}
              />
              <small>{charCount}</small>
            </div>
          </label>

          <footer className="createHabitModal__footer" style={{justifyContent: onDelete ? 'space-between' : 'flex-end'}}>
            {onDelete && (
               <button type="button" className="btn btn--ghost" style={{color: '#ef4444', borderColor: '#fee2e2', background: '#fee2e2'}} onClick={onDelete}>
                 <Trash2 size={18} />
               </button>
            )}
            <div style={{display:'flex', gap: '12px'}}>
                <button type="button" onClick={onClose} className="btn btn--ghost">
                Cancelar
                </button>
                <button type="submit" className="btn btn--primary">
                {habit ? 'Salvar Alterações' : 'Criar Hábito'}
                </button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  )
}