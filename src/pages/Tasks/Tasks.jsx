import { useEffect, useMemo, useState } from 'react'

import TopNav from '../../components/TopNav/TopNav.jsx'

import './Tasks.css'

const DEFAULT_USER = {
  name: 'Matheus Nalberth',
  email: 'Nalberthdev@gmail.com',
  avatarUrl: 'https://placehold.co/42x42',
}

const FILTERS = [
  { id: 'today', label: 'Hoje', group: 'timeline', icon: 'list', tone: 'primary' },
  { id: 'flow', label: 'Flow', group: 'status', icon: 'spark', tone: 'amber' },
  { id: 'quick', label: 'Tarefa Rápida', group: 'status', icon: 'bolt', tone: 'mint' },
  { id: 'done', label: 'Finalizada', group: 'status', icon: 'check', tone: 'sage' },
  { id: 'tomorrow', label: 'Amanhã', group: 'timeline', icon: 'sun', tone: 'dawn' },
  { id: 'late', label: 'Atrasadas', group: 'timeline', icon: 'calendar-late', tone: 'warning' },
  { id: 'unscheduled', label: 'Sem Agendamento', group: 'timeline', icon: 'calendar-off', tone: 'stone' },
]

const INITIAL_TASKS = [
  {
    id: 'task-flow-onboarding',
    title: 'Desenhar ritual de onboarding do Flow CRM',
    context: 'Next Action · Squad Flow Sprint 07',
    stage: 'Clarificar',
    status: 'Flow',
    tags: ['flow'],
    priority: 'Urgente',
    timeline: 'today',
    dueLabel: 'Hoje · 14h00',
    energy: 'Criativo',
    horizon: "Focus 90'",
    xp: 24,
    progress: 0.45,
    completed: false,
    subtasks: [
      { id: 'sub-flow-onboarding-1', label: 'Capturar principais dores do usuário em entrevistas', done: false },
      { id: 'sub-flow-onboarding-2', label: 'Clarificar responsabilidades de cada squad', done: false },
      { id: 'sub-flow-onboarding-3', label: 'Definir primeira versão do ritual', done: false },
    ],
  },
  {
    id: 'task-flow-brief',
    title: 'Validar briefing com time de Produto Atlas',
    context: 'Waiting For · Produto Atlas',
    stage: 'Organizar',
    status: 'Flow',
    tags: ['flow'],
    priority: 'Normal',
    timeline: 'tomorrow',
    dueLabel: 'Amanhã · 09h30',
    energy: 'Estratégico',
    horizon: "Focus 45'",
    xp: 16,
    progress: 0.25,
    completed: false,
    subtasks: [
      { id: 'sub-flow-brief-1', label: 'Esclarecer objetivos do briefing', done: true },
      { id: 'sub-flow-brief-2', label: 'Mapear dependências externas', done: false },
      { id: 'sub-flow-brief-3', label: 'Registrar próximos passos no Notion', done: false },
    ],
  },
  {
    id: 'task-quick-video',
    title: 'Gravar vídeo rápido para comunidade FlowOS',
    context: 'Next Action · Conteúdo',
    stage: 'Executar',
    status: 'Tarefa Rápida',
    tags: ['flow', 'quick'],
    priority: 'Alta',
    timeline: 'today',
    dueLabel: 'Hoje · 09h50',
    energy: 'Leve',
    horizon: "Sprint 15'",
    xp: 8,
    progress: 0.7,
    completed: false,
    subtasks: [
      { id: 'sub-quick-video-1', label: 'Selecionar CTA do vídeo', done: true },
      { id: 'sub-quick-video-2', label: 'Clarificar roteiro em bullet points', done: false },
      { id: 'sub-quick-video-3', label: 'Publicar snippet no FlowSpace', done: false },
    ],
  },
  {
    id: 'task-late-finance',
    title: 'Enviar relatório financeiro da Squad FlowOS',
    context: 'Waiting For · Financeiro',
    stage: 'Rever',
    status: 'Flow',
    tags: ['flow'],
    priority: 'Delegar',
    timeline: 'late',
    dueLabel: 'Ontem · 18h00',
    energy: 'Analítico',
    horizon: "Focus 30'",
    xp: 14,
    progress: 0.8,
    completed: false,
    subtasks: [
      { id: 'sub-late-finance-1', label: 'Enviar lembrete para financeiro', done: false },
      { id: 'sub-late-finance-2', label: 'Registrar follow-up no CRM', done: false },
    ],
  },
  {
    id: 'task-done-review',
    title: 'Checklist de QA para release 1.7',
    context: 'Next Action · Flow QA',
    stage: 'Executar',
    status: 'Flow',
    tags: ['flow', 'done-marker'],
    priority: 'Baixa',
    timeline: 'today',
    dueLabel: 'Hoje · 08h00',
    energy: 'Analítico',
    horizon: "Focus 25'",
    xp: 12,
    progress: 1,
    completed: true,
    subtasks: [
      { id: 'sub-done-review-1', label: 'Revisar casos críticos', done: true },
      { id: 'sub-done-review-2', label: 'Documentar regressões', done: true },
    ],
  },
  {
    id: 'task-unscheduled',
    title: 'Mapear gatilhos para próxima review de hábitos',
    context: 'Someday · Hábitos',
    stage: 'Capturar',
    status: 'Backlog Pessoal',
    tags: ['flow', 'quick'],
    priority: 'Normal',
    timeline: 'unscheduled',
    dueLabel: 'Sem prazo',
    energy: 'Reflexivo',
    horizon: 'Explorar',
    xp: 5,
    progress: 0.1,
    completed: false,
    subtasks: [
      { id: 'sub-unscheduled-1', label: 'Listar hábitos âncora', done: false },
      { id: 'sub-unscheduled-2', label: 'Priorizar gatilhos semanais', done: false },
    ],
  },
]

