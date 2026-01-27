import { useEffect, useMemo, useRef, useState } from 'react'
import { Calendar, Clock, ChevronDown, MapPin, AlignLeft, Type, X, Check } from 'lucide-react'
import './CreateEventModal.css'

const DESCRIPTION_LIMIT = 500

// Tipos de Evento
const EVENT_TYPES = [
  { id: 'meeting', label: 'Reunião', color: '#3b82f6', icon: '📅' },
  { id: 'workout', label: 'Treino', color: '#10b981', icon: '💪' },
  { id: 'event', label: 'Evento', color: '#f59e0b', icon: '🎉' },
  { id: 'default', label: 'Padrão', color: '#6b7280', icon: '📌' },
]

export default function CreateEventModal({
  open,
  onClose,
  onSubmit,
  onDelete, // New prop
  initialData = null,
}) {
  const dialogRef = useRef(null)
  const titleRef = useRef(null)

  const defaultForm = useMemo(
    () => ({
      title: '',
      date: '',
      time: '',
      location: '',
      type: 'default',
      description: '',
    }),
    [],
  )

  const [form, setForm] = useState(defaultForm)
  const [showType, setShowType] = useState(false)

  const charCounter = useMemo(() => `${form.description.length}/${DESCRIPTION_LIMIT}`, [form.description.length])

  useEffect(() => {
    if (open) {
      if (initialData) {
        // Extrai data e hora se existir
        let date = ''
        let time = ''
        if (initialData.start_time) {
          const d = new Date(initialData.start_time)
          date = d.toISOString().split('T')[0]
          time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
        }

        setForm({
          ...defaultForm,
          ...initialData,
          date,
          time,
          type: initialData.type || 'default',
        })
      } else {
        setForm(defaultForm)
      }
      setShowType(false)
    }
  }, [open, defaultForm, initialData])

  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      requestAnimationFrame(() => titleRef.current?.focus())
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    // Combina data e hora
    let startTime = null
    if (form.date) {
      startTime = form.time
        ? new Date(`${form.date}T${form.time}`).toISOString()
        : new Date(`${form.date}T00:00:00`).toISOString()
    }

    const payload = {
      ...form,
      start_time: startTime,
    }

    onSubmit?.(payload)
  }

  const selectedType = EVENT_TYPES.find(t => t.id === form.type) || EVENT_TYPES[3]

  return (
    <div className="createEventModal" role="dialog" aria-modal="true">
      <div className="createEventModal__backdrop" onClick={onClose} />

      <section className="createEventModal__panel" ref={dialogRef}>
        <header className="createEventModal__header">
          <h2 className="createEventModal__title">
            {initialData ? 'Editar evento' : 'Novo evento'}
          </h2>
          <button type="button" className="createEventModal__closeBtn" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </header>

        <form className="createEventModal__form" onSubmit={handleSubmit}>
          {/* Nome do Evento */}
          <div className="cem__field">
            <label className="cem__label">
              Nome do evento <span className="cem__required">*</span>
            </label>
            <input
              ref={titleRef}
              type="text"
              className="cem__input cem__input--lg"
              placeholder="Reunião de equipe, Treino, etc..."
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              required
            />
          </div>

          {/* Data e Hora */}
          <div className="cem__row">
            <div className="cem__field cem__field--flex">
              <label className="cem__label">
                <Calendar size={14} />
                Data <span className="cem__required">*</span>
              </label>
              <input
                type="date"
                className="cem__dateInput"
                value={form.date}
                onChange={(e) => updateField('date', e.target.value)}
                required
              />
            </div>
            <div className="cem__field cem__field--flex">
              <label className="cem__label">
                <Clock size={14} />
                Horário <span className="cem__required">*</span>
              </label>
              <input
                type="time"
                className="cem__timeInput"
                value={form.time}
                onChange={(e) => updateField('time', e.target.value)}
                required
              />
            </div>
          </div>

          {/* Local e Tipo */}
          <div className="cem__row">
            {/* Local */}
            <div className="cem__field cem__field--grow">
              <label className="cem__label">
                <MapPin size={14} />
                Local
              </label>
              <input
                type="text"
                className="cem__input"
                placeholder="Google Meet, Escritório, Academia..."
                value={form.location}
                onChange={(e) => updateField('location', e.target.value)}
              />
            </div>

            {/* Tipo Dropdown */}
            <div className="cem__field">
              <label className="cem__label">Tipo</label>
              <div className="cem__dropdown">
                <button
                  type="button"
                  className="cem__dropdownBtn"
                  onClick={() => setShowType(!showType)}
                  style={/** @type {React.CSSProperties} */({ '--accent': selectedType.color })}
                >
                  <span className="cem__dropdownIcon">{selectedType.icon}</span>
                  <span>{selectedType.label}</span>
                  <ChevronDown size={16} className={showType ? 'rotated' : ''} />
                </button>
                {showType && (
                  <div className="cem__dropdownMenu">
                    {EVENT_TYPES.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`cem__dropdownItem ${form.type === opt.id ? 'active' : ''}`}
                        onClick={() => { updateField('type', opt.id); setShowType(false) }}
                      >
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                        {form.type === opt.id && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Descrição - Opcional */}
          <div className="cem__field">
            <label className="cem__label">Descrição</label>
            <div className="cem__textareaWrap">
              <textarea
                className="cem__textarea"
                placeholder="Detalhes sobre o evento (opcional)"
                maxLength={DESCRIPTION_LIMIT}
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
              />
              <span className="cem__counter">{charCounter}</span>
            </div>
          </div>

          {/* Footer */}
          <footer className="cem__footer">
            {initialData && onDelete && (
              <button
                type="button"
                className="cem__btn cem__btn--danger"
                onClick={onDelete}
                style={{ marginRight: 'auto', color: '#ef4444', background: '#fee2e2', border: 'none' }}
              >
                Excluir
              </button>
            )}
            <button type="button" className="cem__btn cem__btn--ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="cem__btn cem__btn--primary">
              {initialData ? 'Salvar' : 'Criar evento'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
