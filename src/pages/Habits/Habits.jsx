import { useState, useMemo, useEffect } from 'react'
import TopNav from '../../components/TopNav/TopNav.jsx'
import { useApp } from '../../context/AppContext.jsx'
import CreateHabitModal from '../../components/CreateHabitModal/CreateHabitModal.jsx'
import FloatingCreateButton from '../../components/FloatingCreateButton/FloatingCreateButton.jsx'
import {
  Calendar,
  BarChart3,
  TrendingUp,
  Search,
  Sparkles,
  Dumbbell,
  Brain,
  BookOpen,
  Book,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react'

import './Habits.css'

const VIEW_MODES = [
  { id: 'daily', label: 'Diário', icon: Calendar },
  { id: 'weekly', label: 'Semanal', icon: BarChart3 },
  { id: 'monthly', label: 'Mensal', icon: TrendingUp },
]

const CATEGORIES = [
  { id: 'all', label: 'Todos', color: '#ff4800' },
  { id: 'saude', label: 'Saúde', color: '#0a9463' },
  { id: 'trabalho', label: 'Trabalho', color: '#ff7a00' },
  { id: 'aprendizado', label: 'Aprendizado', color: '#4f5bd5' },
  { id: 'mindfulness', label: 'Mindfulness', color: '#ff4800' },
]

const ICON_OPTIONS = [
  { id: 'sparkles', icon: Sparkles, label: 'Sparkles' },
  { id: 'dumbbell', icon: Dumbbell, label: 'Dumbbell' },
  { id: 'brain', icon: Brain, label: 'Brain' },
  { id: 'bookopen', icon: BookOpen, label: 'Book Open' },
  { id: 'book', icon: Book, label: 'Book' },
]

const WEEKDAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

export default function Habits({ user, onNavigate, onLogout }) {
  const { habits, addHabit, updateHabit, deleteHabit, completeHabit } = useApp()

  const [viewMode, setViewMode] = useState('daily')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)

  // Estado para visualizações semanal/mensal
  const [selectedDate, setSelectedDate] = useState(null)
  const [showDayModal, setShowDayModal] = useState(false)

  // Estado para navegação do mês
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Obter ícone por ID
  const getIcon = (iconId) => {
    const iconOption = ICON_OPTIONS.find(opt => opt.id === iconId)
    return iconOption ? iconOption.icon : Sparkles
  }

  // Habits com ícones e streaks calculados
  const habitsWithMeta = useMemo(() => {
    return habits.map(habit => ({
      ...habit,
      icon: getIcon(habit.iconId || 'sparkles'),
      streak: habit.current_streak || 0,
    }))
  }, [habits])

  // === LÓGICA DE FILTRAGEM ===
  const filteredHabits = useMemo(() => {
    const today = new Date()
    const currentDayOfWeek = today.getDay()

    return habitsWithMeta.filter((habit) => {
      const matchesCategory = categoryFilter === 'all' || habit.category === categoryFilter
      const matchesSearch = (habit.label || habit.name || '').toLowerCase().includes(searchTerm.toLowerCase())

      if (!matchesCategory || !matchesSearch) return false

      if (!habit.frequency || habit.frequency === 'daily') return true

      if (habit.frequency === 'custom' || habit.frequency === 'weekly') {
        let days = []

        if (Array.isArray(habit.customDays)) days = habit.customDays
        else if (Array.isArray(habit.selectedDays)) days = habit.selectedDays
        else if (typeof habit.customDays === 'string') {
          try { days = JSON.parse(habit.customDays) } catch (e) {
            days = habit.customDays.split(',').map(d => parseInt(d.trim()))
          }
        }

        const numericDays = days.map(d => Number(d))

        if (numericDays.length === 0) return false;

        return numericDays.includes(currentDayOfWeek);
      }

      return true
    })
  }, [habitsWithMeta, categoryFilter, searchTerm])

  // === LÓGICA DE CHECKLIST ===
  const toggleHabitCompletion = async (habitId, dateStr) => {
    if (completeHabit) {
      await completeHabit(habitId)
    }
  }

  const isHabitComplete = (habit, dateStr) => {
    const list = Array.isArray(habit.completions)
      ? habit.completions
      : (Array.isArray(habit.completed_dates) ? habit.completed_dates : [])

    return list.includes(dateStr)
  }

  const getDateString = (date) => {
    if (typeof date === 'number') {
      const d = new Date()
      d.setDate(d.getDate() + date)
      return d.toISOString().split('T')[0]
    }
    return date.toISOString().split('T')[0]
  }

  // Gera dados para a semana atual
  const weeklyData = useMemo(() => {
    const today = new Date()
    const currentDay = today.getDay()

    return WEEKDAY_NAMES.map((day, index) => {
      const offset = index - currentDay
      const date = new Date()
      date.setDate(date.getDate() + offset)
      const dateStr = getDateString(date)

      const activeHabitsForDay = habitsWithMeta.filter(h => {
        if (!h.frequency || h.frequency === 'daily') return true;

        let days = [];
        if (Array.isArray(h.customDays)) days = h.customDays;
        else if (typeof h.customDays === 'string') { try { days = JSON.parse(h.customDays) } catch (e) { } }

        const numericDays = days.map(d => Number(d))
        if (numericDays.length > 0) return numericDays.includes(index);
        return false;
      });

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

    // Adiciona dias vazios no início
    for (let i = 0; i < startingDayOfWeek; i++) {
      currentWeek.push(null)
    }

    // Adiciona os dias do mês
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day)
      const dateStr = getDateString(date)

      // Calcula progresso do dia
      const activeHabitsForDay = habitsWithMeta.filter(h => {
        if (!h.frequency || h.frequency === 'daily') return true;

        let days = [];
        if (Array.isArray(h.customDays)) days = h.customDays;
        else if (typeof h.customDays === 'string') { try { days = JSON.parse(h.customDays) } catch (e) { } }

        const numericDays = days.map(d => Number(d))
        if (numericDays.length > 0) return numericDays.includes(date.getDay());
        return h.frequency === 'daily';
      });

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

    // Completa a última semana com dias vazios
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

    const dateStr = getDateString(selectedDate)
    const dayOfWeek = selectedDate.getDay()

    const habitsForDay = habitsWithMeta.filter(h => {
      if (!h.frequency || h.frequency === 'daily') return true;

      let days = [];
      if (Array.isArray(h.customDays)) days = h.customDays;
      else if (typeof h.customDays === 'string') { try { days = JSON.parse(h.customDays) } catch (e) { } }

      const numericDays = days.map(d => Number(d))
      if (numericDays.length > 0) return numericDays.includes(dayOfWeek);
      return h.frequency === 'daily';
    }).map(h => ({
      ...h,
      isCompleted: isHabitComplete(h, dateStr)
    }))

    return {
      date: selectedDate,
      dateStr,
      habits: habitsForDay,
      completedCount: habitsForDay.filter(h => h.isCompleted).length,
      total: habitsForDay.length,
    }
  }, [selectedDate, habitsWithMeta])

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
                      <li key={habit.id} className={`dayModal__item ${habit.isCompleted ? 'dayModal__item--completed' : ''}`}>
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
            <div className="searchBox">
              <Search className="searchBox__icon" size={16} />
              <input
                type="text"
                placeholder="Buscar hábitos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
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
                {filteredHabits.length === 0 ? (
                  <div className="habitsEmpty">
                    <p>Nenhum hábito programado para hoje.</p>
                  </div>
                ) : (
                  filteredHabits.map((habit) => {
                    const category = CATEGORIES.find(c => c.id === habit.category)
                    const IconComponent = habit.icon
                    const todayStr = getDateString(0)
                    const isChecked = isHabitComplete(habit, todayStr)

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
                            onChange={() => toggleHabitCompletion(habit.id, todayStr)}
                          />
                        </div>

                        <div
                          className="dailyCheckItem__content"
                          onClick={() => handleEditHabit(habit)}
                        >
                          <IconComponent className="dailyCheckItem__icon" size={20} strokeWidth={2} />
                          <span className="dailyCheckItem__label">{habit.label || habit.name}</span>
                          {habit.focus && <span className="dailyCheckItem__focus">{habit.focus}</span>}
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

                      <div className="weekDayCard__ring" style={{ '--progress': progressPercent }}>
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
                            <div
                              className="monthDayCell__bar"
                              style={{
                                width: `${progressPercent}%`,
                                backgroundColor: getProgressColor(day.completion)
                              }}
                            />
                            {day.total > 0 && (
                              <span className="monthDayCell__count">{day.completedCount}/{day.total}</span>
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