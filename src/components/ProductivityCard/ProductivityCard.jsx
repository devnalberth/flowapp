import './ProductivityCard.css'

const bars = Array.from({ length: 28 }).map((_, index) => ({
  height: 30 + ((index * 11) % 60),
  variant: index % 7 === 0 ? 'solid' : index % 3 === 0 ? 'dense' : 'soft',
  size: index % 6 === 0 ? 'xl' : index % 2 === 0 ? 'md' : 'sm',
}))

export default function ProductivityCard({ className = '' }) {
  return (
    <section className={`prod ui-card ${className}`.trim()}>
      <header className="prod__header">
        <div className="prod__title">Produtividade</div>
        <div className="prod__filter">
          <span className="prod__filterLabel">Dia</span>
          <span className="prod__chev" />
        </div>
      </header>

      <div className="prod__chart" aria-hidden="true">
        {bars.map((bar, index) => (
          <span
            // eslint-disable-next-line react/no-array-index-key
            key={index}
            className={`prod__bar prod__bar--${bar.variant} prod__bar--${bar.size}`.trim()}
            style={{ height: `${bar.height}%` }}
          />
        ))}
      </div>

      <footer className="prod__footer">
        <div>
          <p className="prod__label">Horas de Trabalho</p>
          <p className="prod__value">9h 30m</p>
        </div>
        <div className="prod__right">
          <p className="prod__label">Nível de Produtividade</p>
          <p className="prod__value">Moderado</p>
        </div>
      </footer>
    </section>
  )
}
