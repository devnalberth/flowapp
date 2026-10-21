import { usePageActions } from '../../context/ShellContext.jsx'
import { useEffect, useMemo, useState, useRef } from 'react'
import { useApp } from '../../context/AppContext'

import CreateTaskModal from '../../components/CreateTaskModal/CreateTaskModal.jsx'
import CreateEventModal from '../../components/CreateEventModal/CreateEventModal.jsx'
import { Calendar, CheckCircle2, Archive, ChevronDown, Trash2 } from 'lucide-react'
import useFocusTimer, { POMODORO_TECHNIQUES } from '../../hooks/useFocusTimer.js'
import { normalizeTaskStatus, isArchivedTask } from '../../utils/taskStatus'
import { buildLessonContextMap, buildBlockContextMap } from '../../utils/studyMetrics'
import { categorizeTask } from '../../utils/taskCategory'
import FlowDashboardModal from '../../components/FlowDashboardModal/FlowDashboardModal.jsx'

import ConfirmModal from '../../components/ui/ConfirmModal.jsx'
import ActionMenu from '../../components/ui/ActionMenu.jsx'
import KpiCard from '../../components/ui/KpiCard.jsx'
import { Segmented } from '../../components/ui/Tabs.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { useToast } from '../../components/ui/ToastProvider.jsx'
import { motion } from 'framer-motion'
import { useMotionPresets } from '../../components/ui/motion'
import { focusLogService } from '../../services/focusLogService'
import { formatMinutes } from '../../utils/habitStats'
import { TaskFocusCard, CompactTaskRow, TaskDetailDrawer, PomodoroConfigModal } from './TasksUI'

import './Tasks.css'

const FILTERS = [
  { id: 'today', label: 'Hoje', group: 'timeline', icon: 'list', tone: 'primary' },
  { id: 'flow', label: 'Flow', group: 'status', icon: 'spark', tone: 'amber' },
  { id: 'quick', label: 'Tarefa Rápida', group: 'status', icon: 'bolt', tone: 'mint' },
  { id: 'done', label: 'Finalizada', group: 'status', icon: 'check', tone: 'sage' },
  { id: 'archived', label: 'Arquivadas', group: 'status', icon: 'archive', tone: 'stone' },
  { id: 'tomorrow', label: 'Amanhã', group: 'timeline', icon: 'sun', tone: 'dawn' },
  { id: 'late', label: 'Atrasadas', group: 'timeline', icon: 'calendar-late', tone: 'warning' },
  {
    id: 'unscheduled',
    label: 'Sem Agendamento',
    group: 'timeline',
    icon: 'calendar-off',
    tone: 'stone',
  },
]

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

