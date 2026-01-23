import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Calendar, Clock, ChevronDown, Briefcase, Heart, Wallet, Activity, User, X, Check,
  ClipboardList, RefreshCw, CheckCircle2, Archive, Circle, AlertCircle, Flame
} from 'lucide-react'
import './CreateTaskModal.css'

const DESCRIPTION_LIMIT = 500

// Novos status padronizados
const STATUS_OPTIONS = [
  { id: 'todo', label: 'A Fazer', color: '#6b7280', icon: ClipboardList },
  { id: 'in_progress', label: 'Em Andamento', color: '#3b82f6', icon: RefreshCw },
  { id: 'done', label: 'Concluída', color: '#10b981', icon: CheckCircle2 },
  { id: 'archived', label: 'Arquivada', color: '#9ca3af', icon: Archive },
]

// Prioridades na ordem correta
const PRIORITY_OPTIONS = [
  { id: 'Baixa', label: 'Baixa', color: '#10b981', icon: Circle },
  { id: 'Normal', label: 'Normal', color: '#6b7280', icon: Circle },
  { id: 'Alta', label: 'Alta', color: '#f59e0b', icon: AlertCircle },
  { id: 'Urgente', label: 'Urgente', color: '#ef4444', icon: Flame },
]

// Áreas da tarefa
const AREA_OPTIONS = [
  { id: 'pessoal', label: 'Pessoal', color: '#8b5cf6', icon: User },
  { id: 'profissional', label: 'Profissional', color: '#3b82f6', icon: Briefcase },
  { id: 'saude', label: 'Saúde', color: '#10b981', icon: Activity },
  { id: 'financeiro', label: 'Financeiro', color: '#f59e0b', icon: Wallet },
  { id: 'relacionamento', label: 'Relacionamento', color: '#ec4899', icon: Heart },
]

