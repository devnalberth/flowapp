import { useMemo } from 'react'
import { X, Flame, Trophy, CalendarCheck, CalendarDays, Zap, Pencil } from 'lucide-react'
import HabitHeatmap from './HabitHeatmap.jsx'
import { getCategoryMeta, getHabitIcon, TIMER_CATEGORY_LABEL } from './habitsMeta.js'
import {
  computeStreaks,
  getHabitConsistency,
  getBestWeekday,
  formatMinutes,
} from '../../utils/habitStats.js'

// Modal de detalhe de um hábito: streaks derivados do histórico, taxa 30d,
// melhor dia da semana e heatmap individual dos últimos 4 meses.
export default function HabitDetailModal({ habit, timerProgress = null, onClose, onEdit }) {
  const category = getCategoryMeta(habit.category)
  const IconComponent = habit.icon || getHabitIcon(habit.iconId || 'sparkles')

  const streaks = useMemo(() => computeStreaks(habit), [habit])
  const consistency30 = useMemo(() => getHabitConsistency([habit], 30)[0], [habit])
  const bestWeekday = useMemo(() => getBestWeekday(habit, 90), [habit])
  const totalDone = Array.isArray(habit.completions) ? habit.completions.length : 0

  return (
    <div className="dayModal habitDetail">
      <div className="dayModal__backdrop" onClick={onClose} />
      <div className="dayModal__panel habitDetail__panel">
        <header className="dayModal__header">
          <div className="habitDetail__title">
            <div className="dayModal__itemIcon" style={{ backgroundColor: category.color }}>
              <IconComponent size={18} />
            </div>
            <div>
              <h3>{habit.label || habit.name}</h3>
              <p>
                {category.label}
                {habit.frequency === 'custom' || habit.frequency === 'weekly'
                  ? ' · dias personalizados'
                  : ' · diário'}
              </p>
            </div>
            {habit.timerCategory && habit.timerGoalMinutes && (
              <span className="habitAuto" title="Concluído automaticamente pelo timer de foco">
                <Zap size={11} /> auto
              </span>
            )}
          </div>
          <button className="dayModal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="dayModal__content habitDetail__content">
          <div className="habitDetail__kpis">
            <div className="habitDetail__kpi">
              <span className="habitDetail__kpiIcon" style={{ color: '#ff8d00' }}><Flame size={16} /></span>
              <strong>{streaks.current}</strong>
              <span>sequência atual</span>
            </div>
            <div className="habitDetail__kpi">
              <span className="habitDetail__kpiIcon" style={{ color: '#7c5cff' }}><Trophy size={16} /></span>
              <strong>{Math.max(streaks.best, habit.bestStreak || 0)}</strong>
              <span>recorde</span>
            </div>
            <div className="habitDetail__kpi">
              <span className="habitDetail__kpiIcon" style={{ color: '#16a34a' }}><CalendarCheck size={16} /></span>
              <strong>
                {consistency30?.rate !== null && consistency30 !== undefined
                  ? `${Math.round(consistency30.rate * 100)}%`
                  : '—'}
              </strong>
              <span>taxa · 30d</span>
            </div>
            <div className="habitDetail__kpi">
              <span className="habitDetail__kpiIcon" style={{ color: '#0ea5e9' }}><CalendarDays size={16} /></span>
              <strong>{bestWeekday ? bestWeekday.label : '—'}</strong>
              <span>melhor dia</span>
            </div>
          </div>

          {timerProgress && (
            <div className="habitDetail__timer">
              <div className="habitDetail__timerHeader">
                <span>
                  <Zap size={13} /> Meta de {TIMER_CATEGORY_LABEL[habit.timerCategory] || 'foco'} do dia
                </span>
                <strong>
                  {formatMinutes(timerProgress.got)} / {formatMinutes(timerProgress.goal)}
                </strong>
              </div>
              <div className="dailyCheckItem__timerBar">
                <span
                  className="dailyCheckItem__timerFill"
                  style={{ width: `${Math.round(timerProgress.pct * 100)}%` }}
                />
              </div>
            </div>
          )}

          <div className="habitDetail__section">
            <h4>Histórico · últimos 4 meses</h4>
            <HabitHeatmap singleHabit={habit} daysBack={126} />
          </div>

          <p className="habitDetail__totals">
            {totalDone} {totalDone === 1 ? 'conclusão registrada' : 'conclusões registradas'} desde a criação
          </p>
        </div>

        <footer className="habitDetail__footer">
          <button type="button" className="btnPrimary" onClick={onEdit}>
            <Pencil size={16} />
            <span>Editar hábito</span>
          </button>
        </footer>
      </div>
    </div>
  )
}
