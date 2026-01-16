import './ProjectOverviewCard.css'

const BAR_DATA = [
  { month: 'Jan', progress: 65 },
  { month: 'Fev', progress: 40 },
  { month: 'Mar', progress: 85, active: true },
  { month: 'Abri', progress: 55 },
  { month: 'Maio', progress: 48 },
]

const MAX_VALUE = 100

export default function ProjectOverviewCard({ className = '' }) {
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
            {BAR_DATA.map((bar) => (
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
            {BAR_DATA.map((bar) => (
              <span key={bar.month}>{bar.month}</span>
            ))}
          </div>
        </div>
      </div>

      <footer className="proj__footer">
        <div>
          <p className="proj__label">Total de Projetos</p>
          <p className="proj__value">12</p>
        </div>
        <div className="proj__right">
          <p className="proj__label">Taxa de Conclusão</p>
          <p className="proj__value">85%</p>
        </div>
      </footer>
    </section>
  )
}
