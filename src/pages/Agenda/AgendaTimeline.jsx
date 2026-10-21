import { CalendarOff } from 'lucide-react'
import EmptyState from '../../components/ui/EmptyState'
import TaskCheck from '../../components/ui/TaskCheck'
import PriorityTag from '../../components/ui/PriorityTag'
import StatusBadge from '../../components/ui/StatusBadge'
import { maskAgendaText } from './agendaPresentation'
import { localDateKey } from '../../utils/habitStats'

const minutesOf = (time) => {
  const [h, m] = time.split(':').map(Number)
  return h * 60 + m
}
const labelOf = (minutes) =>
  `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`

// Timed tasks are fixed visual blocks, never an inferred task duration.
export default function AgendaTimeline({
  days,
  items,
  now,
  onSelectDay,
  onOpen,
  formatMoney,
  dayView = false,
  projects = [],
  onToggleTask,
  busyTask,
  onNewEvent,
  hideValues,
}) {
  const today = localDateKey(now)
  const dayKeys = days.map(localDateKey)
  const visible = items.filter((item) => dayKeys.includes(item.day))
  const timed = visible.filter((item) => item.time)
  const startHour = Math.min(8, ...timed.map((item) => Math.floor(minutesOf(item.time) / 60)))
  const endHour = Math.min(
    24,
    Math.max(
      21,
      ...timed.map((item) =>
        Math.ceil(
          Math.max(
            minutesOf(item.time) + 30,
            item.source.endTime ? minutesOf(item.source.endTime) : 0
          ) / 60
        )
      )
    )
  )
  const range = Array.from({ length: endHour - startHour }, (_, i) => startHour + i)
  const allDayRows = Math.max(
    dayView ? 1 : 2,
    ...dayKeys.map((key) => visible.filter((item) => item.day === key && !item.time).length)
  )
  const nowMinutes = now.getHours() * 60 + now.getMinutes()
  return (
    <div className="agenda-timeline-scroll">
      <div
        className={`agenda-timeline ${dayView ? 'agenda-timeline--day' : ''}`}
        style={{
          '--agenda-columns': days.length,
          '--agenda-hours': range.length,
          '--agenda-all-day-height': `${dayView ? allDayRows * 32 + 12 : allDayRows * 28 + 6}px`,
        }}
      >
        {!dayView && (
          <div className="agenda-timeline-head">
            <span />
            {days.map((date) => (
              <button
                type="button"
                key={localDateKey(date)}
                className={localDateKey(date) === today ? 'is-today' : ''}
                onClick={() => onSelectDay(localDateKey(date))}
              >
                <span>
                  {date.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                </span>
                <strong>{date.getDate()}</strong>
              </button>
            ))}
          </div>
        )}
        <div className="agenda-timeline-all">
          <span>Dia todo</span>
          {dayKeys.map((key) => (
            <div key={key} className={key === today ? 'is-today' : ''}>
              {visible
                .filter((item) => item.day === key && !item.time)
                .map((item) => (
                  <button
                    type="button"
                    key={item.key}
                    className={`agenda-chip agenda-${item.kind} ${item.done ? 'is-done' : ''}`}
                    title={item.title}
                    onClick={() => onOpen(item)}
                  >
                    {item.title}
                    {item.kind === 'bill' && ` · ${formatMoney(item.amount)}`}
                  </button>
                ))}
            </div>
          ))}
        </div>
        <div className="agenda-timeline-body">
          {dayView && !timed.length && (
            <div className="agenda-timeline-empty">
              <EmptyState
                icon={CalendarOff}
                title={`Nada marcado para ${days[0].toLocaleDateString('pt-BR', { weekday: 'long' })}`}
                description="Crie um evento ou dê uma data a uma tarefa para ela aparecer aqui."
                action="Novo evento"
                onAction={onNewEvent}
              />
            </div>
          )}
          <div className="agenda-timeline-hours">
            {range.map((hour, index) => (
              <time key={hour} style={{ top: index * 48 }}>
                {labelOf(hour * 60)}
              </time>
            ))}
            {dayKeys.includes(today) &&
              nowMinutes >= startHour * 60 &&
              nowMinutes < endHour * 60 && (
                <strong
                  className="agenda-now-label"
                  style={{ top: (nowMinutes - startHour * 60) * 0.8 - 8 }}
                >
                  {labelOf(nowMinutes)}
                </strong>
              )}
          </div>
          {dayKeys.map((key) => {
            const dayItems = timed
              .filter((item) => item.day === key)
              .map((item) => {
                const start = minutesOf(item.time)
                const end =
                  item.kind === 'event' && item.source.endTime
                    ? minutesOf(item.source.endTime)
                    : start + (item.kind === 'task' ? 30 : 60)
                return {
                  ...item,
                  start,
                  end: Math.max(start + (dayView && item.kind === 'task' ? 50 : 30), end),
                }
              })
            // Divide simultaneous blocks into lanes so every record remains reachable.
            const groups = []
            for (const item of dayItems) {
              let group = groups.at(-1)
              if (!group || item.start >= group.end) {
                group = { end: item.end, items: [] }
                groups.push(group)
              }
              group.end = Math.max(group.end, item.end)
              group.items.push(item)
            }
            for (const group of groups) {
              const lanes = []
              for (const item of group.items) {
                let lane = lanes.findIndex((end) => end <= item.start)
                if (lane < 0) lane = lanes.length
                lanes[lane] = item.end
                item.lane = lane
              }
              for (const item of group.items) item.laneCount = lanes.length
            }
            return (
              <div key={key} className={`agenda-time-column ${key === today ? 'is-today' : ''}`}>
                {dayItems.map((item) => {
                  const style = {
                    top: (item.start - startHour * 60) * 0.8 + 1,
                    height:
                      item.kind === 'task'
                        ? dayView
                          ? 40
                          : 24
                        : Math.max(24, (item.end - item.start) * 0.8 - 2),
                    left: `calc(${(item.lane / item.laneCount) * 100}% + 4px)`,
                    width: `calc(${100 / item.laneCount}% - 8px)`,
                  }
                  const className = `agenda-time-block agenda-${item.kind} ${item.done ? 'is-done' : ''} ${!item.done && item.source.status === 'in_progress' ? 'is-active' : ''} ${item.kind === 'event' && item.end - item.start < 50 ? 'is-compact' : ''}`
                  if (dayView && item.kind === 'task') {
                    const project = projects.find(
                      (project) => project.id === (item.source.projectId || item.source.project_id)
                    )
                    return (
                      <div key={item.key} className={className} style={style}>
                        <TaskCheck
                          checked={item.done}
                          label={`${item.done ? 'Reabrir' : 'Concluir'} ${item.title}`}
                          onChange={() => onToggleTask(item.source)}
                          disabled={busyTask === item.source.id}
                        />
                        <time>{item.time}</time>
                        <button
                          type="button"
                          className="agenda-task-open"
                          onClick={() => onOpen(item)}
                        >
                          {item.title}
                        </button>
                        <span className="agenda-task-project">
                          {maskAgendaText(
                            project?.title || project?.name || item.source.project || 'Sem projeto',
                            hideValues
                          )}
                        </span>
                        {!item.done && item.source.status === 'in_progress' && (
                          <StatusBadge tone="accent">Em andamento</StatusBadge>
                        )}
                        {!item.done && item.source.priority && (
                          <PriorityTag priority={item.source.priority} />
                        )}
                      </div>
                    )
                  }
                  return (
                    <button
                      type="button"
                      key={item.key}
                      className={className}
                      style={style}
                      title={`${item.time} ${item.title}`}
                      onClick={() => onOpen(item)}
                    >
                      {item.kind === 'task' && (
                        <img
                          src={`/assets/agenda/task-${item.done ? 'done' : item.source.status === 'in_progress' ? 'active' : 'open'}.svg`}
                          alt=""
                        />
                      )}
                      <strong>
                        {item.kind === 'task' || (!dayView && item.end - item.start < 50)
                          ? `${item.time} `
                          : ''}
                        {item.title}
                      </strong>
                      {item.kind === 'event' && (
                        <small>
                          {item.time}
                          {item.source.endTime ? '–' + item.source.endTime.slice(0, 5) : ''} ·{' '}
                          {maskAgendaText(item.source.location || 'Evento', hideValues)}
                        </small>
                      )}
                    </button>
                  )
                })}
                {key === today && nowMinutes >= startHour * 60 && nowMinutes < endHour * 60 && (
                  <div
                    className="agenda-now-line"
                    style={{ top: (nowMinutes - startHour * 60) * 0.8 }}
                  >
                    <img src="/assets/agenda/now-dot.svg" alt="" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
