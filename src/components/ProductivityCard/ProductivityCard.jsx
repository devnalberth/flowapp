import { useState, useMemo } from 'react'
import './ProductivityCard.css'

const FILTERS = ['Dia', 'Semana', 'Mês']

export default function ProductivityCard({ className = '', tasks = [] }) {
  const [activeFilter, setActiveFilter] = useState('Semana')

  // Filtra tarefas que têm algum tempo de foco registrado via Pomodoro
  const trackedTasks = useMemo(() => {
    // Inclui tarefas com tempo de foco registrado OU tarefas concluídas
    return tasks.filter(t => {
      const timeSpent = Number(t.time_spent) || 0
      return timeSpent > 0 || t.status === 'done' || t.completed
    })
  }, [tasks])

  const chartData = useMemo(() => {
    const now = new Date()

    if (activeFilter === 'Dia') {
      // Últimas 7 horas
      const hours = []
      for (let i = 6; i >= 0; i--) {
        const hour = now.getHours() - i
        // Ajuste simples para horas negativas virarem dia anterior (visualização básica)
        const targetDate = new Date(now)
        targetDate.setHours(hour)

        // Somar minutos das tarefas atualizadas nesta hora
        const minutesInHour = trackedTasks.reduce((acc, t) => {
          const updateDate = new Date(t.updated_at || t.created_at)
          // Verifica se foi atualizada nesta hora/dia
          if (updateDate.getHours() === targetDate.getHours() &&
            updateDate.toDateString() === targetDate.toDateString()) {
            // Se a tarefa foi mexida nesta hora, "chutamos" que o tempo dela conta aqui.
            // (Sem tabela de logs históricos, usamos o total da tarefa como peso)
            return acc + (Number(t.time_spent) || 0)
          }
          return acc
        }, 0)

        // Meta: 60 minutos de foco por hora = 100%
        hours.push({
          label: `${targetDate.getHours()}h`,
          value: Math.min((minutesInHour / 60) * 100, 100),
          active: i === 0,
        })
      }
      return hours
    }

    if (activeFilter === 'Semana') {
      // Últimos 7 dias
      const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
      const weekData = []

      for (let i = 6; i >= 0; i--) {
        const date = new Date(now)
        date.setDate(date.getDate() - i)
        date.setHours(0, 0, 0, 0)

        const minutesInDay = trackedTasks.reduce((acc, t) => {
          const updateDate = new Date(t.updated_at || t.created_at)
          updateDate.setHours(0, 0, 0, 0)

          if (updateDate.getTime() === date.getTime()) {
            return acc + (Number(t.time_spent) || 0)
          }
          return acc
        }, 0)

        // Meta: 8 horas (480 min) por dia = 100%
        weekData.push({
          label: days[date.getDay()],
          value: Math.min((minutesInDay / 480) * 100, 100),
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

      const minutesInWeek = trackedTasks.reduce((acc, t) => {
        const updateDate = new Date(t.updated_at || t.created_at)
        if (updateDate >= weekStart && updateDate <= weekEnd) {
          return acc + (Number(t.time_spent) || 0)
        }
        return acc
      }, 0)

      // Meta: 40 horas (2400 min) por semana = 100%
      weekData.push({
        label: `Sem ${4 - i}`,
        value: Math.min((minutesInWeek / 2400) * 100, 100),
        active: i === 0,
      })
    }
    return weekData
  }, [trackedTasks, activeFilter])

  const stats = useMemo(() => {
    // Soma total de minutos de TODAS as tarefas carregadas
    const totalMinutes = tasks.reduce((acc, t) => acc + (Number(t.time_spent) || 0), 0)

    const hours = Math.floor(totalMinutes / 60)
    const minutes = Math.round(totalMinutes % 60)

    // Lógica de Nível baseada em HORAS TOTAIS trabalhadas (acumulado)
    let productivity = 'Iniciando'
    if (totalMinutes > 2400) productivity = 'Excelente' // > 40h totais
    else if (totalMinutes > 600) productivity = 'Alto' // > 10h totais
    else if (totalMinutes > 120) productivity = 'Moderado' // > 2h totais

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
        <button
          className="prod__filter"
          type="button"
          onClick={() => {
            const next = activeFilter === 'Dia' ? 'Semana' : activeFilter === 'Semana' ? 'Mês' : 'Dia'
            setActiveFilter(next)
          }}
        >
          {activeFilter}
          <svg className="prod__arrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </header>

      <div className="prod__chart">
        <div className="prod__axisY">
          {['100%', '75%', '50%', '25%', '0%'].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="prod__plotWrapper">
          <div
            className="prod__plot"
            aria-hidden="true"
            style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
          >
            {chartData.map((bar, i) => (
              <div key={i} className="prod__group" data-active={bar.active || undefined}>
                <div className="prod__barContainer">
                  <span
                    className="prod__bar prod__bar--value"
                    style={{ height: `${Math.max(bar.value, 4)}%` }} // Mínimo de 4% para aparecer visualmente
                    title={`${Math.round(bar.value)}% da meta`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div
            className="prod__labels"
            style={{ gridTemplateColumns: `repeat(${columnCount}, minmax(0, 1fr))` }}
          >
            {chartData.map((bar, i) => (
              <span key={i}>{bar.label}</span>
            ))}
          </div>
        </div>
      </div>

      <footer className="prod__footer">
        <div>
          <p className="prod__label">Horas de Foco Total</p>
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