export default function Tasks({
  onNavigate,
  onLogout,
  user,
  initialFilter = null,
  studyTarget = null,
}) {
  const notify = useToast()
  const toggleTaskRef = useRef(null)
  const presets = useMotionPresets()
  const [deleteTarget, setDeleteTarget] = useState(null)
  const withFeedback = async (action) => {
    try {
      await action()
    } catch (error) {
      notify({
        title: 'Não foi possível salvar',
        detail: error?.message || 'Tente novamente.',
        tone: 'danger',
      })
    }
  }
  const mask = (value) =>
    prefs.hideFinanceValues
      ? String(value || '').replace(/R\$\s*[\d.,]+(?:\s*(?:mil|milhões?|mi))?/gi, 'R$ ••••')
      : value
  const {
    tasks: contextTasks,
    projects,
    studies,
    addTask,
    updateTask,
    deleteTask,
    addEvent,
    syncTimerHabits,
    userId,
    goals = [],
    prefs = {},
    loading,
  } = useApp()
  const lessonCtxMap = useMemo(() => buildLessonContextMap(studies), [studies])
  const blockCtxMap = useMemo(() => buildBlockContextMap(studies), [studies])
  // --- Estados de Filtro ---
  // Inicialização inteligente baseada no tipo de filtro (Timeline ou Status)
  const [timelineFilter, setTimelineFilter] = useState(() => {
    const filterDef = FILTERS.find((f) => f.id === initialFilter)
    return filterDef?.group === 'timeline' ? initialFilter : 'today'
  })

  const [statusFilters, setStatusFilters] = useState(() => {
    const filterDef = FILTERS.find((f) => f.id === initialFilter)
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

  const [showPomodoroConfig, setShowPomodoroConfig] = useState(false)
  const {
    freeFocusCategory,
    setFreeFocusCategory,
    focusedBlock,
    setFocusedBlock,
    activeTechnique,
    pomodoroMode,
    timeLeft,
    isRunning,
    sessionsCompleted,
    focusedTaskId,
    setFocusedTaskId,
    customConfig,
    setCustomConfig,
    focusedTaskData,
    switchTechnique,
    handleFocusTask,
    toggleTimer,
    resetTimer,
    exitFocusMode,
    formatTime,
  } = useFocusTimer({ tasks, lessonCtxMap, updateTask, syncTimerHabits, userId, studyTarget })

  const projectOptions = useMemo(() => {
    return projects.map((project) => ({ id: project.id, label: project.title }))
  }, [projects])

  useEffect(() => {
    setTasks(contextTasks || [])
  }, [contextTasks])

  // Reage a mudanças na prop initialFilter (navegação via Dashboard)
  useEffect(() => {
    if (initialFilter) {
      const filterDef = FILTERS.find((f) => f.id === initialFilter)
      if (filterDef?.group === 'timeline') {
        setTimelineFilter(initialFilter)
        setStatusFilters([])
      } else if (filterDef?.group === 'status') {
        setTimelineFilter('any') // "status" filters usually override timeline or work alongside 'any'
        setStatusFilters([initialFilter])
      }
    }
  }, [initialFilter])

  useEffect(() => {
    if (!studyTarget?.id) return
    setFocusedBlock(studyTarget)
    setFreeFocusCategory('study')
    setFocusedTaskId(null)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [studyTarget?.id])

  // --- Lógica de Filtros ---
  const filteredTasks = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    // Virada de semana: concluídas de semanas anteriores somem da UI (não do banco)
    const weekStart = getWeekStart()

    const matched = tasks
      .filter((task) => {
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
        else if (timelineFilter === 'tomorrow')
          matchesTimeline = dueDateKey === toLocalDateKey(tomorrow)
        else if (timelineFilter === 'late') matchesTimeline = isLate
        else if (timelineFilter === 'unscheduled') matchesTimeline = !dueDateKey
        else if (timelineFilter === 'any') matchesTimeline = true

        let matchesStatus = true
        if (statusFilters.length > 0) {
          matchesStatus = statusFilters.some((filterId) => {
            if (filterId === 'done') return isDoneTask
            // FLOW: Apenas Alta e Urgente, E que NÃO estão atrasadas
            if (filterId === 'flow') {
              const isHighPriority = task.priority === 'Alta' || task.priority === 'Urgente'
              return isHighPriority && !isLate && !isDoneTask
            }
            if (filterId === 'quick')
              return (task.tags || []).includes('quick') || task.estimatedMinutes <= 15
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
    const task = tasks.find((t) => t.id === taskId)
    if (task) setPendingArchiveTask(task)
  }

  const handleConfirmArchive = async () => {
    const task = pendingArchiveTask
    setPendingArchiveTask(null)
    if (!task) return
    if (focusedTaskId === task.id) exitFocusMode()
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: 'archived' } : t)))
    await updateTask(task.id, { status: 'archived' })
    notify({
      title: 'Tarefa arquivada',
      detail: mask(task.title),
      action: 'Desfazer',
      onAction: () => withFeedback(() => restoreTask(task.id)),
    })
  }

  const restoreTask = async (taskId) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: 'todo' } : t)))
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
          const remaining = curr.filter((id) => id !== filter.id)
          if (remaining.length === 0) setTimelineFilter('today')
          return remaining
        }
        return [filter.id]
      })
    }
  }

  const toggleTaskCompletion = async (taskId) => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const newCompleted = !task.completed
    const currentStatus = normalizeTaskStatus(task)
    const statusToRestore = currentStatus === 'done' ? 'todo' : currentStatus
    if (newCompleted) setCelebratingTask(taskId)

    // completed_at otimista: garante que a tarefa apareça/saia de Finalizadas
    // na hora, sem esperar o retorno do servidor.
    const completedAt = newCompleted ? new Date().toISOString() : null
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, completed: newCompleted, completed_at: completedAt } : t
      )
    )

    await updateTask(taskId, {
      completed: newCompleted,
      status: newCompleted ? 'done' : statusToRestore,
      completed_at: completedAt,
      updated_at: new Date().toISOString(),
    })
    if (newCompleted)
      notify({
        title: 'Tarefa concluída',
        detail: mask(task.title),
        action: 'Desfazer',
        onAction: () => withFeedback(() => toggleTaskRef.current?.(taskId)),
      })
  }

  toggleTaskRef.current = toggleTaskCompletion

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
          setTimelineFilter('today')
          setStatusFilters([])
        }
      }
    } catch (e) {
      notify({
        title: 'Erro ao salvar tarefa',
        detail: e?.message || 'Tente novamente.',
        tone: 'danger',
      })
    }
  }

  // Reagenda uma tarefa atrasada para HOJE (1 clique). Usa meio-dia UTC para a
  // chave de data local nunca "voltar" um dia por fuso. Otimista + persiste no banco.
  const moveTaskToToday = async (task) => {
    const todayKey = toLocalDateKey(new Date())
    const dueDate = `${todayKey}T12:00:00.000Z`
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, due_date: dueDate, dueDate } : t))
    )
    try {
      await updateTask(task.id, { dueDate })
    } catch (e) {
      console.error('Erro ao mover tarefa para hoje:', e)
    }
  }

  const activeDetailTask = useMemo(
    () => (detailTaskId ? tasks.find((t) => t.id === detailTaskId) : null),
    [detailTaskId, tasks]
  )

  const todayKey = toLocalDateKey(new Date())
  const liveTasks = tasks.filter((t) => !isArchivedTask(t))
  const todayTasks = liveTasks.filter((t) => toLocalDateKey(t.due_date) === todayKey)
  const doneToday = todayTasks.filter(
    (t) =>
      normalizeTaskStatus(t) === 'done' &&
      t.completed_at &&
      new Date(t.completed_at) >= getWeekStart()
  )
  const pendingToday = todayTasks.filter((t) => normalizeTaskStatus(t) !== 'done')
  const overdue = liveTasks.filter(
    (t) =>
      normalizeTaskStatus(t) !== 'done' &&
      toLocalDateKey(t.due_date) &&
      toLocalDateKey(t.due_date) < todayKey
  )
  const doneWeek = liveTasks.filter(
    (t) =>
      normalizeTaskStatus(t) === 'done' &&
      t.completed_at &&
      new Date(t.completed_at) >= getWeekStart()
  )
  const focusTotals = focusLogService.getCategoryTotals(1)
  const archived = statusFilters.includes('archived')
  const displayDone =
    timelineFilter === 'today' && statusFilters.length === 0
      ? doneToday.filter((t) => flowCategory === 'all' || categorizeTask(t) === flowCategory)
      : []
  const selectedConfig =
    activeTechnique === 'custom' ? customConfig : POMODORO_TECHNIQUES[activeTechnique]
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  const counts = {
    today: pendingToday.length,
    tomorrow: liveTasks.filter(
      (t) =>
        normalizeTaskStatus(t) !== 'done' && toLocalDateKey(t.due_date) === toLocalDateKey(tomorrow)
    ).length,
    late: overdue.length,
    unscheduled: liveTasks.filter((t) => normalizeTaskStatus(t) !== 'done' && !t.due_date).length,
  }
  const openTask = (task) => setDetailTaskId(task.id)
  const renderRow = (task) => (
    <CompactTaskRow
      key={task.id}
      task={task}
      projects={projects}
      goals={goals}
      lessonCtxMap={lessonCtxMap}
      blockCtxMap={blockCtxMap}
      focused={focusedTaskId === task.id}
      time={formatTime(timeLeft)}
      mask={mask}
      onComplete={(id) => withFeedback(() => toggleTaskCompletion(id))}
      onFocus={handleFocusTask}
      onDetails={openTask}
      onEdit={(task) => {
        setEditTask(task)
        setTaskModalOpen(true)
      }}
      onArchive={requestArchiveTask}
      onRestore={(id) => withFeedback(() => restoreTask(id))}
      onDelete={(task) => setDeleteTarget(task)}
      onMove={(task) => withFeedback(() => moveTaskToToday(task))}
    />
  )
  usePageActions({
    label: 'Nova tarefa',
    options: [
      {
        label: 'Nova tarefa',
        icon: CheckCircle2,
        onClick: () => {
          setEditTask(null)
          setTaskModalOpen(true)
        },
      },
      { label: 'Novo evento', icon: Calendar, onClick: () => setEventModalOpen(true) },
    ],
  })

  return (
    <div className="tasksPage tasks-redesign">
      <motion.header
        className="tasks-heading"
        initial={{ opacity: 0, y: presets.reduce ? 0 : 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1>Tarefas</h1>
        <p>O que importa hoje, em ordem. Urgente e Alta entram no Flow automaticamente.</p>
      </motion.header>
      <motion.div className="tasks-summary" variants={presets.grid} initial="hidden" animate="show">
        <motion.div className="tasks-summary__focus" variants={presets.card}>
          <TaskFocusCard
            config={selectedConfig}
            activeTechnique={activeTechnique}
            onTechnique={switchTechnique}
            category={
              focusedTaskData
                ? categorizeTask(focusedTaskData)
                : focusedBlock
                  ? 'study'
                  : freeFocusCategory
            }
            onCategory={setFreeFocusCategory}
            task={focusedTaskData}
            block={focusedBlock}
            tasks={liveTasks.filter((t) => normalizeTaskStatus(t) !== 'done')}
            onTask={handleFocusTask}
            onClear={() => {
              setFocusedBlock(null)
              exitFocusMode()
            }}
            time={formatTime(timeLeft)}
            running={isRunning}
            mode={pomodoroMode}
            sessions={sessionsCompleted}
            onToggle={toggleTimer}
            onReset={resetTimer}
            onDashboard={() => setShowFlowDash(true)}
            onConfigure={() => setShowPomodoroConfig(true)}
            mask={mask}
          />
        </motion.div>
        <motion.div variants={presets.card}>
          <KpiCard
            label="Hoje"
            value={`${todayTasks.length - pendingToday.length} de ${todayTasks.length}`}
            context={`${pendingToday.length} tarefas abertas hoje`}
            onAction={() => handleFilterClick(FILTERS.find((f) => f.id === 'today'))}
          />
        </motion.div>
        <motion.div variants={presets.card}>
          <KpiCard
            label="Atrasadas"
            value={overdue.length}
            variation={overdue.length ? 'replanejar' : 'em dia'}
            context={overdue.length ? 'escolha uma nova data' : 'nada ficou para trás'}
            onAction={() => handleFilterClick(FILTERS.find((f) => f.id === 'late'))}
          />
        </motion.div>
        <motion.div variants={presets.card}>
          <KpiCard
            label="Foco hoje"
            value={formatMinutes(focusTotals.total)}
            variation={formatMinutes(focusTotals.work)}
            context={`trabalho · ${formatMinutes(focusTotals.study)} estudos`}
            onAction={() => setShowFlowDash(true)}
          />
        </motion.div>
        <motion.div variants={presets.card}>
          <KpiCard
            label="Concluídas na semana"
            value={doneWeek.length}
            context="desde o início da semana"
            onAction={() => handleFilterClick(FILTERS.find((f) => f.id === 'done'))}
          />
        </motion.div>
      </motion.div>
      <motion.section
        className={`tasks-table ${archived ? 'is-archived' : ''}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: presets.reduce ? 0 : 0.3 }}
        aria-label="Lista de tarefas"
      >
        <div className="tasks-toolbar">
          <Segmented
            label="Período das tarefas"
            value={timelineFilter}
            onChange={(value) => handleFilterClick(FILTERS.find((f) => f.id === value))}
            options={[
              ['today', 'Hoje'],
              ['tomorrow', 'Amanhã'],
              ['late', 'Atrasadas'],
              ['unscheduled', 'Sem data'],
            ].map(([value, label]) => ({ value, label, count: counts[value] }))}
          />
          <div className="tasks-toolbar__status">
            {[
              ['flow', 'Flow'],
              ['quick', 'Rápidas'],
              ['done', 'Finalizadas'],
              ['archived', 'Arquivadas'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                aria-pressed={statusFilters.includes(id)}
                className={`tasks-pill ${statusFilters.includes(id) ? 'is-active' : ''}`}
                onClick={() => handleFilterClick(FILTERS.find((f) => f.id === id))}
              >
                {label}
                {id === 'flow' &&
                  ` · ${liveTasks.filter((t) => ['Alta', 'Urgente'].includes(t.priority) && normalizeTaskStatus(t) !== 'done' && !(toLocalDateKey(t.due_date) && toLocalDateKey(t.due_date) < todayKey)).length}`}
              </button>
            ))}
          </div>
          <div className="tasks-toolbar__more">
            <ActionMenu
              label="Categoria das tarefas"
              trigger={
                <button className="tasks-pill" type="button">
                  Categoria:{' '}
                  {flowCategory === 'all'
                    ? 'Tudo'
                    : flowCategory === 'work'
                      ? 'Produtividade'
                      : 'Estudos'}
                  <ChevronDown size={14} />
                </button>
              }
              items={[
                ['all', 'Tudo'],
                ['work', 'Produtividade'],
                ['study', 'Estudos'],
              ].map(([id, label]) => ({ label, onClick: () => setFlowCategory(id) }))}
            />
            <ActionMenu
              label="Ordenação das tarefas"
              trigger={
                <button className="tasks-pill" type="button">
                  {sortBy === 'time' ? 'Por horário' : 'Por prioridade'}
                  <ChevronDown size={14} />
                </button>
              }
              items={[
                { label: 'Por horário', onClick: () => setSortBy('time') },
                { label: 'Por prioridade', onClick: () => setSortBy('priority') },
              ]}
            />
          </div>
        </div>
        {archived && (
          <div className="tasks-archive-note">
            <Archive size={16} />
            <div>
              <strong>Arquivadas ficam fora do seu dia.</strong>
              <p>Restaure quando fizer sentido retomar.</p>
            </div>
          </div>
        )}
        <div className="tasks-columns" aria-hidden="true">
          <span>Tarefa</span>
          <span>Área</span>
          <span>Prioridade</span>
          <span>Horário</span>
          <span />
        </div>
        {loading ? (
          <p className="tasks-loading" role="status">
            Carregando suas tarefas…
          </p>
        ) : (
          <>
            {filteredTasks.some((t) => t.id === focusedTaskId) && (
              <>
                <p className="tasks-group">EM FOCO</p>
                {filteredTasks.filter((t) => t.id === focusedTaskId).map(renderRow)}
              </>
            )}
            {filteredTasks.some((t) => t.id !== focusedTaskId) && (
              <>
                <p className="tasks-group">
                  {archived
                    ? 'ARQUIVADAS'
                    : statusFilters.includes('done')
                      ? 'FINALIZADAS'
                      : 'A FAZER'}
                </p>
                {filteredTasks.filter((t) => t.id !== focusedTaskId).map(renderRow)}
              </>
            )}
            {displayDone.length > 0 && (
              <>
                <p className="tasks-group">CONCLUÍDAS HOJE · {displayDone.length}</p>
                {displayDone.map(renderRow)}
              </>
            )}
            {!filteredTasks.length && !displayDone.length && (
              <EmptyState
                title={archived ? 'Nenhuma tarefa arquivada' : 'Tudo tranquilo por aqui'}
                description={
                  archived
                    ? 'As tarefas que você arquivar aparecem aqui e podem ser restauradas.'
                    : 'Crie uma tarefa ou escolha outro período para organizar o próximo passo.'
                }
                action="Nova tarefa"
                onAction={() => {
                  setEditTask(null)
                  setTaskModalOpen(true)
                }}
              />
            )}
          </>
        )}
      </motion.section>

      {isTaskModalOpen && (
        <CreateTaskModal
          open={true}
          onClose={() => {
            setTaskModalOpen(false)
            setEditTask(null)
          }}
          onSubmit={handleTaskSubmit}
          projectsOptions={projectOptions}
          initialData={editTask}
        />
      )}

      {isEventModalOpen && (
        <CreateEventModal
          open={true}
          onClose={() => setEventModalOpen(false)}
          onSubmit={async (data) => {
            await addEvent(data)
            setEventModalOpen(false)
          }}
          onDelete={null} // Nenhuma exclusão ao criar novo
        />
      )}

      <FlowDashboardModal open={showFlowDash} onClose={() => setShowFlowDash(false)} />

      <PomodoroConfigModal
        show={showPomodoroConfig}
        config={customConfig}
        onClose={() => setShowPomodoroConfig(false)}
        onSave={(newCfg) => {
          setCustomConfig(newCfg)
          setShowPomodoroConfig(false)
        }}
      />

      <TaskDetailDrawer
        tasks={tasks}
        task={activeDetailTask}
        projects={projects}
        goals={goals}
        mask={mask}
        onClose={() => setDetailTaskId(null)}
        onComplete={(id) => {
          withFeedback(() => toggleTaskCompletion(id))
          setDetailTaskId(null)
        }}
        onDelete={(task) => setDeleteTarget(task)}
        onArchive={(id) => {
          requestArchiveTask(id)
          setDetailTaskId(null)
        }}
        onRestore={(id) => {
          withFeedback(() => restoreTask(id))
          setDetailTaskId(null)
        }}
        onEdit={(task) => {
          setEditTask(task)
          setTaskModalOpen(true)
          setDetailTaskId(null)
        }}
      />
      {deleteTarget && (
        <ConfirmModal
          title="Excluir tarefa?"
          width={440}
          className="tasks-confirm-delete"
          message={
            <>
              Essa ação não pode ser desfeita. Se quiser só tirar da frente,{' '}
              <button
                type="button"
                className="tasks-confirm-delete__archive"
                onClick={() => {
                  requestArchiveTask(deleteTarget.id)
                  setDeleteTarget(null)
                }}
              >
                arquive em vez de excluir.
              </button>
            </>
          }
          icon={Trash2}
          confirmIcon={Trash2}
          confirmLabel="Excluir tarefa"
          danger
          onCancel={() => setDeleteTarget(null)}
          onConfirm={async () => {
            try {
              await deleteTask(deleteTarget.id)
              setDeleteTarget(null)
              setDetailTaskId(null)
            } catch (error) {
              notify({ title: 'Erro ao excluir tarefa', detail: error?.message, tone: 'danger' })
            }
          }}
        >
          <div className="tasks-confirm-delete__target">{mask(deleteTarget.title)}</div>
        </ConfirmModal>
      )}

      {pendingArchiveTask && (
        <ConfirmModal
          title="Arquivar tarefa?"
          message={`"${pendingArchiveTask.title}" será movida para Arquivadas. Você pode restaurá-la quando quiser e ela não conta no progresso do projeto enquanto estiver arquivada.`}
          confirmLabel="Arquivar"
          cancelLabel="Cancelar"
          onConfirm={() => withFeedback(handleConfirmArchive)}
          onCancel={() => setPendingArchiveTask(null)}
        />
      )}
    </div>
  )
}
