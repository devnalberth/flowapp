import { useMemo } from 'react'
import './HabitHeatmap.css'
import { getHeatmapData, WEEKDAY_LABELS } from '../../utils/habitStats.js'

// Rampa Brasa dos tokens. Dia sem hábitos = neutro.
const RAMP = {
  empty: 'var(--fa-heat-0)',
  low: 'var(--fa-heat-1)',
  mid: 'var(--fa-heat-2)',
  high: 'var(--fa-heat-3)',
  full: 'var(--fa-heat-4)',
  neutral: 'var(--fa-heat-0)',
}

export function HeatmapLegend() {
  return (
    <div className="habitHeatmap__legend">
      <span>Menos</span>
      {[RAMP.empty, RAMP.low, RAMP.mid, RAMP.high, RAMP.full].map((color) => (
        <span
          key={color}
          className="habitHeatmap__legendDot"
          style={{ background: color }}
        />
      ))}
      <span>Mais</span>
    </div>
  )
}

function cellColor(cell) {
  if (cell.rate === null) return RAMP.neutral
  if (cell.rate >= 1) return RAMP.full
  if (cell.rate >= 0.67) return RAMP.high
  if (cell.rate >= 0.34) return RAMP.mid
  if (cell.rate > 0) return RAMP.low
  return RAMP.empty
}

function cellTitle(cell) {
  const date = cell.dateObj.toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'short',
  })
  if (cell.rate === null) return `${date} · sem hábitos agendados`
  return `${date} · ${cell.completed}/${cell.scheduled} hábitos (${Math.round(cell.rate * 100)}%)`
}

// Heatmap de consistência estilo GitHub: colunas = semanas (dom no topo).
// `singleHabit` restringe ao histórico de um único hábito (modal de detalhe).
export default function HabitHeatmap({
  habits,
  singleHabit = null,
  daysBack = 126,
  onDayClick,
  compact = false,
}) {
  const { weeks, monthLabels } = useMemo(
    () => getHeatmapData(habits, daysBack, singleHabit),
    [habits, singleHabit, daysBack]
  )

  return (
    <div className={`habitHeatmap ${compact ? 'habitHeatmap--compact' : ''}`}>
      <div
        className="habitHeatmap__months"
        style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)` }}
      >
        {monthLabels.map((m) => (
          <span
            key={`${m.label}-${m.index}`}
            className="habitHeatmap__month"
            style={{ gridColumnStart: m.index + 1 }}
          >
            {m.label}
          </span>
        ))}
      </div>

      <div className="habitHeatmap__body">
        <div className="habitHeatmap__weekdays">
          {WEEKDAY_LABELS.map((label, i) => (
            <span key={label} className="habitHeatmap__weekday">
              {label.charAt(0)}
            </span>
          ))}
        </div>

        <div
          className="habitHeatmap__grid"
          style={{
            gridTemplateColumns: `repeat(${weeks.length}, ${compact ? 'minmax(0, 20px)' : '1fr'})`,
          }}
        >
          {weeks.map((week, wIdx) => (
            <div key={wIdx} className="habitHeatmap__col">
              {week.map((cell, dIdx) =>
                cell ? (
                  <button
                    key={cell.dateKey}
                    type="button"
                    className={`habitHeatmap__cell ${cell.isToday ? 'habitHeatmap__cell--today' : ''}`}
                    style={{ background: cellColor(cell) }}
                    title={cellTitle(cell)}
                    aria-label={cellTitle(cell)}
                    onClick={() => onDayClick?.(cell.dateObj)}
                    tabIndex={onDayClick ? 0 : -1}
                  />
                ) : (
                  <span
                    key={dIdx}
                    className="habitHeatmap__cell habitHeatmap__cell--future"
                  />
                )
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="habitHeatmap__legend">
        <span>Menos</span>
        {[RAMP.empty, RAMP.low, RAMP.mid, RAMP.high, RAMP.full].map((color) => (
          <span
            key={color}
            className="habitHeatmap__legendDot"
            style={{ background: color }}
          />
        ))}
        <span>Mais</span>
      </div>
    </div>
  )
}
