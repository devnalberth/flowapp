import { useState } from 'react'
import './ProductivityCard.css'

const FILTERS = ['Dia', 'Semana', 'M\u00eas']

const DATA_BY_FILTER = {
  Dia: [
    { label: '9h', value: 45 },
    { label: '10h', value: 70 },
    { label: '11h', value: 85 },
    { label: '14h', value: 60, active: true },
    { label: '15h', value: 75 },
    { label: '16h', value: 55 },
    { label: '17h', value: 40 },
  ],
  Semana: [
    { label: 'Dom', value: 20 },
    { label: 'Seg', value: 75 },
    { label: 'Ter', value: 80 },
    { label: 'Qua', value: 70, active: true },
    { label: 'Qui', value: 65 },
    { label: 'Sex', value: 85 },
    { label: 'S\u00e1b', value: 30 },
  ],
  M\u00eas: [
    { label: 'Sem 1', value: 60 },
    { label: 'Sem 2', value: 75 },
    { label: 'Sem 3', value: 85, active: true },
    { label: 'Sem 4', value: 70 },
  ],
}

export default function ProductivityCard({ className = '' }) {
  const [activeFilter, setActiveFilter] = useState('Dia')
  const currentData = DATA_BY_FILTER[activeFilter]
  const columnCount = currentData.length

  const totalHours = activeFilter === 'Dia' ? '9h 30m' : activeFilter === 'Semana' ? '42h 15m' : '168h 45m'
  const productivity = activeFilter === 'Dia' ? 'Moderado' : activeFilter === 'Semana' ? 'Alto' : 'Excelente'

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
            {currentData.map((bar) => (
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
            {currentData.map((bar) => (
              <span key={bar.label}>{bar.label}</span>
            ))}
          </div>
        </div>
      </div>

      <footer className="prod__footer">
        <div>
          <p className="prod__label">Horas de Trabalho</p>
          <p className="prod__value">{totalHours}</p>
        </div>
        <div className="prod__right">
          <p className="prod__label">Nível de Produtividade</p>
          <p className="prod__value">{productivity}</p>
        </div>
      </footer>
    </section>
  )
}
