import { useMemo } from 'react'
import {
  Flame,
  Trophy,
  CircleCheck,
  CalendarDays,
  Zap,
  Pencil,
  Clock,
  Check,
  Ellipsis,
  Trash2,
} from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import ActionMenu from '../../components/ui/ActionMenu'
import ProgressBar from '../../components/ui/ProgressBar'
import '../../components/ui/Drawer.css'
import HabitHeatmap from './HabitHeatmap.jsx'
import { getCategoryMeta, getHabitIcon, WEEKDAY_NAMES } from './habitsMeta.js'
import {
  computeStreaks,
  getHabitConsistency,
  getBestWeekday,
  formatMinutes,
  localDateKey,
  parseCustomDays,
} from '../../utils/habitStats.js'

export default function HabitDetailModal({
  habit,
  timerProgress = null,
  onClose,
  onEdit,
  onDelete,
  onToggleToday,
  mask = (value) => value,
}) {
  const category = getCategoryMeta(habit.category)
  const Icon = habit.icon || getHabitIcon(habit.iconId || 'sparkles')
  const streaks = useMemo(() => computeStreaks(habit), [habit])
  const consistency30 = useMemo(
    () => getHabitConsistency([habit], 30)[0],
    [habit]
  )
  const bestWeekday = useMemo(() => getBestWeekday(habit, 90), [habit])
  const totalDone = Array.isArray(habit.completions)
    ? habit.completions.length
    : 0
  const done = habit.completions?.includes(localDateKey())
  const metrics = [
    {
      Icon: Flame,
      color: 'var(--fa-text-accent)',
      value: streaks.current,
      label: 'sequência atual',
    },
    {
      Icon: Trophy,
      color: 'var(--fa-area-relacionamento)',
      value: Math.max(streaks.best, habit.bestStreak || 0),
      label: 'recorde',
    },
    {
      Icon: CircleCheck,
      color: 'var(--fa-status-success)',
      value:
        consistency30?.rate != null
          ? `${Math.round(consistency30.rate * 100)}%`
          : '—',
      label: 'taxa · 30 dias',
    },
    {
      Icon: CalendarDays,
      color: 'var(--fa-area-profissional)',
      value: bestWeekday?.label || '—',
      label: 'melhor dia',
    },
  ]
  return (
    <Modal
      drawer
      width={540}
      className="habit-detail-drawer"
      title="Hábito"
      onClose={onClose}
      headerActions={
        <ActionMenu
          label="Ações do hábito"
          trigger={
            <button
              type="button"
              className="fa-modal__close"
              aria-label="Mais ações"
            >
              <Ellipsis size={16} />
            </button>
          }
          items={[
            { label: 'Editar hábito', icon: Pencil, onClick: onEdit },
            {
              label: 'Excluir hábito',
              icon: Trash2,
              danger: true,
              onClick: onDelete,
            },
          ]}
        />
      }
      footer={
        <>
          <Button variant="secondary" icon={Check} onClick={onToggleToday}>
            {done ? 'Desmarcar hoje' : 'Marcar como feito hoje'}
          </Button>
          <Button icon={Pencil} onClick={onEdit}>
            Editar hábito
          </Button>
        </>
      }
    >
      <div className="habit-detail-content">
        <div className="habit-detail-title">
          <span
            style={{ background: category.background, color: category.color }}
          >
            <Icon size={24} strokeWidth={1.75} />
          </span>
          <div>
            <h3>{mask(habit.label || habit.name)}</h3>
            <div className="habit-detail-chips">
              <span
                style={{
                  background: category.background,
                  color: category.color,
                }}
              >
                {category.label}
              </span>
              <span>
                {habit.frequency === 'daily'
                  ? 'Todos os dias'
                  : parseCustomDays(habit)
                      .map((day) => WEEKDAY_NAMES[day])
                      .join(' · ') || 'Dias personalizados'}
              </span>
              {timerProgress && (
                <span className="habits-auto">
                  <Zap size={11} />
                  auto
                </span>
              )}
            </div>
          </div>
        </div>
        <div className="habit-detail-metrics">
          {metrics.map(({ Icon: MetricIcon, color, value, label }) => (
            <div key={label}>
              <MetricIcon size={16} strokeWidth={1.75} style={{ color }} />
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        {timerProgress && (
          <div className="habit-detail-focus">
            <div>
              <Zap size={14} />
              <strong>Meta de foco do dia</strong>
              <span>
                {formatMinutes(timerProgress.got)} /{' '}
                {formatMinutes(timerProgress.goal)}
              </span>
            </div>
            <ProgressBar value={timerProgress.pct * 100} />
            <p>
              Marca sozinho quando o timer de foco em {category.label} chegar a{' '}
              {formatMinutes(timerProgress.goal)} hoje.
            </p>
          </div>
        )}
        <section className="habit-detail-history">
          <h4>HISTÓRICO · ÚLTIMOS 4 MESES</h4>
          <HabitHeatmap singleHabit={habit} daysBack={126} compact />
          <p>
            {totalDone}{' '}
            {totalDone === 1
              ? 'conclusão registrada'
              : 'conclusões registradas'}{' '}
            desde a criação
          </p>
        </section>
        <div className="habit-detail-info">
          <Clock size={16} />
          <span>Horário ideal</span>
          <strong>{habit.time || 'Não definido'}</strong>
        </div>
        {habit.description && (
          <section className="habit-detail-description">
            <h4>POR QUE ESSE HÁBITO</h4>
            <p>{mask(habit.description)}</p>
          </section>
        )}
      </div>
    </Modal>
  )
}
