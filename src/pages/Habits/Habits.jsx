import { usePageActions } from '../../context/ShellContext.jsx'
import { useState, useMemo, useEffect, useRef } from 'react'
import { useApp } from '../../context/AppContext.jsx'
import CreateHabitModal from '../../components/CreateHabitModal/CreateHabitModal.jsx'
import { focusLogService } from '../../services/focusLogService.js'
import {
  localDateKey,
  isHabitActiveOnDate,
  getDayStats,
  getRangeStats,
  computeStreaks,
  getHabitConsistency,
  formatMinutes,
} from '../../utils/habitStats.js'
import {
  CATEGORIES,
  WEEKDAY_NAMES,
  getHabitIcon,
  TIMER_CATEGORY_LABEL,
} from './habitsMeta.js'
import HabitsStats from './HabitsStats.jsx'
import HabitDayModal from './HabitDayModal'
import HabitDetailModal from './HabitDetailModal.jsx'
import {
  Calendar,
  BarChart3,
  TrendingUp,
  Activity,
  Flame,
  Trash2,
} from 'lucide-react'

import './Habits.css'
import HabitOverview from './HabitOverview'
import HabitWeekView from './HabitWeekView'
import HabitMonthView from './HabitMonthView'
import HabitDailyChecklist, { HabitSequences } from './HabitDailyChecklist'
import { Segmented } from '../../components/ui/Tabs'
import EmptyState from '../../components/ui/EmptyState'
import SearchInput from '../../components/ui/SearchInput'
import CardHeader from '../../components/ui/CardHeader'
import Toast from '../../components/ui/Toast'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { useToast } from '../../components/ui/ToastProvider'
import { motion } from 'framer-motion'
import { useMotionPresets } from '../../components/ui/motion'

const VIEW_MODES = [
  { id: 'daily', label: 'Diário', icon: Calendar },
  { id: 'weekly', label: 'Semanal', icon: BarChart3 },
  { id: 'monthly', label: 'Mensal', icon: TrendingUp },
  { id: 'stats', label: 'Estatísticas', icon: Activity },
]

