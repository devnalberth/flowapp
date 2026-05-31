import { useMemo } from 'react'
import { CheckCircle2, ListChecks, Calendar, Target, Building2, ArrowUpRight } from 'lucide-react'
import { computeProjectStats, PROJECT_STATUS_META } from '../../utils/projectMetrics'
import './ProjectCard.css'

const formatDate = (value) => {
  if (!value) return null
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

const daysLeft = (end) => {
  if (!end) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  const d = new Date(`${String(end).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  return Math.round((d - today) / 86400000)
}

export default function ProjectCard({ project, tasks = [], client, goal, onOpen, index = 0 }) {
  const stats = useMemo(() => computeProjectStats(project, tasks), [project, tasks])
  const color = `#${(project.color || 'ff9500').replace('#', '')}`
  const statusMeta = PROJECT_STATUS_META[stats.autoStatus] || PROJECT_STATUS_META.todo
  const start = formatDate(project.startDate || project.start_date)
  const end = formatDate(project.endDate || project.end_date)
  const remaining = daysLeft(project.endDate || project.end_date)

  // Ângulo do anel de progresso
  const ring = `conic-gradient(${color} ${stats.progress * 3.6}deg, rgba(0,0,0,0.06) 0deg)`

  return (
    <button
      type="button"
      className="projCard"
      style={{ '--accent': color, '--i': Math.min(index, 12) }}
      onClick={() => onOpen?.(project)}
      data-status={stats.autoStatus}
    >
      <span className="projCard__stripe" />

      <header className="projCard__head">
        <div className="projCard__titleWrap">
          <h3 className="projCard__title">{project.title}</h3>
          <span className={`projCard__status projCard__status--${statusMeta.tone}`}>{statusMeta.label}</span>
        </div>
        <span className="projCard__open"><ArrowUpRight size={18} /></span>
      </header>

      <div className="projCard__meta">
        {client && (
          <span className="projCard__chip"><Building2 size={13} /> {client.name}</span>
        )}
        {goal && (
          <span className="projCard__chip projCard__chip--goal"><Target size={13} /> {goal.title}</span>
        )}
      </div>

      <div className="projCard__body">
        <div className="projCard__ring" style={{ background: ring }}>
          <div className="projCard__ringInner">
            <strong>{stats.progress}%</strong>
          </div>
        </div>

        <div className="projCard__stats">
          <div className="projCard__stat">
            <ListChecks size={15} />
            <span><strong>{stats.totalTasks}</strong> tarefas</span>
          </div>
          <div className="projCard__stat projCard__stat--done">
            <CheckCircle2 size={15} />
            <span><strong>{stats.doneTasks}</strong> concluídas</span>
          </div>
          <div className="projCard__stat projCard__stat--pending">
            <span className="projCard__dot" />
            <span><strong>{stats.pendingTasks}</strong> pendentes</span>
          </div>
        </div>
      </div>

      {(start || end) && (
        <footer className="projCard__dates">
          <span className="projCard__dateItem"><Calendar size={13} /> {start || '—'} {end ? `→ ${end}` : ''}</span>
          {typeof remaining === 'number' && stats.autoStatus !== 'completed' && (
            <span className={`projCard__deadline ${remaining < 0 ? 'is-late' : ''}`}>
              {remaining < 0 ? `${Math.abs(remaining)}d atrasado` : remaining === 0 ? 'vence hoje' : `${remaining}d restantes`}
            </span>
          )}
        </footer>
      )}
    </button>
  )
}
