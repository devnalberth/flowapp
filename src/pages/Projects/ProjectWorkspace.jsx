import { useMemo, useState } from 'react'
import {
  ArrowLeft, LayoutGrid, List as ListIcon, CalendarDays, Gauge,
  Pencil, Trash2, Plus, CheckCircle2, ListChecks, Clock, Target,
  Building2, Mail, Phone, ChevronLeft, ChevronRight, Flag, Archive, ArchiveRestore
} from 'lucide-react'
import { computeProjectStats, tasksOfProject, PROJECT_STATUS_META } from '../../utils/projectMetrics'
import { normalizeTaskStatus } from '../../utils/taskStatus'
import './ProjectWorkspace.css'

const TASK_COLUMNS = [
  { status: 'todo', label: 'A Fazer' },
  { status: 'in_progress', label: 'Em Andamento' },
  { status: 'done', label: 'Concluída' },
]

const PRIORITY_TONE = { Urgente: '#ef4444', Alta: '#f59e0b', Normal: '#3b82f6', Baixa: '#10b981' }

const dateKey = (value) => {
  if (!value) return null
  const s = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10)
}

const fmtDate = (value) => {
  const k = dateKey(value)
  if (!k) return null
  const d = new Date(`${k}T00:00:00`)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

const fmtShort = (value) => {
  const k = dateKey(value)
  if (!k) return null
  const d = new Date(`${k}T00:00:00`)
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

export default function ProjectWorkspace({ project, tasks = [], client, goal, onBack, onEdit, onArchive, onRestore, onDelete, updateTask, onNewTask }) {
  const [tab, setTab] = useState('kanban')
  const stats = useMemo(() => computeProjectStats(project, tasks), [project, tasks])
  const color = `#${(project.color || 'ff9500').replace('#', '')}`
  const archived = project.status === 'archived'
  const statusMeta = archived
    ? PROJECT_STATUS_META.archived
    : PROJECT_STATUS_META[stats.autoStatus] || PROJECT_STATUS_META.todo

  // Tarefas do projeto (sem arquivadas) para board/lista/calendário
  const projectTasks = useMemo(
    () => tasksOfProject(project, tasks).filter(t => normalizeTaskStatus(t) !== 'archived'),
    [project, tasks]
  )

  const TABS = [
    { id: 'overview', label: 'Visão Geral', icon: Gauge },
    { id: 'kanban', label: 'Kanban', icon: LayoutGrid },
    { id: 'list', label: 'Lista', icon: ListIcon },
    { id: 'calendar', label: 'Calendário', icon: CalendarDays },
  ]

  return (
    <div className="pw" style={{ '--accent': color }}>
      <header className="pw__header">
        <button className="pw__back" onClick={onBack}><ArrowLeft size={18} /> Projetos</button>

        <div className="pw__titleRow">
          <div className="pw__titleMain">
            <span className="pw__dot" />
            <div>
              <h1 className="pw__title">{project.title}</h1>
              <div className="pw__sub">
                <span className={`pw__status pw__status--${statusMeta.tone}`}>{statusMeta.label}</span>
                {client && <span className="pw__subItem"><Building2 size={13} /> {client.name}</span>}
                {goal && <span className="pw__subItem"><Target size={13} /> {goal.title}</span>}
              </div>
            </div>
          </div>

          <div className="pw__headActions">
            {!archived && (
              <button className="pw__iconBtn" onClick={() => onEdit?.(project)} title="Editar projeto" aria-label="Editar projeto"><Pencil size={16} /></button>
            )}
            {archived ? (
              <button className="pw__iconBtn" onClick={() => onRestore?.(project)} title="Restaurar projeto" aria-label="Restaurar projeto"><ArchiveRestore size={16} /></button>
            ) : (
              <button className="pw__iconBtn" onClick={() => onArchive?.(project)} title="Arquivar projeto" aria-label="Arquivar projeto"><Archive size={16} /></button>
            )}
            <button className="pw__iconBtn pw__iconBtn--danger" onClick={() => onDelete?.(project)} title="Excluir projeto" aria-label="Excluir projeto"><Trash2 size={16} /></button>
          </div>
        </div>

        <div className="pw__progressBar">
          <div className="pw__progressFill" style={{ width: `${stats.progress}%` }} />
          <span className="pw__progressLabel">{stats.progress}% concluído</span>
        </div>

        <nav className="pw__tabs">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button key={t.id} className={`pw__tab ${tab === t.id ? 'is-active' : ''}`} onClick={() => setTab(t.id)}>
                <Icon size={15} /> {t.label}
              </button>
            )
          })}
        </nav>
      </header>

      <div className="pw__content">
        {tab === 'overview' && <OverviewView project={project} stats={stats} client={client} goal={goal} />}
        {tab === 'kanban' && <KanbanView tasks={projectTasks} updateTask={updateTask} onNewTask={onNewTask} />}
        {tab === 'list' && <ListView tasks={projectTasks} updateTask={updateTask} />}
        {tab === 'calendar' && <CalendarView tasks={projectTasks} accent={color} />}
      </div>
    </div>
  )
}

