import { CircleCheck, Zap, Plus } from 'lucide-react'
import Button from '../../components/ui/Button'
import HeroCard from '../../components/ui/HeroCard'
import KpiCard from '../../components/ui/KpiCard'
import ProgressRing from '../../components/ui/ProgressRing'
import ProgressBar from '../../components/ui/ProgressBar'
import { formatMinutes, isHabitActiveOnDate } from '../../utils/habitStats'

export default function HabitOverview({
  kpis,
  habits,
  timerProgressOf,
  isComplete,
  todayKey,
  monthStats,
  onDetail,
  onStats,
  onCreate,
  mask,
}) {
  const active = habits.filter((habit) =>
    isHabitActiveOnDate(habit, new Date())
  )
  const automatic = active.filter((h) => timerProgressOf(h)).slice(0, 2)
  const done = active.filter((h) => isComplete(h, todayKey))
  const finished =
    kpis.day.scheduled > 0 && kpis.day.completed === kpis.day.scheduled
  if (!habits.length)
    return (
      <div className="habits-overview">
        <HeroCard className="habits-today-hero habits-today-hero--empty">
          <div className="habits-empty-hero-content">
            <span className="habits-eyebrow">HÁBITOS</span>
            <h2>Comece hoje</h2>
            <p>
              Um hábito pequeno, todo dia, vale mais que um plano perfeito. Os
              de foco e estudo podem se marcar sozinhos pelo timer.
            </p>
            <Button variant="accent" icon={Plus} onClick={onCreate}>
              Criar primeiro hábito
            </Button>
          </div>
        </HeroCard>
        <KpiCard
          label="Sequência ativa"
          value="—"
          variation="0 dias"
          context="comece hoje"
          onAction={onStats}
        />
        <KpiCard
          label="Semana"
          value="—"
          variation="0 de 0"
          context="sem hábitos na semana"
          onAction={onStats}
        />
        <KpiCard
          label="Mais consistente · 30 dias"
          value="—"
          variation="30 dias"
          context="sem dados ainda"
          onAction={onStats}
        />
        <KpiCard
          label={`Dias 100% em ${new Date().toLocaleDateString('pt-BR', { month: 'long' })}`}
          value="—"
          variation={new Date().toLocaleDateString('pt-BR', { month: 'long' })}
          context="sem dados ainda"
          onAction={onStats}
        />
      </div>
    )
  return (
    <div className="habits-overview">
      <HeroCard
        className={`habits-today-hero ${finished ? 'is-complete' : ''}`}
      >
        <div className="habits-hero-summary">
          <div>
            <span className="habits-eyebrow">
              HOJE ·{' '}
              {new Date()
                .toLocaleDateString('pt-BR', {
                  weekday: 'long',
                  day: 'numeric',
                })
                .replace('-feira', '')
                .replace('.', '')
                .toUpperCase()}
            </span>
            <div className="habits-hero-number">
              <strong>
                {kpis.day.completed} de {kpis.day.scheduled}
              </strong>
              <span>hábitos feitos</span>
            </div>
            <p>
              {finished
                ? 'Dia completo. Todas as sequências seguem vivas.'
                : automatic.length
                  ? 'Cada sessão de foco conta para os seus hábitos.'
                  : kpis.day.scheduled
                    ? 'Um hábito de cada vez. Você está construindo sua rotina.'
                    : 'Um espaço para as pequenas vitórias do dia.'}
            </p>
          </div>
          <ProgressRing
            size="lg"
            value={(kpis.day.rate || 0) * 100}
            label="Hábitos concluídos hoje"
          />
        </div>
        <div className="habits-hero-timers">
          {automatic.map((habit) => {
            const timer = timerProgressOf(habit)
            const Icon = habit.icon
            return (
              <div className="habits-hero-timer" key={habit.id}>
                <div>
                  <Icon size={16} strokeWidth={1.75} />
                  <button type="button" onClick={() => onDetail(habit.id)}>
                    {mask(habit.label || habit.name)}
                  </button>
                  <span className="habits-auto">
                    <Zap size={11} strokeWidth={1.75} />
                    auto
                  </span>
                  <strong>
                    {formatMinutes(timer.got)} de {formatMinutes(timer.goal)}
                  </strong>
                </div>
                <ProgressBar value={timer.pct * 100} />
              </div>
            )
          })}
        </div>
        <div className="habits-hero-done">
          <CircleCheck size={16} strokeWidth={1.75} />
          <span>{done.length ? 'Feitos:' : 'Seu próximo passo:'}</span>
          <strong>
            {finished
              ? `os ${kpis.day.scheduled} hábitos de hoje`
              : done.length
                ? done.map((h) => mask(h.label || h.name)).join(' · ')
                : 'escolha um hábito para começar'}
          </strong>
        </div>
      </HeroCard>
      <KpiCard
        label="Sequência ativa"
        value={
          kpis.topStreakHabit?.streak
            ? `${kpis.topStreakHabit.streak} dias`
            : '—'
        }
        variation={`recorde ${kpis.bestEver}`}
        context={mask(
          kpis.topStreakHabit?.label ||
            kpis.topStreakHabit?.name ||
            'Comece hoje'
        )}
        onAction={
          kpis.topStreakHabit
            ? () => onDetail(kpis.topStreakHabit.id)
            : undefined
        }
      />
      <KpiCard
        label="Semana"
        value={
          kpis.week.rate != null ? `${Math.round(kpis.week.rate * 100)}%` : '—'
        }
        variation={`${kpis.week.completed} de ${kpis.week.scheduled}`}
        context="conclusões até hoje"
        onAction={onStats}
      />
      <KpiCard
        label="Mais consistente · 30 dias"
        value={
          kpis.topConsistent
            ? `${Math.round(kpis.topConsistent.rate * 100)}%`
            : '—'
        }
        variation={
          kpis.topConsistent
            ? `${kpis.topConsistent.completed} de ${kpis.topConsistent.scheduled}`
            : 'Sem histórico'
        }
        context={mask(kpis.topConsistent?.label || 'Comece hoje')}
        onAction={
          kpis.topConsistent ? () => onDetail(kpis.topConsistent.id) : undefined
        }
      />
      <KpiCard
        label={`Dias 100% em ${new Date().toLocaleDateString('pt-BR', { month: 'long' })}`}
        value={monthStats.perfectDays}
        variation={`de ${monthStats.activeDays}`}
        context="todos os hábitos feitos"
        onAction={onStats}
      />
    </div>
  )
}
