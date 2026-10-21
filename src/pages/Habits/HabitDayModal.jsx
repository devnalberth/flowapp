import { CalendarDays, Check, CircleCheck } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import StatusBadge from '../../components/ui/StatusBadge'
import { getCategoryMeta } from './habitsMeta'
import { formatMinutes } from '../../utils/habitStats'
import { focusLogService } from '../../services/focusLogService'

export default function HabitDayModal({ day, onClose, onCompleteDate, mask }) {
  const title = day.date
    .toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
    .replace('-feira', '')
  const log = focusLogService.getAll()[day.dateStr]
  const sorted = [...day.habits].sort(
    (a, b) => Number(a.isCompleted) - Number(b.isCompleted)
  )
  return (
    <Modal
      width={520}
      className="habit-day-modal"
      title={title.charAt(0).toUpperCase() + title.slice(1)}
      subtitle={`${day.completedCount} de ${day.total} hábitos concluídos · clique para marcar ou desmarcar`}
      icon={CalendarDays}
      onClose={onClose}
    >
      <div className="habit-day-list">
        {sorted.map((habit) => {
          const category = getCategoryMeta(habit.category)
          const Icon = habit.icon
          const focus = log?.categories?.[habit.timerCategory]
          return (
            <button
              type="button"
              className={`habit-day-row ${habit.isCompleted ? 'is-complete' : ''}`}
              key={habit.id}
              aria-pressed={habit.isCompleted}
              onClick={() => onCompleteDate(habit.id, day.dateStr)}
            >
              <span
                className="habit-day-icon"
                style={{
                  background: category.background,
                  color: category.color,
                }}
              >
                <Icon size={18} strokeWidth={1.75} />
              </span>
              <span className="habit-day-text">
                <strong>{mask(habit.label || habit.name)}</strong>
                <small>
                  {category.label}
                  {habit.timerCategory && !habit.isCompleted
                    ? ` · ${focus ? formatMinutes(focus) : '0h'} de foco nesse dia`
                    : ''}
                </small>
              </span>
              <StatusBadge
                tone={habit.isCompleted ? 'success' : 'neutral'}
                icon={habit.isCompleted ? Check : undefined}
              >
                {habit.isCompleted ? 'Concluído' : 'Não feito'}
              </StatusBadge>
            </button>
          )
        })}
        {!day.habits.length && <p>Nenhum hábito programado para este dia.</p>}
        <p className="habit-day-note">
          <CircleCheck size={14} strokeWidth={1.75} />
          Marcar um dia passado recalcula as sequências na hora.
        </p>
      </div>
    </Modal>
  )
}
