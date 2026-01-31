import { useEffect, useMemo, useRef, useState } from 'react'

import './CreateProjectModal.css'

const AREAS = ['Profissional', 'Pessoal', 'Financeiro', 'Estudos']
const STATUS_OPTIONS = ['todo', 'in_progress', 'review', 'completed']
const COLOR_OPTIONS = [
  { label: 'Laranja', value: 'ff9500' },
  { label: 'Azul', value: '007aff' },
  { label: 'Verde', value: '34c759' },
  { label: 'Rosa', value: 'ff2d55' },
  { label: 'Roxo', value: 'af52de' },
  { label: 'Cinza', value: '8e8e93' },
]
const DESCRIPTION_LIMIT = 200

const DEFAULT_FORM = {
  title: '',
  area: AREAS[0],
  status: 'todo',
  color: COLOR_OPTIONS[0].value,
  description: '',
  goalId: '',
}

export default function CreateProjectModal({ open, onClose, onSubmit, goalOptions = [], initialData = null }) {
  const [form, setForm] = useState(() => ({ ...DEFAULT_FORM }))
  const dialogRef = useRef(null)
  const nameRef = useRef(null)

  const remainingChars = useMemo(
    () => `${(form.description || '').length}/${DESCRIPTION_LIMIT}`,
    [form.description],
  )

  useEffect(() => {
    if (!open) {
      return undefined
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
      requestAnimationFrame(() => {
        nameRef.current?.focus()
      })
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    if (initialData) {
      setForm({
        ...DEFAULT_FORM,
        ...initialData,
        description: initialData.description || '',
        goalId: initialData.goalId || initialData.goal_id || DEFAULT_FORM.goalId,
      })
    } else {
      setForm(() => ({ ...DEFAULT_FORM }))
    }
  }, [open, initialData])

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onSubmit?.(form)
  }

  return (
    <div className="createProjectModal" role="dialog" aria-modal="true">
      <div className="createProjectModal__backdrop" onClick={onClose} />

      <section className="createProjectModal__panel" ref={dialogRef}>
        <header className="createProjectModal__header">
          <h2 className="createProjectModal__title">Criar Novo Projeto</h2>
          <button type="button" className="createProjectModal__iconBtn" onClick={onClose} aria-label="Fechar modal">
            <span className="createProjectModal__closeIcon" />
          </button>
        </header>

        <form className="createProjectModal__form" onSubmit={handleSubmit}>
          <label className="createProjectModal__field">
            <span className="createProjectModal__label">Nome do projeto*</span>
            <input
              ref={nameRef}
              className="createProjectModal__input"
              type="text"
              name="title"
              placeholder="Nome do projeto"
              value={form.title}
              onChange={updateField('title')}
              required
            />
          </label>

          <label className="createProjectModal__field">
            <span className="createProjectModal__label">Área do Projeto</span>
            <select
              className="createProjectModal__input createProjectModal__input--select"
              name="area"
              value={form.area}
              onChange={updateField('area')}
            >
              {AREAS.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>

          <label className="createProjectModal__field">
            <span className="createProjectModal__label">Cor do Projeto</span>
            <select
              className="createProjectModal__input createProjectModal__input--select"
              name="color"
              value={form.color}
              onChange={updateField('color')}
            >
              {COLOR_OPTIONS.map((color) => (
                <option key={color.value} value={color.value}>
                  {color.label}
                </option>
              ))}
            </select>
          </label>

          <label className="createProjectModal__field">
            <span className="createProjectModal__label">Status Inicial</span>
            <select
              className="createProjectModal__input createProjectModal__input--select"
              name="status"
              value={form.status}
              onChange={updateField('status')}
            >
              <option value="todo">A Fazer</option>
              <option value="in_progress">Em Andamento</option>
              <option value="review">Em Revisão</option>
              <option value="completed">Concluído</option>
            </select>
          </label>

          <label className="createProjectModal__field">
            <span className="createProjectModal__label">Vincular a Meta (Opcional)</span>
            <select
              className="createProjectModal__input createProjectModal__input--select"
              name="goalId"
              value={form.goalId}
              onChange={updateField('goalId')}
            >
              <option value="">Sem vínculo</option>
              {goalOptions?.map((goal) => (
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </label>



          <label className="createProjectModal__field">
            <span className="createProjectModal__label">Descrição do projeto</span>
            <div className="createProjectModal__textareaWrap">
              <textarea
                className="createProjectModal__textarea"
                name="description"
                placeholder="Descreva o objetivo e escopo do projeto..."
                maxLength={DESCRIPTION_LIMIT}
                value={form.description}
                onChange={updateField('description')}
              />
              <span className="createProjectModal__counter">{remainingChars}</span>
            </div>
          </label>

          <footer className="createProjectModal__footer">
            <button type="button" className="createProjectModal__btn createProjectModal__btn--ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="createProjectModal__btn createProjectModal__btn--primary">
              {initialData ? 'Salvar alterações' : 'Criar Projeto'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
