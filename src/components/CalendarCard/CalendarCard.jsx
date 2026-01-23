import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X, CheckCircle2, Clock, TrendingUp, Calendar, Wallet, Target } from 'lucide-react'
import './CalendarCard.css'

const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

export default function CalendarCard({
  className = '',
  tasks = [],
  habits = [],
  finances = [],
  events = []
}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)

  const { days, completedDays, importantDays, hasTasks, hasEvents, hasFinances, today, monthLabel, year } = useMemo(() => {
    const now = new Date()
    const viewMonth = currentDate.getMonth()
    const viewYear = currentDate.getFullYear()

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate()
    const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay()

    // Cria array com espaços vazios para alinhamento
    const daysArray = []
    for (let i = 0; i < firstDayOfMonth; i++) {
      daysArray.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      daysArray.push(i)
    }

    // Dias com tarefas concluídas
    const completed = new Set()
    // Dias que têm tarefas
    const withTasks = new Set()

    tasks.forEach(t => {
      if (t.due_date) {
        const date = new Date(t.due_date)
        if (date.getMonth() === viewMonth && date.getFullYear() === viewYear) {
          withTasks.add(date.getDate())
          if (t.status === 'done' || t.completed) {
            completed.add(date.getDate())
          }
        }
      }
    })

    // Dias com tarefas importantes (prioridade alta)
    const important = new Set()
    tasks.filter(t => t.priority === 'high' || t.priority === 'Alta' || t.priority === 'Urgente').forEach(t => {
      if (!t.due_date) return
      const date = new Date(t.due_date)
      if (date.getMonth() === viewMonth && date.getFullYear() === viewYear) {
        important.add(date.getDate())
      }
    })

    // Dias com eventos
    const withEvents = new Set()
    events.forEach(e => {
      if (e.date) {
        const date = new Date(e.date)
        if (date.getMonth() === viewMonth && date.getFullYear() === viewYear) {
          withEvents.add(date.getDate())
        }
      }
    })

    // Dias com movimentações financeiras
    const withFinances = new Set()
    finances.forEach(f => {
      const dateStr = f.date || f.created_at
      if (dateStr) {
        const date = new Date(dateStr)
        if (date.getMonth() === viewMonth && date.getFullYear() === viewYear) {
          withFinances.add(date.getDate())
        }
      }
    })

    const isCurrentMonth = now.getMonth() === viewMonth && now.getFullYear() === viewYear

    return {
      days: daysArray,
      completedDays: completed,
      importantDays: important,
      hasTasks: withTasks,
      hasEvents: withEvents,
      hasFinances: withFinances,
      today: isCurrentMonth ? now.getDate() : null,
      monthLabel: months[viewMonth],
      year: viewYear,
    }
  }, [tasks, events, finances, currentDate])

  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(newDate.getMonth() + direction)
      return newDate
    })
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getDayClass = (day) => {
    if (!day) return 'cal__day cal__day--empty'

    let classes = 'cal__day'

    if (day === today) classes += ' cal__day--today'
    else if (importantDays.has(day)) classes += ' cal__day--important'
    else if (completedDays.has(day)) classes += ' cal__day--completed'

    // Indicadores de conteúdo
    if (hasTasks.has(day) || hasEvents.has(day) || hasFinances.has(day)) {
      classes += ' cal__day--hasContent'
    }

    return classes
  }

  const handleDayClick = (day) => {
    if (!day) return
    setSelectedDay(day)
  }

  // Dados do dia selecionado para o modal
  const selectedDayData = useMemo(() => {
    if (!selectedDay) return null

    const viewMonth = currentDate.getMonth()
    const viewYear = currentDate.getFullYear()
    const selectedDate = new Date(viewYear, viewMonth, selectedDay)
    const dateStr = selectedDate.toISOString().split('T')[0]

    // Tarefas do dia
    const dayTasks = tasks.filter(t => {
      if (!t.due_date) return false
      const taskDate = new Date(t.due_date)
      return taskDate.getDate() === selectedDay &&
        taskDate.getMonth() === viewMonth &&
        taskDate.getFullYear() === viewYear
    })

    // Hábitos concluídos nesse dia
    const dayHabits = habits.filter(h => {
      const completions = h.completions || h.completed_dates || []
      return completions.includes(dateStr)
    })

    // Eventos do dia
    const dayEvents = events.filter(e => {
      if (!e.date) return false
      const eventDate = new Date(e.date)
      return eventDate.getDate() === selectedDay &&
        eventDate.getMonth() === viewMonth &&
        eventDate.getFullYear() === viewYear
    })

    // Finanças do dia
    const dayFinances = finances.filter(f => {
      const financeDate = new Date(f.date || f.created_at)
      return financeDate.getDate() === selectedDay &&
        financeDate.getMonth() === viewMonth &&
        financeDate.getFullYear() === viewYear
    })

    // Produtividade do dia
    const focusMinutes = tasks.reduce((acc, t) => {
      if (!t.updated_at) return acc
      const updateDate = new Date(t.updated_at)
      if (updateDate.getDate() === selectedDay &&
        updateDate.getMonth() === viewMonth &&
        updateDate.getFullYear() === viewYear) {
        return acc + (Number(t.time_spent) || 0)
      }
      return acc
    }, 0)

    const completedTasksCount = dayTasks.filter(t => t.completed || t.status === 'done').length

    // Balanço financeiro
    const income = dayFinances.filter(f => f.type === 'income').reduce((acc, f) => acc + (Number(f.amount) || 0), 0)
    const expense = dayFinances.filter(f => f.type === 'expense').reduce((acc, f) => acc + (Number(f.amount) || 0), 0)

    return {
      date: selectedDate,
      dateFormatted: selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }),
      tasks: dayTasks,
      habits: dayHabits,
      events: dayEvents,
      finances: dayFinances,
      focusMinutes,
      completedTasksCount,
      totalTasks: dayTasks.length,
      income,
      expense,
      balance: income - expense,
    }
  }, [selectedDay, currentDate, tasks, habits, events, finances])

  return (
    <section className={`cal ui-card ${className}`.trim()}>
      <header className="cal__header">
        <div className="cal__title">Calendário</div>
        <div className="cal__nav">
          <button className="cal__navBtn" onClick={() => navigateMonth(-1)} title="Mês anterior">
            <ChevronLeft size={18} />
          </button>
          <button className="cal__monthBtn" onClick={goToToday} title="Ir para hoje">
            <span>{monthLabel}</span>
            <span className="cal__year">{year}</span>
          </button>
          <button className="cal__navBtn" onClick={() => navigateMonth(1)} title="Próximo mês">
            <ChevronRight size={18} />
          </button>
        </div>
      </header>

      <div className="cal__week">
        {weekDays.map((d, index) => (
          <span key={`weekday-${index}`} className="cal__weekDay">
            {d}
          </span>
        ))}
      </div>

      <div className="cal__grid">
        {days.map((day, index) => (
          <button
            key={`day-${index}`}
            type="button"
            className={getDayClass(day)}
            onClick={() => handleDayClick(day)}
            disabled={!day}
          >
            {day}
            {day && (hasTasks.has(day) || hasEvents.has(day) || hasFinances.has(day)) && (
              <span className="cal__dayDot" />
            )}
          </button>
        ))}
      </div>

      {/* Modal de Resumo do Dia */}
      {selectedDay && selectedDayData && (
        <DaySummaryModal
          data={selectedDayData}
          onClose={() => setSelectedDay(null)}
        />
      )}
    </section>
  )
}

