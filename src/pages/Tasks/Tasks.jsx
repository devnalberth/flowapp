import { useEffect, useMemo, useState, useRef } from 'react'
import { useApp } from '../../context/AppContext'

import TopNav from '../../components/TopNav/TopNav.jsx'
import CreateTaskModal from '../../components/CreateTaskModal/CreateTaskModal.jsx'
import CreateEventModal from '../../components/CreateEventModal/CreateEventModal.jsx'
import FloatingCreateButton from '../../components/FloatingCreateButton/FloatingCreateButton.jsx'
import { Play, Pause, RotateCcw, Settings, Zap, Coffee, Timer, Calendar, Sun, AlertTriangle, CalendarOff, CheckCircle2, ListTodo, Sparkles, Archive, Clock, RefreshCw } from 'lucide-react'
import { focusLogService } from '../../services/focusLogService'

import './Tasks.css'

const DEFAULT_USER = {
  name: 'Matheus Nalberth',
  email: 'Nalberthdev@gmail.com',
  avatarUrl: 'https://placehold.co/42x42',
}

// Configurações das Técnicas
const POMODORO_TECHNIQUES = {
  classic: { id: 'classic', label: 'Clássico', focus: 25, break: 5, longBreak: 15, sessions: 4, icon: Timer },
  deep: { id: 'deep', label: 'Deep Work', focus: 50, break: 10, longBreak: 20, sessions: 4, icon: Zap },
  flow: { id: 'flow', label: 'Flow 90', focus: 90, break: 30, longBreak: 30, sessions: 1, icon: Coffee },
  custom: { id: 'custom', label: 'Personalizado', focus: 25, break: 5, longBreak: 15, sessions: 4, icon: Settings }
}

const FILTERS = [
  { id: 'today', label: 'Hoje', group: 'timeline', icon: 'list', tone: 'primary' },
  { id: 'flow', label: 'Flow', group: 'status', icon: 'spark', tone: 'amber' },
  { id: 'quick', label: 'Tarefa Rápida', group: 'status', icon: 'bolt', tone: 'mint' },
  { id: 'done', label: 'Finalizada', group: 'status', icon: 'check', tone: 'sage' },
  { id: 'archived', label: 'Arquivadas', group: 'status', icon: 'archive', tone: 'stone' },
  { id: 'tomorrow', label: 'Amanhã', group: 'timeline', icon: 'sun', tone: 'dawn' },
  { id: 'late', label: 'Atrasadas', group: 'timeline', icon: 'calendar-late', tone: 'warning' },
  { id: 'unscheduled', label: 'Sem Agendamento', group: 'timeline', icon: 'calendar-off', tone: 'stone' },
]

const STATUS_META = {
  todo: { label: 'A Fazer', icon: ListTodo },
  in_progress: { label: 'Em Andamento', icon: RefreshCw },
  done: { label: 'Concluída', icon: CheckCircle2 },
  archived: { label: 'Arquivada', icon: Archive },
}

const DATE_ONLY_REGEX = /^\d{4}-\d{2}-\d{2}$/
const DATE_ONLY_WITH_MIDNIGHT_REGEX = /T00:00:00(?:\.000)?(?:Z|[+-]\d{2}:\d{2})?$/

