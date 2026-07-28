import { useEffect, useMemo, useState, useRef } from 'react'
import { useApp } from '../../context/AppContext'

import TopNav from '../../components/TopNav/TopNav.jsx'
import CreateTaskModal from '../../components/CreateTaskModal/CreateTaskModal.jsx'
import CreateEventModal from '../../components/CreateEventModal/CreateEventModal.jsx'
import FloatingCreateButton from '../../components/FloatingCreateButton/FloatingCreateButton.jsx'
import { Play, Pause, RotateCcw, Settings, Zap, Coffee, Timer, Calendar, Sun, AlertTriangle, CalendarOff, CheckCircle2, ListTodo, Sparkles, Archive, Clock, RefreshCw, BarChart3, Briefcase, BookOpen } from 'lucide-react'
import { focusLogService } from '../../services/focusLogService'
import { normalizeTaskStatus, isArchivedTask } from '../../utils/taskStatus'
import { buildLessonContextMap } from '../../utils/studyMetrics'
import { categorizeTask, CATEGORY_META } from '../../utils/taskCategory'
import FlowDashboardModal from '../../components/FlowDashboardModal/FlowDashboardModal.jsx'

const STUDY_KIND_LABEL = { module: 'Módulo', submodule: 'Sub-módulo', subject: 'Matéria' }
import ConfirmModal from '../../components/ConfirmModal/ConfirmModal.jsx'

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

// Início da semana atual (domingo 00:00). Base da "virada de semana": tarefas
// concluídas em semanas anteriores somem do filtro Finalizadas (apenas na UI —
// nada é apagado do banco e elas continuam contando nos projetos).
const getWeekStart = () => {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - d.getDay()) // getDay(): 0 = domingo
  return d
}

// Status e Prioridades agora são definidos dentro do CreateTaskModal

