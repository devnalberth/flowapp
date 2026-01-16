import './CalendarCard.css'

const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const completedDays = new Set([2, 4, 7, 16, 17, 19, 22])
const importantDays = new Set([13])
const today = 18
const monthLabel = 'Agosto'

export default function CalendarCard({ className = '' }) {
  const days = Array.from({ length: 31 }).map((_, i) => i + 1)

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
