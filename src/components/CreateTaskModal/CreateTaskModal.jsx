import { useEffect, useMemo, useRef, useState } from 'react'

import './CreateTaskModal.css'

const DESCRIPTION_LIMIT = 200

export default function CreateTaskModal({
  open,
  onClose,
  onSubmit,
  projectsOptions = [],
  goalOptions = [],
  areaOptions = [],
  statusOptions = [],
  priorityOptions = [],
  initialProject = '',
}) {
  const dialogRef = useRef(null)
  const nameRef = useRef(null)

  const defaultForm = useMemo(
    () => ({
      name: '',
      startDate: '',
      dueDate: '',
      status: statusOptions[0] ?? '',
      priority: priorityOptions[0] ?? '',
      description: '',
      project: initialProject || '',
      goal: '',
      area: '',
    }),
    [initialProject, priorityOptions, statusOptions],
  )

  const [form, setForm] = useState(defaultForm)

  const charCounter = useMemo(() => `${form.description.length}/${DESCRIPTION_LIMIT}`, [form.description.length])

  useEffect(() => {
    if (open) {
      setForm(defaultForm)
    }
  }, [open, defaultForm])

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
    <div className="createTaskModal" role="dialog" aria-modal="true">
      <div className="createTaskModal__backdrop" onClick={onClose} />

      <section className="createTaskModal__panel" ref={dialogRef}>
        <header className="createTaskModal__header">
          <h2 className="createTaskModal__title">Criar nova tarefa</h2>
          <button type="button" className="createTaskModal__iconBtn" onClick={onClose} aria-label="Fechar modal">
            <span className="createTaskModal__closeIcon" aria-hidden="true" />
          </button>
        </header>

        <form className="createTaskModal__form" onSubmit={handleSubmit}>
          <label className="createTaskModal__field">
            <span className="createTaskModal__label">
              Nome da tarefa <span className="createTaskModal__asterisk" aria-hidden="true">*</span>
            </span>
            <input
              ref={nameRef}
              type="text"
              name="name"
              className="createTaskModal__input"
              placeholder="Nome da tarefa"
              value={form.name}
              onChange={updateField('name')}
              required
            />
          </label>

          <label className="createTaskModal__field">
            <span className="createTaskModal__label">
              Data da tarefa <span className="createTaskModal__asterisk" aria-hidden="true">*</span>
            </span>
            <div className="createTaskModal__dateRange">
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={updateField('startDate')}
                className="createTaskModal__dateInput"
                required
              />
              <span className="createTaskModal__dateDivider" aria-hidden="true">
                —
              </span>
              <input
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={updateField('dueDate')}
                className="createTaskModal__dateInput"
                required
              />
              <span className="createTaskModal__calendarIcon" aria-hidden="true" />
            </div>
          </label>

          <label className="createTaskModal__field">
            <span className="createTaskModal__label">
              Status <span className="createTaskModal__asterisk" aria-hidden="true">*</span>
            </span>
            <select
              className="createTaskModal__input createTaskModal__input--select"
              name="status"
              value={form.status}
              onChange={updateField('status')}
              required
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="createTaskModal__field">
            <span className="createTaskModal__label">
              Prioridade <span className="createTaskModal__asterisk" aria-hidden="true">*</span>
            </span>
            <select
              className="createTaskModal__input createTaskModal__input--select"
              name="priority"
              value={form.priority}
              onChange={updateField('priority')}
              required
            >
              {priorityOptions.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>

          <label className="createTaskModal__field">
            <span className="createTaskModal__label">
              Descrição <span className="createTaskModal__asterisk" aria-hidden="true">*</span>
            </span>
            <div className="createTaskModal__textareaWrap">
              <textarea
                className="createTaskModal__textarea"
                name="description"
                placeholder="Descreva a tarefa em detalhes"
                maxLength={DESCRIPTION_LIMIT}
                value={form.description}
                onChange={updateField('description')}
                required
              />
              <span className="createTaskModal__counter">{charCounter}</span>
            </div>
          </label>

          <label className="createTaskModal__field">
            <span className="createTaskModal__label">
              Projeto <span className="createTaskModal__asterisk" aria-hidden="true">*</span>
            </span>
            <select
              className="createTaskModal__input createTaskModal__input--select"
              name="project"
              value={form.project}
              onChange={updateField('project')}
              required
            >
              <option value="" disabled>
                Selecione o projeto da tarefa
              </option>
              {projectsOptions.map((project) => (
                <option key={project} value={project}>
                  {project}
                </option>
              ))}
            </select>
          </label>

          <label className="createTaskModal__field">
            <span className="createTaskModal__label">
              Meta <span className="createTaskModal__asterisk" aria-hidden="true">*</span>
            </span>
            <select
              className="createTaskModal__input createTaskModal__input--select"
              name="goal"
              value={form.goal}
              onChange={updateField('goal')}
              required
            >
              <option value="" disabled>
                Selecione a meta da tarefa
              </option>
              {goalOptions.map((goal) => (
                <option key={goal} value={goal}>
                  {goal}
                </option>
              ))}
            </select>
          </label>

          <label className="createTaskModal__field">
            <span className="createTaskModal__label">
              Área <span className="createTaskModal__asterisk" aria-hidden="true">*</span>
            </span>
            <select
              className="createTaskModal__input createTaskModal__input--select"
              name="area"
              value={form.area}
              onChange={updateField('area')}
              required
            >
              <option value="" disabled>
                Selecione a área da tarefa
              </option>
              {areaOptions.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>

          <footer className="createTaskModal__footer">
            <button
              type="button"
              className="createTaskModal__btn createTaskModal__btn--ghost"
              onClick={onClose}
            >
              Cancelar
            </button>
            <button type="submit" className="createTaskModal__btn createTaskModal__btn--primary">
              Criar tarefa
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
