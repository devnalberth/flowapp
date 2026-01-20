import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'

import TopNav from '../../components/TopNav/TopNav.jsx'
import CreateTaskModal from '../../components/CreateTaskModal/CreateTaskModal.jsx'
import FloatingCreateButton from '../../components/FloatingCreateButton/FloatingCreateButton.jsx'

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

const TASK_MODAL_STATUS = ['Capturar', 'Clarificar', 'Executar', 'Rever', 'Flow']
const TASK_MODAL_PRIORITY = ['Alta', 'Média', 'Baixa', 'Urgente']

export default function Tasks({ onNavigate, onLogout, user }) {
  const currentUser = user ?? DEFAULT_USER
  const { tasks: contextTasks, projects, addTask, updateTask, deleteTask } = useApp()
  
  // Estado inicial dos filtros
  const [timelineFilter, setTimelineFilter] = useState('today')
  const [statusFilters, setStatusFilters] = useState([]) 
  
  const [tasks, setTasks] = useState([])
  const [expandedTaskId, setExpandedTaskId] = useState(null)
  const [detailTaskId, setDetailTaskId] = useState(null)
  const [celebratingTask, setCelebratingTask] = useState(null)
  const [isTaskModalOpen, setTaskModalOpen] = useState(false)

  // Pomodoro States
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

  const projectOptions = useMemo(() => {
    return projects.map((project) => ({ id: project.id, label: project.title }))
  }, [projects])

  useEffect(() => {
    setTasks(contextTasks || [])
  }, [contextTasks])

  const isFlowMode = statusFilters.includes('flow')
  
  // === LÓGICA DE FILTRAGEM CORRIGIDA E ROBUSTA ===
  const filteredTasks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    const matched = tasks.filter((task) => {
      // 1. Normalizar Data
      let dueDate = null
      if (task.due_date) {
        dueDate = new Date(task.due_date)
        dueDate.setHours(0, 0, 0, 0)
        
        // Ajuste de fuso horário opcional se necessário
        const timezoneOffset = dueDate.getTimezoneOffset() * 60000
        if (task.due_date.includes('T00:00:00') && timezoneOffset > 0) {
           dueDate = new Date(dueDate.getTime() + timezoneOffset)
        }
      }

      // 2. Verificar Timeline (Datas)
      let matchesTimeline = false
      if (timelineFilter === 'today') {
        matchesTimeline = dueDate && dueDate.getTime() === today.getTime()
      } else if (timelineFilter === 'tomorrow') {
        matchesTimeline = dueDate && dueDate.getTime() === tomorrow.getTime()
      } else if (timelineFilter === 'late') {
        matchesTimeline = dueDate && dueDate < today && !task.completed
      } else if (timelineFilter === 'unscheduled') {
        matchesTimeline = !dueDate
      } else if (timelineFilter === 'any') {
        matchesTimeline = true
      }

      // 3. Verificar Status
      let matchesStatus = true
      if (statusFilters.length > 0) {
        matchesStatus = statusFilters.some(filterId => {
          if (filterId === 'done') return task.completed
          if (filterId === 'flow') return (task.tags || []).includes('flow') || task.status === 'Flow' || task.priority === 'Urgente'
          if (filterId === 'quick') return (task.tags || []).includes('quick') || task.estimatedMinutes <= 15
          return false
        })
      }

      // Regras de Combinação
      if (statusFilters.includes('done')) {
         return task.completed
      }

      if (statusFilters.length === 0) {
        return matchesTimeline && !task.completed
      }

      return matchesStatus
    })

    // Função utilitária para comparar datas (nulls vão para o final)
    const getTimeOrInfinity = (dateStr) => {
      if (!dateStr) return Infinity
      try {
        return new Date(dateStr).getTime()
      } catch (e) {
        return Infinity
      }
    }

    const priorityRank = (p) => {
      if (!p) return 0
      const map = { 'Urgente': 4, 'Alta': 3, 'Média': 2, 'Baixa': 1 }
      return map[p] || 0
    }

    // Ordenação por regras solicitadas
    matched.sort((a, b) => {
      // Se estamos em filtro 'today' -> ordenar por data (mais cedo -> mais tarde)
      if (timelineFilter === 'today' && statusFilters.length === 0) {
        return getTimeOrInfinity(a.due_date) - getTimeOrInfinity(b.due_date)
      }

      // Se estamos em modo Flow -> data mais cedo, dentro da mesma data prioridade mais alta primeiro
      if (statusFilters.includes('flow')) {
        const dateComp = getTimeOrInfinity(a.due_date) - getTimeOrInfinity(b.due_date)
        if (dateComp !== 0) return dateComp
        return priorityRank(b.priority) - priorityRank(a.priority)
      }

      // Default: ordenar por data asc (sem data vão para o final)
      return getTimeOrInfinity(a.due_date) - getTimeOrInfinity(b.due_date)
    })

    return matched
  }, [tasks, timelineFilter, statusFilters])

  // --- Handlers ---
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
    await updateTask(taskId, { completed: newCompleted, status: newCompleted ? 'Concluído' : task.status })
  }

  const handleFocusTask = (id) => { setFocusedTaskId(id); setPomodoroRunning(false); setPomodoroTime(pomodoroConfig.focusTime * 60); }
  const togglePomodoro = () => setPomodoroRunning(p => !p)
  const resetPomodoro = () => { setPomodoroRunning(false); setPomodoroTime(pomodoroConfig.focusTime * 60) }
  const formatTime = (s) => `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`

  const handleConfigSave = (newConfig) => {
    setPomodoroConfig(newConfig)
    setPomodoroTime(newConfig.focusTime * 60)
    setPomodoroRunning(false)
    setShowPomodoroConfig(false)
  }

  const [editTask, setEditTask] = useState(null)
  const handleTaskSubmit = async (data) => {
    try {
      if (editTask) {
        await updateTask(editTask.id, data)
      } else {
        await addTask({
          ...data,
          status: data.status || 'Capturar'
        })
      }
      setTaskModalOpen(false)
      setEditTask(null)
      const createdDate = data.dueDate ? new Date(data.dueDate) : null
      const today = new Date()
      if (createdDate && createdDate.getDate() === today.getDate()) {
        if (timelineFilter !== 'today') {
           setTimelineFilter('today')
           setStatusFilters([])
        }
      } else if (!data.dueDate) {
        if (timelineFilter !== 'unscheduled') {
           setTimelineFilter('unscheduled')
           setStatusFilters([])
        }
      }
    } catch (e) {
      alert(editTask ? 'Erro ao editar tarefa' : 'Erro ao criar tarefa')
    }
  }

  const handleSubtaskToggle = (taskId, subtaskId) => {
    setTasks(prev => prev.map(t => {
      if (t.id !== taskId) return t
      const subtasks = t.subtasks?.map(s => s.id === subtaskId ? {...s, done: !s.done} : s) || []
      return { ...t, subtasks }
    }))
  }
  const handleClarifyToggle = (id) => setExpandedTaskId(curr => curr === id ? null : id)
  const handleDetailOpen = (id) => setDetailTaskId(id)
  const handleDetailClose = () => setDetailTaskId(null)
  const activeDetailTask = detailTaskId ? tasks.find(t => t.id === detailTaskId) : null

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
                <span className="tasksFilters__icon"><FilterIcon name={f.icon}/></span>
                <span>{f.label}</span>
              </button>
            )
          })}
        </div>

        <header className="tasksListShell__head">
          <div><p className="tasksListShell__eyebrow">Checklist</p><h2>Minhas Tarefas</h2></div>
        </header>

        <ul className="tasksList">
          {filteredTasks.map(task => {
            const isDone = task.completed
            // CORREÇÃO AQUI: Adicionado .getTime() para comparar número com número
            const isLate = !isDone && task.due_date && new Date(task.due_date).getTime() < new Date().setHours(0,0,0,0)
            const isExpanded = expandedTaskId === task.id
            
            return (
              <li key={task.id} className={`taskCard ${isDone ? 'taskCard--done' : ''} ${isLate ? 'taskCard--late' : ''} ${celebratingTask === task.id ? 'taskCard--celebrate' : ''}`}>
                 {celebratingTask === task.id && (
                  <div className="taskCard__celebration">
                    <span className="taskCard__xpPop">+10 XP</span>
                    <span className="taskCard__confetti taskCard__confetti--one" />
                    <span className="taskCard__confetti taskCard__confetti--two" />
                  </div>
                )}
                
                <button className={`taskCard__checkbox ${isDone ? 'taskCard__checkbox--checked' : ''}`} onClick={() => toggleTaskCompletion(task.id)}>
                  <span className="taskCard__checkboxMark"/>
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
                      {isFlowMode && <button className="taskCard__focusBtn" onClick={() => handleFocusTask(task.id)}>Focar</button>}
                      <span className="taskChip">{task.priority}</span>
                      {task.due_date && <span className="taskCard__dueText">{new Date(task.due_date).toLocaleDateString('pt-BR', {timeZone: 'UTC'})}</span>}
                    </div>
                  </div>

                  <div className="taskCard__actions">
                    <button className="taskCard__actionBtn" onClick={() => handleClarifyToggle(task.id)}>
                      {isExpanded ? 'Recolher' : 'Clarificar'}
                    </button>
                    <button className="taskCard__actionBtn taskCard__actionBtn--ghost" onClick={() => handleDetailOpen(task.id)}>
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

        {isFlowMode && (
          <section className="pomodoroCard ui-card">
            <div className="pomodoroCard__timer">{formatTime(pomodoroTime)}</div>
            <div className="pomodoroCard__controls">
              <button className="pomodoroCard__btn pomodoroCard__btn--primary" onClick={togglePomodoro}>{pomodoroRunning ? 'Pausar' : 'Iniciar'}</button>
              <button className="pomodoroCard__btn pomodoroCard__btn--secondary" onClick={resetPomodoro}>Resetar</button>
            </div>
          </section>
        )}
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
        config={pomodoroConfig}
        onClose={() => setShowPomodoroConfig(false)}
        onSave={handleConfigSave}
      />

      <TaskDetailModal 
        task={activeDetailTask} 
        onClose={handleDetailClose} 
        deleteTask={deleteTask}
        onEdit={(task) => {
          setEditTask(task);
          setTaskModalOpen(true);
          setDetailTaskId(null);
        }}
      />
    </div>
  )
}

function FilterIcon({ name }) {
  const common = { width: 18, height: 18 }
  switch (name) {
    case 'list':
      return (
        <svg viewBox="0 0 24 24" {...common} aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" fill="currentColor" opacity="0.06" />
          <line x1="8" y1="9" x2="16" y2="9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="8" y1="13" x2="16" y2="13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          <line x1="8" y1="17" x2="12" y2="17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    case 'spark':
      return (
        <svg viewBox="0 0 24 24" {...common} aria-hidden="true">
          <path d="M12 2l1.9 4.6L18 8l-4.1 1.4L12 14l-1.9-4.6L6 8l4.1-1.4L12 2z" fill="currentColor" opacity="0.95" />
        </svg>
      )
    case 'bolt':
      return (
        <svg viewBox="0 0 24 24" {...common} aria-hidden="true">
          <path d="M13 2L3 14h7l-1 8L21 10h-7l-1-8z" fill="currentColor" />
        </svg>
      )
    case 'check':
      return (
        <svg viewBox="0 0 24 24" {...common} aria-hidden="true">
          <path d="M20 6L9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        </svg>
      )
    case 'sun':
      return (
        <svg viewBox="0 0 24 24" {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="4" fill="currentColor" />
          <g stroke="currentColor" strokeWidth="1.4">
            <line x1="12" y1="2" x2="12" y2="4" />
            <line x1="12" y1="20" x2="12" y2="22" />
            <line x1="2" y1="12" x2="4" y2="12" />
            <line x1="20" y1="12" x2="22" y2="12" />
          </g>
        </svg>
      )
    case 'calendar-late':
      return (
        <svg viewBox="0 0 24 24" {...common} aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.2" />
          <path d="M8 16l2-2 2 2 4-4" stroke="currentColor" strokeWidth="1.8" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )
    case 'calendar-off':
      return (
        <svg viewBox="0 0 24 24" {...common} aria-hidden="true">
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
          <line x1="3" y1="10" x2="21" y2="10" stroke="currentColor" strokeWidth="1.2" />
          <line x1="4" y1="20" x2="20" y2="4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )
    default:
      return (
        <svg viewBox="0 0 24 24" {...common} aria-hidden="true">
          <circle cx="12" cy="12" r="3" fill="currentColor" />
        </svg>
      )
  }
}

function TaskDetailModal({ task, onClose, deleteTask, onEdit }) {
  if (!task) return null

  const handleDelete = async () => {
    const ok = window.confirm('Tem certeza que deseja excluir esta tarefa?')
    if (!ok) return
    try {
      await deleteTask(task.id)
      onClose()
    } catch (e) {
      alert('Erro ao excluir tarefa')
    }
  }

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
          <button className="taskModal__deleteBtn" onClick={handleDelete}>Excluir</button>
        </footer>
      </div>
    </div>
  )
}

function PomodoroConfigModal({ show, config, onClose, onSave }) {
  const [localConfig, setLocalConfig] = useState(config || { focusTime: 25, shortBreak: 5, longBreak: 10, technique: 'classic' })

  useEffect(() => {
    if(config) setLocalConfig(config)
  }, [config])

  if (!show) return null

  return (
    <div className="pomodoroConfigModal">
      <div className="pomodoroConfigModal__backdrop" onClick={onClose} />
      <div className="pomodoroConfigModal__panel">
        <header className="pomodoroConfigModal__header">
            <h3>Configurar Pomodoro</h3>
            <button className="pomodoroConfigModal__close" onClick={onClose}>×</button>
        </header>
        
        <div className="pomodoroConfigModal__content">
            <div className="pomodoroInput">
                <label>Foco (minutos)</label>
                <input 
                    type="number" 
                    value={localConfig.focusTime} 
                    onChange={e => setLocalConfig({...localConfig, focusTime: Number(e.target.value)})}
                />
            </div>
            <div className="pomodoroInput">
                <label>Pausa Curta (minutos)</label>
                <input 
                    type="number" 
                    value={localConfig.shortBreak} 
                    onChange={e => setLocalConfig({...localConfig, shortBreak: Number(e.target.value)})}
                />
            </div>
             <div className="pomodoroInput">
                <label>Pausa Longa (minutos)</label>
                <input 
                    type="number" 
                    value={localConfig.longBreak} 
                    onChange={e => setLocalConfig({...localConfig, longBreak: Number(e.target.value)})}
                />
            </div>
        </div>

        <footer className="pomodoroConfigModal__footer">
            <button className="pomodoroConfigModal__btn pomodoroConfigModal__btn--secondary" onClick={onClose}>Cancelar</button>
            <button className="pomodoroConfigModal__btn pomodoroConfigModal__btn--primary" onClick={() => onSave(localConfig)}>Salvar</button>
        </footer>
      </div>
    </div>
  )
}