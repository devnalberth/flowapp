import { useMemo } from 'react'
import './ProjectOverviewCard.css'

const MAX_VALUE = 100

export default function ProjectOverviewCard({ className = '', projects = [] }) {
  const stats = useMemo(() => {
    const totalProjects = projects.length
    const completedProjects = projects.filter(p => p.status === 'completed' || p.status === 'done').length
    const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0

    // Agrupar projetos por mês (últimos 5 meses)
    const now = new Date()
    const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
    const barData = []

    for (let i = 4; i >= 0; i--) {
      const month = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = months[month.getMonth()]
      const isCurrentMonth = i === 0

      // Calcular progresso médio dos projetos criados nesse mês
      const monthProjects = projects.filter(p => {
        const createdDate = new Date(p.created_at)
        return createdDate.getMonth() === month.getMonth() && 
               createdDate.getFullYear() === month.getFullYear()
      })

      const avgProgress = monthProjects.length > 0
        ? monthProjects.reduce((sum, p) => sum + (p.progress || 0), 0) / monthProjects.length
        : 0

      barData.push({
        month: monthName,
        progress: Math.round(avgProgress),
        active: isCurrentMonth,
      })
    }

    return { totalProjects, completionRate, barData }
  }, [projects])

  return (
    <section className={`proj ui-card ${className}`.trim()}>
      <header className="proj__header">
        <div className="txt-cardTitle">Visão Geral dos Projetos</div>
        <div className="proj__filter">
          <span>Este Ano</span>
          <svg className="proj__arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </div>
      </header>

      <div className="proj__chart">
        <div className="proj__axisY">
          {[100, 80, 60, 40, 20, 0].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="proj__plotWrapper">
          <div className="proj__plot" aria-hidden="true">
            {stats.barData.map((bar) => (
              <div key={bar.month} className="proj__group" data-active={bar.active || undefined}>
                <span className="proj__bar proj__bar--bg" />
                <span
                  className="proj__bar proj__bar--value"
                  style={{ height: `${bar.progress}%` }}
                />
              </div>
            ))}
          </div>

          <div className="proj__months">
            {stats.barData.map((bar) => (
              <span key={bar.month}>{bar.month}</span>
            ))}
          </div>
        </div>
      </div>

      <footer className="proj__footer">
        <div>
          <p className="proj__label">Total de Projetos</p>
          <p className="proj__value">{stats.totalProjects}</p>
        </div>
        <div className="proj__right">
          <p className="proj__label">Taxa de Conclusão</p>
          <p className="proj__value">{stats.completionRate}%</p>
        </div>
      </footer>
    </section>
  )
}
