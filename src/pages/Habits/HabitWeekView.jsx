import { Check } from 'lucide-react'
import CardHeader from '../../components/ui/CardHeader'
import ProgressRing from '../../components/ui/ProgressRing'
import { isHabitActiveOnDate, localDateKey } from '../../utils/habitStats'

export default function HabitWeekView({
  days,
  habits,
  stats,
  onDayClick,
  onCompleteDate,
  isComplete,
  mask,
}) {
  const todayKey = localDateKey()
  const title = days.length
    ? `Semana atual · ${days[0].dayNumber} a ${days[6].dateObj.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`
    : 'Semana atual'
  return (
    <section className="habits-week-view">
      <CardHeader
        title={title}
        subtitle="Clique num dia para ver e marcar os hábitos dele"
      />
      <div className="habits-week-days">
        {days.map((day) => {
          const future = day.dateString > todayKey
          return (
            <button
              type="button"
              key={day.dateString}
              className={`habits-week-day ${day.isToday ? 'is-today' : ''} ${future ? 'is-future' : ''}`}
              aria-label={day.dateObj.toLocaleDateString('pt-BR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
              onClick={() => onDayClick(day.dateObj)}
            >
              <span>{day.dayName}</span>
              <strong>{day.dayNumber}</strong>
              <ProgressRing
                size="md"
                value={future ? 0 : day.completion * 100}
                label={`Progresso de ${day.dayName}`}
              >
                {future || !day.total
                  ? '—'
                  : `${Math.round(day.completion * 100)}%`}
              </ProgressRing>
              <small>
                {future
                  ? `${day.total} hábitos`
                  : `${day.completedCount} de ${day.total}`}
              </small>
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
      <div className="habits-week-matrix-scroll">
        <table className="habits-week-matrix">
          <caption>
            <strong>POR HÁBITO</strong>{' '}
            <span>✓ feito · ○ ficou para trás · – não é dia dele</span>
          </caption>
          <thead>
            <tr>
              <th scope="col">
                <span className="fa-sr-only">Hábito</span>
              </th>
              {days.map((day) => (
                <th
                  scope="col"
                  key={day.dateString}
                  className={day.isToday ? 'is-today' : ''}
                >
                  <abbr title={day.dayName}>{day.dayName[0]}</abbr>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...habits]
              .sort((a, b) => {
                const rank = (h) =>
                  !isHabitActiveOnDate(h, new Date())
                    ? 2
                    : isComplete(h, todayKey)
                      ? 0
                      : 1
                return rank(a) - rank(b) || b.streak - a.streak
              })
              .map((habit) => (
                <tr key={habit.id}>
                  <th scope="row">{mask(habit.label || habit.name)}</th>
                  {days.map((day) => {
                    const active = isHabitActiveOnDate(habit, day.dateObj),
                      done = isComplete(habit, day.dateString),
                      future = day.dateString > todayKey
                    return (
                      <td key={day.dateString}>
                        {active ? (
                          <button
                            type="button"
                            className={`habit-week-check ${done ? 'is-done' : ''} ${future ? 'is-future' : ''} ${day.isToday ? 'is-today' : ''}`}
                            aria-label={`${done ? 'Desmarcar' : 'Marcar'} ${mask(habit.label || habit.name)} · ${day.dateString}`}
                            onClick={() =>
                              future
                                ? onDayClick(day.dateObj)
                                : onCompleteDate(habit.id, day.dateString)
                            }
                          >
                            {done && <Check size={12} strokeWidth={2} />}
                          </button>
                        ) : (
                          <span
                            className="habit-not-scheduled"
                            aria-label="Não programado"
                          >
                            –
                          </span>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
          </tbody>
        </table>
      </div>
      <div className="habits-week-summary">
        <span>
          Até agora: {stats.completed} de {stats.scheduled} conclusões ·{' '}
          {stats.perfectDays} dias com tudo feito
        </span>
        <strong>
          {stats.rate != null ? `${Math.round(stats.rate * 100)}%` : '—'}
        </strong>
      </div>
    </section>
  )
}
