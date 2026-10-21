import { usePageActions } from '../../context/ShellContext.jsx'
import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import ChatbotCard from '../../components/ChatbotCard/ChatbotCard.jsx'
import ProductivityCard from '../../components/ProductivityCard/ProductivityCard.jsx'
import CalendarCard from '../../components/CalendarCard/CalendarCard.jsx'
import CreateTaskModal from '../../components/CreateTaskModal/CreateTaskModal.jsx'
import CreateEventModal from '../../components/CreateEventModal/CreateEventModal.jsx'
import { Calendar, CheckCircle2 } from 'lucide-react'

import { motion } from 'framer-motion'
import StreakPill from '../../components/ui/StreakPill.jsx'
import ConfirmModal from '../../components/ui/ConfirmModal.jsx'
import Button from '../../components/ui/Button.jsx'
import { useToast } from '../../components/ui/ToastProvider.jsx'
import { useMotionPresets } from '../../components/ui/motion'
import useFocusTimer from '../../hooks/useFocusTimer'
import {
  localDateKey,
  isHabitActiveOnDate,
  isHabitDoneOn,
  computeStreaks,
  formatMinutes,
} from '../../utils/habitStats'
import { buildLessonContextMap } from '../../utils/studyMetrics'
import { categorizeTask } from '../../utils/taskCategory'
import { normalizeTaskStatus } from '../../utils/taskStatus'
import { focusLogService } from '../../services/focusLogService'
import { FocusHero, TodayTasks, TodayHabits, AgendaCard, FocusGoals } from './DashboardCards'
import { calendarDayKey } from './dashboardPresentation'
import './Dashboard.css'

