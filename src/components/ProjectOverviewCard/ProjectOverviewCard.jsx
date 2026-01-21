import { useMemo, useState } from 'react'
import './ProjectOverviewCard.css'

const MAX_VALUE = 100

export default function ProjectOverviewCard({ className = '', projects = [], tasks = [] }) { // Adicionado tasks nas props
  const [filter, setFilter] = useState('year') // 'year' | 'month' | 'week'

  const filterLabel = useMemo(() => {
    switch (filter) {
      case 'year': return 'Este Ano'
      case 'month': return 'Este Mês'
      case 'week': return 'Esta Semana'
    }
  }, [filter])

  const toggleFilter = () => {
    const next = filter === 'year' ? 'month' : filter === 'month' ? 'week' : 'year'
    setFilter(next)
  }

  const stats = useMemo(() => {
    // 1. Enriquecer projetos com progresso calculado dinamicamente
    const projectsWithProgress = projects.map(p => {
      const pTasks = tasks.filter(t => t.projectId === p.id || t.project === p.title)
      const total = pTasks.length
      const done = pTasks.filter(t => t.completed).length
      const progress = total > 0 ? (done / total) * 100 : 0
      return { ...p, calculatedProgress: progress, totalTasks: total, completedTasks: done }
    })

    const totalProjects = projectsWithProgress.length
    // Considera concluído se status for 'completed'/'done' OU se progresso calculado for 100% (com pelo menos 1 tarefa)
    const completedProjects = projectsWithProgress.filter(p =>
      p.status === 'completed' || p.status === 'done' || (p.calculatedProgress === 100 && p.totalTasks > 0)
    ).length

    const completionRate = totalProjects > 0 ? Math.round((completedProjects / totalProjects) * 100) : 0

    // 2. Gerar dados do gráfico baseado no filtro
    const now = new Date()
    const barData = []

    if (filter === 'year') {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      for (let i = 4; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const monthIdx = date.getMonth()
        const year = date.getFullYear()

        const relevantProjects = projectsWithProgress.filter(p => {
          const d = new Date(p.created_at)
          return d.getMonth() === monthIdx && d.getFullYear() === year
        })

        const avg = relevantProjects.length > 0
          ? relevantProjects.reduce((sum, p) => sum + p.calculatedProgress, 0) / relevantProjects.length
          : 0

        barData.push({
          label: months[monthIdx],
          progress: Math.round(avg),
          active: i === 0
        })
      }
    }
    else if (filter === 'month') {
      // Últimas 4 semanas
      for (let i = 3; i >= 0; i--) {
        // Semana relativa
        const weekLabel = `Sem ${4 - i}`

        // Definir range da semana
        const weekStart = new Date(now); weekStart.setDate(now.getDate() - (i * 7) - now.getDay());
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6);

        const relevantProjects = projectsWithProgress.filter(p => {
          const d = new Date(p.created_at)
          return d >= weekStart && d <= weekEnd
        })

        const avg = relevantProjects.length > 0
          ? relevantProjects.reduce((sum, p) => sum + p.calculatedProgress, 0) / relevantProjects.length
          : 0 // Se não tiver projetos criados na semana, barra zerada. (Justo)

        barData.push({
          label: weekLabel,
          progress: Math.round(avg),
          active: i === 0
        })
      }
    }
    else if (filter === 'week') {
      // Últimos 7 dias (Dias da semana)
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const dayName = days[date.getDay()]

        const relevantProjects = projectsWithProgress.filter(p => {
          const d = new Date(p.created_at)
          return d.getDate() === date.getDate() && d.getMonth() === date.getMonth()
        })
        const avg = relevantProjects.length > 0
          ? relevantProjects.reduce((sum, p) => sum + p.calculatedProgress, 0) / relevantProjects.length
          : 0

        barData.push({
          label: dayName,
          progress: Math.round(avg),
          active: i === 0
        })
      }
    }

    return { totalProjects, completionRate, barData }
  }, [projects, tasks, filter])

  return (
    <section className={`proj ui-card ${className}`.trim()}>
      <header className="proj__header">
        <div className="txt-cardTitle">Visão Geral dos Projetos</div>
        <button className="proj__filter" onClick={toggleFilter} style={{ background: 'none', border: 'none', font: 'inherit', color: 'inherit', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>{filterLabel}</span>
          <svg className="proj__arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </button>
      </header>

      <div className="proj__chart">
        <div className="proj__axisY">
          {[100, 80, 60, 40, 20, 0].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="proj__plotWrapper">
          <div className="proj__plot" aria-hidden="true">
            {stats.barData.map((bar, idx) => (
              <div key={idx} className="proj__group" data-active={bar.active || undefined}>
                <span className="proj__bar proj__bar--bg" />
                <span
                  className="proj__bar proj__bar--value"
                  style={{ height: `${bar.progress}%` }}
                />
              </div>
            ))}
          </div>

          <div className="proj__months">
            {stats.barData.map((bar, idx) => (
              <span key={idx}>{bar.label}</span>
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
