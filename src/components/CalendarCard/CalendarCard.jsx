import { useMemo } from 'react'
import './CalendarCard.css'

const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']

export default function CalendarCard({ className = '', tasks = [] }) {
  const { days, completedDays, importantDays, today, monthLabel } = useMemo(() => {
    const now = new Date()
    const currentDay = now.getDate()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro']
    
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
    const daysArray = Array.from({ length: daysInMonth }).map((_, i) => i + 1)

    // Dias com tarefas concluídas
    const completed = new Set()
    tasks.filter(t => t.status === 'done' || t.status === 'completed').forEach(t => {
      const date = new Date(t.updated_at)
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        completed.add(date.getDate())
      }
    })

    // Dias com tarefas importantes (prioridade alta)
    const important = new Set()
    tasks.filter(t => t.priority === 'high' || t.priority === 'Alta').forEach(t => {
      if (!t.due_date) return
      const date = new Date(t.due_date)
      if (date.getMonth() === currentMonth && date.getFullYear() === currentYear) {
        important.add(date.getDate())
      }
    })

    return {
      days: daysArray,
      completedDays: completed,
      importantDays: important,
      today: currentDay,
      monthLabel: months[currentMonth],
    }
  }, [tasks])

  const getDayClass = (day) => {
    if (day === today) return 'cal__day cal__day--today'
    if (importantDays.has(day)) return 'cal__day cal__day--important'
    if (completedDays.has(day)) return 'cal__day cal__day--completed'
    return 'cal__day'
  }

  return (
    <section className={`cal ui-card ${className}`.trim()}>
      <header className="cal__header">
        <div className="cal__title">Calendário</div>
        <div className="cal__filter">
          <span>{monthLabel}</span>
          <svg className="cal__arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
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
        {days.map((day) => (
          <button key={day} type="button" className={getDayClass(day)}>
            {day}
          </button>
        ))}
      </div>
    </section>
  )
}
