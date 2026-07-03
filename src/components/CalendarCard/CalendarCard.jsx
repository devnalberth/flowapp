import { useState, useMemo } from 'react'
import { ChevronLeft, ChevronRight, X, CheckCircle2, Clock, TrendingUp, Calendar, Wallet, Target } from 'lucide-react'
import { focusLogService } from '../../services/focusLogService'
import './CalendarCard.css'

const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']
const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']

// Chaves locais YYYY-MM-DD — nunca toISOString direto, que em UTC-3 desloca o dia.
const localDayKey = (d) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]

// Campos de CALENDÁRIO (due_date, event.date, finance.date): a data literal é a intenção
const toDayKey = (value) => {
  if (!value) return null
  const s = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const d = new Date(s)
  return Number.isNaN(d.getTime()) ? null : localDayKey(d)
}

// Campos de TIMESTAMP (created_at/updated_at): sempre o dia LOCAL do instante
const tsKey = (value) => {
  if (!value) return null
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : localDayKey(d)
}

const pad2 = (n) => String(n).padStart(2, '0')
const keyOf = (year, monthIdx, day) => `${year}-${pad2(monthIdx + 1)}-${pad2(day)}`

// Extrai { day } se a chave pertence ao mês/ano em exibição
const dayInView = (key, viewYear, viewMonth) => {
  if (!key) return null
  const [y, m, d] = key.split('-').map(Number)
  return y === viewYear && m - 1 === viewMonth ? d : null
}

export default function CalendarCard({
  className = '',
  tasks = [],
  habits = [],
  finances = [],
  events = [],
  onEditEvent, // New prop
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
      const day = dayInView(toDayKey(t.due_date), viewYear, viewMonth)
      if (day != null) {
        withTasks.add(day)
        if (t.status === 'done' || t.completed) {
          completed.add(day)
        }
      }
    })

    // Dias com tarefas importantes (prioridade alta)
    const important = new Set()
    tasks.filter(t => t.priority === 'high' || t.priority === 'Alta' || t.priority === 'Urgente').forEach(t => {
      const day = dayInView(toDayKey(t.due_date), viewYear, viewMonth)
      if (day != null) important.add(day)
    })

    // Dias com eventos
    const withEvents = new Set()
    events.forEach(e => {
      const day = dayInView(toDayKey(e.date), viewYear, viewMonth)
      if (day != null) withEvents.add(day)
    })

    // Dias com movimentações financeiras
    const withFinances = new Set()
    finances.forEach(f => {
      const key = f.date ? toDayKey(f.date) : tsKey(f.created_at)
      const day = dayInView(key, viewYear, viewMonth)
      if (day != null) withFinances.add(day)
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
    // Chave LOCAL do dia clicado (toISOString aqui deslocava para o dia anterior)
    const dateStr = keyOf(viewYear, viewMonth, selectedDay)

    // Tarefas do dia
    const dayTasks = tasks.filter(t => toDayKey(t.due_date) === dateStr)

    // Hábitos concluídos nesse dia
    const dayHabits = habits.filter(h => {
      const completions = h.completions || h.completed_dates || []
      return completions.includes(dateStr)
    })

    // Eventos do dia
    const dayEvents = events.filter(e => toDayKey(e.date) === dateStr)

    // Finanças do dia
    const dayFinances = finances.filter(f => (f.date ? toDayKey(f.date) : tsKey(f.created_at)) === dateStr)

    // Produtividade do dia - usa focusLogService (localStorage) como fonte primária
    let focusMinutes = focusLogService.getTimeForDate(dateStr)

    // Fallback: se não tiver log, tenta calcular a partir das tasks (dados antigos)
    if (focusMinutes === 0) {
      focusMinutes = tasks.reduce((acc, t) => {
        if (!t.updated_at) return acc
        if (tsKey(t.updated_at) === dateStr) {
          return acc + (Number(t.time_spent) || 0)
        }
        return acc
      }, 0)
    }

    const completedTasksCount = dayTasks.filter(t => t.completed || t.status === 'done').length

    // Balanço financeiro
    const income = dayFinances.filter(f => f.type === 'income').reduce((acc, f) => acc + (Number(f.amount) || 0), 0)
    const expense = dayFinances.filter(f => f.type === 'expense').reduce((acc, f) => acc + (Number(f.amount) || 0), 0)

    const selectedDate = new Date(viewYear, viewMonth, selectedDay)

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
          onEditEvent={onEditEvent}
        />
      )}
    </section>
  )
}

function DaySummaryModal({ data, onClose, onEditEvent }) {
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
                  <li
                    key={event.id}
                    className="dayModal__event"
                    onClick={() => { onClose(); onEditEvent?.(event) }}
                    style={{ cursor: 'pointer', transition: 'background 0.2s', borderRadius: 8 }}
                    title="Clique para editar"
                  >
                    <span className="dayModal__eventTime">{event.time || '—'}</span>
                    <span>{event.title}</span>
                    <span style={{ marginLeft: 'auto', opacity: 0.5, fontSize: 11 }}>Editar</span>
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
