import { useState, useMemo, useEffect, useRef } from 'react'
import TopNav from '../../components/TopNav/TopNav.jsx'
import { useApp } from '../../context/AppContext.jsx'
import CreateHabitModal from '../../components/CreateHabitModal/CreateHabitModal.jsx'
import FloatingCreateButton from '../../components/FloatingCreateButton/FloatingCreateButton.jsx'
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
import { CATEGORIES, WEEKDAY_NAMES, getHabitIcon, TIMER_CATEGORY_LABEL } from './habitsMeta.js'
import HabitsStats from './HabitsStats.jsx'
import HabitDetailModal from './HabitDetailModal.jsx'
import {
  Calendar,
  BarChart3,
  TrendingUp,
  Activity,
  Search,
  Plus,
  Edit2,
  Check,
  X,
  Zap,
  Flame,
  CheckCircle2,
  Trophy,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

import './Habits.css'
import './HabitsStats.css'

const VIEW_MODES = [
  { id: 'daily', label: 'Diário', icon: Calendar },
  { id: 'weekly', label: 'Semanal', icon: BarChart3 },
  { id: 'monthly', label: 'Mensal', icon: TrendingUp },
  { id: 'stats', label: 'Estatísticas', icon: Activity },
]

export default function Habits({ user, onNavigate, onLogout }) {
  const { habits, addHabit, updateHabit, deleteHabit, completeHabit, completeHabitForDate, syncTimerHabits } = useApp()

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
  const [focusTotals, setFocusTotals] = useState(() => focusLogService.getCategoryTotals(1))
  useEffect(() => {
    const update = () => setFocusTotals(focusLogService.getCategoryTotals(1))
    update()
    const id = setInterval(update, 60000)
    return () => clearInterval(id)
  }, [habits])

  // Habits com ícones e streaks SEMPRE derivados do histórico de conclusões
  const habitsWithMeta = useMemo(() => {
    return habits.map(habit => {
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
    return habitsWithMeta.filter(h => categoryFilter === 'all' || h.category === categoryFilter)
  }, [habitsWithMeta, categoryFilter])

  const filteredHabits = useMemo(() => {
    const today = new Date()
    return categoryFilteredHabits.filter((habit) => {
      const matchesSearch = (habit.label || habit.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      return matchesSearch && isHabitActiveOnDate(habit, today)
    })
  }, [categoryFilteredHabits, searchTerm])

  // Progresso de foco do dia para hábitos vinculados ao timer (null se não vinculado)
  const timerProgressOf = (habit) => {
    if (!habit.timerCategory || !habit.timerGoalMinutes) return null
    const got = habit.timerCategory === 'study' ? focusTotals.study : focusTotals.work
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
      const got = h.timerCategory === 'study' ? focusTotals.study : focusTotals.work
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
      if (!topStreakHabit || h.streak > topStreakHabit.streak) topStreakHabit = h
      bestEver = Math.max(bestEver, h.bestStreakComputed || 0)
    }

    const weekStart = new Date(today)
    weekStart.setDate(weekStart.getDate() - weekStart.getDay())
    const week = getRangeStats(habitsWithMeta, weekStart, today)

    const topConsistent = getHabitConsistency(habitsWithMeta, 30).find(r => r.rate !== null) || null

    return { day, topStreakHabit, bestEver, week, topConsistent }
  }, [habitsWithMeta])

  // === CELEBRAÇÃO 100% ===
  const [showCelebration, setShowCelebration] = useState(false)
  const prevRateRef = useRef(kpis.day.rate)
  useEffect(() => {
    const prev = prevRateRef.current
    prevRateRef.current = kpis.day.rate
    if (kpis.day.scheduled > 0 && kpis.day.rate === 1 && prev !== null && prev < 1) {
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
      : (Array.isArray(habit.completed_dates) ? habit.completed_dates : [])
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

      const activeHabitsForDay = habitsWithMeta.filter(h => isHabitActiveOnDate(h, date))
      const completed = activeHabitsForDay.filter(habit => isHabitComplete(habit, dateStr))
      const completion = activeHabitsForDay.length > 0 ? completed.length / activeHabitsForDay.length : 0

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

      const activeHabitsForDay = habitsWithMeta.filter(h => isHabitActiveOnDate(h, date))
      const completed = activeHabitsForDay.filter(habit => isHabitComplete(habit, dateStr))
      const completion = activeHabitsForDay.length > 0 ? completed.length / activeHabitsForDay.length : 0

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
      .filter(h => isHabitActiveOnDate(h, selectedDate))
      .map(h => ({ ...h, isCompleted: isHabitComplete(h, dateStr) }))

    return {
      date: selectedDate,
      dateStr,
      habits: habitsForDay,
      completedCount: habitsForDay.filter(h => h.isCompleted).length,
      total: habitsForDay.length,
    }
  }, [selectedDate, habitsWithMeta])

  const detailHabit = useMemo(
    () => habitsWithMeta.find(h => h.id === detailHabitId) || null,
    [habitsWithMeta, detailHabitId],
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
      alert('Erro ao salvar hábito')
    }
  }

  const handleDeleteHabit = async () => {
    if (!editingHabit) return
    if (confirm('Tem certeza que deseja excluir este hábito?')) {
      try {
        await deleteHabit(editingHabit.id)
        setShowModal(false)
        setEditingHabit(null)
      } catch (error) {
        console.error(error)
        alert('Erro ao excluir')
      }
    }
  }

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + direction)
      return newDate
    })
  }

  // Função para obter cor baseada no progresso
  const getProgressColor = (completion) => {
    if (completion >= 0.8) return '#10b981' // Verde
    if (completion >= 0.5) return '#f59e0b' // Amarelo
    if (completion > 0) return '#ef4444' // Vermelho
    return '#e5e7eb' // Cinza
  }

  const todayKey = localDateKey()

  return (
    <div className="habitsPage">
      <TopNav user={user} active="Hábitos" onNavigate={onNavigate} onLogout={onLogout} />

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

      {/* Modal de Detalhe de um Hábito */}
      {detailHabit && (
        <HabitDetailModal
          habit={detailHabit}
          timerProgress={timerProgressOf(detailHabit)}
          onClose={() => setDetailHabitId(null)}
          onEdit={() => {
            setDetailHabitId(null)
            handleEditHabit(detailHabit)
          }}
        />
      )}

      {/* Celebração ao fechar 100% do dia */}
      {showCelebration && (
        <div className="habitsCelebration" role="status">
          <div className="habitsCelebration__card">
            <span className="habitsCelebration__emoji">🎉</span>
            <strong>Dia completo!</strong>
            <span>Todos os hábitos de hoje foram concluídos</span>
          </div>
        </div>
      )}

      {/* Modal de Detalhes do Dia */}
      {showDayModal && selectedDayData && (
        <div className="dayModal">
          <div className="dayModal__backdrop" onClick={() => setShowDayModal(false)} />
          <div className="dayModal__panel">
            <header className="dayModal__header">
              <div>
                <h3>{selectedDayData.date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</h3>
                <p>{selectedDayData.completedCount} de {selectedDayData.total} hábitos concluídos</p>
              </div>
              <button className="dayModal__close" onClick={() => setShowDayModal(false)}>
                <X size={20} />
              </button>
            </header>

            <div className="dayModal__content">
              {selectedDayData.habits.length === 0 ? (
                <div className="dayModal__empty">
                  <p>Nenhum hábito programado para este dia.</p>
                </div>
              ) : (
                <ul className="dayModal__list">
                  {selectedDayData.habits.map(habit => {
                    const IconComponent = habit.icon
                    const category = CATEGORIES.find(c => c.id === habit.category)

                    return (
                      <li
                        key={habit.id}
                        className={`dayModal__item ${habit.isCompleted ? 'dayModal__item--completed' : ''}`}
                        onClick={() => {
                          if (selectedDayData?.dateStr) {
                            completeHabitForDate(habit.id, selectedDayData.dateStr)
                          }
                        }}
                        style={{ cursor: 'pointer' }}
                        title="Clique para marcar/desmarcar"
                      >
                        <div className="dayModal__itemIcon" style={{ backgroundColor: category?.color || '#ff4800' }}>
                          <IconComponent size={18} />
                        </div>
                        <div className="dayModal__itemContent">
                          <span className="dayModal__itemLabel">{habit.label || habit.name}</span>
                          {habit.focus && <span className="dayModal__itemFocus">{habit.focus}</span>}
                        </div>
                        <div className={`dayModal__itemStatus ${habit.isCompleted ? 'completed' : 'pending'}`}>
                          {habit.isCompleted ? (
                            <><Check size={14} /> Concluído</>
                          ) : (
                            <><X size={14} /> Pendente</>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="habitsWrapper">
        {/* KPI Strip — pulso do dia, visível em todas as views */}
        <section className="habitsKpis">
          <article className="habitsKpis__card">
            <span className="habitsKpis__label"><CheckCircle2 size={14} /> Hoje</span>
            <span className="habitsKpis__value">
              {kpis.day.scheduled > 0 ? `${kpis.day.completed}/${kpis.day.scheduled}` : '—'}
            </span>
            <span className="habitsKpis__sub">
              {kpis.day.rate !== null ? `${Math.round(kpis.day.rate * 100)}% concluído` : 'sem hábitos hoje'}
            </span>
            <div className="habitsKpis__bar">
              <span style={{ width: `${Math.round((kpis.day.rate || 0) * 100)}%` }} />
            </div>
          </article>

          <article className="habitsKpis__card">
            <span className="habitsKpis__label"><Flame size={14} /> Sequência ativa</span>
            <span className="habitsKpis__value">
              {kpis.topStreakHabit && kpis.topStreakHabit.streak > 0
                ? `${kpis.topStreakHabit.streak} ${kpis.topStreakHabit.streak === 1 ? 'dia' : 'dias'}`
                : '—'}
            </span>
            <span className="habitsKpis__sub">
              {kpis.topStreakHabit && kpis.topStreakHabit.streak > 0
                ? (kpis.topStreakHabit.label || kpis.topStreakHabit.name)
                : 'comece hoje 🔥'}
              {kpis.bestEver > 0 && ` · recorde: ${kpis.bestEver}`}
            </span>
          </article>

          <article className="habitsKpis__card">
            <span className="habitsKpis__label"><TrendingUp size={14} /> Semana</span>
            <span className="habitsKpis__value">
              {kpis.week.rate !== null ? `${Math.round(kpis.week.rate * 100)}%` : '—'}
            </span>
            <span className="habitsKpis__sub">
              {kpis.week.scheduled > 0
                ? `${kpis.week.completed} de ${kpis.week.scheduled} conclusões`
                : 'sem hábitos na semana'}
            </span>
          </article>

          <article
            className={`habitsKpis__card ${kpis.topConsistent ? 'habitsKpis__card--clickable' : ''}`}
            onClick={() => kpis.topConsistent && setDetailHabitId(kpis.topConsistent.id)}
            title={kpis.topConsistent ? 'Ver detalhes do hábito' : undefined}
          >
            <span className="habitsKpis__label"><Trophy size={14} /> Mais consistente · 30d</span>
            <span className="habitsKpis__value">
              {kpis.topConsistent ? `${Math.round(kpis.topConsistent.rate * 100)}%` : '—'}
            </span>
            <span className="habitsKpis__sub">
              {kpis.topConsistent ? kpis.topConsistent.label : 'sem dados ainda'}
            </span>
          </article>
        </section>

        {/* Controles e Filtros */}
        <section className="habitsControls">
          <div className="habitsControls__modes">
            {VIEW_MODES.map((mode) => {
              const IconComponent = mode.icon
              return (
                <button
                  key={mode.id}
                  type="button"
                  className={`modeBtn ${viewMode === mode.id ? 'modeBtn--active' : ''}`}
                  onClick={() => setViewMode(mode.id)}
                >
                  <IconComponent className="modeBtn__icon" size={18} />
                  <span className="modeBtn__label">{mode.label}</span>
                </button>
              )
            })}
          </div>

          <div className="habitsControls__filters">
            {viewMode !== 'stats' && (
              <div className="searchBox">
                <Search className="searchBox__icon" size={16} />
                <input
                  type="text"
                  placeholder="Buscar hábitos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            <div className="categoryFilters">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={`categoryBtn ${categoryFilter === cat.id ? 'categoryBtn--active' : ''}`}
                  style={/** @type {any} */ ({ '--cat-color': cat.color })}
                  onClick={() => setCategoryFilter(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Board de Conteúdo */}
        <section className="habitsBoard">

          {/* VISUALIZAÇÃO DIÁRIA */}
          {viewMode === 'daily' && (
            <div className="habitsDaily">
              <div className="dailyHeader">
                <div>
                  <h3>Hoje · {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</h3>
                  <p>Checklist diário dos seus hábitos</p>
                </div>
                <button type="button" className="btnPrimary" onClick={handleAddHabit}>
                  <Plus size={18} strokeWidth={2.5} />
                  <span>Adicionar hábito</span>
                </button>
              </div>

              <div className="dailyChecklist">
                {dailyHabits.length === 0 ? (
                  <div className="habitsEmpty">
                    <p>Nenhum hábito programado para hoje.</p>
                  </div>
                ) : (
                  dailyHabits.map((habit) => {
                    const category = CATEGORIES.find(c => c.id === habit.category)
                    const IconComponent = habit.icon
                    const isChecked = isHabitComplete(habit, todayKey)
                    const timer = timerProgressOf(habit)

                    return (
                      <div
                        key={habit.id}
                        className={`dailyCheckItem ${isChecked ? 'dailyCheckItem--checked' : ''}`}
                        style={/** @type {any} */ ({ '--item-color': category?.color || '#ff4800' })}
                      >
                        <div className="dailyCheckItem__checkbox">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleHabitCompletion(habit.id)}
                          />
                        </div>

                        <div
                          className="dailyCheckItem__content"
                          onClick={() => setDetailHabitId(habit.id)}
                        >
                          <div className="dailyCheckItem__main">
                            <IconComponent className="dailyCheckItem__icon" size={20} strokeWidth={2} />
                            <span className="dailyCheckItem__label">{habit.label || habit.name}</span>
                            {habit.focus && <span className="dailyCheckItem__focus">{habit.focus}</span>}
                            {timer && (
                              <span className="habitAuto" title="Concluído automaticamente pelo timer de foco">
                                <Zap size={11} /> auto
                              </span>
                            )}
                          </div>

                          {timer && !isChecked && (
                            <div className="dailyCheckItem__timer">
                              <div className="dailyCheckItem__timerBar">
                                <span
                                  className="dailyCheckItem__timerFill"
                                  style={{ width: `${Math.round(timer.pct * 100)}%` }}
                                />
                              </div>
                              <span className="dailyCheckItem__timerText">
                                {formatMinutes(timer.got)} / {formatMinutes(timer.goal)} de {timer.catLabel}
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="dailyCheckItem__actions">
                          <span className="dailyCheckItem__streak">🔥 {habit.streak}</span>
                          <button className="iconBtn" onClick={() => handleEditHabit(habit)}>
                            <Edit2 size={16} />
                          </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {/* VISUALIZAÇÃO SEMANAL - REDESIGNED */}
          {viewMode === 'weekly' && (
            <div className="habitsWeeklyNew">
              <header className="habitsWeeklyNew__header">
                <h3>Semana Atual</h3>
                <p>Clique em um dia para ver detalhes</p>
              </header>

              <div className="habitsWeeklyNew__grid">
                {weeklyData.map((slot) => {
                  const progressPercent = Math.round(slot.completion * 100)
                  return (
                    <button
                      key={slot.dateString}
                      className={`weekDayCard ${slot.isToday ? 'weekDayCard--today' : ''}`}
                      onClick={() => handleDayClick(slot.dateObj)}
                    >
                      <div className="weekDayCard__header">
                        <span className="weekDayCard__name">{slot.dayName}</span>
                        <span className="weekDayCard__number">{slot.dayNumber}</span>
                      </div>

                      <div className="weekDayCard__ring" style={{
// @ts-ignore
                      '--progress': progressPercent }}>
                        <svg viewBox="0 0 36 36">
                          <path
                            className="weekDayCard__ringBg"
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                          />
                          <path
                            className="weekDayCard__ringFill"
                            strokeDasharray={`${progressPercent}, 100`}
                            d="M18 2.0845
                              a 15.9155 15.9155 0 0 1 0 31.831
                              a 15.9155 15.9155 0 0 1 0 -31.831"
                            style={{ stroke: getProgressColor(slot.completion) }}
                          />
                        </svg>
                        <span className="weekDayCard__percent">{progressPercent}%</span>
                      </div>

                      <div className="weekDayCard__stats">
                        <span>{slot.completedCount}/{slot.total}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* VISUALIZAÇÃO MENSAL - REDESIGNED */}
          {viewMode === 'monthly' && (
            <div className="habitsMonthlyNew">
              <header className="habitsMonthlyNew__header">
                <div className="habitsMonthlyNew__title">
                  <h3>Calendário de Hábitos</h3>
                  <p>Clique em um dia para ver detalhes</p>
                </div>
                <div className="habitsMonthlyNew__nav">
                  <button onClick={() => navigateMonth(-1)}>
                    <ChevronLeft size={20} />
                  </button>
                  <span>{currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span>
                  <button onClick={() => navigateMonth(1)}>
                    <ChevronRight size={20} />
                  </button>
                </div>
              </header>

              <div className="habitsMonthlyNew__calendar">
                <div className="habitsMonthlyNew__weekdays">
                  {WEEKDAY_NAMES.map(day => (
                    <span key={day}>{day}</span>
                  ))}
                </div>

                <div className="habitsMonthlyNew__grid">
                  {monthlyCalendar.map((week, weekIdx) => (
                    <div key={weekIdx} className="habitsMonthlyNew__week">
                      {week.map((day, dayIdx) => {
                        if (!day) {
                          return <div key={dayIdx} className="monthDayCell monthDayCell--empty" />
                        }

                        const progressPercent = Math.round(day.completion * 100)

                        return (
                          <button
                            key={day.dateString}
                            className={`monthDayCell ${day.isToday ? 'monthDayCell--today' : ''}`}
                            onClick={() => handleDayClick(day.dateObj)}
                          >
                            <span className="monthDayCell__number">{day.day}</span>
                            {day.total > 0 ? (
                              <div className="monthDayCell__ring">
                                {(() => {
                                  const r = 18
                                  const circ = 2 * Math.PI * r
                                  const color = getProgressColor(day.completion)
                                  return (
                                    <svg viewBox="0 0 44 44" width="44" height="44">
                                      <circle cx="22" cy="22" r={r} fill="none" stroke="#e5e7eb" strokeWidth="3.5" />
                                      <circle
                                        cx="22" cy="22" r={r}
                                        fill="none"
                                        stroke={color}
                                        strokeWidth="3.5"
                                        strokeLinecap="round"
                                        strokeDasharray={`${progressPercent / 100 * circ} ${circ}`}
                                        transform="rotate(-90 22 22)"
                                      />
                                      <text x="22" y="26" textAnchor="middle" fontSize="10" fontWeight="700" fill={color}>
                                        {progressPercent}%
                                      </text>
                                    </svg>
                                  )
                                })()}
                              </div>
                            ) : (
                              <div className="monthDayCell__ring monthDayCell__ring--empty">
                                <svg viewBox="0 0 44 44" width="44" height="44">
                                  <circle cx="22" cy="22" r="18" fill="none" stroke="#e5e7eb" strokeWidth="3.5" />
                                </svg>
                              </div>
                            )}
                          </button>
                        )
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* Legenda */}
              <div className="habitsMonthlyNew__legend">
                <span><span className="legendDot" style={{ backgroundColor: '#e5e7eb' }} /> Sem hábitos</span>
                <span><span className="legendDot" style={{ backgroundColor: '#ef4444' }} /> &lt; 50%</span>
                <span><span className="legendDot" style={{ backgroundColor: '#f59e0b' }} /> 50-80%</span>
                <span><span className="legendDot" style={{ backgroundColor: '#10b981' }} /> &gt; 80%</span>
              </div>
            </div>
          )}

          {/* VISUALIZAÇÃO ESTATÍSTICAS */}
          {viewMode === 'stats' && (
            <HabitsStats
              habits={categoryFilteredHabits}
              onOpenDetail={setDetailHabitId}
              onDayClick={handleDayClick}
            />
          )}
        </section>

        <FloatingCreateButton
          label="Novo hábito"
          caption="Criar hábito"
          onClick={handleAddHabit}
          icon={Plus}
          ariaLabel="Criar novo hábito"
        />
      </div>
    </div>
  )
}
