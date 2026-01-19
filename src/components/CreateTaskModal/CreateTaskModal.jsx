import { useEffect, useMemo, useRef, useState } from 'react'

import './CreateTaskModal.css'

const DESCRIPTION_LIMIT = 200

export default function CreateTaskModal({
  open,
  onClose,
  onSubmit,
  projectsOptions = [],
  statusOptions = [],
  priorityOptions = [],
  initialProject = '',
}) {
  const dialogRef = useRef(null)
  const nameRef = useRef(null)
  const startDateRef = useRef(null)
  const dueDateRef = useRef(null)

  const normalizedProjects = useMemo(() => {
    return projectsOptions.map((option) =>
      typeof option === 'string'
        ? { id: option, label: option }
        : option
    )
  }, [projectsOptions])

  const defaultProjectId = useMemo(() => {
    if (!initialProject) return ''
    const found = normalizedProjects.find(
      (option) => option.id === initialProject || option.label === initialProject,
    )
    return found?.id || ''
  }, [initialProject, normalizedProjects])

  const defaultForm = useMemo(
    () => ({
      title: '',
      startDate: '',
      dueDate: '',
      status: statusOptions[0] ?? '',
      priority: priorityOptions[0] ?? '',
      description: '',
      projectId: defaultProjectId,
      subtasks: [],
    }),
    [defaultProjectId, priorityOptions, statusOptions],
  )

  const [form, setForm] = useState(defaultForm)
  const [subtaskDraft, setSubtaskDraft] = useState('')

  const charCounter = useMemo(() => `${form.description.length}/${DESCRIPTION_LIMIT}`, [form.description.length])

  useEffect(() => {
    if (open) {
      setForm(defaultForm)
      setSubtaskDraft('')
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
              name="title"
              className="createTaskModal__input"
              placeholder="Nome da tarefa"
              value={form.title}
              onChange={updateField('title')}
              required
            />
          </label>

          <label className="createTaskModal__field">
            <span className="createTaskModal__label">
              Data da tarefa <span className="createTaskModal__asterisk" aria-hidden="true">*</span>
            </span>
            <div className="createTaskModal__dateRange">
              <input
                ref={startDateRef}
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
                ref={dueDateRef}
                type="date"
                name="dueDate"
                value={form.dueDate}
                onChange={updateField('dueDate')}
                className="createTaskModal__dateInput"
                required
              />
              <button
                type="button"
                className="createTaskModal__calendarBtn"
                onClick={() => dueDateRef.current?.showPicker?.()}
                aria-label="Abrir calendário"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </button>
            </div>
          </label>

          <div className="createTaskModal__grid">
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
          </div>

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
                rows={3}
                required
              />
              <span className="createTaskModal__counter">{charCounter}</span>
            </div>
          </label>

          <label className="createTaskModal__field">
            <span className="createTaskModal__label">
              Projeto vinculado <span className="createTaskModal__asterisk" aria-hidden="true">*</span>
            </span>
            <select
              className="createTaskModal__input createTaskModal__input--select"
              name="projectId"
              value={form.projectId}
              onChange={updateField('projectId')}
              required
            >
              <option value="" disabled>
                Selecione o projeto
              </option>
              {normalizedProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.label}
                </option>
              ))}
            </select>
          </label>

          <label className="createTaskModal__field">
            <span className="createTaskModal__label">Subtarefas para clarificar</span>
            <div className="createTaskModal__subtasks">
              <div className="subtaskInput">
                <input
                  type="text"
                  placeholder="Ex: Definir próximo passo"
                  value={subtaskDraft}
                  onChange={(event) => setSubtaskDraft(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      if (!subtaskDraft.trim()) return
                      const newSubtask = {
                        id:
                          typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                            ? crypto.randomUUID()
                            : String(Date.now()),
                        title: subtaskDraft.trim(),
                      }
                      setForm((prev) => ({
                        ...prev,
                        subtasks: [...prev.subtasks, newSubtask],
                      }))
                      setSubtaskDraft('')
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!subtaskDraft.trim()) return
                    const newSubtask = {
                      id:
                        typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
                          ? crypto.randomUUID()
                          : String(Date.now()),
                      title: subtaskDraft.trim(),
                    }
                    setForm((prev) => ({
                      ...prev,
                      subtasks: [...prev.subtasks, newSubtask],
                    }))
                    setSubtaskDraft('')
                  }}
                >
                  Adicionar
                </button>
              </div>
              {form.subtasks.length > 0 && (
                <ul className="createTaskModal__subtaskList">
                  {form.subtasks.map((subtask, index) => (
                    <li key={subtask.id || index}>
                      <span>{subtask.title}</span>
                      <button
                        type="button"
                        onClick={() =>
                          setForm((prev) => ({
                            ...prev,
                            subtasks: prev.subtasks.filter((_, i) => i !== index),
                          }))
                        }
                      >
                        ×
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
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