export default function Dashboard({ onNavigate, onLogout, user }) {
  // Garantimos valores padrão vazios caso o contexto falhe momentaneamente
  const {
    tasks = [],
    projects = [],
    goals = [],
    habits = [],
    finances = [],
    events = [],
    loading,
    addTask,
    addEvent,
    updateEvent,
    deleteEvent,
    updateTask,
    completeHabit,
    studies = [],
    syncTimerHabits,
    userId,
    prefs = {},
  } = useApp()

  const [isTaskModalOpen, setTaskModalOpen] = useState(false)
  const [isEventModalOpen, setEventModalOpen] = useState(false)

  // Estado para edição de evento
  const [editingEvent, setEditingEvent] = useState(null)

  // 1. CAMADA DE SEGURANÇA (FIREWALL DE DADOS)
  // Normaliza os hábitos para garantir que arrays existam, evitando erros visuais
  const safeHabits = useMemo(() => {
    if (!Array.isArray(habits)) return []

    return habits.map((h) => {
      // O serviço novo usa 'completions', o antigo usava 'completed_dates'
      // Vamos garantir que AMBOS existam e sejam arrays
      const datesArray = Array.isArray(h.completions)
        ? h.completions
        : Array.isArray(h.completed_dates)
          ? h.completed_dates
          : []

      return {
        ...h,
        completions: datesArray, // Novo padrão
        completed_dates: datesArray, // Compatibilidade com código legado
        current_streak: h.currentStreak || h.current_streak || 0, // Garante streak numérico
      }
    })
  }, [habits])

  const kpis = useMemo(() => {
    const now = new Date()

    const dayKeyOf = (date) => {
      const off = date.getTimezoneOffset()
      return new Date(date.getTime() - off * 60000).toISOString().split('T')[0]
    }

    // Campos de CALENDÁRIO (due_date): a data literal da string é a intenção
    const toDayKey = (value) => {
      if (!value) return null
      const s = String(value)
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
      const d = new Date(s)
      return Number.isNaN(d.getTime()) ? null : dayKeyOf(d)
    }

    // Campos de TIMESTAMP (completed_at/updated_at): sempre o dia LOCAL do instante
    const tsKey = (value) => {
      if (!value) return null
      const d = new Date(value)
      return Number.isNaN(d.getTime()) ? null : dayKeyOf(d)
    }

    const todayKey = dayKeyOf(now)

    // Últimos 7 dias (para os mini-gráficos dos KPIs)
    const last7 = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      last7.push({
        key: dayKeyOf(d),
        label: d.toLocaleDateString('pt-BR', {
          weekday: 'short',
          day: 'numeric',
        }),
      })
    }

    // Início da semana (domingo)
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weekStartKey = dayKeyOf(weekStart)

    const safeTasks = (Array.isArray(tasks) ? tasks : []).filter((t) => t.status !== 'archived')
    const isDone = (t) => t.completed || t.status === 'done'
    // Data de conclusão real quando existe; updated_at só como fallback legado
    const doneKey = (t) => tsKey(t.completed_at || t.updated_at || t.created_at)

    // 1. TAREFAS DE HOJE (agendadas para hoje, feitas ou não)
    const tasksTodayAll = safeTasks.filter((t) => toDayKey(t.due_date) === todayKey)
    const totalToday = tasksTodayAll.length

    // 2. PENDENTES HOJE
    const pendingToday = tasksTodayAll.filter((t) => !isDone(t)).length

    // 3. FINALIZADAS NA SEMANA (desde domingo)
    const doneWeek = safeTasks.filter((t) => {
      if (!isDone(t)) return false
      const k = doneKey(t)
      return k && k >= weekStartKey
    }).length

    // Mini-gráficos: últimos 7 dias
    const trendToday = last7.map(({ key, label }) => ({
      label,
      value: safeTasks.filter((t) => toDayKey(t.due_date) === key).length,
    }))
    const trendPending = last7.map(({ key, label }) => ({
      label,
      value: safeTasks.filter((t) => toDayKey(t.due_date) === key && !isDone(t)).length,
    }))
    const trendDone = last7.map(({ key, label }) => ({
      label,
      value: safeTasks.filter((t) => isDone(t) && doneKey(t) === key).length,
    }))

    // Streak dos hábitos
    const streakDays = safeHabits.reduce((max, habit) => {
      return Math.max(max, habit.current_streak || 0)
    }, 0)

    return {
      totalToday,
      pendingToday,
      doneWeek,
      streakDays,
      trendToday,
      trendPending,
      trendDone,
    }
  }, [tasks, safeHabits])

  const handleEditEvent = (event) => {
    setEditingEvent(event)
    setEventModalOpen(true)
  }

  const handleEventSubmit = async (data) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, data)
    } else {
      await addEvent(data)
    }
    setEventModalOpen(false)
    setEditingEvent(null)
  }

  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busy, setBusy] = useState(null)
  const notify = useToast()
  const presets = useMotionPresets()
  const today = localDateKey()
  const lessonCtxMap = useMemo(() => buildLessonContextMap(studies), [studies])
  const timer = useFocusTimer({
    tasks,
    lessonCtxMap,
    updateTask,
    syncTimerHabits,
    userId,
  })
  const [focusTotals, setFocusTotals] = useState(() => focusLogService.getCategoryTotals(1))
  useEffect(() => {
    const refresh = () => setFocusTotals(focusLogService.getCategoryTotals(1))
    refresh()
    const interval = setInterval(refresh, 60000)
    return () => clearInterval(interval)
  }, [habits, tasks])
  const activeTasks = tasks.filter((t) => t.status !== 'archived')
  const isDone = (t) => t.completed || t.status === 'done'
  const tasksToday = activeTasks.filter((t) => calendarDayKey(t.due_date) === today)
  const overdue = activeTasks.filter(
    (t) => !isDone(t) && t.due_date && calendarDayKey(t.due_date) < today
  )
  const todayHabits = safeHabits.filter((h) => isHabitActiveOnDate(h, new Date()))
  const habitsDone = todayHabits.filter((h) => isHabitDoneOn(h, today)).length
  const closed =
    tasksToday.length > 0 &&
    tasksToday.every(isDone) &&
    habitsDone === todayHabits.length &&
    overdue.length === 0
  const focusTask = timer.focusedTaskData || tasksToday.find((t) => !isDone(t)) || overdue[0]
  const focusProject = projects.find(
    (p) => p.id === (focusTask?.projectId || focusTask?.project_id)
  )
  const focusGoal = goals.find((g) => g.id === (focusProject?.goalId || focusProject?.goal_id))
  const focusMinutes = focusLogService.getTimeForDate(today)
  const mask = (value) =>
    prefs.hideFinanceValues
      ? String(value || '').replace(/R\$\s*[\d.,]+(?:\s*(?:mil|milhões?|mi))?/gi, 'R$ ••••')
      : value
  const perform = async (id, action) => {
    if (busy) return
    setBusy(id)
    try {
      await action()
    } catch (error) {
      notify?.({
        title: 'Não foi possível salvar',
        detail: error?.message || 'Tente novamente.',
        tone: 'danger',
      })
    } finally {
      setBusy(null)
    }
  }
  const toggleTask = (taskId) =>
    perform(taskId, async () => {
      const task = tasks.find((t) => t.id === taskId)
      if (!task) return
      const newCompleted = !task.completed
      const currentStatus = normalizeTaskStatus(task)
      const statusToRestore = currentStatus === 'done' ? 'todo' : currentStatus
      const completedAt = newCompleted ? new Date().toISOString() : null
      if (newCompleted && timer.focusedTaskId === taskId) {
        if (timer.isRunning) timer.toggleTimer()
        timer.setFocusedTaskId(null)
      }
      await updateTask(taskId, {
        completed: newCompleted,
        status: newCompleted ? 'done' : statusToRestore,
        completed_at: completedAt,
        updated_at: new Date().toISOString(),
      })
    })
  const handleDeleteEvent = () => setConfirmDelete(true)
  const deleteConfirmed = () =>
    perform('event-delete', async () => {
      await deleteEvent(editingEvent.id)
      setConfirmDelete(false)
      setEventModalOpen(false)
      setEditingEvent(null)
    })
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Bom dia' : hour < 18 ? 'Boa tarde' : 'Boa noite'
  const summary = overdue.length
    ? `${overdue.length} tarefa${overdue.length === 1 ? ' ficou' : 's ficaram'} para trás. Leve para hoje ou escolha outra data.`
    : closed
      ? 'Tudo o que você planejou para hoje está feito.'
      : tasksToday.length
        ? `${tasksToday.length - kpis.pendingToday} de ${tasksToday.length} tarefas feitas · ${formatMinutes(focusMinutes)} de foco hoje`
        : 'Seu dia está livre. Escolha por onde começar.'

  usePageActions({
    options: [
      {
        label: 'Nova tarefa',
        icon: CheckCircle2,
        onClick: () => setTaskModalOpen(true),
      },
      {
        label: 'Novo evento',
        icon: Calendar,
        onClick: () => {
          setEditingEvent(null)
          setEventModalOpen(true)
        },
      },
    ],
  })

  return (
    <div className="dash home-dashboard">
      <motion.header
        className="home-welcome"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, delay: presets.reduce ? 0 : 0.15 }}
      >
        <h1>
          {greeting}
          {user?.name ? `, ${user.name.trim().split(' ')[0]}` : ''}
        </h1>
        <div className="home-welcome__summary">
          <p>{loading ? 'Sincronizando seus dados…' : summary}</p>
          <StreakPill
            days={kpis.streakDays}
            record={safeHabits.reduce(
              (max, h) => Math.max(max, computeStreaks(h).best, h.bestStreak || 0),
              0
            )}
          />
          {overdue.length > 0 && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => onNavigate('Tarefas', { initialFilter: 'late' })}
            >
              Replanejar
            </Button>
          )}
        </div>
      </motion.header>
      {loading ? (
        <div className="home-loading" role="status">
          Sincronizando seus dados…
        </div>
      ) : (
        <motion.div className="home-grid" variants={presets.grid} initial="hidden" animate="show">
          <motion.div className="home-slot home-slot--hero" variants={presets.card}>
            <FocusHero
              timer={timer}
              task={focusTask}
              project={focusProject}
              goal={focusGoal}
              closed={closed}
              total={tasksToday.length}
              habitsDone={habitsDone}
              habitsTotal={todayHabits.length}
              streak={kpis.streakDays}
              focusMinutes={
                closed
                  ? focusMinutes
                  : focusTotals[focusTask ? categorizeTask(focusTask) : 'work'] || 0
              }
              focusLabel={
                focusTask && categorizeTask(focusTask) === 'study'
                  ? 'de estudos hoje'
                  : 'de trabalho focado hoje'
              }
              unscheduled={activeTasks.filter((t) => !isDone(t) && !t.due_date).length}
              onCreate={() => setTaskModalOpen(true)}
              onNavigate={onNavigate}
              onComplete={toggleTask}
              mask={mask}
            />
          </motion.div>
          <motion.div className="home-slot home-slot--focus" variants={presets.card}>
            <ProductivityCard tasks={tasks} redesign />
          </motion.div>
          <motion.div className="home-slot home-slot--tasks" variants={presets.card}>
            <TodayTasks
              tasks={tasksToday}
              overdue={overdue}
              today={today}
              focusedId={focusTask?.id}
              projects={projects}
              onComplete={toggleTask}
              onFocus={timer.handleFocusTask}
              onMove={(id, date) =>
                perform(id, () =>
                  updateTask(id, {
                    due_date: date,
                    updated_at: new Date().toISOString(),
                  })
                )
              }
              onNavigate={onNavigate}
              onCreate={() => setTaskModalOpen(true)}
              busy={busy}
            />
          </motion.div>
          <motion.div className="home-slot home-slot--habits" variants={presets.card}>
            <TodayHabits
              habits={todayHabits}
              today={today}
              focusTotals={focusTotals}
              onComplete={(id) => perform(id, () => completeHabit(id))}
              onNavigate={onNavigate}
              busy={busy}
            />
          </motion.div>
          <motion.div className="home-slot home-slot--agenda" variants={presets.card}>
            <AgendaCard
              events={events}
              today={today}
              onEdit={handleEditEvent}
              onCreate={() => {
                setEditingEvent(null)
                setEventModalOpen(true)
              }}
            />
          </motion.div>
          <motion.div className="home-slot home-slot--goals" variants={presets.card}>
            <FocusGoals
              goals={goals}
              projects={projects}
              tasks={tasks}
              onNavigate={onNavigate}
              mask={mask}
            />
          </motion.div>
          <motion.div className="home-slot home-slot--calendar" variants={presets.card}>
            <CalendarCard
              tasks={tasks}
              habits={safeHabits}
              finances={finances}
              events={events}
              onEditEvent={handleEditEvent}
              redesign
              hideValues={prefs.hideFinanceValues}
            />
          </motion.div>
          <motion.div className="home-slot home-slot--chat" variants={presets.card}>
            <ChatbotCard user={user} onOpenFlowChat={() => onNavigate('FlowChat')} />
          </motion.div>
        </motion.div>
      )}
      {confirmDelete && (
        <ConfirmModal
          title="Excluir evento?"
          message="Este evento será excluído da sua agenda."
          danger
          confirmLabel="Excluir evento"
          pending={busy === 'event-delete'}
          onConfirm={deleteConfirmed}
          onCancel={() => setConfirmDelete(false)}
        />
      )}

      {isTaskModalOpen && (
        <CreateTaskModal
          open={true}
          onClose={() => setTaskModalOpen(false)}
          onSubmit={async (data) => {
            await addTask(data)
            setTaskModalOpen(false)
          }}
          projectsOptions={projects.map((p) => ({ id: p.id, label: p.title }))}
        />
      )}

      {isEventModalOpen && (
        <CreateEventModal
          open={true}
          onClose={() => {
            setEventModalOpen(false)
            setEditingEvent(null)
          }}
          onSubmit={handleEventSubmit}
          onDelete={handleDeleteEvent}
          initialData={editingEvent}
        />
      )}
    </div>
  )
}
