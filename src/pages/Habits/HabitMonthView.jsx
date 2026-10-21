import { ChevronLeft, ChevronRight } from 'lucide-react'
import CardHeader from '../../components/ui/CardHeader'
import ProgressRing from '../../components/ui/ProgressRing'
import { localDateKey } from '../../utils/habitStats'
import { WEEKDAY_NAMES } from './habitsMeta'

export default function HabitMonthView({
  date,
  calendar,
  onNavigateMonth,
  onDayClick,
}) {
  const todayKey = localDateKey(),
    label = date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  const perfect = calendar
    .flat()
    .filter(
      (day) =>
        day &&
        day.dateString <= todayKey &&
        day.total > 0 &&
        day.completedCount === day.total
    ).length
  return (
    <section className="habits-month-view">
      <div className="habits-month-heading">
        <CardHeader
          title={label.charAt(0).toUpperCase() + label.slice(1)}
          subtitle={`${perfect} dias com tudo feito · clique num dia para ver detalhes`}
        />
        <button
          type="button"
          className="habits-month-nav"
          aria-label="Mês anterior"
          onClick={() => onNavigateMonth(-1)}
        >
          <ChevronLeft size={16} strokeWidth={1.75} />
        </button>
        <button
          type="button"
          className="habits-month-nav"
          aria-label="Próximo mês"
          onClick={() => onNavigateMonth(1)}
        >
          <ChevronRight size={16} strokeWidth={1.75} />
        </button>
      </div>
      <div className="habits-month-weekdays" aria-hidden="true">
        {WEEKDAY_NAMES.map((day) => (
          <span key={day}>{day}</span>
        ))}
      </div>
      <div className="habits-month-days">
        {calendar.flat().map((day, index) => {
          if (!day)
            return <span key={`empty-${index}`} className="habit-month-empty" />
          const future = day.dateString > todayKey
          return (
            <button
              type="button"
              key={day.dateString}
              className={`habit-month-day ${future ? 'is-future' : ''} ${day.isToday ? 'is-today' : ''}`}
              aria-current={day.isToday ? 'date' : undefined}
              aria-label={`${day.dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })} · ${future ? `${day.total} hábitos programados` : `${day.completedCount} de ${day.total} concluídos`}`}
              onClick={() => onDayClick(day.dateObj)}
            >
              <span>{day.day}</span>
              <ProgressRing
                size="sm"
                value={future ? 0 : day.completion * 100}
                label={`Progresso do dia ${day.day}`}
              >
                {future
                  ? ' '
                  : day.total
                    ? Math.round(day.completion * 100)
                    : '—'}
              </ProgressRing>
            </button>
          )
        })}
      </div>
      <div className="habits-week-legend">
        <span>
          <i />
          Em andamento
        </span>
        <span>
          <i />
          100% do dia
        </span>
        <span>
          <i />
          Ainda não chegou
        </span>
      </div>
    </section>
  )
}
