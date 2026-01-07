import './StatCard.css'

export default function StatCard({ title, value, variant = 'total' }) {
  return (
    <article className="statCard ui-card" data-variant={variant}>
      <header className="statCard__header">
        <span className="statCard__title">{title}</span>

        <div className="statCard__tools" aria-hidden="true">
          <span className="statCard__chip statCard__chip--circle" />
          <span className="statCard__chip statCard__chip--square">
            <span className="statCard__chipArrow" />
          </span>
        </div>
      </header>

      <div className="statCard__valueRow">
        <span className="statCard__value">{value}</span>
        <span className="statCard__spark" aria-hidden="true" />
      </div>
    </article>
  )
}