/* ---------- Visão Geral ---------- */
function OverviewView({ project, stats, client, goal }) {
  const start = fmtDate(project.startDate || project.start_date)
  const end = fmtDate(project.endDate || project.end_date)
  let remaining = null
  const endK = dateKey(project.endDate || project.end_date)
  if (endK) {
    const today = new Date(); today.setHours(0, 0, 0, 0)
    remaining = Math.round((new Date(`${endK}T00:00:00`) - today) / 86400000)
  }

  return (
    <div className="pw__overview">
      <div className="pw__kpis">
        <div className="pw__kpi"><ListChecks size={18} /><strong>{stats.totalTasks}</strong><span>Tarefas</span></div>
        <div className="pw__kpi pw__kpi--done"><CheckCircle2 size={18} /><strong>{stats.doneTasks}</strong><span>Concluídas</span></div>
        <div className="pw__kpi pw__kpi--pending"><Clock size={18} /><strong>{stats.pendingTasks}</strong><span>Pendentes</span></div>
        <div className="pw__kpi pw__kpi--accent"><Gauge size={18} /><strong>{stats.progress}%</strong><span>Andamento</span></div>
      </div>

      <div className="pw__panels">
        <section className="pw__panel">
          <h3 className="pw__panelTitle">Detalhes</h3>
          <ul className="pw__details">
            <li><span>Início</span><strong>{start || '—'}</strong></li>
            <li><span>Prazo de término</span><strong>{end || '—'}</strong></li>
            <li>
              <span>Dias restantes</span>
              <strong className={remaining != null && remaining < 0 ? 'is-late' : ''}>
                {remaining == null ? '—' : remaining < 0 ? `${Math.abs(remaining)}d atrasado` : `${remaining}d`}
              </strong>
            </li>
            <li><span>Área</span><strong>{project.area || '—'}</strong></li>
            <li><span>Meta vinculada</span><strong>{goal?.title || '—'}</strong></li>
          </ul>
        </section>

        <section className="pw__panel">
          <h3 className="pw__panelTitle">Cliente</h3>
          {client ? (
            <ul className="pw__details">
              <li><span>Nome</span><strong>{client.name}</strong></li>
              {client.company && <li><span>Empresa</span><strong>{client.company}</strong></li>}
              {client.email && <li><span><Mail size={13} /> E-mail</span><strong>{client.email}</strong></li>}
              {client.phone && <li><span><Phone size={13} /> Telefone</span><strong>{client.phone}</strong></li>}
              {client.notes && <li className="pw__notes"><span>Notas</span><p>{client.notes}</p></li>}
            </ul>
          ) : (
            <p className="pw__empty">Projeto sem cliente vinculado.</p>
          )}
        </section>
      </div>

      {project.description && (
        <section className="pw__panel">
          <h3 className="pw__panelTitle">Descrição</h3>
          <p className="pw__desc">{project.description}</p>
        </section>
      )}
    </div>
  )
}