function DaySummaryModal({ data, onClose }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
  }

  const formatMinutes = (minutes) => {
    const h = Math.floor(minutes / 60)
    const m = Math.round(minutes % 60)
    return h > 0 ? `${h}h ${m}m` : `${m}m`
  }

  return (
    <div className="dayModal">
      <div className="dayModal__backdrop" onClick={onClose} />
      <div className="dayModal__panel">
        <header className="dayModal__header">
          <div>
            <p className="dayModal__eyebrow">Resumo do Dia</p>
            <h2 className="dayModal__date">{data.dateFormatted}</h2>
          </div>
          <button className="dayModal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="dayModal__content">
          {/* Mini Dashboard de Produtividade */}
          <div className="dayModal__stats">
            <div className="dayModal__stat">
              <Clock size={16} />
              <div>
                <span className="dayModal__statValue">{formatMinutes(data.focusMinutes)}</span>
                <span className="dayModal__statLabel">Foco</span>
              </div>
            </div>
            <div className="dayModal__stat">
              <CheckCircle2 size={16} />
              <div>
                <span className="dayModal__statValue">{data.completedTasksCount}/{data.totalTasks}</span>
                <span className="dayModal__statLabel">Tarefas</span>
              </div>
            </div>
            <div className="dayModal__stat">
              <Target size={16} />
              <div>
                <span className="dayModal__statValue">{data.habits.length}</span>
                <span className="dayModal__statLabel">Hábitos</span>
              </div>
            </div>
          </div>

          {/* Tarefas do Dia */}
          {data.tasks.length > 0 && (
            <div className="dayModal__section">
              <h3 className="dayModal__sectionTitle">
                <CheckCircle2 size={16} />
                Tarefas ({data.tasks.length})
              </h3>
              <ul className="dayModal__list">
                {data.tasks.map(task => (
                  <li key={task.id} className={`dayModal__task ${task.completed ? 'completed' : ''}`}>
                    <span className={`dayModal__taskCheck ${task.completed ? 'checked' : ''}`} />
                    <span className="dayModal__taskTitle">{task.title}</span>
                    <span className={`dayModal__taskPriority priority--${task.priority?.toLowerCase()}`}>
                      {task.priority}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Hábitos Concluídos */}
          {data.habits.length > 0 && (
            <div className="dayModal__section">
              <h3 className="dayModal__sectionTitle">
                <TrendingUp size={16} />
                Hábitos Concluídos ({data.habits.length})
              </h3>
              <ul className="dayModal__list">
                {data.habits.map(habit => (
                  <li key={habit.id} className="dayModal__habit">
                    <span className="dayModal__habitEmoji">{habit.emoji || '✅'}</span>
                    <span>{habit.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Eventos */}
          {data.events.length > 0 && (
            <div className="dayModal__section">
              <h3 className="dayModal__sectionTitle">
                <Calendar size={16} />
                Eventos ({data.events.length})
              </h3>
              <ul className="dayModal__list">
                {data.events.map(event => (
                  <li key={event.id} className="dayModal__event">
                    <span className="dayModal__eventTime">{event.time || '—'}</span>
                    <span>{event.title}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Movimentações Financeiras */}
          {data.finances.length > 0 && (
            <div className="dayModal__section">
              <h3 className="dayModal__sectionTitle">
                <Wallet size={16} />
                Finanças ({data.finances.length})
              </h3>
              <ul className="dayModal__list dayModal__financeList">
                {data.finances.map(finance => (
                  <li key={finance.id} className={`dayModal__finance ${finance.type}`}>
                    <span className="dayModal__financeDesc">{finance.description || finance.category}</span>
                    <span className={`dayModal__financeAmount ${finance.type}`}>
                      {finance.type === 'income' ? '+' : '-'}{formatCurrency(finance.amount)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="dayModal__financeBalance">
                <span>Balanço do dia:</span>
                <span className={data.balance >= 0 ? 'positive' : 'negative'}>
                  {formatCurrency(data.balance)}
                </span>
              </div>
            </div>
          )}

          {/* Estado vazio */}
          {data.tasks.length === 0 && data.habits.length === 0 && data.events.length === 0 && data.finances.length === 0 && (
            <div className="dayModal__empty">
              <Calendar size={48} strokeWidth={1} />
              <p>Nenhuma atividade registrada neste dia.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
