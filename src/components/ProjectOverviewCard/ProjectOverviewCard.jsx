import { useMemo, useState } from 'react'
import { countsForProjectProgress } from '../../utils/taskStatus'
import './ProjectOverviewCard.css'

const MAX_VALUE = 100

// Chave local YYYY-MM-DD (datas literais usam a string; timestamps viram dia local)
const toDayKey = (value) => {
  if (!value) return null
  const s = String(value)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return null
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]
}

const pad2 = (n) => String(n).padStart(2, '0')

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
    // 1. Enriquecer projetos com progresso calculado dinamicamente (arquivados fora)
    const projectsWithProgress = projects.filter(p => p.status !== 'archived').map(p => {
      const pTasks = tasks.filter(t => (t.projectId === p.id || t.project === p.title) && countsForProjectProgress(t))
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

    // 2. Barras: taxa de conclusão das TAREFAS DE PROJETOS com prazo em cada
    // período (dado histórico real — antes agrupava pelo mês de criação do
    // projeto, zerando meses sem projetos novos)
    const now = new Date()
    const barData = []

    const projectTasks = tasks.filter(t =>
      (t.projectId || t.project_id || t.project) && countsForProjectProgress(t)
    )

    const isDone = (t) => t.completed || t.status === 'done'

    // Taxa de conclusão das tarefas com prazo entre as chaves [startKey, endKey]
    const rateBetween = (startKey, endKey) => {
      const inRange = projectTasks.filter(t => {
        const k = toDayKey(t.due_date)
        return k && k >= startKey && k <= endKey
      })
      if (inRange.length === 0) return { pct: 0, done: 0, total: 0 }
      const done = inRange.filter(isDone).length
      return { pct: Math.round((done / inRange.length) * 100), done, total: inRange.length }
    }

    const localKey = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

    if (filter === 'year') {
      const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
      for (let i = 4; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const y = date.getFullYear()
        const m = date.getMonth()
        const lastDay = new Date(y, m + 1, 0).getDate()
        const rate = rateBetween(`${y}-${pad2(m + 1)}-01`, `${y}-${pad2(m + 1)}-${pad2(lastDay)}`)

        barData.push({
          label: months[m],
          progress: rate.pct,
          detail: `${rate.done} de ${rate.total} tarefas concluídas`,
          active: i === 0,
        })
      }
    }
    else if (filter === 'month') {
      // Últimas 4 semanas (dom → sáb)
      for (let i = 3; i >= 0; i--) {
        const weekStart = new Date(now); weekStart.setDate(now.getDate() - (i * 7) - now.getDay())
        const weekEnd = new Date(weekStart); weekEnd.setDate(weekStart.getDate() + 6)
        const rate = rateBetween(localKey(weekStart), localKey(weekEnd))

        barData.push({
          label: `Sem ${4 - i}`,
          progress: rate.pct,
          detail: `${rate.done} de ${rate.total} tarefas concluídas`,
          active: i === 0,
        })
      }
    }
    else if (filter === 'week') {
      // Últimos 7 dias
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        const key = localKey(date)
        const rate = rateBetween(key, key)

        barData.push({
          label: days[date.getDay()],
          progress: rate.pct,
          detail: `${rate.done} de ${rate.total} tarefas concluídas`,
          active: i === 0,
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
              <div key={idx} className="proj__group" data-active={bar.active || undefined} title={`${bar.label}: ${bar.detail}`}>
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