export default function Habits({ user, onNavigate, onLogout }) {
  const {
    prefs = {},
    habits = [],
    addHabit,
    updateHabit,
    deleteHabit,
    completeHabit,
    completeHabitForDate,
    syncTimerHabits,
  } = useApp()

  const notify = useToast()
  const presets = useMotionPresets()
  const [confirmHabit, setConfirmHabit] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const mask = (value) =>
    prefs.hideFinanceValues
      ? String(value || '').replace(
          /R\$\s*[\d.,]+(?:\s*(?:mil|milhões?|mi))?/gi,
          'R$ ••••'
        )
      : value
  // Ao abrir a aba, conclui automaticamente hábitos cuja meta de foco do dia já foi batida.
  useEffect(() => {
    if (habits?.length) syncTimerHabits?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [habits.length])

  const [viewMode, setViewMode] = useState('daily')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  const [detailHabitId, setDetailHabitId] = useState(null)

  // Estado para visualizações semanal/mensal
  const [selectedDate, setSelectedDate] = useState(null)
  const [showDayModal, setShowDayModal] = useState(false)

  // Estado para navegação do mês
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Tempo de foco de HOJE por categoria ({ work, study }) — alimenta o progresso
  // dos hábitos vinculados ao timer. localStorage não é reativo: atualiza no mount,
  // quando os hábitos mudam (pós-sync) e num intervalo de 60s.
  const [focusTotals, setFocusTotals] = useState(() =>
    focusLogService.getCategoryTotals(1)
  )
  useEffect(() => {
    const update = () => setFocusTotals(focusLogService.getCategoryTotals(1))
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [habits])

  // Habits com ícones e streaks SEMPRE derivados do histórico de conclusões
  const habitsWithMeta = useMemo(() => {
    return habits.map((habit) => {
      const { current, best } = computeStreaks(habit)
      return {
        ...habit,
        icon: getHabitIcon(habit.iconId || 'sparkles'),
        streak: current,
        bestStreakComputed: Math.max(best, habit.bestStreak || 0),
      }
    })
  }, [habits])

  // === FILTRAGEM ===
  const categoryFilteredHabits = useMemo(() => {
    return habitsWithMeta.filter(
      (h) => categoryFilter === 'all' || h.category === categoryFilter
    )
  }, [habitsWithMeta, categoryFilter])

  const filteredHabits = useMemo(() => {
    const today = new Date()
    return categoryFilteredHabits.filter((habit) => {
      const matchesSearch = (habit.label || habit.name || '')
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
      return matchesSearch && isHabitActiveOnDate(habit, today)
    })
  }, [categoryFilteredHabits, searchTerm])

  // Progresso de foco do dia para hábitos vinculados ao timer (null se não vinculado)
  const timerProgressOf = (habit) => {
    if (!habit.timerCategory || !habit.timerGoalMinutes) return null
    const got =
      habit.timerCategory === 'study' ? focusTotals.study : focusTotals.work
    return {
      got,
      goal: habit.timerGoalMinutes,
      pct: Math.min(1, got / habit.timerGoalMinutes),
      catLabel: TIMER_CATEGORY_LABEL[habit.timerCategory] || 'foco',
    }
  }

  // Ordenação inteligente do checklist: pendentes primeiro (hábitos de timer com
  // mais progresso no topo), concluídos por último.
  const dailyHabits = useMemo(() => {
    const todayKey = localDateKey()
    const progressOf = (h) => {
      if (!h.timerCategory || !h.timerGoalMinutes) return -1
      const got =
        h.timerCategory === 'study' ? focusTotals.study : focusTotals.work
      return Math.min(1, got / h.timerGoalMinutes)
    }
    return [...filteredHabits].sort((a, b) => {
      const aDone = a.completions?.includes(todayKey) ? 1 : 0
      const bDone = b.completions?.includes(todayKey) ? 1 : 0
      if (aDone !== bDone) return aDone - bDone
      return progressOf(b) - progressOf(a)
    })
  }, [filteredHabits, focusTotals])

  // === KPIs (sempre sobre TODOS os hábitos, independente de filtros) ===
  const kpis = useMemo(() => {
    const today = new Date()
    const day = getDayStats(habitsWithMeta, today)

    let topStreakHabit = null
    let bestEver = 0
    for (const h of habitsWithMeta) {
      if (!topStreakHabit || h.streak > topStreakHabit.streak)
        topStreakHabit = h
      bestEver = Math.max(bestEver, h.bestStreakComputed || 0)
    }

    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const week = getRangeStats(habitsWithMeta, weekStart, today)

    const topConsistent =
      getHabitConsistency(habitsWithMeta, 30).find((r) => r.rate !== null) ||
      null

    return { day, topStreakHabit, bestEver, week, topConsistent }
  }, [habitsWithMeta])

  // === CELEBRAÇÃO 100% ===
  const [showCelebration, setShowCelebration] = useState(false)
  const prevRateRef = useRef(kpis.day.rate)
  useEffect(() => {
    const prev = prevRateRef.current
    prevRateRef.current = kpis.day.rate
    if (
      kpis.day.scheduled > 0 &&
      kpis.day.rate === 1 &&
      prev !== null &&
      prev < 1
    ) {
      setShowCelebration(true)
      const t = setTimeout(() => setShowCelebration(false), 2600)
      return () => clearTimeout(t)
    }
  }, [kpis.day.rate, kpis.day.scheduled])

  // === CHECKLIST ===
  const toggleHabitCompletion = async (habitId) => {
    if (completeHabit) await completeHabit(habitId)
  }

  const isHabitComplete = (habit, dateStr) => {
    const list = Array.isArray(habit.completions)
      ? habit.completions
      : Array.isArray(habit.completed_dates)
        ? habit.completed_dates
        : []
    return list.includes(dateStr)
  }

  // Gera dados para a semana atual
  const weeklyData = useMemo(() => {
    const today = new Date()
    const currentDay = today.getDay()

    return WEEKDAY_NAMES.map((day, index) => {
      const date = new Date()
      date.setDate(date.getDate() + (index - currentDay))
      const dateStr = localDateKey(date)

      const activeHabitsForDay = habitsWithMeta.filter((h) =>
        isHabitActiveOnDate(h, date)
      )
      const completed = activeHabitsForDay.filter((habit) =>
        isHabitComplete(habit, dateStr)
      )
      const completion =
        activeHabitsForDay.length > 0
          ? completed.length / activeHabitsForDay.length
          : 0

      return {
        dayName: day,
        dayNumber: date.getDate(),
        dateString: dateStr,
        dateObj: new Date(date),
        completion,
        completedCount: completed.length,
        total: activeHabitsForDay.length,
        isToday: index === currentDay,
      }
    })
  }, [habitsWithMeta])

  // Gera calendário dinâmico para o mês
  const monthlyCalendar = useMemo(() => {
    const year = currentMonth.getFullYear()
    const month = currentMonth.getMonth()

    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const calendar = []
    let currentWeek = []

    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = localDateKey(date)

      const activeHabitsForDay = habitsWithMeta.filter((h) =>
        isHabitActiveOnDate(h, date)
      )
      const completed = activeHabitsForDay.filter((habit) =>
        isHabitComplete(habit, dateStr)
      )
      const completion =
        activeHabitsForDay.length > 0
          ? completed.length / activeHabitsForDay.length
          : 0

      currentWeek.push({
        day,
        dateString: dateStr,
        dateObj: date,
        completion,
        completedCount: completed.length,
        total: activeHabitsForDay.length,
        isToday: new Date().toDateString() === date.toDateString(),
      })

      if (currentWeek.length === 7) {
        calendar.push(currentWeek)
        currentWeek = []
      }
    }

    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) {
        currentWeek.push(null)
      }
      calendar.push(currentWeek)
    }

    return calendar
  }, [currentMonth, habitsWithMeta])

  // Dados do dia selecionado para o modal
  const selectedDayData = useMemo(() => {
    if (!selectedDate) return null

    const dateStr = localDateKey(selectedDate)
    const habitsForDay = habitsWithMeta
      .filter((h) => isHabitActiveOnDate(h, selectedDate))
      .map((h) => ({ ...h, isCompleted: isHabitComplete(h, dateStr) }))

    return {
      date: selectedDate,
      dateStr,
      habits: habitsForDay,
      completedCount: habitsForDay.filter((h) => h.isCompleted).length,
      total: habitsForDay.length,
    }
  }, [selectedDate, habitsWithMeta])

  const detailHabit = useMemo(
    () => habitsWithMeta.find((h) => h.id === detailHabitId) || null,
    [habitsWithMeta, detailHabitId]
  )

  // Handlers
  const handleDayClick = (dateObj) => {
    setSelectedDate(dateObj)
    setShowDayModal(true)
  }

  const handleAddHabit = () => {
    setEditingHabit(null)
    setShowModal(true)
  }

  const handleEditHabit = (habit) => {
    setEditingHabit(habit)
    setShowModal(true)
  }

  const handleSaveHabit = async (habitData) => {
    try {
      if (editingHabit) {
        await updateHabit(editingHabit.id, habitData)
      } else {
        await addHabit({ ...habitData, completions: [] })
      }
      setShowModal(false)
      setEditingHabit(null)
    } catch (error) {
      notify?.({
        title: 'Não foi possível salvar o hábito',
        detail: 'Tente novamente.',
        tone: 'danger',
      })
    }
  }

  const handleDeleteHabit = () => {
    if (editingHabit) setConfirmHabit(editingHabit)
  }
  const confirmDeleteHabit = async () => {
    if (!confirmHabit) return
    setDeleting(true)
    try {
      await deleteHabit(confirmHabit.id)
      setConfirmHabit(null)
      setShowModal(false)
      setEditingHabit(null)
      notify?.({ title: 'Hábito excluído' })
    } catch {
      notify?.({
        title: 'Não foi possível excluir o hábito',
        detail: 'Tente novamente.',
        tone: 'danger',
      })
    } finally {
      setDeleting(false)
    }
  }

  const navigateMonth = (direction) => {
    setCurrentMonth((prev) => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + direction)
      return newDate
    })
  }

  const monthStats = useMemo(() => {
    const now = new Date()
    return getRangeStats(
      habitsWithMeta,
      new Date(now.getFullYear(), now.getMonth(), 1),
      now
    )
  }, [habitsWithMeta])
  const todayKey = localDateKey()

  usePageActions({ label: 'Novo hábito', onClick: handleAddHabit })

  const filters = (
    <div className="habits-filters">
      {viewMode !== 'stats' && (
        <SearchInput
          label="Buscar hábitos"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          onClear={() => setSearchTerm('')}
        />
      )}
      <div className="habits-category-filters">
        {CATEGORIES.map((category) => (
          <button
            type="button"
            key={category.id}
            className={categoryFilter === category.id ? 'is-active' : ''}
            style={{ '--habit-color': category.color }}
            aria-pressed={categoryFilter === category.id}
            onClick={() => setCategoryFilter(category.id)}
          >
            {category.id !== 'all' && <i />}
            {category.label}
          </button>
        ))}
      </div>
    </div>
  )
  return (
    <div className="habitsPage habits-redesign">
      <motion.header
        className="habits-page-header"
        initial="hidden"
        animate="show"
        variants={presets.row}
      >
        <div>
          <h1>Hábitos</h1>
          <p>
            Pequenas vitórias todo dia. Os automáticos se marcam sozinhos pelo
            timer de foco.
          </p>
        </div>
        <Segmented
          label="Visualização dos hábitos"
          value={viewMode}
          onChange={setViewMode}
          options={VIEW_MODES.map((mode) => ({
            value: mode.id,
            label: mode.label,
          }))}
        />
      </motion.header>
      <motion.div initial="hidden" animate="show" variants={presets.grid}>
        <motion.div variants={presets.card}>
          <HabitOverview
            kpis={kpis}
            habits={habitsWithMeta}
            timerProgressOf={timerProgressOf}
            isComplete={isHabitComplete}
            todayKey={todayKey}
            monthStats={monthStats}
            onDetail={setDetailHabitId}
            onCreate={() => {
              setEditingHabit(null)
              setShowModal(true)
            }}
            onStats={() => setViewMode('stats')}
            mask={mask}
          />
        </motion.div>
        {habits.length === 0 ? (
          <motion.article className="habits-empty-card" variants={presets.card}>
            <CardHeader
              title={`Hoje · ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`}
              subtitle="Nenhum hábito criado ainda"
            />
            <EmptyState
              icon={Flame}
              title="Seu primeiro hábito começa aqui"
              description="Escolha algo que caiba no seu dia. A sequência aparece a partir do primeiro check."
            />
          </motion.article>
        ) : viewMode === 'daily' ? (
          <motion.div className="habits-daily-grid" variants={presets.card}>
            <HabitDailyChecklist
              habits={dailyHabits}
              todayKey={todayKey}
              timerProgressOf={timerProgressOf}
              isComplete={isHabitComplete}
              onToggle={toggleHabitCompletion}
              onDetail={setDetailHabitId}
              onEdit={handleEditHabit}
              filters={filters}
              onCreate={handleAddHabit}
              mask={mask}
            />
            <HabitSequences
              habits={habitsWithMeta}
              onDetail={setDetailHabitId}
              mask={mask}
            />
          </motion.div>
        ) : viewMode === 'weekly' ? (
          <motion.div
            className="habits-daily-grid habits-week-grid"
            variants={presets.card}
          >
            <HabitWeekView
              days={weeklyData}
              habits={habitsWithMeta}
              stats={kpis.week}
              onDayClick={handleDayClick}
              onCompleteDate={completeHabitForDate}
              isComplete={isHabitComplete}
              mask={mask}
            />
            <HabitSequences
              habits={habitsWithMeta}
              onDetail={setDetailHabitId}
              mask={mask}
            />
          </motion.div>
        ) : viewMode === 'monthly' ? (
          <motion.div
            className="habits-daily-grid habits-month-grid"
            variants={presets.card}
          >
            <HabitMonthView
              date={currentMonth}
              calendar={monthlyCalendar}
              onNavigateMonth={navigateMonth}
              onDayClick={handleDayClick}
            />
            <HabitSequences
              habits={habitsWithMeta}
              onDetail={setDetailHabitId}
              mask={mask}
            />
          </motion.div>
        ) : (
          <>
            {categoryFilter !== 'all' && (
              <div className="habits-stats-active-filter">{filters}</div>
            )}
            <HabitsStats
              habits={categoryFilteredHabits}
              onOpenDetail={setDetailHabitId}
              onDayClick={handleDayClick}
              mask={mask}
            />
          </>
        )}
      </motion.div>
      {showModal && (
        <CreateHabitModal
          habit={editingHabit}
          onClose={() => {
            setShowModal(false)
            setEditingHabit(null)
          }}
          onSubmit={handleSaveHabit}
          onDelete={editingHabit ? handleDeleteHabit : undefined}
        />
      )}
      {detailHabit && (
        <HabitDetailModal
          habit={detailHabit}
          mask={mask}
          onToggleToday={() => toggleHabitCompletion(detailHabit.id)}
          onDelete={() => {
            setConfirmHabit(detailHabit)
            setDetailHabitId(null)
          }}
          timerProgress={timerProgressOf(detailHabit)}
          onClose={() => setDetailHabitId(null)}
          onEdit={() => {
            setDetailHabitId(null)
            handleEditHabit(detailHabit)
          }}
        />
      )}
      {confirmHabit && (
        <ConfirmModal
          title="Excluir hábito?"
          width={440}
          className="habit-delete-modal"
          icon={Trash2}
          confirmIcon={Trash2}
          message={`O histórico vai junto: ${(confirmHabit.completions || []).length} conclusões e a sequência de ${confirmHabit.streak || 0} dias. Não dá para desfazer.`}
          confirmLabel="Excluir hábito"
          danger
          pending={deleting}
          onCancel={() => setConfirmHabit(null)}
          onConfirm={confirmDeleteHabit}
        >
          <div className="habit-delete-name">
            {mask(confirmHabit.label || confirmHabit.name)}
          </div>
        </ConfirmModal>
      )}
      {showDayModal && selectedDayData && (
        <HabitDayModal
          day={selectedDayData}
          onClose={() => setShowDayModal(false)}
          onCompleteDate={completeHabitForDate}
          mask={mask}
        />
      )}
      {showCelebration && (
        <div className="habits-celebration-toast">
          <Toast
            title="Dia completo!"
            detail="Todos os hábitos de hoje foram concluídos."
            onClose={() => setShowCelebration(false)}
          />
        </div>
      )}
    </div>
  )
}
