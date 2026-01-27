import './StatCard.css'

export default function StatCard({ title, value, variant = 'total', onClick }) {
  return (
    <article
      className="statCard ui-card"
      data-variant={variant}
      onClick={onClick}
      style={onClick ? { cursor: 'pointer' } : {}}
      role={onClick ? "button" : "article"}
      tabIndex={onClick ? 0 : undefined}
    >
      <header className="statCard__header">
        <span className="statCard__title">{title}</span>
        <div className="statCard__arrow" aria-label="Ver detalhes">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </div>
      </header>

      <div className="statCard__valueRow">
        <span className="statCard__value">{value}</span>
        <span className="statCard__spark" aria-hidden="true" />
      </div>
    </article>
  )
}