export default function CreateTaskModal({
  open,
  onClose,
  onSubmit,
  projectsOptions = [],
  initialProject = '',
  initialData = null,
}) {
  const dialogRef = useRef(null)
  const nameRef = useRef(null)

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
      dueDate: '',
      dueTime: '',
      status: 'todo',
      priority: 'Normal',
      area: 'pessoal',
      description: '',
      projectId: defaultProjectId,
      subtasks: [],
    }),
    [defaultProjectId],
  )

  const [form, setForm] = useState(defaultForm)
  const [subtaskDraft, setSubtaskDraft] = useState('')

  // Dropdowns
  const [showStatus, setShowStatus] = useState(false)
  const [showPriority, setShowPriority] = useState(false)
  const [showArea, setShowArea] = useState(false)
  const [showProject, setShowProject] = useState(false)

  const charCounter = useMemo(() => `${form.description.length}/${DESCRIPTION_LIMIT}`, [form.description.length])

  useEffect(() => {
    if (open) {
      if (initialData) {
        // Extrai data e hora se existir
        let dueDate = ''
        let dueTime = ''
        if (initialData.due_date || initialData.dueDate) {
          const dateVal = initialData.due_date || initialData.dueDate
          if (dateVal.includes('T')) {
            [dueDate, dueTime] = dateVal.split('T')
            dueTime = dueTime.slice(0, 5)
          } else {
            dueDate = dateVal
          }
        }

        setForm({
          ...defaultForm,
          ...initialData,
          dueDate,
          dueTime,
          status: initialData.status || 'todo',
          priority: initialData.priority || 'Normal',
          area: initialData.area || initialData.context || 'pessoal',
          projectId: initialData.projectId || initialData.project_id || defaultProjectId,
          subtasks: initialData.subtasks || [],
        })
      } else {
        setForm(defaultForm)
      }
      setSubtaskDraft('')
      // Fecha todos os dropdowns
      setShowStatus(false)
      setShowPriority(false)
      setShowArea(false)
      setShowProject(false)
    }
  }, [open, defaultForm, initialData, defaultProjectId])

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
      requestAnimationFrame(() => nameRef.current?.focus())
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
    let finalDueDate = null
    if (form.dueDate) {
      finalDueDate = form.dueTime
        ? new Date(`${form.dueDate}T${form.dueTime}`).toISOString()
        : new Date(`${form.dueDate}T00:00:00`).toISOString()
    }

    // Determina se é Flow automaticamente (Alta ou Urgente = Flow)
    const isFlow = form.priority === 'Alta' || form.priority === 'Urgente'

    const payload = {
      ...form,
      dueDate: finalDueDate,
      context: form.area, // Salva área como context para compatibilidade
      tags: isFlow ? ['flow'] : [], // Adiciona tag flow para prioridades altas
    }

    onSubmit?.(payload)
  }

  const selectedStatus = STATUS_OPTIONS.find(s => s.id === form.status) || STATUS_OPTIONS[0]
  const selectedPriority = PRIORITY_OPTIONS.find(p => p.id === form.priority) || PRIORITY_OPTIONS[1]
  const selectedArea = AREA_OPTIONS.find(a => a.id === form.area) || AREA_OPTIONS[0]
  const selectedProject = normalizedProjects.find(p => p.id === form.projectId)

  return (
    <div className="createTaskModal" role="dialog" aria-modal="true">
      <div className="createTaskModal__backdrop" onClick={onClose} />

      <section className="createTaskModal__panel" ref={dialogRef}>
        <header className="createTaskModal__header">
          <h2 className="createTaskModal__title">
            {initialData ? 'Editar tarefa' : 'Nova tarefa'}
          </h2>
          <button type="button" className="createTaskModal__closeBtn" onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </header>

        <form className="createTaskModal__form" onSubmit={handleSubmit}>
          {/* Nome da Tarefa */}
          <div className="ctm__field">
            <label className="ctm__label">
              Nome da tarefa <span className="ctm__required">*</span>
            </label>
            <input
              ref={nameRef}
              type="text"
              className="ctm__input ctm__input--lg"
              placeholder="O que você precisa fazer?"
              value={form.title}
              onChange={(e) => updateField('title', e.target.value)}
              required
            />
          </div>

          {/* Data e Hora - Design Moderno */}
          <div className="ctm__row">
            <div className="ctm__field ctm__field--flex">
              <label className="ctm__label">
                <Calendar size={14} />
                Data
              </label>
              <input
                type="date"
                className="ctm__dateInput"
                value={form.dueDate}
                onChange={(e) => updateField('dueDate', e.target.value)}
              />
            </div>
            <div className="ctm__field ctm__field--flex">
              <label className="ctm__label">
                <Clock size={14} />
                Horário
              </label>
              <input
                type="time"
                className="ctm__timeInput"
                value={form.dueTime}
                onChange={(e) => updateField('dueTime', e.target.value)}
              />
            </div>
          </div>

          {/* Status e Prioridade - Chips Modernos */}
          <div className="ctm__row">
            {/* Status Dropdown */}
            <div className="ctm__field">
              <label className="ctm__label">Status</label>
              <div className="ctm__dropdown">
                <button
                  type="button"
                  className="ctm__dropdownBtn"
                  onClick={() => { setShowStatus(!showStatus); setShowPriority(false); setShowArea(false); setShowProject(false) }}
                  style={{ '--accent': selectedStatus.color }}
                >
                  <span className="ctm__dropdownIcon">{(() => { const Icon = selectedStatus.icon; return <Icon size={16} /> })()}</span>
                  <span>{selectedStatus.label}</span>
                  <ChevronDown size={16} className={showStatus ? 'rotated' : ''} />
                </button>
                {showStatus && (
                  <div className="ctm__dropdownMenu">
                    {STATUS_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`ctm__dropdownItem ${form.status === opt.id ? 'active' : ''}`}
                        onClick={() => { updateField('status', opt.id); setShowStatus(false) }}
                      >
                        {(() => { const Icon = opt.icon; return <Icon size={16} /> })()}
                        <span>{opt.label}</span>
                        {form.status === opt.id && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Prioridade Dropdown */}
            <div className="ctm__field">
              <label className="ctm__label">
                Prioridade
                {(form.priority === 'Alta' || form.priority === 'Urgente') && (
                  <span className="ctm__flowBadge">⚡ Flow</span>
                )}
              </label>
              <div className="ctm__dropdown">
                <button
                  type="button"
                  className="ctm__dropdownBtn"
                  onClick={() => { setShowPriority(!showPriority); setShowStatus(false); setShowArea(false); setShowProject(false) }}
                  style={{ '--accent': selectedPriority.color }}
                >
                  <span className="ctm__dropdownIcon">{(() => { const Icon = selectedPriority.icon; return <Icon size={16} /> })()}</span>
                  <span>{selectedPriority.label}</span>
                  <ChevronDown size={16} className={showPriority ? 'rotated' : ''} />
                </button>
                {showPriority && (
                  <div className="ctm__dropdownMenu">
                    {PRIORITY_OPTIONS.map(opt => (
                      <button
                        key={opt.id}
                        type="button"
                        className={`ctm__dropdownItem ${form.priority === opt.id ? 'active' : ''}`}
                        onClick={() => { updateField('priority', opt.id); setShowPriority(false) }}
                      >
                        {(() => { const Icon = opt.icon; return <Icon size={16} /> })()}
                        <span>{opt.label}</span>
                        {(opt.id === 'Alta' || opt.id === 'Urgente') && <span className="ctm__flowTag">Flow</span>}
                        {form.priority === opt.id && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Área e Projeto */}
          <div className="ctm__row">
            {/* Área Dropdown */}
            <div className="ctm__field">
              <label className="ctm__label">Área</label>
              <div className="ctm__dropdown">
                <button
                  type="button"
                  className="ctm__dropdownBtn"
                  onClick={() => { setShowArea(!showArea); setShowStatus(false); setShowPriority(false); setShowProject(false) }}
                  style={{ '--accent': selectedArea.color }}
                >
                  {(() => { const Icon = selectedArea.icon; return <Icon size={16} /> })()}
                  <span>{selectedArea.label}</span>
                  <ChevronDown size={16} className={showArea ? 'rotated' : ''} />
                </button>
                {showArea && (
                  <div className="ctm__dropdownMenu">
                    {AREA_OPTIONS.map(opt => {
                      const Icon = opt.icon
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          className={`ctm__dropdownItem ${form.area === opt.id ? 'active' : ''}`}
                          onClick={() => { updateField('area', opt.id); setShowArea(false) }}
                          style={{ '--item-color': opt.color }}
                        >
                          <Icon size={16} style={{ color: opt.color }} />
                          <span>{opt.label}</span>
                          {form.area === opt.id && <Check size={14} />}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Projeto Dropdown */}
            <div className="ctm__field">
              <label className="ctm__label">Projeto</label>
              <div className="ctm__dropdown">
                <button
                  type="button"
                  className="ctm__dropdownBtn ctm__dropdownBtn--secondary"
                  onClick={() => { setShowProject(!showProject); setShowStatus(false); setShowPriority(false); setShowArea(false) }}
                >
                  <span>{selectedProject?.label || 'Sem projeto'}</span>
                  <ChevronDown size={16} className={showProject ? 'rotated' : ''} />
                </button>
                {showProject && (
                  <div className="ctm__dropdownMenu">
                    <button
                      type="button"
                      className={`ctm__dropdownItem ${!form.projectId ? 'active' : ''}`}
                      onClick={() => { updateField('projectId', ''); setShowProject(false) }}
                    >
                      <span>Sem projeto</span>
                      {!form.projectId && <Check size={14} />}
                    </button>
                    {normalizedProjects.map(project => (
                      <button
                        key={project.id}
                        type="button"
                        className={`ctm__dropdownItem ${form.projectId === project.id ? 'active' : ''}`}
                        onClick={() => { updateField('projectId', project.id); setShowProject(false) }}
                      >
                        <span>{project.label}</span>
                        {form.projectId === project.id && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Descrição - Opcional */}
          <div className="ctm__field">
            <label className="ctm__label">Descrição</label>
            <div className="ctm__textareaWrap">
              <textarea
                className="ctm__textarea"
                placeholder="Detalhes adicionais sobre a tarefa (opcional)"
                maxLength={DESCRIPTION_LIMIT}
                value={form.description}
                onChange={(e) => updateField('description', e.target.value)}
                rows={3}
              />
              <span className="ctm__counter">{charCounter}</span>
            </div>
          </div>

          {/* Subtarefas */}
          <div className="ctm__field">
            <label className="ctm__label">Subtarefas</label>
            <div className="ctm__subtasks">
              <div className="ctm__subtaskInput">
                <input
                  type="text"
                  placeholder="Adicionar subtarefa..."
                  value={subtaskDraft}
                  onChange={(e) => setSubtaskDraft(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      if (!subtaskDraft.trim()) return
                      const newSubtask = {
                        id: crypto.randomUUID?.() || String(Date.now()),
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
                  className="ctm__addBtn"
                  onClick={() => {
                    if (!subtaskDraft.trim()) return
                    const newSubtask = {
                      id: crypto.randomUUID?.() || String(Date.now()),
                      title: subtaskDraft.trim(),
                    }
                    setForm((prev) => ({
                      ...prev,
                      subtasks: [...prev.subtasks, newSubtask],
                    }))
                    setSubtaskDraft('')
                  }}
                >
                  +
                </button>
              </div>
              {form.subtasks.length > 0 && (
                <ul className="ctm__subtaskList">
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
                        <X size={14} />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Footer */}
          <footer className="ctm__footer">
            <button type="button" className="ctm__btn ctm__btn--ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="ctm__btn ctm__btn--primary">
              {initialData ? 'Salvar' : 'Criar tarefa'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
