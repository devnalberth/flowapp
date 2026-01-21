import { useEffect, useMemo, useState, useRef } from 'react'
import { useApp } from '../../context/AppContext'

import TopNav from '../../components/TopNav/TopNav.jsx'
import CreateTaskModal from '../../components/CreateTaskModal/CreateTaskModal.jsx'
import FloatingCreateButton from '../../components/FloatingCreateButton/FloatingCreateButton.jsx'
import { Play, Pause, RotateCcw, Settings, Zap, Coffee, Timer, Calendar, Sun, AlertTriangle, CalendarOff, CheckCircle2, ListTodo, Sparkles } from 'lucide-react'

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
  { id: 'tomorrow', label: 'Amanhã', group: 'timeline', icon: 'sun', tone: 'dawn' },
  { id: 'late', label: 'Atrasadas', group: 'timeline', icon: 'calendar-late', tone: 'warning' },
  { id: 'unscheduled', label: 'Sem Agendamento', group: 'timeline', icon: 'calendar-off', tone: 'stone' },
]

const TASK_MODAL_STATUS = ['Capturar', 'Clarificar', 'Executar', 'Rever', 'Flow']
const TASK_MODAL_PRIORITY = ['Alta', 'Média', 'Baixa', 'Urgente']

export default function Tasks({ onNavigate, onLogout, user }) {
  const currentUser = user ?? DEFAULT_USER
  const { tasks: contextTasks, projects, addTask, updateTask, deleteTask } = useApp()

  // --- Estados de Filtro ---
  const [timelineFilter, setTimelineFilter] = useState('today')
  const [statusFilters, setStatusFilters] = useState([])

  // --- Estados de Dados ---
  const [tasks, setTasks] = useState([])
  const [editTask, setEditTask] = useState(null)
  const [isTaskModalOpen, setTaskModalOpen] = useState(false)
  const [expandedTaskId, setExpandedTaskId] = useState(null)
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

    // Atualiza otimista e no banco
    await updateTask(focusedTaskId, { time_spent: newTimeSpent })
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

    const matched = tasks.filter((task) => {
      let dueDate = null
      if (task.due_date) {
        dueDate = new Date(task.due_date)
        dueDate.setHours(0, 0, 0, 0)
        const timezoneOffset = dueDate.getTimezoneOffset() * 60000
        if (task.due_date.includes('T00:00:00') && timezoneOffset > 0) {
          dueDate = new Date(dueDate.getTime() + timezoneOffset)
        }
      }

      let matchesTimeline = false
      if (timelineFilter === 'today') matchesTimeline = dueDate && dueDate.getTime() === today.getTime()
      else if (timelineFilter === 'tomorrow') matchesTimeline = dueDate && dueDate.getTime() === tomorrow.getTime()
      else if (timelineFilter === 'late') matchesTimeline = dueDate && dueDate < today && !task.completed
      else if (timelineFilter === 'unscheduled') matchesTimeline = !dueDate
      else if (timelineFilter === 'any') matchesTimeline = true

      let matchesStatus = true
      if (statusFilters.length > 0) {
        matchesStatus = statusFilters.some(filterId => {
          if (filterId === 'done') return !!task.completed
          if (filterId === 'flow') return (task.tags || []).includes('flow') || task.status === 'Flow' || task.priority === 'Urgente'
          if (filterId === 'quick') return (task.tags || []).includes('quick') || task.estimatedMinutes <= 15
          return false
        })
      }

      // Se o filtro "Finalizada" estiver ativo, mostra APENAS as finalizadas
      if (statusFilters.includes('done')) return !!task.completed

      // Se não houver filtro de status (Minhas Tarefas padrão), ESCONDE as finalizadas
      if (statusFilters.length === 0) return matchesTimeline && !task.completed

      // Caso contrário, retorna o match de status calculado
      return matchesStatus
    })

    return matched.sort((a, b) => {
      const timeA = a.due_date ? new Date(a.due_date).getTime() : Infinity
      const timeB = b.due_date ? new Date(b.due_date).getTime() : Infinity
      return timeA - timeB
    })
  }, [tasks, timelineFilter, statusFilters])

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
    if (newCompleted) setCelebratingTask(taskId)

    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, completed: newCompleted } : t))

    await updateTask(taskId, {
      completed: newCompleted,
      status: newCompleted ? 'done' : (task.prevStatus || 'Capturar')
    })
  }

  const handleTaskSubmit = async (data) => {
    try {
      if (editTask) {
        await updateTask(editTask.id, data)
      } else {
        await addTask({ ...data, status: data.status || 'Capturar' })
      }
      setTaskModalOpen(false)
      setEditTask(null)

      const createdDate = data.dueDate ? new Date(data.dueDate) : null
      const today = new Date()
      if (createdDate && createdDate.getDate() === today.getDate()) {
        if (timelineFilter !== 'today') {
          setTimelineFilter('today'); setStatusFilters([]);
        }
      }
    } catch (e) {
      alert('Erro ao salvar tarefa')
    }
  }

  const handleSubtaskToggle = (taskId, subtaskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t
      const subtasks = t.subtasks?.map(s => s.id === subtaskId ? { ...s, done: !s.done } : s) || []
      return { ...t, subtasks }
    }))
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
        </header>

        <ul className="tasksList">
          {filteredTasks.map(task => {
            const isDone = task.completed
            const isLate = !isDone && task.due_date && new Date(task.due_date).getTime() < new Date().setHours(0, 0, 0, 0)
            const isExpanded = expandedTaskId === task.id
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
                      {task.due_date && <span className="taskCard__dueText">{new Date(task.due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}</span>}
                    </div>
                  </div>

                  <div className="taskCard__actions">
                    <button className="taskCard__actionBtn" onClick={() => setExpandedTaskId(curr => curr === task.id ? null : task.id)}>
                      {isExpanded ? 'Recolher' : 'Clarificar'}
                    </button>
                    <button className="taskCard__actionBtn taskCard__actionBtn--ghost" onClick={() => { setDetailTaskId(task.id); setEditTask(null); }}>
                      Detalhes
                    </button>
                  </div>

                  {isExpanded && task.subtasks && (
                    <div className="taskCard__details">
                      <ul className="subtasksList">
                        {task.subtasks.map((subtask) => (
                          <li key={subtask.id}>
                            <button
                              type="button"
                              className={subtask.done ? 'subtask subtask--done' : 'subtask'}
                              onClick={() => handleSubtaskToggle(task.id, subtask.id)}
                            >
                              <span className="subtask__check" />
                              <div className="subtask__content">
                                <p>{subtask.label || subtask.title}</p>
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

        {filteredTasks.length === 0 && <div className="tasksListShell__empty">Nenhuma tarefa encontrada.</div>}
      </section>

      <FloatingCreateButton label="Nova tarefa" onClick={() => { setEditTask(null); setTaskModalOpen(true) }} />

      {isTaskModalOpen && (
        <CreateTaskModal
          open={true}
          onClose={() => { setTaskModalOpen(false); setEditTask(null) }}
          onSubmit={handleTaskSubmit}
          projectsOptions={projectOptions}
          statusOptions={TASK_MODAL_STATUS}
          priorityOptions={TASK_MODAL_PRIORITY}
          initialData={editTask}
        />
      )}

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
    sun: <Sun size={14} />,
    'calendar-late': <AlertTriangle size={14} />,
    'calendar-off': <CalendarOff size={14} />
  }
  return <span style={{ display: 'flex', alignItems: 'center' }}>{icons[name] || '•'}</span>
}

function TaskDetailModal({ task, onClose, deleteTask, onEdit }) {
  if (!task) return null
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
          <span>Status: {task.status}</span>
        </div>
        <div className="taskModal__description">
          <p>{task.description || 'Sem descrição'}</p>
        </div>
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