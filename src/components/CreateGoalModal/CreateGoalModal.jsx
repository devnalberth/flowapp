import { useEffect, useMemo, useRef, useState } from 'react'

import './CreateGoalModal.css'

const DESCRIPTION_LIMIT = 280

export default function CreateGoalModal({ open, onClose, onSubmit, areaOptions = [] }) {
  const [form, setForm] = useState({
    title: '',
    area: areaOptions[0] ?? '',
    startDate: '',
    endDate: '',
    target: '',
  })
  const titleRef = useRef(null)

  const charCount = useMemo(() => `${form.target.length}/${DESCRIPTION_LIMIT}`, [form.target.length])

  useEffect(() => {
    if (open) {
      setForm({
        title: '',
        area: areaOptions[0] ?? '',
        startDate: '',
        endDate: '',
        target: '',
      })
      requestAnimationFrame(() => titleRef.current?.focus())
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open, areaOptions])

  useEffect(() => {
    if (!open) return undefined
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) {
    return null
  }

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit?.(form)
  }

  return (
    <div className="createGoalModal" role="dialog" aria-modal="true">
      <div className="createGoalModal__backdrop" onClick={onClose} />
      <section className="createGoalModal__panel">
        <header className="createGoalModal__header">
          <div>
            <p className="createGoalModal__eyebrow">Nova meta</p>
            <h3>Mapear objetivo estratégico</h3>
          </div>
          <button type="button" className="createGoalModal__close" onClick={onClose} aria-label="Fechar modal">
            ✕
          </button>
        </header>

        <form className="createGoalModal__form" onSubmit={handleSubmit}>
          <label className="createGoalModal__field">
            <span>Título da meta*</span>
            <input
              ref={titleRef}
              type="text"
              placeholder="Ex: Escalar Flow OS para 1k clientes"
              value={form.title}
              onChange={updateField('title')}
              required
            />
          </label>

          <label className="createGoalModal__field">
            <span>Área</span>
            <select value={form.area} onChange={updateField('area')}>
              {areaOptions.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>

          <div className="createGoalModal__grid">
            <label className="createGoalModal__field">
              <span>Início</span>
              <input type="date" value={form.startDate} onChange={updateField('startDate')} />
            </label>
            <label className="createGoalModal__field">
              <span>Prazo</span>
              <input type="date" value={form.endDate} min={form.startDate || undefined} onChange={updateField('endDate')} />
            </label>
          </div>

          <label className="createGoalModal__field">
            <span>Resultado desejado</span>
            <div className="createGoalModal__textareaWrap">
              <textarea
                placeholder="Descreva o que precisa estar verdadeiro para considerar a meta concluída."
                maxLength={DESCRIPTION_LIMIT}
                value={form.target}
                onChange={updateField('target')}
              />
              <small>{charCount}</small>
            </div>
          </label>

          <footer className="createGoalModal__footer">
            <button type="button" onClick={onClose} className="btn btn--ghost">
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary">
              Registrar meta
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
