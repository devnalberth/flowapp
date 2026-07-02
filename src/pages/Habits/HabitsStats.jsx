import { useMemo } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts'
import { CalendarCheck, Medal, Percent } from 'lucide-react'
import HabitHeatmap from './HabitHeatmap.jsx'
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
export default function HabitsStats({ habits, onOpenDetail, onDayClick }) {
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
      <div className="habitsStats">
        <div className="habitsStats__panel habitsStats__empty">
          <p>Sem hábitos nesta categoria ainda. Crie um hábito para começar a acompanhar suas estatísticas.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="habitsStats">
      {/* Heatmap de consistência */}
      <article className="habitsStats__panel">
        <header className="habitsStats__panelHeader">
          <div>
            <h3>Consistência</h3>
            <p>Últimos 4 meses · clique em um dia para ver detalhes</p>
          </div>
        </header>
        <HabitHeatmap habits={habits} daysBack={126} onDayClick={onDayClick} />
      </article>

      <div className="habitsStats__grid2">
        {/* Tendência semanal */}
        <article className="habitsStats__panel">
          <header className="habitsStats__panelHeader">
            <div>
              <h3>Tendência semanal</h3>
              <p>Taxa de conclusão nas últimas 12 semanas</p>
            </div>
          </header>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={trend} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="habitsTrendFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ff4800" stopOpacity={0.28} />
                  <stop offset="100%" stopColor="#ff9500" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11, fill: '#8b8b95' }} />
              <YAxis
                domain={[0, 100]}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 11, fill: '#8b8b95' }}
              />
              <Tooltip
                formatter={(value, _name, entry) => [
                  `${value}% (${entry?.payload?.completed}/${entry?.payload?.scheduled})`,
                  'Conclusão',
                ]}
                labelFormatter={(label) => `Semana de ${label}`}
              />
              <Area
                type="monotone"
                dataKey="pct"
                stroke="#ff4800"
                strokeWidth={3}
                fill="url(#habitsTrendFill)"
                dot={false}
                connectNulls={false}
                name="Conclusão"
              />
            </AreaChart>
          </ResponsiveContainer>
        </article>

        {/* Consistência por hábito */}
        <article className="habitsStats__panel">
          <header className="habitsStats__panelHeader">
            <div>
              <h3>Consistência por hábito</h3>
              <p>Últimos 30 dias · clique para ver detalhes</p>
            </div>
          </header>
          <div className="habitsStats__bars">
            {consistency.map((row) => {
              const color = getCategoryMeta(row.category)?.color || '#ff4800'
              const pct = row.rate !== null ? Math.round(row.rate * 100) : null
              return (
                <button
                  key={row.id}
                  type="button"
                  className="consistencyBar"
                  onClick={() => onOpenDetail?.(row.id)}
                  title={`${row.label} · ${row.completed}/${row.scheduled} conclusões em 30 dias`}
                >
                  <span className="consistencyBar__label">{row.label}</span>
                  <span className="consistencyBar__track">
                    <span
                      className="consistencyBar__fill"
                      style={{ width: `${pct ?? 0}%`, background: color }}
                    />
                  </span>
                  <span className="consistencyBar__pct">{pct !== null ? `${pct}%` : '—'}</span>
                </button>
              )
            })}
          </div>
        </article>
      </div>

      <div className="habitsStats__grid2">
        {/* Breakdown por categoria */}
        <article className="habitsStats__panel">
          <header className="habitsStats__panelHeader">
            <div>
              <h3>Por categoria</h3>
              <p>Taxa de conclusão nos últimos 30 dias</p>
            </div>
          </header>
          <div className="categoryBreak">
            {breakdown.map((group) => {
              const meta = getCategoryMeta(group.categoryId)
              const pct = group.rate !== null ? Math.round(group.rate * 100) : null
              return (
                <div key={group.categoryId} className="categoryBreak__row">
                  <span className="categoryBreak__dot" style={{ background: meta.color }} />
                  <span className="categoryBreak__label">
                    {meta.label}
                    <em>{group.habits} {group.habits === 1 ? 'hábito' : 'hábitos'}</em>
                  </span>
                  <span className="categoryBreak__track">
                    <span
                      className="categoryBreak__fill"
                      style={{ width: `${pct ?? 0}%`, background: meta.color }}
                    />
                  </span>
                  <span className="categoryBreak__pct">{pct !== null ? `${pct}%` : '—'}</span>
                </div>
              )
            })}
          </div>
        </article>

        {/* Mini-KPIs do mês */}
        <article className="habitsStats__panel">
          <header className="habitsStats__panelHeader">
            <div>
              <h3>Resumo do mês</h3>
              <p>{new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
            </div>
          </header>
          <div className="habitsStats__miniKpis">
            <div className="habitsStats__miniKpi">
              <span className="habitsStats__miniKpiIcon"><Percent size={16} /></span>
              <strong>{monthStats.rate !== null ? `${Math.round(monthStats.rate * 100)}%` : '—'}</strong>
              <span>taxa do mês</span>
            </div>
            <div className="habitsStats__miniKpi">
              <span className="habitsStats__miniKpiIcon"><Medal size={16} /></span>
              <strong>{monthStats.perfectDays}</strong>
              <span>{monthStats.perfectDays === 1 ? 'dia 100%' : 'dias 100%'}</span>
            </div>
            <div className="habitsStats__miniKpi">
              <span className="habitsStats__miniKpiIcon"><CalendarCheck size={16} /></span>
              <strong>{totalDone}</strong>
              <span>conclusões no total</span>
            </div>
          </div>
        </article>
      </div>
    </div>
  )
}
