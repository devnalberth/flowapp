import { motion } from 'framer-motion'
import { useMotionPresets } from '../../components/ui/motion'
import { Flame, Play, Pause, Check, Plus, Sun, CalendarOff, Flag, Target } from 'lucide-react'
import Button from '../../components/ui/Button.jsx'
import CardHeader from '../../components/ui/CardHeader.jsx'
import HeroCard from '../../components/ui/HeroCard.jsx'
import HeroCelebration from '../../components/ui/HeroCelebration.jsx'
import ActionMenu from '../../components/ui/ActionMenu.jsx'
import TaskCheck from '../../components/ui/TaskCheck.jsx'
import PriorityTag from '../../components/ui/PriorityTag.jsx'
import ProgressBar from '../../components/ui/ProgressBar.jsx'
import ProgressRing from '../../components/ui/ProgressRing.jsx'
import AreaChip from '../../components/ui/AreaChip.jsx'
import EmptyState from '../../components/ui/EmptyState.jsx'
import { POMODORO_TECHNIQUES } from '../../hooks/useFocusTimer'
import { computeStreaks, isHabitDoneOn, formatMinutes } from '../../utils/habitStats'
import { calendarDayKey } from './dashboardPresentation'
import { computeProjectStats } from '../../utils/projectMetrics'