/* ---------- Kanban de tarefas ---------- */
function KanbanView({ tasks, updateTask, onNewTask }) {
  const [draggingId, setDraggingId] = useState(null)
  const [overCol, setOverCol] = useState(null)

  const byColumn = useMemo(() => {
    const map = { todo: [], in_progress: [], done: [] }
    tasks.forEach(t => {
      const s = normalizeTaskStatus(t)
      if (map[s]) map[s].push(t)
    })
    return map
  }, [tasks])

  const handleDrop = async (e, colStatus) => {
    e.preventDefault()
    const id = e.dataTransfer.getData('text/plain') || draggingId
    setOverCol(null); setDraggingId(null)
    if (!id) return
    const task = tasks.find(t => t.id === id)
    if (!task || normalizeTaskStatus(task) === colStatus) return
    const completed = colStatus === 'done'
    await updateTask?.(id, {
      status: colStatus,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    })
  }

  return (
    <div className="pw__kanban">
      {TASK_COLUMNS.map(col => (
        <section
          key={col.status}
          className={`pw__col ${overCol === col.status ? 'is-over' : ''}`}
          data-col={col.status}
          onDragOver={(e) => { e.preventDefault(); setOverCol(col.status) }}
          onDragLeave={() => setOverCol((c) => c === col.status ? null : c)}
          onDrop={(e) => handleDrop(e, col.status)}
        >
          <header className="pw__colHead">
            <span className="pw__colTitle">{col.label}</span>
            <span className="pw__colCount">{byColumn[col.status].length}</span>
          </header>

          <div className="pw__colBody">
            {byColumn[col.status].map(task => (
              <article
                key={task.id}
                className="pw__task"
                draggable
                onDragStart={(e) => { setDraggingId(task.id); e.dataTransfer.setData('text/plain', task.id); e.dataTransfer.effectAllowed = 'move' }}
                onDragEnd={() => { setDraggingId(null); setOverCol(null) }}
              >
                <p className="pw__taskTitle">{task.title}</p>
                <div className="pw__taskMeta">
                  {task.priority && (
                    <span className="pw__prio" style={{ '--p': PRIORITY_TONE[task.priority] || '#9ca3af' }}>
                      <Flag size={11} /> {task.priority}
                    </span>
                  )}
                  {fmtShort(task.due_date) && <span className="pw__due"><Clock size={11} /> {fmtShort(task.due_date)}</span>}
                </div>
              </article>
            ))}

            <button className="pw__addTask" onClick={() => onNewTask?.(col.status)}>
              <Plus size={14} /> Nova tarefa
            </button>
          </div>
        </section>
      ))}
    </div>
  )
}

/* ---------- Lista ---------- */
function ListView({ tasks, updateTask }) {
  const ordered = useMemo(() => {
    const rank = { todo: 0, in_progress: 1, done: 2, archived: 3 }
    return [...tasks].sort((a, b) => (rank[normalizeTaskStatus(a)] ?? 0) - (rank[normalizeTaskStatus(b)] ?? 0))
  }, [tasks])

  if (ordered.length === 0) return <p className="pw__empty pw__empty--block">Nenhuma tarefa neste projeto ainda.</p>

  return (
    <ul className="pw__list">
      {ordered.map(task => {
        const s = normalizeTaskStatus(task)
        const isDone = s === 'done'
        return (
          <li key={task.id} className={`pw__row ${isDone ? 'is-done' : ''}`}>
            <button
              className={`pw__check ${isDone ? 'is-checked' : ''}`}
              onClick={() => updateTask?.(task.id, { completed: !isDone, status: !isDone ? 'done' : 'todo', completed_at: !isDone ? new Date().toISOString() : null })}
              aria-label={isDone ? 'Reabrir' : 'Concluir'}
            >
              <CheckCircle2 size={16} />
            </button>
            <div className="pw__rowBody">
              <span className="pw__rowTitle">{task.title}</span>
              <div className="pw__rowMeta">
                <span className={`pw__statusTag pw__statusTag--${s}`}>{TASK_COLUMNS.find(c => c.status === s)?.label || 'Tarefa'}</span>
                {task.priority && <span className="pw__prio" style={{ '--p': PRIORITY_TONE[task.priority] || '#9ca3af' }}><Flag size={11} /> {task.priority}</span>}
                {fmtShort(task.due_date) && <span className="pw__due"><Clock size={11} /> {fmtShort(task.due_date)}</span>}
              </div>
            </div>
          </li>
        )
      })}
    </ul>
  )
}

