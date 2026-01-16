import { useState, useMemo } from 'react'
import './ProductivityCard.css'

const FILTERS = ['Dia', 'Semana', 'Mês']

export default function ProductivityCard({ className = '', tasks = [] }) {
  const [activeFilter, setActiveFilter] = useState('Semana')

  const chartData = useMemo(() => {
    const now = new Date()
    const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed')

    if (activeFilter === 'Dia') {
      // Últimas 7 horas do dia
      const hours = []
      for (let i = 6; i >= 0; i--) {
        const hour = now.getHours() - i
        if (hour < 0) continue
        
        const hourTasks = completedTasks.filter(t => {
          const completedDate = new Date(t.updated_at)
          return completedDate.getHours() === hour &&
                 completedDate.toDateString() === now.toDateString()
        }).length

        hours.push({
          label: `${hour}h`,
          value: Math.min(hourTasks * 25, 100),
          active: i === 0,
        })
      }
      return hours.length > 0 ? hours : [{ label: 'Hoje', value: 0, active: true }]
    }

    if (activeFilter === 'Semana') {
      // Últimos 7 dias
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      const weekData = []
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)
        
        const dayTasks = completedTasks.filter(t => {
          const completedDate = new Date(t.updated_at)
          completedDate.setHours(0, 0, 0, 0)
          return completedDate.getTime() === date.getTime()
        }).length

        weekData.push({
          label: days[date.getDay()],
          value: Math.min(dayTasks * 20, 100),
          active: i === 0,
        })
      }
      return weekData
    }

    // Mês - últimas 4 semanas
    const weekData = []
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date(now)
      weekStart.setDate(weekStart.getDate() - (i * 7))
      weekStart.setHours(0, 0, 0, 0)
      
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekEnd.getDate() + 6)
      weekEnd.setHours(23, 59, 59, 999)

      const weekTasks = completedTasks.filter(t => {
        const completedDate = new Date(t.updated_at)
        return completedDate >= weekStart && completedDate <= weekEnd
      }).length

      weekData.push({
        label: `Sem ${4 - i}`,
        value: Math.min(weekTasks * 10, 100),
        active: i === 0,
      })
    }
    return weekData
  }, [tasks, activeFilter])

  const stats = useMemo(() => {
    const completedTasks = tasks.filter(t => t.status === 'done' || t.status === 'completed')
    const totalHours = completedTasks.length * 2 // Estimativa de 2h por tarefa
    const hours = Math.floor(totalHours)
    const minutes = Math.round((totalHours - hours) * 60)

    let productivity = 'Baixo'
    if (completedTasks.length > 20) productivity = 'Excelente'
    else if (completedTasks.length > 10) productivity = 'Alto'
    else if (completedTasks.length > 5) productivity = 'Moderado'

    return {
      totalHours: `${hours}h ${minutes}m`,
      productivity,
    }
  }, [tasks])

  const columnCount = chartData.length

  return (
    <section className={`prod ui-card ${className}`.trim()}>
      <header className="prod__header">
        <div className="txt-cardTitle">Produtividade</div>
        <div className="prod__filter">
          <span>{activeFilter}</span>
          <svg className="prod__arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </div>
      </header>

      <div className="prod__chart">
        <div className="prod__axisY">
          {[100, 80, 60, 40, 20, 0].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="prod__plotWrapper">
          <div
            className="prod__plot"
            aria-hidden="true"
            style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
          >
            {chartData.map((bar) => (
              <div key={bar.label} className="prod__group" data-active={bar.active || undefined}>
                <span className="prod__bar prod__bar--bg" />
                <span
                  className="prod__bar prod__bar--value"
                  style={{ height: `${bar.value}%` }}
                />
              </div>
            ))}
          </div>

          <div
            className="prod__labels"
            style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
          >
            {chartData.map((bar) => (
              <span key={bar.label}>{bar.label}</span>
            ))}
          </div>
        </div>
      </div>

      <footer className="prod__footer">
        <div>
          <p className="prod__label">Horas de Trabalho</p>
          <p className="prod__value">{stats.totalHours}</p>
        </div>
        <div className="prod__right">
          <p className="prod__label">Nível de Produtividade</p>
          <p className="prod__value">{stats.productivity}</p>
        </div>
      </footer>
    </section>
  )
}
