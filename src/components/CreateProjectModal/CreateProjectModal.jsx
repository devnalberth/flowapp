import { useEffect, useMemo, useRef, useState } from 'react'

import './CreateProjectModal.css'

const AREAS = ['Profissional', 'Pessoal', 'Financeiro', 'Estudos']
const GOALS = ['Lançar novo produto', 'Quitar dívidas', 'Melhorar hábitos', 'Aprender IA']
const DESCRIPTION_LIMIT = 200

const DEFAULT_FORM = {
  name: '',
  area: AREAS[0],
  deadline: '',
  description: '',
  goal: '',
}

export default function CreateProjectModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState(() => ({ ...DEFAULT_FORM }))
  const dialogRef = useRef(null)
  const nameRef = useRef(null)

  const remainingChars = useMemo(
    () => `${form.description.length}/${DESCRIPTION_LIMIT}`,
    [form.description.length],
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
    if (!open) {
      setForm(() => ({ ...DEFAULT_FORM }))
    }
  }, [open])

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
              name="name"
              placeholder="Nome do projeto"
              value={form.name}
              onChange={updateField('name')}
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
            <span className="createProjectModal__label">Prazo do Projeto</span>
            <input
              className="createProjectModal__input"
              type="date"
              name="deadline"
              value={form.deadline}
              onChange={updateField('deadline')}
            />
          </label>

          <label className="createProjectModal__field">
            <span className="createProjectModal__label">Descrição do projeto</span>
            <div className="createProjectModal__textareaWrap">
              <textarea
                className="createProjectModal__textarea"
                name="description"
                placeholder="Placeholder"
                maxLength={DESCRIPTION_LIMIT}
                value={form.description}
                onChange={updateField('description')}
              />
              <span className="createProjectModal__counter">{remainingChars}</span>
            </div>
          </label>

          <label className="createProjectModal__field">
            <span className="createProjectModal__label">Meta Vinculada</span>
            <select
              className="createProjectModal__input createProjectModal__input--select"
              name="goal"
              value={form.goal}
              onChange={updateField('goal')}
            >
              <option value="">Selecione a meta</option>
              {GOALS.map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </label>

          <footer className="createProjectModal__footer">
            <button type="button" className="createProjectModal__btn createProjectModal__btn--ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="createProjectModal__btn createProjectModal__btn--primary">
              Salvar
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