/* ---------- Calendário ---------- */
const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

function CalendarView({ tasks, accent }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d })
  const [selected, setSelected] = useState(null)

  const { cells, byDay, monthLabel } = useMemo(() => {
    const y = cursor.getFullYear(), m = cursor.getMonth()
    const daysInMonth = new Date(y, m + 1, 0).getDate()
    const firstDow = new Date(y, m, 1).getDay()
    const arr = []
    for (let i = 0; i < firstDow; i++) arr.push(null)
    for (let d = 1; d <= daysInMonth; d++) arr.push(d)

    const map = {}
    tasks.forEach(t => {
      const k = dateKey(t.due_date)
      if (!k) return
      const [ty, tm, td] = k.split('-').map(Number)
      if (ty === y && tm === m + 1) {
        if (!map[td]) map[td] = []
        map[td].push(t)
      }
    })
    return { cells: arr, byDay: map, monthLabel: `${MONTHS[m]} ${y}` }
  }, [cursor, tasks])

  const today = new Date()
  const isToday = (d) => d && today.getDate() === d && today.getMonth() === cursor.getMonth() && today.getFullYear() === cursor.getFullYear()
  const selectedTasks = selected && byDay[selected] ? byDay[selected] : []

  const shift = (delta) => { setSelected(null); setCursor(c => new Date(c.getFullYear(), c.getMonth() + delta, 1)) }

  return (
    <div className="pw__calendar" style={{ '--accent': accent }}>
      <div className="pw__calMain">
        <header className="pw__calHead">
          <button className="pw__calNav" onClick={() => shift(-1)}><ChevronLeft size={18} /></button>
          <strong>{monthLabel}</strong>
          <button className="pw__calNav" onClick={() => shift(1)}><ChevronRight size={18} /></button>
        </header>
        <div className="pw__calWeek">{WEEKDAYS.map((d, i) => <span key={i}>{d}</span>)}</div>
        <div className="pw__calGrid">
          {cells.map((d, i) => {
            const has = d && byDay[d]
            return (
              <button
                key={i}
                className={`pw__calDay ${!d ? 'is-empty' : ''} ${isToday(d) ? 'is-today' : ''} ${selected === d ? 'is-selected' : ''}`}
                disabled={!d}
                onClick={() => setSelected(d)}
              >
                {d}
                {has && <span className="pw__calDot" data-count={byDay[d].length} />}
              </button>
            )
          })}
        </div>
      </div>

      <aside className="pw__calSide">
        <h4>{selected ? `Dia ${selected}` : 'Selecione um dia'}</h4>
        {selected ? (
          selectedTasks.length ? (
            <ul className="pw__calTasks">
              {selectedTasks.map(t => (
                <li key={t.id} className={normalizeTaskStatus(t) === 'done' ? 'is-done' : ''}>
                  <span className="pw__calTaskDot" style={{ background: PRIORITY_TONE[t.priority] || '#9ca3af' }} />
                  {t.title}
                </li>
              ))}
            </ul>
          ) : <p className="pw__empty">Sem tarefas neste dia.</p>
        ) : <p className="pw__empty">Clique num dia para ver as tarefas.</p>}
      </aside>
    </div>
  )
}
