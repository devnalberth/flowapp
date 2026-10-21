import { localDateKey } from '../../utils/habitStats'
import CardHeader from '../../components/ui/CardHeader'
import { monthDays } from './agendaPresentation'

export default function AgendaMiniCalendar({ date, selected, today, items, onSelect }) {
  const month = date
    .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
    .replace(' de ', ' ')
  const days = monthDays(date)
  return (
    <section className="agenda-mini">
      <CardHeader
        title={month.charAt(0).toUpperCase() + month.slice(1)}
        subtitle="Clique num dia para abrir"
      />
      <div className="agenda-mini-week" aria-hidden="true">
        {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((day, i) => (
          <span key={i}>{day}</span>
        ))}
      </div>
      <div className="agenda-mini-grid">
        {days.map((day) => {
          const key = localDateKey(day)
          const kinds = new Set(items.filter((item) => item.day === key).map((item) => item.kind))
          return (
            <button
              type="button"
              key={key}
              className={`${day.getMonth() !== date.getMonth() ? 'is-outside' : ''} ${key === selected ? 'is-selected' : ''}`}
              aria-label={day.toLocaleDateString('pt-BR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
              aria-current={key === today ? 'date' : undefined}
              aria-pressed={key === selected}
              onClick={() => onSelect(key)}
            >
              <span>{day.getDate()}</span>
              <i>
                {['task', 'event', 'bill']
                  .filter((kind) => kinds.has(kind))
                  .map((kind) => (
                    <b key={kind} className={`agenda-${kind}`} />
                  ))}
              </i>
            </button>
          )
        })}
      </div>
    </section>
  )
}
