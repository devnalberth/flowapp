import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Calendar,
  Clock,
  ChevronDown,
  Briefcase,
  Heart,
  Wallet,
  Activity,
  User,
  X,
  Check,
  ClipboardList,
  RefreshCw,
  CheckCircle2,
  Archive,
  Circle,
  AlertCircle,
  Flame,
} from 'lucide-react'
import Modal from '../ui/Modal.jsx'
import Button from '../ui/Button.jsx'
import TaskCheck from '../ui/TaskCheck.jsx'
import { Segmented } from '../ui/Tabs.jsx'
import { Input, Textarea, Select, DateInput } from '../ui/Field.jsx'
import { Flag, Plus } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import './CreateTaskModal.css'

const DESCRIPTION_LIMIT = 500
const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/
const LOCAL_FIXED_NO_TIME_REGEX = /T12:00:00(?:\.000)?(?:Z|[+-]\d{2}:\d{2})?$/
const LEGACY_MIDNIGHT_REGEX = /T00:00:00(?:\.000)?(?:Z|[+-]\d{2}:\d{2})?$/

// Novos status padronizados
const STATUS_OPTIONS = [
  { id: 'todo', label: 'A Fazer', color: 'var(--fa-text-caption)', icon: ClipboardList },
  {
    id: 'in_progress',
    label: 'Em Andamento',
    color: 'var(--fa-status-info-solid)',
    icon: RefreshCw,
  },
  { id: 'done', label: 'Concluída', color: 'var(--fa-status-success-solid)', icon: CheckCircle2 },
  { id: 'archived', label: 'Arquivada', color: 'var(--fa-text-caption)', icon: Archive },
]

// Prioridades na ordem correta
const PRIORITY_OPTIONS = [
  { id: 'Baixa', label: 'Baixa', color: 'var(--fa-status-success-solid)', icon: Circle },
  { id: 'Normal', label: 'Normal', color: 'var(--fa-text-caption)', icon: Circle },
  { id: 'Alta', label: 'Alta', color: 'var(--fa-status-warning)', icon: AlertCircle },
  { id: 'Urgente', label: 'Urgente', color: 'var(--fa-status-danger)', icon: Flame },
]

// Áreas da tarefa
const AREA_OPTIONS = [
  { id: 'pessoal', label: 'Pessoal', color: 'var(--fa-area-pessoal)', icon: User },
  {
    id: 'profissional',
    label: 'Profissional',
    color: 'var(--fa-status-info-solid)',
    icon: Briefcase,
  },
  { id: 'saude', label: 'Saúde', color: 'var(--fa-status-success-solid)', icon: Activity },
  { id: 'financeiro', label: 'Financeiro', color: 'var(--fa-status-warning)', icon: Wallet },
  {
    id: 'relacionamento',
    label: 'Relacionamento',
    color: 'var(--fa-area-relacionamento)',
    icon: Heart,
  },
]

const normalizeStatus = (status) => {
  const rawStatus = String(status || '')
    .trim()
    .toLowerCase()
  if (!rawStatus) return 'todo'

  if (['todo', 'a fazer', 'capturar', 'pending'].includes(rawStatus)) return 'todo'
  if (['in_progress', 'em andamento', 'doing'].includes(rawStatus)) return 'in_progress'
  if (['done', 'concluída', 'concluida', 'completed'].includes(rawStatus)) return 'done'
  if (['archived', 'arquivada', 'arquivado'].includes(rawStatus)) return 'archived'

  return 'todo'
}

export const parseDateForForm = (dateValue) => {
  if (!dateValue) return { dueDate: '', dueTime: '' }

  const raw = String(dateValue)

  if (DATE_ONLY_REGEX.test(raw)) {
    return { dueDate: raw, dueTime: '' }
  }

  if (LOCAL_FIXED_NO_TIME_REGEX.test(raw) || LEGACY_MIDNIGHT_REGEX.test(raw)) {
    return { dueDate: raw.slice(0, 10), dueTime: '' }
  }

  const parsed = new Date(raw)
  if (Number.isNaN(parsed.getTime())) {
    return { dueDate: raw.split('T')[0] || '', dueTime: '' }
  }

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  const hours = String(parsed.getHours()).padStart(2, '0')
  const minutes = String(parsed.getMinutes()).padStart(2, '0')

  return {
    dueDate: `${year}-${month}-${day}`,
    dueTime: `${hours}:${minutes}`,
  }
}

