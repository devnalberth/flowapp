import { useMemo } from 'react'
import {
  FolderKanban, TrendingUp, CheckCircle2, Gauge, AlertTriangle,
  CalendarClock, ListChecks,
} from 'lucide-react'
import { computeProjectStats, PROJECT_STATUS_META } from '../../utils/projectMetrics'

// Cores sólidas por status para a barra de distribuição (tons do design system)
const STATUS_BAR = [
  { id: 'todo', color: '#c4c9d4' },
  { id: 'in_progress', color: '#3b82f6' },
  { id: 'review', color: '#ff7a00' },
  { id: 'completed', color: '#16a34a' },
]

const dayMs = 86400000

const daysLeft = (end) => {
  if (!end) return null
  const d = new Date(`${String(end).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  const today = new Date(); today.setHours(0, 0, 0, 0)
  return Math.round((d - today) / dayMs)
}

const fmtDeadline = (end) =>
  new Date(`${String(end).slice(0, 10)}T00:00:00`)
    .toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })

// Dashboard da galeria de projetos: KPIs, distribuição por status e prazos.
// Recebe apenas projetos ATIVOS (arquivados ficam fora das métricas).
export default function ProjectsDashboard({ projects = [], tasks = [], onOpenProject }) {
  const dash = useMemo(() => {
    const withStats = projects.map((p) => ({ project: p, stats: computeProjectStats(p, tasks) }))

    const byStatus = { todo: 0, in_progress: 0, review: 0, completed: 0 }
    let pendingTasks = 0
    let progressSum = 0

    withStats.forEach(({ stats }) => {
      byStatus[stats.autoStatus] = (byStatus[stats.autoStatus] || 0) + 1
      pendingTasks += stats.pendingTasks
      progressSum += stats.progress
    })

    const late = withStats.filter(({ project, stats }) => {
      const left = daysLeft(project.endDate || project.end_date)
      return left != null && left < 0 && stats.autoStatus !== 'completed'
    }).length

    const deadlines = withStats
      .map(({ project, stats }) => ({ project, stats, left: daysLeft(project.endDate || project.end_date) }))
      .filter(({ left, stats }) => left != null && stats.autoStatus !== 'completed')
      .sort((a, b) => a.left - b.left)
      .slice(0, 4)

    return {
      total: projects.length,
      inProgress: byStatus.in_progress + byStatus.review,
      completed: byStatus.completed,
      avgProgress: projects.length ? Math.round(progressSum / projects.length) : 0,
      pendingTasks,
      late,
      byStatus,
      deadlines,
    }
  }, [projects, tasks])

  if (!projects.length) return null

  return (
    <section className="projDash" aria-label="Resumo dos projetos">
      <div className="projDash__kpis">
        <div className="projKpi">
          <FolderKanban size={17} />
          <strong>{dash.total}</strong>
          <span>Projetos ativos</span>
        </div>
        <div className="projKpi">
          <TrendingUp size={17} />
          <strong>{dash.inProgress}</strong>
          <span>Em andamento</span>
        </div>
        <div className="projKpi projKpi--done">
          <CheckCircle2 size={17} />
          <strong>{dash.completed}</strong>
          <span>Concluídos</span>
        </div>
        <div className="projKpi">
          <ListChecks size={17} />
          <strong>{dash.pendingTasks}</strong>
          <span>Tarefas pendentes</span>
        </div>
        <div className="projKpi">
          <Gauge size={17} />
          <strong>{dash.avgProgress}%</strong>
          <span>Progresso médio</span>
        </div>
        <div className={`projKpi ${dash.late > 0 ? 'projKpi--late' : ''}`}>
          <AlertTriangle size={17} />
          <strong>{dash.late}</strong>
          <span>Atrasados</span>
        </div>
      </div>

      <div className="projDash__grid">
        <div className="projDash__panel">
          <h3 className="projDash__panelTitle">Distribuição por status</h3>
          <div className="projDash__bar" role="img" aria-label="Distribuição dos projetos por status">
            {STATUS_BAR.filter(({ id }) => dash.byStatus[id] > 0).map(({ id, color }) => (
              <span
                key={id}
                className="projDash__barSeg"
                style={{ flexGrow: dash.byStatus[id], background: color }}
                title={`${PROJECT_STATUS_META[id].label}: ${dash.byStatus[id]}`}
              />
            ))}
          </div>
          <ul className="projDash__legend">
            {STATUS_BAR.map(({ id, color }) => (
              <li key={id}>
                <span className="projDash__legendDot" style={{ background: color }} />
                {PROJECT_STATUS_META[id].label}
                <strong>{dash.byStatus[id]}</strong>
              </li>
            ))}
          </ul>
        </div>

        <div className="projDash__panel">
          <h3 className="projDash__panelTitle">
            <CalendarClock size={15} /> Próximos prazos
          </h3>
          {dash.deadlines.length === 0 ? (
            <p className="projDash__empty">Nenhum projeto pendente com prazo definido.</p>
          ) : (
            <ul className="projDash__deadlines">
              {dash.deadlines.map(({ project, left }) => (
                <li key={project.id}>
                  <button type="button" onClick={() => onOpenProject?.(project.id)}>
                    <span
                      className="projDash__deadlineDot"
                      style={{ background: `#${(project.color || 'ff9500').replace('#', '')}` }}
                    />
                    <span className="projDash__deadlineTitle">{project.title}</span>
                    <span className="projDash__deadlineDate">{fmtDeadline(project.endDate || project.end_date)}</span>
                    <span className={`projDash__deadlineLeft ${left < 0 ? 'is-late' : left <= 7 ? 'is-soon' : ''}`}>
                      {left < 0 ? `${Math.abs(left)}d atrasado` : left === 0 ? 'vence hoje' : `${left}d`}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  )
}
