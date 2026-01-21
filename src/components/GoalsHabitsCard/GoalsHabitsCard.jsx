import { useState, useMemo } from 'react'
import './GoalsHabitsCard.css'

const GOAL_FILTERS = ['Mensal', 'Trimestral', 'Semestral', 'Anual']

export default function GoalsHabitsCard({ className = '', goals = [], habits = [] }) {
  const [goalFilter, setGoalFilter] = useState('Mensal')

  const habitData = useMemo(() => {
    // Proteção: se habits não for array, retorna dados zerados
    if (!Array.isArray(habits)) {
      return { current: 0, total: 100, change: 0, improved: false }
    }

    const totalHabits = habits.length
    const today = new Date().toISOString().split('T')[0]

    const completedToday = habits.filter(h => {
      // CORREÇÃO DE SEGURANÇA:
      // O Dashboard já entrega os dados sanitizados. 
      // Verificamos 'completions' (novo) ou 'completed_dates' (antigo) e garantimos que seja array.
      // NUNCA usamos JSON.parse aqui para evitar crashes.
      const completedDates = Array.isArray(h.completions)
        ? h.completions
        : (Array.isArray(h.completed_dates) ? h.completed_dates : [])

      return completedDates.includes(today)
    }).length

    const current = totalHabits > 0 ? Math.round((completedToday / totalHabits) * 100) : 0

    // Cálculo seguro de streak
    const avgStreak = totalHabits > 0
      ? habits.reduce((sum, h) => sum + (Number(h.current_streak) || 0), 0) / totalHabits
      : 0

    return {
      current, // Percentual de conclusão hoje (0 a 100)
      total: totalHabits, // Quantidade de hábitos
      change: avgStreak > 5 ? 6.2 : avgStreak > 2 ? 3.8 : -2.4, // Dado decorativo baseado no streak
      improved: avgStreak > 2,
    }
  }, [habits])

  const goalData = useMemo(() => {
    // Proteção para goals
    const safeGoals = Array.isArray(goals) ? goals : []
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()

    // Filtrar metas pelo período selecionado
    const filteredGoals = safeGoals.filter(g => {
      // Usa target_date ou due_date ou created_at como fallback
      const dateStr = g.target_date || g.due_date || g.created_at
      if (!dateStr) return true // Sem data = inclui em todos os filtros

      const goalDate = new Date(dateStr)
      const goalMonth = goalDate.getMonth()
      const goalYear = goalDate.getFullYear()

      switch (goalFilter) {
        case 'Mensal':
          // Metas do mês atual
          return goalMonth === currentMonth && goalYear === currentYear
        case 'Trimestral':
          // Metas do trimestre atual
          const currentQuarter = Math.floor(currentMonth / 3)
          const goalQuarter = Math.floor(goalMonth / 3)
          return goalQuarter === currentQuarter && goalYear === currentYear
        case 'Semestral':
          // Metas do semestre atual
          const currentSemester = currentMonth < 6 ? 0 : 1
          const goalSemester = goalMonth < 6 ? 0 : 1
          return goalSemester === currentSemester && goalYear === currentYear
        case 'Anual':
          // Metas do ano atual
          return goalYear === currentYear
        default:
          return true
      }
    })

    // Calcula progresso médio das metas filtradas
    const totalGoals = filteredGoals.length
    const avgProgress = totalGoals > 0
      ? Math.round(filteredGoals.reduce((sum, g) => sum + (g.progress || 0), 0) / totalGoals)
      : 0

    // Conta metas completas (progress >= 100 ou status completed)
    const completedGoals = filteredGoals.filter(g =>
      (g.progress || 0) >= 100 || g.status === 'completed' || g.status === 'done'
    ).length

    // Grid de 4x4 representando progresso das metas
    const grid = Array(16).fill(false).map((_, i) => {
      return i < Math.round((avgProgress / 100) * 16)
    })

    let labels = ['Jan', 'Fev', 'Mar', 'Abr']
    if (goalFilter === 'Mensal') {
      // Mostra as 4 semanas do mês
      labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']
    } else if (goalFilter === 'Trimestral') {
      const quarterMonths = [
        ['Jan', 'Fev', 'Mar'],
        ['Abr', 'Mai', 'Jun'],
        ['Jul', 'Ago', 'Set'],
        ['Out', 'Nov', 'Dez']
      ]
      const q = Math.floor(currentMonth / 3)
      labels = [...quarterMonths[q], '']
    } else if (goalFilter === 'Semestral') {
      labels = currentMonth < 6 ? ['Jan-Mar', 'Abr-Jun', '', ''] : ['Jul-Set', 'Out-Dez', '', '']
    } else if (goalFilter === 'Anual') {
      labels = ['T1', 'T2', 'T3', 'T4']
    }

    return { labels, grid, progress: avgProgress, totalGoals, completedGoals }
  }, [goals, goalFilter])

  // Cálculo da rotação do ponteiro (Gauge)
  // Mapeia 0-100% para o ângulo do SVG
  const rotation = (habitData.current / 100) * 270 - 135

  const handleGoalFilterToggle = () => {
    const currentIndex = GOAL_FILTERS.indexOf(goalFilter)
    const nextFilter = GOAL_FILTERS[(currentIndex + 1) % GOAL_FILTERS.length]
    setGoalFilter(nextFilter)
  }

  const handleGoalFilterKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleGoalFilterToggle()
    }
  }

  return (
    <section className={`gh ui-card ${className}`.trim()}>
      <div className="gh__habits">
        <div className="gh__halo" aria-hidden="true">
          <span className="gh__ring gh__ring--outer" />
          <span className="gh__ring gh__ring--mid" />
          <span className="gh__ring gh__ring--inner" />

          {/* Gauge radial */}
          <svg className="gh__gauge" viewBox="0 0 200 200">
            {/* Labels dos valores */}
            <text x="100" y="25" className="gh__gaugeLabel">100</text>
            <text x="25" y="108" className="gh__gaugeLabel">75</text>
            <text x="175" y="108" className="gh__gaugeLabel">25</text>
            <text x="100" y="182" className="gh__gaugeLabel">50</text>

            {/* Marcações radiais */}
            {Array.from({ length: 12 }).map((_, i) => {
              const angle = (i * 30 - 90) * (Math.PI / 180)
              const isCardinal = i % 3 === 0
              const innerRadius = isCardinal ? 45 : 50
              const outerRadius = 58
              const x1 = 100 + innerRadius * Math.cos(angle)
              const y1 = 100 + innerRadius * Math.sin(angle)
              const x2 = 100 + outerRadius * Math.cos(angle)
              const y2 = 100 + outerRadius * Math.sin(angle)
              return (
                <line
                  key={i}
                  x1={x1}
                  y1={y1}
                  x2={x2}
                  y2={y2}
                  className="gh__gaugeTick"
                  strokeWidth={isCardinal ? 2 : 1}
                />
              )
            })}

            {/* Círculo central pontilhado */}
            <circle
              cx="100"
              cy="100"
              r="38"
              className="gh__gaugeDashed"
            />

            {/* Ponteiro */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="42"
              className="gh__gaugePointer"
              style={{ transform: `rotate(${rotation}deg)`, transformOrigin: '100px 100px' }}
            />
            <circle cx="100" cy="100" r="4" className="gh__gaugeDot" />
          </svg>
        </div>
        <div className="gh__habitsMeta">
          <span className="gh__habitsLabel">Hábitos Hoje</span>
          {/* Mostra percentual de conclusão do dia */}
          <span className="gh__habitsValue">{habitData.current}%</span>
          <span className="gh__pill" data-improved={habitData.improved || undefined}>
            {Math.abs(habitData.change)}%
            <span className="gh__arrow" aria-hidden="true" style={{ transform: habitData.improved ? 'none' : 'rotate(180deg)' }} />
          </span>
        </div>
      </div>

      <div className="gh__goals">
        <header className="gh__goalsHeader">
          <div className="gh__goalsTitle">Metas</div>
          <div
            className="gh__goalFilter"
            role="button"
            tabIndex={0}
            onClick={handleGoalFilterToggle}
            onKeyDown={handleGoalFilterKeyDown}
          >
            <span>{goalFilter}</span>
            <svg className="gh__goalArrow" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M17 7H7M17 7V17" />
            </svg>
          </div>
        </header>

        <div className="gh__grid" aria-hidden="true">
          {goalData.grid.map((highlight, index) => (
            <span key={index} className={highlight ? 'gh__cell gh__cell--highlight' : 'gh__cell'} />
          ))}
          <div className="gh__focus">
            <div className="gh__focusLabel">Conclusão</div>
            <div className="gh__focusValue">{goalData.progress}%</div>
          </div>
        </div>

        <div className="gh__months">
          {goalData.labels.map((label, index) => (
            <span key={index} className="gh__month">
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}