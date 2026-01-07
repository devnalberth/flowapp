import './CalendarCard.css'

const weekDays = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
const accentDays = new Set([2, 4, 7, 16, 17, 18, 19, 22])
const outlinedDays = new Set([13])

export default function CalendarCard({ className = '' }) {
  const days = Array.from({ length: 31 }).map((_, i) => i + 1)
  const selected = 18

  const getDayClass = (day) => {
    if (day === selected) return 'cal__day cal__day--selected'
    if (accentDays.has(day)) return 'cal__day cal__day--accent'
    if (outlinedDays.has(day)) return 'cal__day cal__day--outlined'
    return 'cal__day'
  }

  return (
    <section className={`cal ui-card ${className}`.trim()}>
      <header className="cal__header">
        <div className="cal__title">Calendário</div>
        <div className="cal__filter">
          <span className="cal__filterLabel">Agosto</span>
          <span className="cal__chev" />
        </div>
      </header>

      <div className="cal__week">
        {weekDays.map((d) => (
          <span key={d} className="cal__weekDay">
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
