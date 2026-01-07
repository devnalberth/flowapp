import './ProjectOverviewCard.css'

const BAR_DATA = [
  { month: 'Jan', planned: 182, delivered: 103 },
  { month: 'Fev', planned: 120, delivered: 42 },
  { month: 'Mar', planned: 220, delivered: 180, active: true },
  { month: 'Abri', planned: 140, delivered: 92 },
  { month: 'Maio', planned: 90, delivered: 60 },
]

const MAX_VALUE = 600

export default function ProjectOverviewCard({ className = '' }) {
  return (
    <section className={`proj ui-card ${className}`.trim()}>
      <header className="proj__header">
        <div className="txt-cardTitle">Visão Geral dos Projetos</div>
        <div className="proj__filter">
          <span className="txt-pill">Este Ano</span>
          <span className="proj__chev" />
        </div>
      </header>

      <div className="proj__chart">
        <div className="proj__axisY">
          {[600, 500, 400, 300, 200, 100, 0].map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="proj__plot" aria-hidden="true">
          {BAR_DATA.map((bar) => (
            <div key={bar.month} className="proj__group" data-active={bar.active || undefined}>
              <span
                className="proj__bar proj__bar--bg"
                style={{ height: `${(bar.planned / MAX_VALUE) * 100}%` }}
              />
              <span
                className="proj__bar proj__bar--value"
                style={{ height: `${(bar.delivered / MAX_VALUE) * 100}%` }}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="proj__months">
        {BAR_DATA.map((bar) => (
          <span key={bar.month}>{bar.month}</span>
        ))}
      </div>
    </section>
  )
}