export default function Tasks({ onNavigate, user }) {
  const currentUser = user ?? DEFAULT_USER
  const [timelineFilter, setTimelineFilter] = useState('today')
  const [statusFilters, setStatusFilters] = useState(['flow'])
  const [tasks, setTasks] = useState(INITIAL_TASKS)
  const [expandedTaskId, setExpandedTaskId] = useState(null)
  const [detailTaskId, setDetailTaskId] = useState(null)
  const [celebratingTask, setCelebratingTask] = useState(null)

  const activeDetailTask = detailTaskId ? tasks.find((task) => task.id === detailTaskId) : null

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesTimeline = timelineFilter === 'any' ? true : task.timeline === timelineFilter

      const matchesStatus =
        statusFilters.length === 0
          ? true
          : statusFilters.some((filterId) => {
              if (filterId === 'done') {
                return task.completed
              }
              return task.tags.includes(filterId)
            })

      return matchesTimeline && matchesStatus
    })
  }, [tasks, timelineFilter, statusFilters])

  const toggleTimeline = (filterId) => {
    setTimelineFilter((current) => (current === filterId ? 'any' : filterId))
  }

  const toggleStatus = (filterId) => {
    setStatusFilters((current) => {
      if (current.includes(filterId)) {
        return current.filter((id) => id !== filterId)
      }
      return [...current, filterId]
    })
  }

  const handleFilterClick = (filter) => {
    if (filter.group === 'timeline') {
      toggleTimeline(filter.id)
    } else {
      toggleStatus(filter.id)
    }
  }

  useEffect(() => {
    if (!celebratingTask) return

    const timer = setTimeout(() => setCelebratingTask(null), 1500)
    return () => clearTimeout(timer)
  }, [celebratingTask])

  const toggleTaskCompletion = (taskId) => {
    let shouldCelebrate = false

    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) {
          return task
        }

        const completed = !task.completed
        if (completed) {
          shouldCelebrate = true
        }

        return {
          ...task,
          completed,
          progress: completed ? 1 : task.progress,
        }
      }),
    )

    if (shouldCelebrate) {
      setCelebratingTask(taskId)
    }
  }

  const handleSubtaskToggle = (taskId, subtaskId) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== taskId) return task

        const subtasks = task.subtasks?.map((subtask) =>
          subtask.id === subtaskId ? { ...subtask, done: !subtask.done } : subtask,
        )

        const total = subtasks?.length ?? 0
        const doneCount = subtasks?.filter((subtask) => subtask.done).length ?? 0
        const completedSubtasks = total > 0 && doneCount === total

        return {
          ...task,
          subtasks,
          completed: completedSubtasks,
          progress: total > 0 ? doneCount / total : task.progress,
        }
      }),
    )
  }

  const handleClarifyToggle = (taskId) => {
    setExpandedTaskId((current) => (current === taskId ? null : taskId))
  }

  const handleDetailOpen = (taskId) => {
    setDetailTaskId(taskId)
  }

  const handleDetailClose = () => {
    setDetailTaskId(null)
  }

  return (
    <div className="tasksPage">
      <TopNav user={currentUser} active="Tarefas" onNavigate={onNavigate} />

      <header className="tasksHero ui-card">
        <div className="tasksHero__intro">
          <p className="tasksHero__eyebrow">GTD em fluxo</p>
          <h1 className="tasksHero__title">Painel de tarefas com filtros inteligentes</h1>
          <p className="tasksHero__subtitle">
            Organize capturas, clarificações e execuções com filtros táticos, lista gamificada e contexto GTD.
          </p>
        </div>
        <div className="tasksHero__metrics">
          <div className="tasksHero__metric">
            <span className="tasksHero__metricLabel">Ritual ativo</span>
            <span className="tasksHero__metricValue">Clarificar · Flow Sprint 07</span>
          </div>
          <div className="tasksHero__metric tasksHero__metric--accent">
            <span className="tasksHero__metricLabel">Focus Points</span>
            <span className="tasksHero__metricValue">128</span>
          </div>
        </div>
      </header>

      <section className="tasksListShell">
        <div className="tasksListShell__filters">
          {FILTERS.map((filter) => {
            const isActive =
              filter.group === 'timeline'
                ? timelineFilter === filter.id
                : statusFilters.includes(filter.id)

            return (
              <button
                key={filter.id}
                type="button"
                className={
                  isActive ? 'tasksFilters__chip tasksFilters__chip--active' : 'tasksFilters__chip'
                }
                data-tone={filter.tone}
                onClick={() => handleFilterClick(filter)}
              >
                <span className="tasksFilters__icon" aria-hidden="true">
                  <FilterIcon name={filter.icon} />
                </span>
                <span>{filter.label}</span>
              </button>
            )
          })}
        </div>

        <header className="tasksListShell__head">
          <div>
            <p className="tasksListShell__eyebrow">Lista checklist</p>
            <h2>Checklist gamificado · visão GTD</h2>
          </div>
          <div className="tasksListShell__legend">
            <span>Prioridade</span>
            <span>Status</span>
            <span>Prazo</span>
          </div>
        </header>

        <ul className="tasksList">
          {filteredTasks.map((task) => {
            const progressPercent = Math.round((task.completed ? 1 : task.progress) * 100)
            const cardClasses = ['taskCard']
            const prioritySlug = task.priority.toLowerCase()
            const isExpanded = expandedTaskId === task.id

            if (task.completed) cardClasses.push('taskCard--done')
            if (task.timeline === 'late') cardClasses.push('taskCard--late')
            if (celebratingTask === task.id) cardClasses.push('taskCard--celebrate')

            return (
              <li key={task.id} className={cardClasses.join(' ')}>
                {celebratingTask === task.id && (
                  <div className="taskCard__celebration" aria-hidden="true">
                    <span className="taskCard__xpPop">+{task.xp} XP</span>
                    <span className="taskCard__confetti taskCard__confetti--one" />
                    <span className="taskCard__confetti taskCard__confetti--two" />
                    <span className="taskCard__confetti taskCard__confetti--three" />
                  </div>
                )}
                <button
                  type="button"
                  className={task.completed ? 'taskCard__checkbox taskCard__checkbox--checked' : 'taskCard__checkbox'}
                  onClick={() => toggleTaskCompletion(task.id)}
                  role="checkbox"
                  aria-checked={task.completed}
                  aria-label={task.completed ? 'Marcar tarefa como pendente' : 'Marcar tarefa como concluída'}
                >
                  <span className="taskCard__checkboxGlow" aria-hidden="true" />
                  <span className="taskCard__checkboxMark" aria-hidden="true" />
                </button>

                <div className="taskCard__body">
                  <div className="taskCard__header">
                    <div>
                      <p className="taskCard__title">{task.title}</p>
                      <div className="taskCard__context">
                        <span>{task.context}</span>
                        <span>{task.stage}</span>
                        <span>{task.horizon}</span>
                      </div>
                    </div>

                    <div className="taskCard__badges">
                      <span className={`taskChip taskChip--priority taskChip--priority-${prioritySlug}`}>
                        Prioridade · {task.priority}
                      </span>
                      <span className="taskChip taskChip--status">{task.status}</span>
                      <span
                        className={
                          task.timeline === 'late'
                            ? 'taskChip taskChip--due taskChip--dueLate'
                            : 'taskChip taskChip--due'
                        }
                      >
                        {task.dueLabel}
                      </span>
                    </div>
                  </div>

                  <div className="taskCard__footer">
                    <div className="taskCard__progress" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
                      <span style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="taskCard__xp">{task.xp} XP</div>
                    <div className="taskCard__energy">{task.energy}</div>
                  </div>

                  <div className="taskCard__actions">
                    <button
                      type="button"
                      className="taskCard__actionBtn"
                      onClick={() => handleClarifyToggle(task.id)}
                      aria-expanded={isExpanded}
                    >
                      {isExpanded ? 'Recolher clarificação' : 'Clarificar agora'}
                    </button>
                    <button type="button" className="taskCard__actionBtn taskCard__actionBtn--ghost" onClick={() => handleDetailOpen(task.id)}>
                      Abrir ritual
                    </button>
                  </div>

                  {isExpanded && task.subtasks && (
                    <div className="taskCard__details">
                      <div className="taskCard__detailsHead">
                        <p>Checklist Clarificar</p>
                        <span>
                          {task.subtasks.filter((subtask) => subtask.done).length}/{task.subtasks.length} passos
                        </span>
                      </div>
                      <ul className="subtasksList">
                        {task.subtasks.map((subtask) => (
                          <li key={subtask.id}>
                            <button
                              type="button"
                              className={subtask.done ? 'subtask subtask--done' : 'subtask'}
                              onClick={() => handleSubtaskToggle(task.id, subtask.id)}
                              aria-pressed={subtask.done}
                            >
                              <span className="subtask__check" aria-hidden="true" />
                              <div className="subtask__content">
                                <p>{subtask.label}</p>
                                {subtask.note && <small>{subtask.note}</small>}
                              </div>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </li>
            )
          })}
        </ul>

        {filteredTasks.length === 0 && (
          <div className="tasksListShell__empty">
            Nenhuma tarefa para os filtros selecionados. Ajuste as pilulas para ver outras capturas e contextos.
          </div>
        )}
      </section>

      <TaskDetailModal
        task={activeDetailTask}
        onClose={handleDetailClose}
        onToggleSubtask={(subtaskId) => {
          if (activeDetailTask) {
            handleSubtaskToggle(activeDetailTask.id, subtaskId)
          }
        }}
      />
    </div>
  )
}

function FilterIcon({ name }) {
  switch (name) {
    case 'list':
      return (
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
          <path d="M4 6h12M4 10h12M4 14h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
      )
    case 'spark':
      return (
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
          <path d="M10 3v4M10 13v4M4.5 5.5l2.8 2.8M12.7 11.7l2.8 2.8M3 10h4m6 0h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="10" cy="10" r="2.6" stroke="currentColor" strokeWidth="1.6" fill="none" />
        </svg>
      )
    case 'bolt':
      return (
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
          <path d="M11.8 2.5 6.5 10h3.3l-1.6 7.5 5.3-7.5H10l1.8-7.5Z" fill="currentColor" />
        </svg>
      )
    case 'check':
      return (
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
          <circle cx="10" cy="10" r="7.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
          <path d="M6.5 10.1 9 12.7l4.7-5.4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'sun':
      return (
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
          <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.6" fill="none" />
          <path d="M10 2v2M10 16v2M4.2 4.2l1.4 1.4M14.4 14.4l1.4 1.4M2 10h2M16 10h2M4.2 15.8l1.4-1.4M14.4 5.6l1.4-1.4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      )
    case 'calendar-late':
      return (
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
          <rect x="3" y="5" width="14" height="12" rx="2" ry="2" stroke="currentColor" strokeWidth="1.6" fill="none" />
          <path d="M3 8h14M7 3v4M13 3v4M8 12h4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    case 'calendar-off':
      return (
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
          <rect x="3" y="5" width="14" height="12" rx="2" ry="2" stroke="currentColor" strokeWidth="1.6" fill="none" />
          <path d="M3 8h14M7 3v4M13 3v4M6 12l8 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 20 20" width="16" height="16" aria-hidden="true" focusable="false">
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.6" fill="none" />
        </svg>
      )
  }
}

function TaskDetailModal({ task, onClose, onToggleSubtask }) {
  if (!task) return null

  const completedSubtasks = task.subtasks?.filter((subtask) => subtask.done).length ?? 0
  const totalSubtasks = task.subtasks?.length ?? 0

  return (
    <div className="taskModal" role="dialog" aria-modal="true" aria-label={`Detalhes da tarefa ${task.title}`}>
      <div className="taskModal__backdrop" onClick={onClose} />
      <section className="taskModal__panel ui-card">
        <header className="taskModal__header">
          <div>
            <p className="taskModal__eyebrow">Fluxo Clarificar</p>
            <h3>{task.title}</h3>
            <p className="taskModal__context">{task.context}</p>
          </div>
          <button type="button" className="taskModal__close" onClick={onClose} aria-label="Fechar detalhes">
            ×
          </button>
        </header>

        <div className="taskModal__meta">
          <span>Prioridade · {task.priority}</span>
          <span>Prazo · {task.dueLabel}</span>
          <span>Energia · {task.energy}</span>
        </div>

        <div className="taskModal__clarify">
          <p className="taskModal__clarifyTitle">Subtarefas ({completedSubtasks}/{totalSubtasks})</p>
          <ul className="taskModal__subtasks">
            {task.subtasks?.map((subtask) => (
              <li key={subtask.id}>
                <button
                  type="button"
                  className={subtask.done ? 'subtask subtask--done' : 'subtask'}
                  onClick={() => onToggleSubtask?.(subtask.id)}
                  aria-pressed={subtask.done}
                >
                  <span className="subtask__check" aria-hidden="true" />
                  <div className="subtask__content">
                    <p>{subtask.label}</p>
                    {subtask.note && <small>{subtask.note}</small>}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        <footer className="taskModal__footer">
          <p>Próximo passo do GTD:</p>
          <strong>{task.stage}</strong>
        </footer>
      </section>
    </div>
  )
}
