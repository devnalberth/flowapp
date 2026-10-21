import { Flame, Pencil, Zap } from 'lucide-react'
import CardHeader from '../../components/ui/CardHeader'
import TaskCheck from '../../components/ui/TaskCheck'
import ProgressBar from '../../components/ui/ProgressBar'
import EmptyState from '../../components/ui/EmptyState'
import { getCategoryMeta } from './habitsMeta'
import { formatMinutes } from '../../utils/habitStats'

export function HabitChecklistRow({
  habit,
  done,
  timer,
  onToggle,
  onDetail,
  onEdit,
  mask,
  expanded = false,
}) {
  const category = getCategoryMeta(habit.category),
    Icon = habit.icon
  return (
    <div
      className={`habit-check-row ${done ? 'is-done' : ''} ${timer && (!done || expanded) ? 'has-timer' : ''}`}
      style={{
        '--habit-color': category.color,
        '--habit-bg': category.background,
      }}
    >
      <TaskCheck
        checked={done}
        label={`${done ? 'Desmarcar' : 'Concluir'} ${mask(habit.label || habit.name)}`}
        onChange={onToggle}
      />
      <span className="habit-check-icon">
        <Icon size={20} strokeWidth={1.75} />
      </span>
      <div className="habit-check-content">
        <div className="habit-check-title">
          <button type="button" onClick={onDetail}>
            {mask(habit.label || habit.name)}
          </button>
          {timer && (
            <span className="habits-auto">
              <Zap size={11} strokeWidth={1.75} />
              auto
            </span>
          )}
        </div>
        <span className="habit-check-caption">
          <i />
          {category.label}
          {timer
            ? ' · conclui pelo timer'
            : habit.time
              ? ` · ${habit.time}`
              : ''}
        </span>
        {timer && (!done || expanded) && (
          <div className="habit-check-progress">
            <ProgressBar value={timer.pct * 100} />
            <span>
              {formatMinutes(timer.got)} de {formatMinutes(timer.goal)}{' '}
              {done && timer.pct >= 1
                ? '· feito pelo timer'
                : `de ${timer.catLabel}`}
            </span>
          </div>
        )}
      </div>
      <span className="habit-check-streak">
        <Flame size={14} strokeWidth={1.75} />
        {habit.streak}
      </span>
      <button
        type="button"
        className="habit-edit-button"
        onClick={onEdit}
        aria-label={`Editar ${mask(habit.label || habit.name)}`}
      >
        <Pencil size={14} strokeWidth={1.75} />
      </button>
    </div>
  )
}
export default function HabitDailyChecklist({
  habits,
  todayKey,
  timerProgressOf,
  isComplete,
  onToggle,
  onDetail,
  onEdit,
  filters,
  onCreate,
  mask,
}) {
  const pending = habits.filter((h) => !isComplete(h, todayKey)),
    done = habits.filter((h) => isComplete(h, todayKey))
  return (
    <section
      className={`habits-checklist ${pending.length === 0 && done.length ? 'is-complete' : ''}`}
    >
      <CardHeader
        title={`Hoje · ${new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`}
        subtitle={
          pending.length === 0 && done.length
            ? `${done.length} de ${habits.length} feitos · dia completo`
            : `${habits.length} hábitos para hoje · pendentes primeiro`
        }
      />
      {filters}
      {!habits.length && (
        <EmptyState
          title="Nenhum hábito para hoje"
          description="Seus hábitos aparecem aqui nos dias programados."
          action="Novo hábito"
          onAction={onCreate}
        />
      )}
      {pending.length > 0 && (
        <h3 className="habits-group-label">PENDENTES · {pending.length}</h3>
      )}
      {pending.map((habit) => (
        <HabitChecklistRow
          key={habit.id}
          habit={habit}
          timer={timerProgressOf(habit)}
          onToggle={() => onToggle(habit.id)}
          onDetail={() => onDetail(habit.id)}
          onEdit={() => onEdit(habit)}
          mask={mask}
        />
      ))}
      {done.length > 0 && (
        <h3 className="habits-group-label">FEITOS HOJE · {done.length}</h3>
      )}
      {done.map((habit) => (
        <HabitChecklistRow
          key={habit.id}
          habit={habit}
          done
          expanded={pending.length === 0}
          timer={timerProgressOf(habit)}
          onToggle={() => onToggle(habit.id)}
          onDetail={() => onDetail(habit.id)}
          onEdit={() => onEdit(habit)}
          mask={mask}
        />
      ))}
    </section>
  )
}
export function HabitSequences({ habits, onDetail, mask }) {
  return (
    <section className="habits-sequences">
      <CardHeader
        title="Sequências"
        subtitle="Quanto falta para o próximo marco"
      />
      {[...habits]
        .sort((a, b) => b.streak - a.streak)
        .map((habit) => {
          const goal = [7, 30, 100].find((m) => m > habit.streak) || 100
          const Icon = habit.icon,
            category = getCategoryMeta(habit.category)
          return (
            <button
              type="button"
              className="habit-sequence"
              key={habit.id}
              onClick={() => onDetail(habit.id)}
              style={{
                '--habit-color': category.color,
                '--habit-bg': category.background,
              }}
            >
              <span className="habit-sequence-title">
                <i>
                  <Icon size={16} strokeWidth={1.75} />
                </i>
                <strong>{mask(habit.label || habit.name)}</strong>
                <small>
                  <Flame size={14} strokeWidth={1.75} />
                  {habit.streak} dias
                </small>
              </span>
              <span className="habit-sequence-progress">
                <ProgressBar value={habit.streak} max={goal} />
                <small>
                  {habit.streak >= 100
                    ? 'Marco de 100 alcançado'
                    : `faltam ${goal - habit.streak} para ${goal}`}
                </small>
              </span>
            </button>
          )
        })}
    </section>
  )
}