export default function Tasks({ onNavigate, onLogout, user, initialFilter = null }) {
  const currentUser = user ?? DEFAULT_USER
  const { tasks: contextTasks, projects, studies, addTask, updateTask, deleteTask, addEvent, syncTimerHabits, userId } = useApp()
  const lessonCtxMap = useMemo(() => buildLessonContextMap(studies), [studies])
  const projectCtxMap = useMemo(() => {
    const map = {}
    for (const p of projects || []) map[p.id] = { title: p.title, area: p.area || null }
    return map
  }, [projects])

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
  const [flowCategory, setFlowCategory] = useState('all') // 'all' | 'work' | 'study'
  const [showFlowDash, setShowFlowDash] = useState(false)

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

    // NOVO: Registra no log diário de foco (localStorage)
    // Usa data local para evitar problemas de fuso horário
    const now = new Date()
    const offset = now.getTimezoneOffset()
    const localDate = new Date(now.getTime() - (offset * 60 * 1000))
    const todayStr = localDate.toISOString().split('T')[0]

    // Registra com categoria (Produtividade/Estudos) e a tarefa, para o dashboard
    const lid = currentTask.studyLessonId || currentTask.study_lesson_id
    const displayTitle = (lid && lessonCtxMap[lid]?.lessonTitle) || currentTask.title
    focusLogService.addTime(todayStr, minutesToAdd, {
      category: categorizeTask(currentTask),
      taskId: currentTask.id,
      taskTitle: displayTitle,
    })

    // Persiste o dia de foco no banco (histórico durável, sobrevive a limpar cache)
    focusLogService.persistDay(userId, todayStr)

    // Conclui automaticamente hábitos vinculados ao timer cuja meta do dia foi atingida
    syncTimerHabits?.()

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

  // Salva o tempo de foco ainda não persistido (sem mexer em estado).
  const persistElapsedFocus = () => {
    if (pomodoroMode !== 'focus') return
    let currentSeconds = timeLeft
    if (isRunning && endTimeRef.current) {
      currentSeconds = Math.ceil((endTimeRef.current - Date.now()) / 1000)
    }
    const elapsed = lastTimeRef.current - currentSeconds
    if (elapsed > 0) saveFocusTime(elapsed)
  }

  // Sai do modo foco: salva o tempo, para o timer e fecha o card do Flow.
  const exitFocusMode = () => {
    persistElapsedFocus()
    clearInterval(timerIntervalRef.current)
    endTimeRef.current = null
    setIsRunning(false)
    setFocusedTaskId(null)
  }

  // Garante que o foco decorrido seja salvo ao sair da página (desmonte).
  const persistRef = useRef(persistElapsedFocus)
  persistRef.current = persistElapsedFocus
  useEffect(() => () => { persistRef.current() }, [])

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

    // Virada de semana: concluídas de semanas anteriores somem da UI (não do banco)
    const weekStart = getWeekStart()

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

      // Virada de semana: esconde concluídas de semanas anteriores (ou sem
      // data de conclusão / legadas). É só na UI — a tarefa continua no banco
      // (completed:true) e segue contando no progresso do projeto/meta.
      if (isDoneTask) {
        const completedDate = task.completed_at ? new Date(task.completed_at) : null
        if (!completedDate || completedDate < weekStart) {
          return false
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
    // Filtro por categoria (Produtividade x Estudos)
    .filter((task) => flowCategory === 'all' || categorizeTask(task) === flowCategory)

    // Ordenação determinística em cascata
    const todayKey = toLocalDateKey(today)
    const priorityOrder = { 'Urgente': 0, 'Alta': 1, 'Normal': 2, 'Baixa': 3 }
    const timeOf = (t) => (t.due_date ? new Date(t.due_date).getTime() : Infinity)
    const rank = (t) => {
      const done = normalizeTaskStatus(t) === 'done'
      const key = toLocalDateKey(t.due_date)
      const late = !done && !!key && key < todayKey
      return { done, late }
    }

    return matched.sort((a, b) => {
      const ra = rank(a)
      const rb = rank(b)
      // 1. Não-concluídas antes de concluídas
      if (ra.done !== rb.done) return ra.done ? 1 : -1
      // 2. Atrasadas primeiro (entre as não-concluídas)
      if (!ra.done && ra.late !== rb.late) return ra.late ? -1 : 1
      // 3. Critério principal escolhido
      if (sortBy === 'priority') {
        const pa = priorityOrder[a.priority] ?? 4
        const pb = priorityOrder[b.priority] ?? 4
        if (pa !== pb) return pa - pb
      }
      // 4. Desempate sempre por horário
      return timeOf(a) - timeOf(b)
    })
  }, [tasks, timelineFilter, statusFilters, sortBy, flowCategory])

  // Arquivamento manual por tarefa (reversível) — não mexe em `completed`,
  // então NÃO afeta o progresso de projetos/metas.
  const [pendingArchiveTask, setPendingArchiveTask] = useState(null)

  const requestArchiveTask = (taskId) => {
    const task = tasks.find(t => t.id === taskId)
    if (task) setPendingArchiveTask(task)
  }

  const handleConfirmArchive = async () => {
    const task = pendingArchiveTask
    setPendingArchiveTask(null)
    if (!task) return
    if (focusedTaskId === task.id) exitFocusMode()
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'archived' } : t))
    await updateTask(task.id, { status: 'archived' })
  }

  const restoreTask = async (taskId) => {
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'todo' } : t))
    await updateTask(taskId, { status: 'todo' })
  }

  const handleFilterClick = (filter) => {
    // Ao trocar de filtro, encerra o Flow (fecha o card e salva o foco)
    exitFocusMode()
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

    // completed_at otimista: garante que a tarefa apareça/saia de Finalizadas
    // na hora, sem esperar o retorno do servidor.
    const completedAt = newCompleted ? new Date().toISOString() : null
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: newCompleted, completed_at: completedAt } : t))

    await updateTask(taskId, {
      completed: newCompleted,
      status: newCompleted ? 'done' : statusToRestore,
      completed_at: completedAt,
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

  // Reagenda uma tarefa atrasada para HOJE (1 clique). Usa meio-dia UTC para a
  // chave de data local nunca "voltar" um dia por fuso. Otimista + persiste no banco.
  const moveTaskToToday = async (task) => {
    const todayKey = toLocalDateKey(new Date())
    const dueDate = `${todayKey}T12:00:00.000Z`
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, due_date: dueDate, dueDate } : t))
    try {
      await updateTask(task.id, { dueDate })
    } catch (e) {
      console.error('Erro ao mover tarefa para hoje:', e)
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
                  {(() => {
                    const cat = CATEGORY_META[categorizeTask(focusedTaskData)]
                    return (
                      <span className="focusCatBadge" style={{ '--c': cat.color }}>
                        {cat.emoji} {cat.label}
                      </span>
                    )
                  })()}
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
              <button className="pomodoroCard__btn dash" onClick={() => setShowFlowDash(true)} title="Painel de produtividade">
                <BarChart3 size={20} />
              </button>
            </div>
          </section>
        )}

        <header className="tasksListShell__head">
          <div><p className="tasksListShell__eyebrow">Checklist</p><h2>Minhas Tarefas</h2></div>
          <div className="tasksListShell__actions">
            <div className="tasksListShell__sort tasksListShell__cat">
              <span className="tasksListShell__sortLabel">Categoria:</span>
              <button className={`tasksListShell__sortBtn ${flowCategory === 'all' ? 'active' : ''}`} onClick={() => setFlowCategory('all')}>
                Tudo
              </button>
              <button className={`tasksListShell__sortBtn ${flowCategory === 'work' ? 'active' : ''}`} onClick={() => setFlowCategory('work')}>
                <Briefcase size={14} /> Produtividade
              </button>
              <button className={`tasksListShell__sortBtn ${flowCategory === 'study' ? 'active' : ''}`} onClick={() => setFlowCategory('study')}>
                <BookOpen size={14} /> Estudos
              </button>
            </div>
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
          {filteredTasks.map((task, idx) => {
            const statusKey = normalizeTaskStatus(task)
            const statusMeta = STATUS_META[statusKey] || STATUS_META.todo
            const StatusIcon = statusMeta.icon
            const isDone = statusKey === 'done'
            const dueDateKey = toLocalDateKey(task.due_date)
            const todayKey = toLocalDateKey(new Date())
            const isLate = !isDone && !!dueDateKey && dueDateKey < todayKey
            const isFocused = focusedTaskId === task.id

            return (
              <li
                key={task.id}
                data-priority={(task.priority || '').toLowerCase()}
                style={{ '--i': Math.min(idx, 12) }}
                className={`taskCard ${isDone ? 'taskCard--done' : ''} ${isLate ? 'taskCard--late' : ''} ${isFocused ? 'taskCard--focused' : ''} ${celebratingTask === task.id ? 'taskCard--celebrate' : ''}`}
              >
                {celebratingTask === task.id && (
                  <div className="taskCard__celebration" aria-hidden="true">
                    <span className="taskCard__xpPop">+10 XP</span>
                    <span className="taskCard__confetti taskCard__confetti--one" />
                    <span className="taskCard__confetti taskCard__confetti--two" />
                    <span className="taskCard__confetti taskCard__confetti--three" />
                    <span className="taskCard__confetti taskCard__confetti--four" />
                    <span className="taskCard__confetti taskCard__confetti--five" />
                  </div>
                )}

                <button
                  className={`taskCard__checkbox ${isDone ? 'taskCard__checkbox--checked' : ''}`}
                  onClick={() => toggleTaskCompletion(task.id)}
                  aria-pressed={isDone}
                  aria-label={isDone ? 'Marcar como não concluída' : 'Concluir tarefa'}
                >
                  <span className="taskCard__checkboxRipple" aria-hidden="true" />
                  <svg className="taskCard__checkboxMark" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
                    <path d="M5 12.5l4.2 4.2L19 7" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                <div className="taskCard__body">
                  <div className="taskCard__header">
                    <div>
                      {(() => {
                        const sId = task.studyLessonId || task.study_lesson_id
                        const sctx = sId ? lessonCtxMap[sId] : null
                        if (sctx) {
                          return (
                            <>
                              <div className="taskCard__ctxRow">
                                <span className="taskCtxChip taskCtxChip--course">
                                  <em>Curso</em> {sctx.studyTitle}
                                </span>
                                <span className={`taskCtxChip taskCtxChip--${sctx.containerKind}`}>
                                  <em>{STUDY_KIND_LABEL[sctx.containerKind] || 'Módulo'}</em> {sctx.containerTitle}
                                </span>
                              </div>
                              <p className="taskCard__title">{sctx.lessonTitle}</p>
                            </>
                          )
                        }
                        const pId = task.projectId || task.project_id
                        const pctx = pId ? projectCtxMap[pId] : null
                        if (pctx) {
                          return (
                            <>
                              <div className="taskCard__ctxRow">
                                <span className="taskCtxChip taskCtxChip--project">
                                  <em>Projeto</em> {pctx.title}
                                </span>
                                {pctx.area && (
                                  <span className="taskCtxChip"><em>Área</em> {pctx.area}</span>
                                )}
                              </div>
                              <p className="taskCard__title">{task.title}</p>
                            </>
                          )
                        }
                        return (
                          <>
                            <p className="taskCard__title">{task.title}</p>
                            <div className="taskCard__context">
                              <span>{task.context || 'Geral'}</span>
                              {task.project && <span>• {task.project}</span>}
                            </div>
                          </>
                        )
                      })()}
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
                    {isLate && (
                      <button
                        className="taskCard__actionBtn taskCard__actionBtn--today"
                        onClick={() => moveTaskToToday(task)}
                        title="Reagendar esta tarefa para hoje"
                      >
                        <Sun size={13} /> Mover para hoje
                      </button>
                    )}
                    <button className="taskCard__actionBtn taskCard__actionBtn--ghost" onClick={() => { setDetailTaskId(task.id); setEditTask(null); }}>
                      Detalhes
                    </button>
                    {statusKey === 'archived' ? (
                      <button className="taskCard__actionBtn taskCard__actionBtn--ghost" onClick={() => restoreTask(task.id)}>
                        <RotateCcw size={13} /> Restaurar
                      </button>
                    ) : (
                      <button className="taskCard__actionBtn taskCard__actionBtn--ghost" onClick={() => requestArchiveTask(task.id)}>
                        <Archive size={13} /> Arquivar
                      </button>
                    )}
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

      <FlowDashboardModal open={showFlowDash} onClose={() => setShowFlowDash(false)} />

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
        onArchive={(id) => { requestArchiveTask(id); setDetailTaskId(null); }}
        onRestore={(id) => { restoreTask(id); setDetailTaskId(null); }}
        onEdit={(task) => {
          setEditTask(task);
          setTaskModalOpen(true);
          setDetailTaskId(null);
        }}
      />

      {pendingArchiveTask && (
        <ConfirmModal
          title="Arquivar tarefa?"
          message={`"${pendingArchiveTask.title}" será movida para Arquivadas. Você pode restaurá-la quando quiser e ela não conta no progresso do projeto enquanto estiver arquivada.`}
          confirmLabel="Arquivar"
          cancelLabel="Cancelar"
          onConfirm={handleConfirmArchive}
          onCancel={() => setPendingArchiveTask(null)}
        />
      )}
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

function TaskDetailModal({ task, onClose, deleteTask, onEdit, onArchive, onRestore }) {
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
          {statusKey === 'archived' ? (
            <button className="taskModal__editBtn" onClick={() => onRestore(task.id)}>Restaurar</button>
          ) : (
            <button className="taskModal__editBtn" onClick={() => onArchive(task.id)}>Arquivar</button>
          )}
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