export default function CreateTaskModal({
  open,
  onClose,
  onSubmit,
  projectsOptions = [],
  initialProject = '',
  initialData = null,
}) {
  const { projects = [], goals = [], prefs = {} } = useApp()
  const nameRef = useRef(null)

  const normalizedProjects = useMemo(() => {
    return projectsOptions.map((option) =>
      typeof option === 'string' ? { id: option, label: option } : option
    )
  }, [projectsOptions])

  const defaultProjectId = useMemo(() => {
    if (!initialProject) return ''
    const found = normalizedProjects.find(
      (option) => option.id === initialProject || option.label === initialProject
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
    [defaultProjectId]
  )

  const [form, setForm] = useState(defaultForm)
  const [subtaskDraft, setSubtaskDraft] = useState('')

  // Dropdowns
  const [showStatus, setShowStatus] = useState(false)
  const [showPriority, setShowPriority] = useState(false)
  const [showArea, setShowArea] = useState(false)
  const [showProject, setShowProject] = useState(false)

  const charCounter = useMemo(
    () => `${(form.description || '').length}/${DESCRIPTION_LIMIT}`,
    [form.description]
  )

  useEffect(() => {
    if (open) {
      if (initialData) {
        const { dueDate, dueTime } = parseDateForForm(initialData.due_date || initialData.dueDate)
        const incomingSubtasks = Array.isArray(initialData.subtasks)
          ? initialData.subtasks
          : Array.isArray(initialData.clarifyItems)
            ? initialData.clarifyItems
            : []

        setForm({
          ...defaultForm,
          ...initialData,
          title: initialData.title || '',
          description: initialData.description || '',
          dueDate,
          dueTime,
          status: normalizeStatus(initialData.status),
          priority: initialData.priority || 'Normal',
          area: initialData.area || initialData.context || 'pessoal',
          projectId: initialData.projectId || initialData.project_id || defaultProjectId,
          subtasks: incomingSubtasks,
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
        : `${form.dueDate}T12:00:00.000Z`
    }

    // Determina se é Flow automaticamente (Alta ou Urgente = Flow)
    const isFlow = form.priority === 'Alta' || form.priority === 'Urgente'

    const payload = {
      ...form,
      dueDate: finalDueDate,
      context: form.area, // Salva área como context para compatibilidade
      status: normalizeStatus(form.status),
      tags: isFlow ? ['flow'] : [], // Adiciona tag flow para prioridades altas
    }

    onSubmit?.(payload)
  }

  const selectedStatus = STATUS_OPTIONS.find((s) => s.id === form.status) || STATUS_OPTIONS[0]
  const selectedPriority =
    PRIORITY_OPTIONS.find((p) => p.id === form.priority) || PRIORITY_OPTIONS[1]
  const selectedArea = AREA_OPTIONS.find((a) => a.id === form.area) || AREA_OPTIONS[0]
  const selectedProject = normalizedProjects.find((p) => p.id === form.projectId)

  const linkedProject = projects.find((p) => p.id === form.projectId)
  const linkedGoal = goals.find((g) => g.id === (linkedProject?.goalId || linkedProject?.goal_id))
  const mask = (value) =>
    prefs.hideFinanceValues
      ? String(value || '').replace(/R\$\s*[\d.,]+(?:\s*(?:mil|milhões?|mi))?/gi, 'R$ ••••')
      : value
  const addSubtask = () => {
    if (!subtaskDraft.trim()) return
    const newSubtask = {
      id: crypto.randomUUID?.() || String(Date.now()),
      title: subtaskDraft.trim(),
    }
    setForm((prev) => ({ ...prev, subtasks: [...prev.subtasks, newSubtask] }))
    setSubtaskDraft('')
  }
  return (
    <Modal
      title={initialData ? 'Editar tarefa' : 'Nova tarefa'}
      subtitle="Ligue a um projeto para ela contar na meta."
      icon={Plus}
      width={600}
      className="create-task-v3"
      onClose={onClose}
      hint="Enter salva · Esc cancela"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="create-task-form">
            {initialData ? 'Salvar' : 'Criar tarefa'}
          </Button>
        </>
      }
    >
      <form id="create-task-form" className="create-task-form" onSubmit={handleSubmit}>
        <Input
          ref={nameRef}
          autoFocus
          label="Título"
          placeholder="O que você precisa fazer?"
          required
          value={form.title}
          onChange={(e) => updateField('title', e.target.value)}
        />
        <Textarea
          className="create-task-form__description"
          label="Descrição"
          optional
          maxLength={DESCRIPTION_LIMIT}
          rows={3}
          placeholder="Detalhes adicionais sobre a tarefa"
          value={form.description}
          onChange={(e) => updateField('description', e.target.value)}
        />
        <div className="create-task-form__row">
          <Select
            label="Projeto"
            value={form.projectId}
            onChange={(e) => updateField('projectId', e.target.value)}
          >
            <option value="">Sem projeto</option>
            {normalizedProjects.map((p) => (
              <option key={p.id} value={p.id}>
                {mask(p.label)}
              </option>
            ))}
          </Select>
          <Select
            label="Área"
            value={form.area}
            onChange={(e) => updateField('area', e.target.value)}
          >
            {AREA_OPTIONS.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label}
              </option>
            ))}
          </Select>
        </div>
        {linkedGoal && (
          <div className="create-task-form__goal">
            <Flag size={14} />
            <span>
              Conta para a meta {mask(linkedGoal.title)} (via {mask(linkedProject.title)})
            </span>
          </div>
        )}
        <div className="create-task-form__priority">
          <label>
            Prioridade{['Alta', 'Urgente'].includes(form.priority) && <span>Entra no Flow</span>}
          </label>
          <Segmented
            label="Prioridade da tarefa"
            value={form.priority}
            options={PRIORITY_OPTIONS.map((p) => ({ value: p.id, label: p.label }))}
            onChange={(value) => updateField('priority', value)}
          />
          <p>Urgente e Alta entram no Flow automaticamente.</p>
        </div>
        <div className="create-task-form__row create-task-form__row--three">
          <DateInput
            label="Data"
            value={form.dueDate}
            onChange={(e) => updateField('dueDate', e.target.value)}
          />
          <Input
            label="Hora"
            optional
            type="time"
            value={form.dueTime}
            onChange={(e) => updateField('dueTime', e.target.value)}
          />
          <Select
            label="Status"
            value={form.status}
            onChange={(e) => updateField('status', e.target.value)}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.label}
              </option>
            ))}
          </Select>
        </div>
        <section className="create-task-form__subtasks">
          <h3>Subtarefas{form.subtasks.length > 0 && ` · ${form.subtasks.length}`}</h3>
          {form.subtasks.map((subtask, index) => (
            <div className="create-task-form__subtask" key={subtask.id || index}>
              <TaskCheck
                checked={subtask.done}
                disabled
                label={subtask.title || subtask.label || 'Subtarefa'}
              />
              <span className={subtask.done ? 'is-done' : ''}>
                {mask(subtask.title || subtask.label)}
              </span>
              <button
                type="button"
                aria-label={`Remover ${subtask.title || subtask.label}`}
                onClick={() =>
                  setForm((prev) => ({
                    ...prev,
                    subtasks: prev.subtasks.filter((_, i) => i !== index),
                  }))
                }
              >
                <X size={14} />
              </button>
            </div>
          ))}
          <div className="create-task-form__add">
            <button type="button" aria-label="Adicionar subtarefa" onClick={addSubtask}>
              <Plus size={14} />
            </button>
            <input
              aria-label="Nova subtarefa"
              placeholder="Adicionar subtarefa…"
              value={subtaskDraft}
              onChange={(e) => setSubtaskDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  addSubtask()
                }
              }}
            />
          </div>
        </section>
      </form>
    </Modal>
  )
}
