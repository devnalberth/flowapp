import { useState, useMemo, useEffect } from 'react'
import { Settings } from 'lucide-react'
import { focusLogService } from '../../services/focusLogService'
import './ProductivityCard.css'

const FILTERS = ['Dia', 'Semana', 'Mês']

// Meta padrão: 4 horas (240 minutos) por dia
const DEFAULT_DAILY_GOAL = 240

export default function ProductivityCard({ className = '', tasks = [] }) {
  const [activeFilter, setActiveFilter] = useState('Semana')
  const [showGoalModal, setShowGoalModal] = useState(false)

  // Meta diária em minutos (persistida no localStorage)
  const [dailyGoal, setDailyGoal] = useState(() => {
    const saved = localStorage.getItem('productivityDailyGoal')
    return saved ? Number(saved) : DEFAULT_DAILY_GOAL
  })

  useEffect(() => {
    localStorage.setItem('productivityDailyGoal', String(dailyGoal))
  }, [dailyGoal])

  // Obtém log de foco do localStorage (fonte de verdade para tempo diário)
  const focusLog = useMemo(() => {
    return focusLogService.getAll()
  }, [tasks]) // Recalcula quando tasks mudam (força refresh)

  // Fallback: calcula tempo por dia a partir das tarefas (para compatibilidade com dados antigos)
  const focusTimeByDateFromTasks = useMemo(() => {
    const byDate = {}

    tasks.forEach(t => {
      const timeSpent = Number(t.time_spent) || 0
      if (timeSpent <= 0) return

      // Usa updated_at como referência do dia em que o tempo foi registrado
      const dateStr = t.updated_at
        ? new Date(t.updated_at).toISOString().split('T')[0]
        : new Date(t.created_at).toISOString().split('T')[0]

      if (!byDate[dateStr]) byDate[dateStr] = 0
      byDate[dateStr] += timeSpent
    })

    return byDate
  }, [tasks])

  // Combina log de foco (localStorage) com fallback de tasks
  const getFocusTimeForDate = (dateStr) => {
    // Prioriza o focusLog (mais preciso)
    if (focusLog[dateStr]) return focusLog[dateStr]
    // Fallback para dados antigos baseados em updated_at
    return focusTimeByDateFromTasks[dateStr] || 0
  }

  const chartData = useMemo(() => {
    const now = new Date()

    if (activeFilter === 'Dia') {
      // Últimas 7 horas do dia atual
      const hours = []
      const todayStr = now.toISOString().split('T')[0]
      const todayMinutes = getFocusTimeForDate(todayStr)

      for (let i = 6; i >= 0; i--) {
        const targetDate = new Date(now)
        targetDate.setHours(now.getHours() - i)

        // Para visualização horária, distribuímos proporcionalmente
        // (Como não temos log por hora, mostramos uma barra de progresso geral)
        const isCurrentHour = i === 0

        hours.push({
          label: `${targetDate.getHours()}h`,
          // Se for a hora atual, mostra o progresso do dia todo
          // Senão, mostra uma barra mínima indicando que passou
          value: isCurrentHour ? Math.min((todayMinutes / dailyGoal) * 100, 100) : 0,
          active: isCurrentHour,
          minutes: isCurrentHour ? todayMinutes : 0,
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
        const dateStr = date.toISOString().split('T')[0]

        const minutesInDay = getFocusTimeForDate(dateStr)

        weekData.push({
          label: days[date.getDay()],
          value: Math.min((minutesInDay / dailyGoal) * 100, 100),
          active: i === 0,
          minutes: minutesInDay,
          dateStr, // Para debug
        })
      }
      return weekData
    }

    // Mês - últimas 4 semanas
    const monthData = []
    for (let i = 3; i >= 0; i--) {
      let minutesInWeek = 0

      // Soma os minutos de cada dia da semana
      for (let d = 0; d < 7; d++) {
        const date = new Date(now)
        date.setDate(date.getDate() - (i * 7) - (6 - d))
        const dateStr = date.toISOString().split('T')[0]
        minutesInWeek += getFocusTimeForDate(dateStr)
      }

      // Meta semanal = meta diária * 7
      const weeklyGoal = dailyGoal * 7

      monthData.push({
        label: `Sem ${4 - i}`,
        value: Math.min((minutesInWeek / weeklyGoal) * 100, 100),
        active: i === 0,
        minutes: minutesInWeek,
      })
    }
    return monthData
  }, [focusLog, focusTimeByDateFromTasks, activeFilter, dailyGoal])

  const stats = useMemo(() => {
    // Calcula minutos do dia atual para determinar o nível
    const todayStr = new Date().toISOString().split('T')[0]
    const todayMinutes = getFocusTimeForDate(todayStr)

    // Soma total da semana atual (últimos 7 dias)
    let weekMinutes = 0
    const now = new Date()
    for (let i = 0; i < 7; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]
      weekMinutes += getFocusTimeForDate(dateStr)
    }

    const hours = Math.floor(weekMinutes / 60)
    const minutes = Math.round(weekMinutes % 60)

    // Lógica de Nível baseada na META DIÁRIA
    // Baixa: menos de 25% da meta
    // Média: entre 25% e 75% da meta
    // Alta: acima de 75% da meta
    const progressPercent = (todayMinutes / dailyGoal) * 100

    let productivity = 'Baixa'
    if (progressPercent >= 75) productivity = 'Alta'
    else if (progressPercent >= 25) productivity = 'Média'

    return {
      totalHours: `${hours}h ${minutes}m`,
      productivity,
      todayMinutes,
      progressPercent: Math.min(progressPercent, 100),
    }
  }, [focusLog, focusTimeByDateFromTasks, dailyGoal])

  const columnCount = chartData.length

  const handleSaveGoal = (newGoalMinutes) => {
    setDailyGoal(newGoalMinutes)
    setShowGoalModal(false)
  }

  return (
    <section className={`prod ui-card ${className}`.trim()}>
      <header className="prod__header">
        <div className="prod__titleRow">
          <div className="txt-cardTitle">Produtividade</div>
          <button
            className="prod__settingsBtn"
            onClick={() => setShowGoalModal(true)}
            title="Configurar meta diária"
          >
            <Settings size={16} />
          </button>
        </div>
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
                    style={{ height: `${Math.max(bar.value, 4)}%` }}
                    title={`${Math.round(bar.minutes)} min (${Math.round(bar.value)}% da meta)`}
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
          <p className="prod__label">Foco Semanal</p>
          <p className="prod__value">{stats.totalHours}</p>
        </div>
        <div className="prod__right">
          <p className="prod__label">Nível de Produtividade</p>
          <p className={`prod__value prod__level--${stats.productivity.toLowerCase()}`}>
            {stats.productivity}
          </p>
        </div>
      </footer>

      {/* Modal de Configuração da Meta */}
      {showGoalModal && (
        <GoalConfigModal
          currentGoal={dailyGoal}
          onClose={() => setShowGoalModal(false)}
          onSave={handleSaveGoal}
        />
      )}
    </section>
  )
}

function GoalConfigModal({ currentGoal, onClose, onSave }) {
  const [hours, setHours] = useState(Math.floor(currentGoal / 60))
  const [minutes, setMinutes] = useState(currentGoal % 60)

  const handleSave = () => {
    const totalMinutes = (hours * 60) + minutes
    if (totalMinutes > 0) {
      onSave(totalMinutes)
    }
  }

  return (
    <div className="goalModal">
      <div className="goalModal__backdrop" onClick={onClose} />
      <div className="goalModal__panel">
        <header className="goalModal__header">
          <h3>Meta Diária de Foco</h3>
          <button className="goalModal__close" onClick={onClose}>×</button>
        </header>
        <div className="goalModal__content">
          <p className="goalModal__description">
            Defina quantas horas você deseja focar por dia. Os níveis de produtividade serão calculados com base nessa meta.
          </p>
          <div className="goalModal__inputs">
            <div className="goalModal__inputGroup">
              <label>Horas</label>
              <input
                type="number"
                min="0"
                max="12"
                value={hours}
                onChange={(e) => setHours(Math.max(0, Math.min(12, Number(e.target.value))))}
              />
            </div>
            <span className="goalModal__separator">:</span>
            <div className="goalModal__inputGroup">
              <label>Minutos</label>
              <input
                type="number"
                min="0"
                max="59"
                value={minutes}
                onChange={(e) => setMinutes(Math.max(0, Math.min(59, Number(e.target.value))))}
              />
            </div>
          </div>
          <p className="goalModal__preview">
            Meta: <strong>{hours}h {minutes}m</strong> por dia
          </p>
        </div>
        <footer className="goalModal__footer">
          <button className="goalModal__btn" onClick={onClose}>Cancelar</button>
          <button className="goalModal__btn goalModal__btn--primary" onClick={handleSave}>Salvar</button>
        </footer>
      </div>
    </div>
  )
}