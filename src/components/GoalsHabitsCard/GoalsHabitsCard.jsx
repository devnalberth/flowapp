import { useState } from 'react'
import './GoalsHabitsCard.css'

const GOAL_FILTERS = ['Mensal', 'Trimestral', 'Semestral', 'Anual']

const HABIT_DATA = {
  Dia: { current: 86, total: 100, change: 6.2, improved: true },
  Semana: { current: 72, total: 100, change: 3.8, improved: true },
  M\u00eas: { current: 68, total: 100, change: -2.4, improved: false },
}

const GOAL_DATA = {
  Mensal: {
    labels: ['Jan', 'Fev', 'Mar', 'Abr'],
    grid: [true, false, false, true, false, true, false, false, true, false, false, true, false, true, false, false],
    progress: 72,
  },
  Trimestral: {
    labels: ['T1', 'T2', 'T3', 'T4'],
    grid: [true, false, false, false, false, true, true, false, false, true, false, false, false, false, true, true],
    progress: 68,
  },
  Semestral: {
    labels: ['1\u00b0 Sem', '2\u00b0 Sem', '', ''],
    grid: [true, true, false, false, true, false, true, false, false, true, false, true, false, false, true, false],
    progress: 75,
  },
  Anual: {
    labels: ['2023', '2024', '2025', '2026'],
    grid: [true, false, false, true, false, false, true, false, false, false, true, true, false, true, false, true],
    progress: 82,
  },
}

export default function GoalsHabitsCard({ className = '' }) {
  const [habitFilter] = useState('Dia')
  const [goalFilter, setGoalFilter] = useState('Mensal')

  const habitData = HABIT_DATA[habitFilter]
  const goalData = GOAL_DATA[goalFilter]

  const percentage = (habitData.current / habitData.total) * 100
  const rotation = (percentage / 100) * 270 - 135 // -135° a 135° (270° range)
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
          <span className="gh__habitsLabel">Hábitos</span>
          <span className="gh__habitsValue">{habitData.current}/{habitData.total}</span>
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
            // eslint-disable-next-line react/no-array-index-key
            <span key={index} className={highlight ? 'gh__cell gh__cell--highlight' : 'gh__cell'} />
          ))}
          <div className="gh__focus">
            <div className="gh__focusLabel">Meta Atual</div>
            <div className="gh__focusValue">{goalData.progress}%</div>
          </div>
        </div>

        <div className="gh__months">
          {goalData.labels.map((label, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <span key={index} className="gh__month">
              {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
