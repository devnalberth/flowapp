import { useMemo } from 'react'
import { ChartColumn, Trophy, CircleCheck } from 'lucide-react'
import { motion } from 'framer-motion'
import EmptyState from '../../components/ui/EmptyState'
import CardHeader from '../../components/ui/CardHeader'
import { useMotionPresets } from '../../components/ui/motion'
import HabitHeatmap, { HeatmapLegend } from './HabitHeatmap.jsx'
import { getCategoryMeta } from './habitsMeta.js'
import {
  getWeeklyTrend,
  getHabitConsistency,
  getCategoryBreakdown,
  getRangeStats,
  totalCompletions,
} from '../../utils/habitStats.js'

// View "Estatísticas" da aba Hábitos: heatmap de consistência, tendência semanal,
// consistência por hábito e breakdown por categoria. Recebe os hábitos JÁ filtrados
// pelo chip de categoria da página.
export default function HabitsStats({
  habits,
  onOpenDetail,
  onDayClick,
  mask = (value) => value,
}) {
  const presets = useMotionPresets()
  const trend = useMemo(() => {
    return getWeeklyTrend(habits, 12).map((w) => ({
      ...w,
      pct: w.rate !== null ? Math.round(w.rate * 100) : null,
    }))
  }, [habits])

  const consistency = useMemo(() => getHabitConsistency(habits, 30), [habits])
  const breakdown = useMemo(() => getCategoryBreakdown(habits, 30), [habits])

  const monthStats = useMemo(() => {
    const today = new Date()
    const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1)
    return getRangeStats(habits, firstOfMonth, today)
  }, [habits])

  const totalDone = useMemo(() => totalCompletions(habits), [habits])

  if (!habits || habits.length === 0) {
    return (
      <div className="habits-stats-redesign">
        <EmptyState
          title="Sem hábitos nesta categoria"
          description="Crie um hábito para começar a acompanhar suas estatísticas."
        />
      </div>
    )
  }

  const availableWeeks = trend.filter((week) => week.pct !== null)
  const average = availableWeeks.length
    ? Math.round(
        availableWeeks.reduce((sum, week) => sum + week.pct, 0) /
          availableWeeks.length
      )
    : null
  const pctLabel = (value) =>
    value === null ? '—' : `${Math.round(value * 100)}%`
  const summary = [
    {
      Icon: ChartColumn,
      color: 'var(--fa-text-accent)',
      value: pctLabel(monthStats.rate),
      label: 'taxa do mês',
    },
    {
      Icon: Trophy,
      color: 'var(--fa-status-success)',
      value: monthStats.perfectDays,
      label: 'dias 100%',
    },
    {
      Icon: CircleCheck,
      color: 'var(--fa-area-profissional)',
      value: totalDone,
      label: 'conclusões no total',
    },
  ]
  return (
    <motion.div
      className="habits-stats-redesign"
      initial="hidden"
      animate="show"
      variants={presets.grid}
    >
      <motion.article
        className="habits-stat-card habits-stat-heatmap"
        variants={presets.card}
      >
        <CardHeader
          title="Consistência"
          subtitle="Últimos 4 meses · clique num dia para ver detalhes"
        />
        <div className="habits-stat-heatmap-body">
          <HabitHeatmap
            habits={habits}
            daysBack={126}
            onDayClick={onDayClick}
          />
          <div className="habits-stat-heatmap-context">
            <HeatmapLegend />
            <div>
              <strong>{pctLabel(monthStats.rate)}</strong>
              <p>
                taxa de{' '}
                {new Date().toLocaleDateString('pt-BR', { month: 'long' })} até
                hoje
              </p>
            </div>
            <div>
              <strong>{monthStats.perfectDays} dias 100%</strong>
              <p>com todos os hábitos feitos no mês</p>
            </div>
          </div>
        </div>
      </motion.article>
      <motion.article
        className="habits-stat-card habits-stat-summary"
        variants={presets.card}
      >
        <CardHeader
          title="Resumo do mês"
          subtitle={new Date()
            .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
            .replace(' de ', ' ')}
        />
        {summary.map(({ Icon, color, value, label }) => (
          <div className="habits-stat-mini" key={label}>
            <span style={{ color }}>
              <Icon size={18} strokeWidth={1.75} />
            </span>
            <div>
              <strong>{value}</strong>
              <p>{label}</p>
            </div>
          </div>
        ))}
      </motion.article>
      <div className="habits-stat-bottom">
        <motion.article
          className="habits-stat-card habits-stat-trend"
          variants={presets.card}
        >
          <CardHeader
            title="Tendência semanal"
            subtitle="Taxa de conclusão nas últimas 12 semanas"
          />
          <div
            className="habits-trend-chart"
            role="img"
            aria-label="Taxa de conclusão por semana"
          >
            {trend.map((week, index) => (
              <div
                className={`habits-trend-week ${index === trend.length - 1 ? 'is-current' : ''}`}
                key={week.label}
              >
                <div
                  className="habits-trend-column"
                  title={`Semana de ${week.label}: ${week.pct === null ? 'sem hábitos agendados' : `${week.pct}% (${week.completed}/${week.scheduled})`}`}
                >
                  {index === trend.length - 1 && week.pct !== null && (
                    <strong style={{ bottom: `${week.pct}%` }}>
                      {week.pct}%
                    </strong>
                  )}
                  <span style={{ height: `${week.pct ?? 0}%` }} />
                </div>
                <small>{index % 2 === 1 ? week.label : ''}</small>
              </div>
            ))}
          </div>
          <p className="habits-stat-caption">
            Semana atual em andamento · média das 12 semanas:{' '}
            {average === null ? '—' : `${average}%`}
          </p>
        </motion.article>
        <motion.article className="habits-stat-card" variants={presets.card}>
          <CardHeader
            title="Consistência por hábito"
            subtitle="Últimos 30 dias · clique para ver detalhes"
          />
          {consistency.map((row) => (
            <button
              className="habits-stat-bar"
              type="button"
              key={row.id}
              onClick={() => onOpenDetail?.(row.id)}
              title={`${row.completed}/${row.scheduled} conclusões em 30 dias`}
            >
              <span>
                <span>{mask(row.label)}</span>
                <small>
                  {row.completed}/{row.scheduled}
                </small>
                <strong>{pctLabel(row.rate)}</strong>
              </span>
              <span className="habits-stat-track">
                <span
                  style={{
                    width: `${(row.rate || 0) * 100}%`,
                    background: getCategoryMeta(row.category).color,
                  }}
                />
              </span>
            </button>
          ))}
        </motion.article>
        <motion.article className="habits-stat-card" variants={presets.card}>
          <CardHeader
            title="Por categoria"
            subtitle="Taxa de conclusão nos últimos 30 dias"
          />
          {breakdown.map((group) => (
            <div className="habits-stat-bar" key={group.categoryId}>
              <span>
                <span>{getCategoryMeta(group.categoryId).label}</span>
                <small>
                  {group.habits} {group.habits === 1 ? 'hábito' : 'hábitos'}
                </small>
                <strong>{pctLabel(group.rate)}</strong>
              </span>
              <span className="habits-stat-track">
                <span
                  style={{
                    width: `${(group.rate || 0) * 100}%`,
                    background: getCategoryMeta(group.categoryId).color,
                  }}
                />
              </span>
            </div>
          ))}
        </motion.article>
      </div>
    </motion.div>
  )
}