export function FocusHero({
  timer,
  task,
  project,
  goal,
  closed,
  total,
  habitsDone,
  habitsTotal,
  streak,
  focusMinutes,
  focusLabel = 'de foco hoje',
  unscheduled,
  onCreate,
  onNavigate,
  onComplete,
  mask,
}) {
  const config =
    timer.activeTechnique === 'custom'
      ? timer.customConfig
      : POMODORO_TECHNIQUES[timer.activeTechnique]
  if (closed && !timer.isRunning)
    return (
      <HeroCelebration
        className="home-hero home-hero--closed"
        badge="DIA FECHADO"
        title="Você fechou o dia."
        description="Tudo o que você planejou para hoje está feito."
        actions={
          <>
            <Button
              variant="secondary"
              icon={Sun}
              onClick={() => onNavigate('Tarefas', { initialFilter: 'tomorrow' })}
            >
              Planejar amanhã
            </Button>
            <Button
              className="home-dark-button"
              icon={Check}
              onClick={() => onNavigate('Tarefas', { initialFilter: 'done' })}
            >
              Ver concluídas
            </Button>
          </>
        }
      >
        <div className="home-hero__numbers">
          {[
            [`${total}/${total}`, 'tarefas feitas'],
            [formatMinutes(focusMinutes), 'de foco hoje'],
            [`${habitsDone}/${habitsTotal}`, 'hábitos'],
            [streak, 'sequência'],
          ].map(([value, label]) => (
            <div key={label}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </HeroCelebration>
    )
  if (!task)
    return (
      <HeroCard className="home-hero home-hero--free">
        <div className="home-hero__free-content">
          <span className="home-hero__badge home-hero__badge--muted">COMECE O DIA</span>
          <h2>Seu dia está livre</h2>
          <p>
            {unscheduled
              ? `Você tem ${unscheduled} tarefa${unscheduled === 1 ? '' : 's'} sem data. Escolha as mais importantes para hoje e comece pelo foco.`
              : 'Planeje seu dia: crie uma tarefa e comece pelo que mais importa.'}
          </p>
          <div className="home-hero__actions">
            <Button variant="accent" icon={Plus} onClick={onCreate}>
              Nova tarefa
            </Button>
            <Button
              className="home-dark-button"
              icon={CalendarOff}
              onClick={() => onNavigate('Tarefas', { initialFilter: 'unscheduled' })}
            >
              Ver tarefas sem data
            </Button>
          </div>
        </div>
      </HeroCard>
    )
  const duration =
    (timer.pomodoroMode === 'focus'
      ? config.focus
      : timer.pomodoroMode === 'break'
        ? config.break
        : config.longBreak) * 60
  const start = () => {
    if (timer.focusedTaskId !== task.id) {
      timer.handleFocusTask(task.id)
      timer.setIsRunning(true)
    } else timer.toggleTimer()
  }
  return (
    <HeroCard className="home-hero home-hero--focus">
      <div className="home-hero__focus-content">
        <div className="home-hero__top">
          <span className="home-hero__badge">
            <i />
            {timer.pomodoroMode === 'focus' ? 'EM FOCO AGORA' : 'HORA DA PAUSA'}
          </span>
          <ActionMenu
            label="Técnica de foco"
            trigger={
              <button className="home-hero__technique" type="button">
                {config.label} · sessão {timer.sessionsCompleted + 1} de {config.sessions}
              </button>
            }
            items={Object.values(POMODORO_TECHNIQUES).map((tech) => ({
              label: tech.label,
              icon: tech.icon,
              onClick: () => timer.switchTechnique(tech.id),
            }))}
          />
        </div>
        <div>
          <h2>{task.title}</h2>
          <p className="home-hero__context">
            {project?.title || task.project || 'Sem projeto'}
            {goal && (
              <>
                <span>·</span>
                <Flag size={12} /> conta para {mask(goal.title)}
              </>
            )}
          </p>
        </div>
        <span className="home-hero__timer" aria-label="Tempo restante">
          {timer.formatTime(timer.timeLeft)}
        </span>
        <ProgressBar value={duration - timer.timeLeft} max={duration} label={undefined} />
        <div className="home-hero__actions">
          <Button variant="accent" icon={timer.isRunning ? Pause : Play} onClick={start}>
            {timer.isRunning ? 'Pausar' : 'Iniciar'}
          </Button>
          <Button className="home-dark-button" icon={Check} onClick={() => onComplete(task.id)}>
            Concluir tarefa
          </Button>
          <span>
            {formatMinutes(focusMinutes)} {focusLabel}
          </span>
        </div>
      </div>
    </HeroCard>
  )
}

export function TodayTasks({
  tasks,
  overdue,
  today,
  focusedId,
  projects,
  onComplete,
  onFocus,
  onMove,
  onNavigate,
  onCreate,
  busy,
}) {
  const presets = useMotionPresets()
  const done = tasks.filter((t) => t.completed || t.status === 'done').length
  const row = (task, late = false) => {
    const checked = Boolean(task.completed || task.status === 'done')
    const project = projects.find((p) => p.id === (task.projectId || task.project_id))
    const priority =
      { high: 'Alta', urgent: 'Urgente', normal: 'Normal', low: 'Baixa' }[task.priority] ||
      task.priority
    return (
      <motion.div
        variants={presets.row}
        className={`home-task ${checked ? 'is-done' : ''} ${focusedId === task.id ? 'is-focused' : ''} ${late ? 'is-late' : ''}`}
        key={task.id}
      >
        <TaskCheck
          checked={checked}
          label={`${checked ? 'Reabrir' : 'Concluir'} ${task.title}`}
          disabled={busy === task.id}
          onChange={() => onComplete(task.id)}
        />
        <button
          className="home-task__text"
          onClick={() =>
            checked ? onNavigate('Tarefas', { initialFilter: 'done' }) : onFocus(task.id)
          }
        >
          <strong>{task.title}</strong>
          <span>
            {late ? 'atrasada · ' : ''}
            {task.time || task.due_time || 'Sem horário'} ·{' '}
            {project?.title || task.project || 'Sem projeto'}
          </span>
        </button>
        {late ? (
          <Button
            variant="secondary"
            size="sm"
            icon={Sun}
            disabled={busy === task.id}
            onClick={() => onMove(task.id, today)}
          >
            Mover para hoje
          </Button>
        ) : (
          !checked && (
            <>
              <button
                className="home-task__focus"
                onClick={() => onFocus(task.id)}
                aria-label={`Focar ${task.title}`}
              >
                <Play size={12} />
                {focusedId === task.id ? 'Em foco' : 'Focar'}
              </button>
              {priority && <PriorityTag priority={priority} />}
            </>
          )
        )}
      </motion.div>
    )
  }
  return (
    <section className="home-card home-tasks">
      <CardHeader
        title="Tarefas de hoje"
        subtitle={
          tasks.length
            ? `${done} de ${tasks.length} feitas${overdue.length ? ` · ${overdue.length} atrasadas` : ` · ${tasks.length - done ? `faltam ${tasks.length - done}` : 'tudo certo'}`}`
            : 'Nenhuma tarefa com data de hoje'
        }
        onAction={() => onNavigate('Tarefas', { initialFilter: 'today' })}
      />
      <AnimatedList className="home-tasks__list">
        {overdue.length > 0 && (
          <>
            <p className="home-section-label">ATRASADAS</p>
            {overdue.map((t) => row(t, true))}
            <p className="home-section-label">HOJE</p>
          </>
        )}
        {(overdue.length ? tasks.filter((t) => !t.completed && t.status !== 'done') : tasks).map(
          (t) => row(t)
        )}
        {!tasks.length && !overdue.length && (
          <EmptyState
            title="Nada para hoje ainda"
            description="Planeje o dia: crie uma tarefa ou mova uma de amanhã ou sem data para hoje."
            action="Adicionar tarefa"
            onAction={onCreate}
          />
        )}
      </AnimatedList>
      {overdue.length > 0 && done > 0 && (
        <button
          className="home-tasks__done"
          onClick={() => onNavigate('Tarefas', { initialFilter: 'done' })}
        >
          <span>
            <Check size={12} />
          </span>
          {done} concluídas hoje
        </button>
      )}
    </section>
  )
}

export function TodayHabits({ habits, today, focusTotals, onComplete, onNavigate, busy }) {
  const presets = useMotionPresets()
  const done = habits.filter((h) => isHabitDoneOn(h, today)).length
  return (
    <section className="home-card home-habits">
      <CardHeader
        title="Hábitos de hoje"
        subtitle={`${done} de ${habits.length} · o foco marca os AUTO`}
        onAction={() => onNavigate('Hábitos')}
      />
      <AnimatedList className="home-habits__list">
        {habits.map((h) => {
          const checked = isHabitDoneOn(h, today)
          const auto = h.timerCategory && h.timerGoalMinutes
          const minutes = h.timerCategory === 'study' ? focusTotals.study : focusTotals.work
          const streak = computeStreaks(h).current
          return (
            <motion.div variants={presets.row} className="home-habit" key={h.id}>
              <div className="home-habit__row">
                <TaskCheck
                  checked={checked}
                  label={`${h.label || h.name || h.title}${auto ? ' · automático pelo foco' : ''}`}
                  disabled={Boolean(auto) || busy === h.id}
                  onChange={() => onComplete(h.id)}
                />
                <div>
                  <strong>{h.label || h.name || h.title}</strong>
                  <span>
                    <Flame size={12} />
                    {streak} {streak === 1 ? 'dia' : 'dias'}
                    {auto ? ' · AUTO pelo foco' : ''}
                  </span>
                </div>
              </div>
              {auto && !checked && (
                <>
                  <ProgressBar value={minutes} max={h.timerGoalMinutes} />
                  <p>
                    {formatMinutes(minutes)} de {formatMinutes(h.timerGoalMinutes)}
                  </p>
                </>
              )}
            </motion.div>
          )
        })}
        {!habits.length && (
          <EmptyState
            title="Seu próximo hábito"
            description="Comece com um pequeno passo por dia."
            action="Ver hábitos"
            onAction={() => onNavigate('Hábitos')}
          />
        )}
      </AnimatedList>
    </section>
  )
}

export function AgendaCard({ events, today, onEdit, onCreate }) {
  const presets = useMotionPresets()
  const upcoming = events
    .filter((e) => calendarDayKey(e.date) >= today)
    .sort((a, b) => `${a.date} ${a.time || ''}`.localeCompare(`${b.date} ${b.time || ''}`))
  let previous = null
  return (
    <section className="home-card home-agenda">
      <CardHeader
        title="Agenda"
        subtitle={`${upcoming.filter((e) => calendarDayKey(e.date) === today).length} compromissos hoje`}
        onAction={onCreate}
        actionLabel="Criar evento"
      />
      <AnimatedList className="home-agenda__list">
        {upcoming.map((e) => {
          const date = calendarDayKey(e.date)
          const heading = previous !== date
          previous = date
          return (
            <motion.div variants={presets.row} key={e.id}>
              {heading && (
                <p className="home-section-label">
                  {date === today
                    ? 'HOJE'
                    : new Date(`${date}T12:00:00`).toLocaleDateString('pt-BR', {
                        weekday: 'short',
                        day: 'numeric',
                      })}
                </p>
              )}
              <button className="home-event" onClick={() => onEdit(e)}>
                <strong>{e.title}</strong>
                <span>
                  {e.time || 'Sem horário'} · {e.location || e.description || 'Evento'}
                </span>
              </button>
            </motion.div>
          )
        })}
        {!upcoming.length && (
          <EmptyState
            title="Agenda livre"
            description="Seus próximos compromissos aparecem aqui."
            action="Novo evento"
            onAction={onCreate}
          />
        )}
      </AnimatedList>
    </section>
  )
}

export function FocusGoals({ goals, projects, tasks, onNavigate, mask }) {
  const presets = useMotionPresets()
  const items = goals
    .map((g) => {
      const linked = projects
        .filter((p) => p.goalId === g.id || p.goal_id === g.id)
        .map((p) => computeProjectStats(p, tasks))
      const progress = linked.length
        ? Math.round(linked.reduce((sum, p) => sum + p.progress, 0) / linked.length)
        : Math.round((g.progress || 0) * 100)
      return {
        ...g,
        progress,
        total: linked.reduce((sum, p) => sum + p.totalTasks, 0),
        done: linked.reduce((sum, p) => sum + p.doneTasks, 0),
      }
    })
    .filter((g) => g.progress < 100 && g.status !== 'archived')
    .sort((a, b) =>
      String(a.endDate || a.end_date || a.due_date || a.deadline || '9999').localeCompare(
        String(b.endDate || b.end_date || b.due_date || b.deadline || '9999')
      )
    )
    .slice(0, 3)
  return (
    <section className="home-card home-goals">
      <CardHeader
        title="Metas em foco"
        subtitle="Tudo o que você faz soma aqui"
        onAction={() => onNavigate('Metas')}
      />
      <AnimatedList className="home-goals__grid">
        {items.map((g) => {
          const area =
            ['Financeiro', 'Estudos', 'Pessoal', 'Profissional', 'Saúde', 'Relacionamento'].find(
              (a) => a.toLowerCase() === g.area?.toLowerCase()
            ) || g.area
          const key = {
            Financeiro: 'financeiro',
            Estudos: 'estudos',
            Pessoal: 'pessoal',
            Profissional: 'profissional',
            Saúde: 'saude',
            Relacionamento: 'relacionamento',
          }[area]
          return (
            <motion.button
              variants={presets.row}
              key={g.id}
              className="home-goal"
              onClick={() => onNavigate('Metas')}
            >
              <ProgressRing
                value={g.progress}
                size="md"
                color={key ? `var(--fa-area-${key})` : undefined}
              />
              <AreaChip area={area} />
              <strong>{mask(g.title)}</strong>
              <span>
                {g.total
                  ? `${g.done} de ${g.total} tarefas`
                  : mask(g.target || 'Acompanhe sua meta')}
                <small>
                  {g.endDate || g.end_date || g.due_date || g.deadline
                    ? `até ${new Date(`${String(g.endDate || g.end_date || g.due_date || g.deadline).slice(0, 10)}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'short' })}`
                    : 'Sem prazo definido'}
                </small>
              </span>
            </motion.button>
          )
        })}
        {!items.length && (
          <EmptyState
            icon={Target}
            title="Uma direção para seu foco"
            description="Suas metas ativas aparecem aqui."
            action="Ver metas"
            onAction={() => onNavigate('Metas')}
          />
        )}
      </AnimatedList>
    </section>
  )
}

function AnimatedList({ className, children }) {
  const { reduce } = useMotionPresets()
  return (
    <motion.div
      className={className}
      variants={{ show: { transition: { staggerChildren: reduce ? 0 : 0.045 } } }}
    >
      {children}
    </motion.div>
  )
}