const toLocalDateKey = (value) => {
  if (!value) return null

  if (typeof value === 'string') {
    if (DATE_ONLY_REGEX.test(value)) return value
    if (DATE_ONLY_WITH_MIDNIGHT_REGEX.test(value)) return value.slice(0, 10)
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null

  const year = parsed.getFullYear()
  const month = String(parsed.getMonth() + 1).padStart(2, '0')
  const day = String(parsed.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const formatDateKeyPtBr = (dateKey) => {
  if (!dateKey) return ''
  const [year, month, day] = dateKey.split('-')
  return `${day}/${month}/${year}`
}

const normalizeTaskStatus = (task) => {
  if (task?.completed) return 'done'

  const rawStatus = String(task?.status || '').trim().toLowerCase()
  if (!rawStatus) return 'todo'

  if (['todo', 'a fazer', 'capturar', 'pending'].includes(rawStatus)) return 'todo'
  if (['in_progress', 'em andamento', 'doing'].includes(rawStatus)) return 'in_progress'
  if (['done', 'concluída', 'concluida', 'completed'].includes(rawStatus)) return 'done'
  if (['archived', 'arquivada', 'arquivado'].includes(rawStatus)) return 'archived'

  return 'todo'
}

// Calcula o início da semana atual (Domingo)
const getWeekStart = () => {
  const now = new Date()
  const dayOfWeek = now.getDay() // 0 = Domingo
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() - dayOfWeek)
  weekStart.setHours(0, 0, 0, 0)
  return weekStart
}

// Calcula o fim da semana atual (Sábado)
const getWeekEnd = () => {
  const weekStart = getWeekStart()
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekStart.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  return weekEnd
}

// Status e Prioridades agora são definidos dentro do CreateTaskModal

export default function Tasks({ onNavigate, onLogout, user, initialFilter = null }) {
  const currentUser = user ?? DEFAULT_USER
  const { tasks: contextTasks, projects, addTask, updateTask, deleteTask, addEvent } = useApp()

  // --- Estados de Filtro ---
  // Inicialização inteligente baseada no tipo de filtro (Timeline ou Status)
  const [timelineFilter, setTimelineFilter] = useState(() => {
    const filterDef = FILTERS.find(f => f.id === initialFilter)
    return filterDef?.group === 'timeline' ? initialFilter : 'today'
  })

  const [statusFilters, setStatusFilters] = useState(() => {
    const filterDef = FILTERS.find(f => f.id === initialFilter)
    return filterDef?.group === 'status' ? [initialFilter] : []
  })

  const [sortBy, setSortBy] = useState('time') // 'time' ou 'priority'

  // --- Estados de Dados ---
  const [tasks, setTasks] = useState([])
  const [editTask, setEditTask] = useState(null)
  const [isTaskModalOpen, setTaskModalOpen] = useState(false)
  const [isEventModalOpen, setEventModalOpen] = useState(false)
  const [detailTaskId, setDetailTaskId] = useState(null)
  const [celebratingTask, setCelebratingTask] = useState(null)

  // --- Estados do Pomodoro Power User ---
  const [activeTechnique, setActiveTechnique] = useState('classic')
  const [pomodoroMode, setPomodoroMode] = useState('focus') // 'focus', 'break', 'longBreak'
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [focusedTaskId, setFocusedTaskId] = useState(null)

  const [showPomodoroConfig, setShowPomodoroConfig] = useState(false)
  const [customConfig, setCustomConfig] = useState({ focus: 25, break: 5, longBreak: 15, sessions: 4 })

  // --- REFS PARA O TIMER REAL (FIX DO SEGUNDO PLANO) ---
  const endTimeRef = useRef(null)
  const timerIntervalRef = useRef(null)
  const lastTimeRef = useRef(timeLeft) // Para calcular o tempo gasto ao pausar

  const projectOptions = useMemo(() => {
    return projects.map((project) => ({ id: project.id, label: project.title }))
  }, [projects])

  useEffect(() => {
    setTasks(contextTasks || [])
  }, [contextTasks])

  // Reage a mudanças na prop initialFilter (navegação via Dashboard)
  useEffect(() => {
    if (initialFilter) {
      const filterDef = FILTERS.find(f => f.id === initialFilter)
      if (filterDef?.group === 'timeline') {
        setTimelineFilter(initialFilter)
        setStatusFilters([])
      } else if (filterDef?.group === 'status') {
        setTimelineFilter('any') // "status" filters usually override timeline or work alongside 'any'
        setStatusFilters([initialFilter])
      }
    }
  }, [initialFilter])

  const focusedTaskData = useMemo(() =>
    focusedTaskId ? tasks.find(t => t.id === focusedTaskId) : null
    , [focusedTaskId, tasks])

  // --- LÓGICA ROBUSTA DO TIMER (TIMESTAMP) ---
  useEffect(() => {
    if (isRunning) {
      // Se acabou de iniciar/retomar, define o tempo de término baseado no agora
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + timeLeft * 1000
        lastTimeRef.current = timeLeft // Marca onde começou
      }

      timerIntervalRef.current = setInterval(() => {
        const now = Date.now()
        const diff = endTimeRef.current - now
        const secondsLeft = Math.ceil(diff / 1000)

        if (secondsLeft <= 0) {
          handleTimerComplete()
        } else {
          setTimeLeft(secondsLeft)
        }
      }, 100) // Verifica a cada 100ms para maior precisão visual
    } else {
      clearInterval(timerIntervalRef.current)
      endTimeRef.current = null // Limpa a referência ao pausar
    }

    return () => clearInterval(timerIntervalRef.current)
  }, [isRunning])

  // Função para salvar o tempo focado na tarefa
  const saveFocusTime = async (secondsElapsed) => {
    if (!focusedTaskId || !secondsElapsed || secondsElapsed <= 0) return
    if (pomodoroMode !== 'focus') return // Só salva tempo de foco, não de pausa

    const minutesToAdd = secondsElapsed / 60

    // Busca a tarefa atualizada
    const currentTask = tasks.find(t => t.id === focusedTaskId)
    if (!currentTask) return

    const newTimeSpent = (currentTask.time_spent || 0) + minutesToAdd

    console.log(`Salvando foco: +${minutesToAdd.toFixed(2)} min na tarefa ${currentTask.title}`)

    // NOVO: Registra no log diário de foco (localStorage)
    // Usa data local para evitar problemas de fuso horário
    const now = new Date()
    const offset = now.getTimezoneOffset()
    const localDate = new Date(now.getTime() - (offset * 60 * 1000))
    const todayStr = localDate.toISOString().split('T')[0]

    focusLogService.addTime(todayStr, minutesToAdd)

    // Atualiza otimista e no banco
    await updateTask(focusedTaskId, {
      time_spent: newTimeSpent,
      updated_at: new Date().toISOString()
    })
  }

  const handleTimerComplete = () => {
    setIsRunning(false)
    clearInterval(timerIntervalRef.current)

    // Salva o tempo total do ciclo que acabou
    const config = activeTechnique === 'custom' ? customConfig : POMODORO_TECHNIQUES[activeTechnique]
    if (pomodoroMode === 'focus') {
      saveFocusTime(config.focus * 60) // Salva o ciclo completo
    }

    endTimeRef.current = null

    if (pomodoroMode === 'focus') {
      const newSessions = sessionsCompleted + 1
      setSessionsCompleted(newSessions)

      if (newSessions >= config.sessions) {
        setPomodoroMode('longBreak')
        setTimeLeft(config.longBreak * 60)
        setSessionsCompleted(0)
      } else {
        setPomodoroMode('break')
        setTimeLeft(config.break * 60)
      }
    } else {
      setPomodoroMode('focus')
      setTimeLeft(config.focus * 60)
    }
  }

  const switchTechnique = (techId) => {
    // Se estava rodando, salva o progresso parcial antes de trocar
    if (isRunning && pomodoroMode === 'focus') {
      const elapsed = lastTimeRef.current - timeLeft
      saveFocusTime(elapsed)
    }

    setActiveTechnique(techId)
    setIsRunning(false)
    setPomodoroMode('focus')
    setSessionsCompleted(0)
    endTimeRef.current = null

    const config = techId === 'custom' ? customConfig : POMODORO_TECHNIQUES[techId]
    setTimeLeft(config.focus * 60)
    lastTimeRef.current = config.focus * 60
  }

  const handleFocusTask = (taskId) => {
    // Se estava rodando em outra tarefa, salva o tempo dela
    if (isRunning && focusedTaskId && focusedTaskId !== taskId && pomodoroMode === 'focus') {
      const elapsed = lastTimeRef.current - timeLeft
      saveFocusTime(elapsed)
    }

    setFocusedTaskId(taskId)
    const config = activeTechnique === 'custom' ? customConfig : POMODORO_TECHNIQUES[activeTechnique]
    setPomodoroMode('focus')
    setTimeLeft(config.focus * 60)
    setIsRunning(false)
    endTimeRef.current = null
    lastTimeRef.current = config.focus * 60
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleTimer = () => {
    if (isRunning) {
      // Vai pausar: Salva o tempo decorrido desde o último start/resume
      if (pomodoroMode === 'focus') {
        const currentSeconds = Math.ceil((endTimeRef.current - Date.now()) / 1000)
        const elapsed = lastTimeRef.current - currentSeconds
        saveFocusTime(elapsed)

        // Atualiza a referência "último tempo" para o tempo atual (pausado)
        // para que na próxima retomada a conta comece daqui
        setTimeLeft(currentSeconds)
        lastTimeRef.current = currentSeconds
      }
    }
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    // Se resetar durante o foco, salva o que foi feito até agora
    if (isRunning && pomodoroMode === 'focus') {
      const currentSeconds = Math.ceil((endTimeRef.current - Date.now()) / 1000)
      const elapsed = lastTimeRef.current - currentSeconds
      saveFocusTime(elapsed)
    }

    setIsRunning(false)
    endTimeRef.current = null
    const config = activeTechnique === 'custom' ? customConfig : POMODORO_TECHNIQUES[activeTechnique]
    const resetTime = (pomodoroMode === 'focus' ? config.focus : pomodoroMode === 'break' ? config.break : config.longBreak) * 60
    setTimeLeft(resetTime)
    lastTimeRef.current = resetTime
  }

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, seconds)
    const m = Math.floor(safeSeconds / 60)
    const s = safeSeconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  // --- Lógica de Filtros ---
  const filteredTasks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Semana atual (Domingo a Sábado)
    const weekStart = getWeekStart()
    const weekEnd = getWeekEnd()

    const matched = tasks.filter((task) => {
      const dueDateKey = toLocalDateKey(task.due_date)

      // Verifica se está atrasada
      const isDoneTask = normalizeTaskStatus(task) === 'done'
      const isLate = !!dueDateKey && dueDateKey < toLocalDateKey(today) && !isDoneTask

      // Verifica se está arquivada (status = 'archived')
      const isArchived = normalizeTaskStatus(task) === 'archived'

      // Se filtro de Arquivadas está ativo, mostra APENAS arquivadas
      if (statusFilters.includes('archived')) {
        return isArchived
      }

      // Para outros filtros, EXCLUI tarefas arquivadas
      if (isArchived) return false

      // Exclui tarefas finalizadas de semanas anteriores (já deveriam estar arquivadas)
      if (isDoneTask) {
        const completedDate = task.updated_at ? new Date(task.updated_at) : null
        if (completedDate && completedDate < weekStart) {
          return false // Esconde tarefas finalizadas de semanas anteriores
        }
      }

      let matchesTimeline = false
      if (timelineFilter === 'today') matchesTimeline = dueDateKey === toLocalDateKey(today)
      else if (timelineFilter === 'tomorrow') matchesTimeline = dueDateKey === toLocalDateKey(tomorrow)
      else if (timelineFilter === 'late') matchesTimeline = isLate
      else if (timelineFilter === 'unscheduled') matchesTimeline = !dueDateKey
      else if (timelineFilter === 'any') matchesTimeline = true

      let matchesStatus = true
      if (statusFilters.length > 0) {
        matchesStatus = statusFilters.some(filterId => {
          if (filterId === 'done') return isDoneTask
          // FLOW: Apenas Alta e Urgente, E que NÃO estão atrasadas
          if (filterId === 'flow') {
            const isHighPriority = task.priority === 'Alta' || task.priority === 'Urgente'
            return isHighPriority && !isLate && !isDoneTask
          }
          if (filterId === 'quick') return (task.tags || []).includes('quick') || task.estimatedMinutes <= 15
          return false
        })
      }

      // Se o filtro "Finalizada" estiver ativo, mostra APENAS as finalizadas da semana atual
      if (statusFilters.includes('done')) return isDoneTask

      // Se não houver filtro de status (Minhas Tarefas padrão), ESCONDE as finalizadas
      if (statusFilters.length === 0) return matchesTimeline && !isDoneTask

      // Caso contrário, retorna o match de status calculado
      return matchesStatus
    })

    // Ordenação
    return matched.sort((a, b) => {
      if (sortBy === 'priority') {
        // Ordenar por prioridade: Urgente > Alta > Normal > Baixa
        const priorityOrder = { 'Urgente': 0, 'Alta': 1, 'Normal': 2, 'Baixa': 3 }
        const priorityA = priorityOrder[a.priority] ?? 4
        const priorityB = priorityOrder[b.priority] ?? 4
        if (priorityA !== priorityB) return priorityA - priorityB
        // Se mesma prioridade, ordena por horário
        const timeA = a.due_date ? new Date(a.due_date).getTime() : Infinity
        const timeB = b.due_date ? new Date(b.due_date).getTime() : Infinity
        return timeA - timeB
      } else {
        // Ordenar por horário (padrão)
        const timeA = a.due_date ? new Date(a.due_date).getTime() : Infinity
        const timeB = b.due_date ? new Date(b.due_date).getTime() : Infinity
        return timeA - timeB
      }
    })
  }, [tasks, timelineFilter, statusFilters, sortBy])

  // Função para arquivar todas as tarefas finalizadas
  const archiveCompletedTasks = async () => {
    const completedTasks = tasks.filter(t => t.completed && t.status !== 'archived')

    if (completedTasks.length === 0) {
      alert('Não há tarefas finalizadas para arquivar.')
      return
    }

    if (!confirm(`Arquivar ${completedTasks.length} tarefa(s) finalizada(s)?`)) return

    for (const task of completedTasks) {
      await updateTask(task.id, { status: 'archived' })
    }
  }

  const handleFilterClick = (filter) => {
    if (filter.group === 'timeline') {
      setStatusFilters([])
      setTimelineFilter(filter.id)
    } else {
      setTimelineFilter('any')
      setStatusFilters((curr) => {
        if (curr.includes(filter.id)) {
          const remaining = curr.filter(id => id !== filter.id)
          if (remaining.length === 0) setTimelineFilter('today')
          return remaining
        }
        return [filter.id]
      })
    }
  }

  const toggleTaskCompletion = async (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (!task) return

    const newCompleted = !task.completed
    const currentStatus = normalizeTaskStatus(task)
    const statusToRestore = currentStatus === 'done' ? 'todo' : currentStatus
    if (newCompleted) setCelebratingTask(taskId)

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: newCompleted } : t))

    await updateTask(taskId, {
      completed: newCompleted,
      status: newCompleted ? 'done' : statusToRestore,
      updated_at: new Date().toISOString()
    })
  }

  const handleTaskSubmit = async (data) => {
    try {
      if (editTask) {
        await updateTask(editTask.id, data)
      } else {
        await addTask({ ...data, status: data.status || 'todo' })
      }
      setTaskModalOpen(false)
      setEditTask(null)

      const createdDateKey = toLocalDateKey(data.dueDate)
      const todayKey = toLocalDateKey(new Date())
      if (createdDateKey && createdDateKey === todayKey) {
        if (timelineFilter !== 'today') {
          setTimelineFilter('today'); setStatusFilters([]);
        }
      }
    } catch (e) {
      alert('Erro ao salvar tarefa')
    }
  }

  const activeDetailTask = useMemo(() =>
    detailTaskId ? tasks.find(t => t.id === detailTaskId) : null
    , [detailTaskId, tasks])

  return (
    <div className="tasksPage">
      <TopNav user={currentUser} active="Tarefas" onNavigate={onNavigate} onLogout={onLogout} />

      <section className="tasksListShell">
        <div className="tasksListShell__filters">
          {FILTERS.map(f => {
            const active = f.group === 'timeline' ? timelineFilter === f.id : statusFilters.includes(f.id)
            return (
              <button key={f.id} className={`tasksFilters__chip ${active ? 'tasksFilters__chip--active' : ''}`}
                data-tone={f.tone} onClick={() => handleFilterClick(f)}>
                <span className="tasksFilters__icon"><FilterIcon name={f.icon} /></span>
                <span>{f.label}</span>
              </button>
            )
          })}
        </div>

        {/* POMODORO POWER USER UI */}
        {(statusFilters.includes('flow') || focusedTaskId) && (
          <section className="pomodoroCard ui-card">
            <div className="pomodoroCard__header">
              <div className="pomodoroCard__techniques">
                {Object.values(POMODORO_TECHNIQUES).map(tech => {
                  const Icon = tech.icon;
                  return (
                    <button
                      key={tech.id}
                      className={`techBtn ${activeTechnique === tech.id ? 'techBtn--active' : ''}`}
                      onClick={() => switchTechnique(tech.id)}
                      title={tech.label}
                    >
                      <Icon size={16} />
                      <span>{tech.label}</span>
                    </button>
                  )
                })}
              </div>
              <button className="configBtn" onClick={() => setShowPomodoroConfig(true)}>
                <Settings size={18} />
              </button>
            </div>

            <div className="pomodoroCard__display">
              {focusedTaskData ? (
                <div className="pomodoroCard__focus">
                  <span className="focusLabel">Focando em:</span>
                  <p className="focusTitle">{focusedTaskData.title}</p>
                  {/* Mostra o tempo já acumulado da tarefa se existir */}
                  {focusedTaskData.time_spent > 0 && (
                    <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>
                      Tempo total acumulado: {Math.floor(focusedTaskData.time_spent)} min
                    </span>
                  )}
                </div>
              ) : (
                <p className="pomodoroCard__message">Selecione uma tarefa para focar ou inicie um ciclo livre.</p>
              )}

              <div className="pomodoroCard__timer">
                {formatTime(timeLeft)}
              </div>

              <div className="pomodoroCard__status">
                <span className={`statusPill ${pomodoroMode}`}>
                  {pomodoroMode === 'focus' ? '🎯 Foco' : pomodoroMode === 'break' ? '☕ Pausa' : '🌴 Pausa Longa'}
                </span>
                <span className="sessionCount">
                  Sessão {sessionsCompleted + 1}/{activeTechnique === 'custom' ? customConfig.sessions : POMODORO_TECHNIQUES[activeTechnique].sessions}
                </span>
              </div>
            </div>

            <div className="pomodoroCard__controls">
              <button className={`pomodoroCard__btn ${isRunning ? 'pause' : 'play'}`} onClick={toggleTimer}>
                {isRunning ? <><Pause size={20} /> Pausar</> : <><Play size={20} /> Iniciar</>}
              </button>
              <button className="pomodoroCard__btn reset" onClick={resetTimer}>
                <RotateCcw size={20} />
              </button>
            </div>
          </section>
        )}

        <header className="tasksListShell__head">
          <div><p className="tasksListShell__eyebrow">Checklist</p><h2>Minhas Tarefas</h2></div>
          <div className="tasksListShell__actions">
            {/* Botão de Arquivar aparece quando filtro Finalizada está ativo */}
            {statusFilters.includes('done') && (
              <button
                className="tasksListShell__archiveBtn"
                onClick={archiveCompletedTasks}
                title="Arquivar todas as tarefas finalizadas"
              >
                <Archive size={14} />
                Arquivar Todas
              </button>
            )}
            <div className="tasksListShell__sort">
              <span className="tasksListShell__sortLabel">Ordenar:</span>
              <button
                className={`tasksListShell__sortBtn ${sortBy === 'time' ? 'active' : ''}`}
                onClick={() => setSortBy('time')}
              >
                <Clock size={14} /> Horário
              </button>
              <button
                className={`tasksListShell__sortBtn ${sortBy === 'priority' ? 'active' : ''}`}
                onClick={() => setSortBy('priority')}
              >
                <Zap size={14} /> Prioridade
              </button>
            </div>
          </div>
        </header>

        <ul className="tasksList">
          {filteredTasks.map(task => {
            const statusKey = normalizeTaskStatus(task)
            const statusMeta = STATUS_META[statusKey] || STATUS_META.todo
            const StatusIcon = statusMeta.icon
            const isDone = statusKey === 'done'
            const dueDateKey = toLocalDateKey(task.due_date)
            const todayKey = toLocalDateKey(new Date())
            const isLate = !isDone && !!dueDateKey && dueDateKey < todayKey
            const isFocused = focusedTaskId === task.id

            return (
              <li key={task.id} className={`taskCard ${isDone ? 'taskCard--done' : ''} ${isLate ? 'taskCard--late' : ''} ${isFocused ? 'taskCard--focused' : ''} ${celebratingTask === task.id ? 'taskCard--celebrate' : ''}`}>
                {celebratingTask === task.id && (
                  <div className="taskCard__celebration">
                    <span className="taskCard__xpPop">+ XP</span>
                    <span className="taskCard__confetti taskCard__confetti--one" />
                    <span className="taskCard__confetti taskCard__confetti--two" />
                  </div>
                )}

                <button className={`taskCard__checkbox ${isDone ? 'taskCard__checkbox--checked' : ''}`} onClick={() => toggleTaskCompletion(task.id)}>
                  <span className="taskCard__checkboxMark" />
                </button>

                <div className="taskCard__body">
                  <div className="taskCard__header">
                    <div>
                      <p className="taskCard__title">{task.title}</p>
                      <div className="taskCard__context">
                        <span>{task.context || 'Geral'}</span>
                        {task.project && <span>• {task.project}</span>}
                      </div>
                    </div>

                    <div className="taskCard__badges">
                      <span className={`taskStatusChip taskStatusChip--${statusKey}`}>
                        <StatusIcon size={12} />
                        {statusMeta.label}
                      </span>

                      {!isDone && (
                        <button
                          className={`taskCard__focusBtn ${isFocused ? 'active' : ''}`}
                          onClick={() => handleFocusTask(task.id)}
                        >
                          {isFocused ? <Zap size={12} fill="currentColor" /> : <Play size={12} />}
                          {isFocused ? 'Em Foco' : 'Focar'}
                        </button>
                      )}

                      <span className={`taskChip priority-${task.priority?.toLowerCase()}`}>{task.priority}</span>
                      {dueDateKey && <span className="taskCard__dueText">{formatDateKeyPtBr(dueDateKey)}</span>}
                    </div>
                  </div>

                  <div className="taskCard__actions">
                    <button className="taskCard__actionBtn taskCard__actionBtn--ghost" onClick={() => { setDetailTaskId(task.id); setEditTask(null); }}>
                      Detalhes
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        {filteredTasks.length === 0 && <div className="tasksListShell__empty">Nenhuma tarefa encontrada.</div>}
      </section>

      <FloatingCreateButton
        label="Criar novo"
        options={[
          { label: 'Nova Tarefa', icon: CheckCircle2, onClick: () => { setEditTask(null); setTaskModalOpen(true) }, color: '#3b82f6' },
          { label: 'Novo Evento', icon: Calendar, onClick: () => setEventModalOpen(true), color: '#f59e0b' }
        ]}
      />

      {
        isTaskModalOpen && (
          <CreateTaskModal
            open={true}
            onClose={() => { setTaskModalOpen(false); setEditTask(null) }}
            onSubmit={handleTaskSubmit}
            projectsOptions={projectOptions}
            initialData={editTask}
          />
        )
      }

      {
        isEventModalOpen && (
          <CreateEventModal
            open={true}
            onClose={() => setEventModalOpen(false)}
            onSubmit={async (data) => {
              await addEvent(data)
              setEventModalOpen(false)
            }}
            onDelete={null} // Nenhuma exclusão ao criar novo
          />
        )
      }

      <PomodoroConfigModal
        show={showPomodoroConfig}
        config={customConfig}
        onClose={() => setShowPomodoroConfig(false)}
        onSave={(newCfg) => { setCustomConfig(newCfg); setShowPomodoroConfig(false); }}
      />

      <TaskDetailModal
        task={activeDetailTask}
        onClose={() => setDetailTaskId(null)}
        deleteTask={async (id) => { await deleteTask(id); setDetailTaskId(null); }}
        onEdit={(task) => {
          setEditTask(task);
          setTaskModalOpen(true);
          setDetailTaskId(null);
        }}
      />
    </div>
  )
}

// === Subcomponentes Visuais ===

function FilterIcon({ name }) {
  const icons = {
    list: <ListTodo size={14} />,
    spark: <Sparkles size={14} />,
    bolt: <Zap size={14} />,
    check: <CheckCircle2 size={14} />,
    archive: <Archive size={14} />,
    sun: <Sun size={14} />,
    'calendar-late': <AlertTriangle size={14} />,
    'calendar-off': <CalendarOff size={14} />
  }
  return <span style={{ display: 'flex', alignItems: 'center' }}>{icons[name] || '•'}</span>
}

function TaskDetailModal({ task, onClose, deleteTask, onEdit }) {
  if (!task) return null
  const statusKey = normalizeTaskStatus(task)
  const statusMeta = STATUS_META[statusKey] || STATUS_META.todo
  const StatusIcon = statusMeta.icon
  const subtasks = Array.isArray(task.subtasks)
    ? task.subtasks
    : Array.isArray(task.clarifyItems)
      ? task.clarifyItems
      : []

  return (
    <div className="taskModal" onClick={onClose}>
      <div className="taskModal__backdrop" />
      <div className="taskModal__panel" onClick={e => e.stopPropagation()}>
        <header className="taskModal__header">
          <h3>{task.title}</h3>
          <button className="taskModal__close" onClick={onClose}>×</button>
        </header>
        <div className="taskModal__meta">
          <span>Prioridade: {task.priority}</span>
          <span className={`taskStatusChip taskStatusChip--${statusKey}`}>
            <StatusIcon size={12} />
            {statusMeta.label}
          </span>
        </div>
        <div className="taskModal__description">
          <p>{task.description || 'Sem descrição'}</p>
        </div>

        {subtasks.length > 0 && (
          <div className="taskModal__subtasks">
            <h4>Subtarefas</h4>
            <ul>
              {subtasks.map((subtask, index) => (
                <li key={subtask.id || index}>
                  <span className={subtask.done ? 'taskModal__subtaskText taskModal__subtaskText--done' : 'taskModal__subtaskText'}>
                    {subtask.label || subtask.title || 'Subtarefa'}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <footer className="taskModal__footer">
          <button className="taskModal__closeBtn" onClick={onClose}>Fechar</button>
          <button className="taskModal__editBtn" onClick={() => onEdit(task)}>Editar</button>
          <button className="taskModal__deleteBtn" onClick={() => { if (confirm('Excluir?')) deleteTask(task.id) }}>Excluir</button>
        </footer>
      </div>
    </div>
  )
}

function PomodoroConfigModal({ show, config, onClose, onSave }) {
  const [local, setLocal] = useState(config)
  useEffect(() => { if (config) setLocal(config) }, [config])
  if (!show) return null

  return (
    <div className="pomodoroConfigModal">
      <div className="pomodoroConfigModal__backdrop" onClick={onClose} />
      <div className="pomodoroConfigModal__panel">
        <header className="pomodoroConfigModal__header">
          <h3>Configurar Personalizado</h3>
          <button className="pomodoroConfigModal__close" onClick={onClose}>×</button>
        </header>
        <div className="pomodoroConfigModal__content">
          <div className="pomodoroInput">
            <label>Foco (minutos)</label>
            <input type="number" value={local.focus} onChange={e => setLocal({ ...local, focus: Number(e.target.value) })} />
          </div>
          <div className="pomodoroInput">
            <label>Pausa Curta (min)</label>
            <input type="number" value={local.break} onChange={e => setLocal({ ...local, break: Number(e.target.value) })} />
          </div>
          <div className="pomodoroInput">
            <label>Pausa Longa (min)</label>
            <input type="number" value={local.longBreak} onChange={e => setLocal({ ...local, longBreak: Number(e.target.value) })} />
          </div>
          <div className="pomodoroInput">
            <label>Sessões p/ Pausa Longa</label>
            <input type="number" value={local.sessions} onChange={e => setLocal({ ...local, sessions: Number(e.target.value) })} />
          </div>
        </div>
        <footer className="pomodoroConfigModal__footer">
          <button className="pomodoroConfigModal__btn" onClick={onClose}>Cancelar</button>
          <button className="pomodoroConfigModal__btn pomodoroConfigModal__btn--primary" onClick={() => onSave(local)}>Salvar</button>
        </footer>
      </div>
    </div>
  )
}