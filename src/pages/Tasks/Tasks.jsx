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
    estimatedMinutes: 90,
    estimatedPomodoros: 4,
    completedPomodoros: 2,
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
    estimatedMinutes: 45,
    estimatedPomodoros: 2,
    completedPomodoros: 0,
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
    estimatedMinutes: 15,
    estimatedPomodoros: 1,
    completedPomodoros: 0,
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
    estimatedMinutes: 30,
    estimatedPomodoros: 2,
    completedPomodoros: 1,
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
    estimatedMinutes: 25,
    estimatedPomodoros: 1,
    completedPomodoros: 1,
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
    estimatedMinutes: 20,
    estimatedPomodoros: 1,
    completedPomodoros: 0,
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
  const [pomodoroTime, setPomodoroTime] = useState(25 * 60)
  const [pomodoroRunning, setPomodoroRunning] = useState(false)
  const [showPomodoroConfig, setShowPomodoroConfig] = useState(false)
  const [pomodoroConfig, setPomodoroConfig] = useState({
    focusTime: 25,
    shortBreak: 5,
    longBreak: 10,
    sessionsBeforeLongBreak: 4,
    technique: 'classic'
  })
  const [focusedTaskId, setFocusedTaskId] = useState(null)
  const [currentPomodoroIndex, setCurrentPomodoroIndex] = useState(0)

  const isFlowMode = statusFilters.includes('flow')
  const focusedTask = focusedTaskId ? tasks.find(t => t.id === focusedTaskId) : null

  // Função para calcular pomodoros baseado na técnica e duração da tarefa
  const calculatePomodoros = (estimatedMinutes, technique) => {
    if (!estimatedMinutes) return 0
    
    let focusTime = 25 // default
    
    switch (technique) {
      case 'classic':
        focusTime = 25
        break
      case 'short':
        focusTime = 15
        break
      case 'long':
        focusTime = 50
        break
      case 'custom':
        focusTime = pomodoroConfig.focusTime
        break
      default:
        focusTime = 25
    }
    
    return Math.ceil(estimatedMinutes / focusTime)
  }

  const activeDetailTask = detailTaskId ? tasks.find((task) => task.id === detailTaskId) : null

  const filteredTasks = useMemo(() => {
    let filtered = tasks.filter((task) => {
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

    // Filter for urgent and high priority tasks when Flow mode is active
    if (isFlowMode) {
      filtered = filtered.filter((task) => 
        task.priority === 'Urgente' || task.priority === 'Alta'
      )
    }

    return filtered
  }, [tasks, timelineFilter, statusFilters, isFlowMode])

  const totalPomodorosNeeded = useMemo(() => {
    return filteredTasks
      .filter((task) => !task.completed && (task.priority === 'Urgente' || task.priority === 'Alta'))
      .reduce((sum, task) => {
        const remaining = Math.max(0, (task.estimatedPomodoros || 0) - (task.completedPomodoros || 0))
        return sum + remaining
      }, 0)
  }, [filteredTasks])

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

  useEffect(() => {
    if (!pomodoroRunning || pomodoroTime <= 0) return

    const interval = setInterval(() => {
      setPomodoroTime((prev) => {
        if (prev <= 1) {
          setPomodoroRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [pomodoroRunning, pomodoroTime])

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

  const togglePomodoro = () => {
    setPomodoroRunning((prev) => !prev)
  }

  const resetPomodoro = () => {
    setPomodoroTime(pomodoroConfig.focusTime * 60)
    setPomodoroRunning(false)
  }

  const handleConfigSave = (newConfig) => {
    setPomodoroConfig(newConfig)
    setPomodoroTime(newConfig.focusTime * 60)
    setPomodoroRunning(false)
    setShowPomodoroConfig(false)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const handleFocusTask = (taskId) => {
    setFocusedTaskId(taskId)
    setCurrentPomodoroIndex(0)
    setPomodoroTime(pomodoroConfig.focusTime * 60)
    setPomodoroRunning(false)
  }

  return (
    <div className="tasksPage">
      <TopNav user={currentUser} active="Tarefas" onNavigate={onNavigate} />

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

            const dueStateLabel = task.completed
              ? 'Concluída'
              : task.timeline === 'late'
                ? 'Atrasada'
                : task.timeline === 'unscheduled'
                  ? 'Sem prazo'
                  : 'No prazo'

            const dueStateTone = task.completed
              ? 'done'
              : task.timeline === 'late'
                ? 'late'
                : task.timeline === 'unscheduled'
                  ? 'none'
                  : 'ok'

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
                      {isFlowMode && (
                        <button
                          type="button"
                          className={focusedTaskId === task.id ? 'taskCard__focusBtn taskCard__focusBtn--active' : 'taskCard__focusBtn'}
                          onClick={() => handleFocusTask(task.id)}
                        >
                          <svg viewBox="0 0 20 20" width="14" height="14">
                            <path d="M10 2l2.5 5 5.5.7-4 3.9 1 5.4-5-2.6-5 2.6 1-5.4-4-3.9 5.5-.7z" fill="currentColor" />
                          </svg>
                          {focusedTaskId === task.id ? 'Em foco' : 'Focar'}
                        </button>
                      )}
                      <span className={`taskChip taskChip--priority taskChip--priority-${prioritySlug}`}>
                        Prioridade · {task.priority}
                      </span>
                      <span className={`taskChip taskChip--dueState taskChip--dueState-${dueStateTone}`}>
                        {dueStateLabel}
                      </span>
                      <span className="taskChip taskChip--status">{task.status}</span>
                      <span className="taskCard__dueText">{task.dueLabel}</span>
                    </div>
                  </div>

                  <div className="taskCard__footer">
                    <div className="taskCard__progress" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
                      <span style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="taskCard__xp">{task.xp} XP</div>
                    {task.estimatedMinutes && (
                      <div className="taskCard__pomodoros">
                        {task.completedPomodoros || 0}/{calculatePomodoros(task.estimatedMinutes, pomodoroConfig.technique)} 🍅
                      </div>
                    )}
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

        {isFlowMode && (
          <section className="pomodoroCard ui-card">
            <div className="pomodoroCard__brand">
              <span className="pomodoroCard__logo">⚡</span>
              <div>
                <p className="pomodoroCard__brandText">Foco</p>
                <p className="pomodoroCard__brandSub">BY FLOWAPP</p>
              </div>
            </div>
            <p className="pomodoroCard__quote">"Foco traz abundância"</p>
            <button 
              type="button" 
              className="pomodoroCard__configBtn"
              onClick={() => setShowPomodoroConfig(true)}
              aria-label="Configurar Pomodoro"
            >
              <svg viewBox="0 0 24 24" width="18" height="18">
                <path d="M12 9.75a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Zm8.25 2.25a6.18 6.18 0 0 0-.094-1.062l2.051-1.6a.75.75 0 0 0 .168-.957l-1.945-3.37a.75.75 0 0 0-.908-.328l-2.414.868a7 7 0 0 0-1.842-1.065l-.368-2.54A.75.75 0 0 0 14.126 2h-4.25a.75.75 0 0 0-.742.641l-.368 2.54a7.002 7.002 0 0 0-1.842 1.065l-2.414-.868a.75.75 0 0 0-.908.328L1.657 9.076a.75.75 0 0 0 .168.956l2.051 1.6A6.23 6.23 0 0 0 3.75 12c0 .358.032.717.094 1.062l-2.05 1.6a.75.75 0 0 0-.169.957l1.946 3.37a.75.75 0 0 0 .908.328l2.414-.868c.555.45 1.176.817 1.842 1.065l.368 2.54a.75.75 0 0 0 .742.641h4.25a.75.75 0 0 0 .742-.641l.368-2.54a7.002 7.002 0 0 0 1.842-1.065l2.414.868a.75.75 0 0 0 .908-.328l1.945-3.37a.75.75 0 0 0-.168-.957l-2.051-1.6A6.2 6.2 0 0 0 20.25 12Z" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {focusedTask && (
              <div className="pomodoroCard__focused">
                <p className="pomodoroCard__focusedLabel">Em foco</p>
                <p className="pomodoroCard__focusedTitle">{focusedTask.title}</p>
                <div className="pomodoroCard__sequence">
                  {Array.from({ length: calculatePomodoros(focusedTask.estimatedMinutes, pomodoroConfig.technique) }).map((_, index) => (
                    <span
                      key={index}
                      className={
                        index < (focusedTask.completedPomodoros || 0)
                          ? 'pomodoroCard__bullet pomodoroCard__bullet--completed'
                          : index === currentPomodoroIndex
                          ? 'pomodoroCard__bullet pomodoroCard__bullet--active'
                          : 'pomodoroCard__bullet'
                      }
                    />
                  ))}
                </div>
              </div>
            )}
            {!focusedTask && totalPomodorosNeeded > 0 && (
              <div className="pomodoroCard__stats">
                <p className="pomodoroCard__statsLabel">Pomodoros necessários</p>
                <p className="pomodoroCard__statsValue">{totalPomodorosNeeded}</p>
                <p className="pomodoroCard__statsSubtext">
                  {filteredTasks.filter(t => !t.completed).length} {filteredTasks.filter(t => !t.completed).length === 1 ? 'tarefa' : 'tarefas'} de alta prioridade
                </p>
              </div>
            )}
            <div className="pomodoroCard__timer">{formatTime(pomodoroTime)}</div>
            <p className="pomodoroCard__message">
              Noites são feitas para sonhos e sonhadores como você, {currentUser.name.split(' ')[0]}!
            </p>
            <div className="pomodoroCard__controls">
              <button 
                type="button" 
                className="pomodoroCard__btn pomodoroCard__btn--primary"
                onClick={togglePomodoro}
              >
                {pomodoroRunning ? 'Pausar' : 'Iniciar'}
              </button>
              <button 
                type="button" 
                className="pomodoroCard__btn pomodoroCard__btn--secondary"
                onClick={resetPomodoro}
              >
                Resetar
              </button>
            </div>
          </section>
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

      <PomodoroConfigModal
        show={showPomodoroConfig}
        config={pomodoroConfig}
        onClose={() => setShowPomodoroConfig(false)}
        onSave={handleConfigSave}
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

function PomodoroConfigModal({ show, config, onClose, onSave }) {
  const [localConfig, setLocalConfig] = useState(config)

  useEffect(() => {
    setLocalConfig(config)
  }, [config])

  if (!show) return null

  const handleSave = () => {
    onSave(localConfig)
  }

  const techniques = [
    { id: 'classic', name: 'Clássico', description: '25min foco · 5min pausa · 10min após 4 sessões' },
    { id: 'short', name: 'Curto', description: '15min foco · 3min pausa' },
    { id: 'long', name: 'Longo', description: '50min foco · 10min pausa · 1h após 4 sessões' },
    { id: 'custom', name: 'Personalizado', description: 'Configure manualmente' }
  ]

  const handleTechniqueChange = (technique) => {
    let newConfig = { ...localConfig, technique }
    
    if (technique === 'classic') {
      newConfig = { ...newConfig, focusTime: 25, shortBreak: 5, longBreak: 10, sessionsBeforeLongBreak: 4 }
    } else if (technique === 'short') {
      newConfig = { ...newConfig, focusTime: 15, shortBreak: 3, longBreak: 10, sessionsBeforeLongBreak: 4 }
    } else if (technique === 'long') {
      newConfig = { ...newConfig, focusTime: 50, shortBreak: 10, longBreak: 60, sessionsBeforeLongBreak: 4 }
    }
    
    setLocalConfig(newConfig)
  }

  return (
    <div className="pomodoroConfigModal" role="dialog" aria-modal="true">
      <div className="pomodoroConfigModal__backdrop" onClick={onClose} />
      <section className="pomodoroConfigModal__panel ui-card">
        <header className="pomodoroConfigModal__header">
          <div>
            <h3>Configurar Pomodoro</h3>
            <p>Escolha sua técnica e ajuste os tempos</p>
          </div>
          <button type="button" className="pomodoroConfigModal__close" onClick={onClose} aria-label="Fechar">
            ×
          </button>
        </header>

        <div className="pomodoroConfigModal__content">
          <div className="pomodoroConfigModal__section">
            <label>Técnica</label>
            <div className="pomodoroConfigModal__techniques">
              {techniques.map((tech) => (
                <button
                  key={tech.id}
                  type="button"
                  className={localConfig.technique === tech.id ? 'pomodoroTechnique pomodoroTechnique--active' : 'pomodoroTechnique'}
                  onClick={() => handleTechniqueChange(tech.id)}
                >
                  <strong>{tech.name}</strong>
                  <span>{tech.description}</span>
                </button>
              ))}
            </div>
          </div>

          {localConfig.technique === 'custom' && (
            <div className="pomodoroConfigModal__section">
              <label>Tempos personalizados (minutos)</label>
              <div className="pomodoroConfigModal__inputs">
                <div className="pomodoroInput">
                  <label htmlFor="focusTime">Foco</label>
                  <input
                    id="focusTime"
                    type="number"
                    min="1"
                    max="90"
                    value={localConfig.focusTime}
                    onChange={(e) => setLocalConfig({ ...localConfig, focusTime: parseInt(e.target.value) || 25 })}
                  />
                </div>
                <div className="pomodoroInput">
                  <label htmlFor="shortBreak">Pausa curta</label>
                  <input
                    id="shortBreak"
                    type="number"
                    min="1"
                    max="30"
                    value={localConfig.shortBreak}
                    onChange={(e) => setLocalConfig({ ...localConfig, shortBreak: parseInt(e.target.value) || 5 })}
                  />
                </div>
                <div className="pomodoroInput">
                  <label htmlFor="longBreak">Pausa longa</label>
                  <input
                    id="longBreak"
                    type="number"
                    min="1"
                    max="60"
                    value={localConfig.longBreak}
                    onChange={(e) => setLocalConfig({ ...localConfig, longBreak: parseInt(e.target.value) || 15 })}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="pomodoroConfigModal__footer">
          <button type="button" className="pomodoroConfigModal__btn pomodoroConfigModal__btn--secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="button" className="pomodoroConfigModal__btn pomodoroConfigModal__btn--primary" onClick={handleSave}>
            Salvar configuração
          </button>
        </footer>
      </section>
    </div>
  )
}
