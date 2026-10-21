import './StatusBadge.css'

export default function StatusBadge({ tone = 'neutral', icon: Icon, children, className = '' }) {
  return (
    <span className={`fa-status fa-status--${tone} ${className}`}>
      {Icon ? (
        <Icon size={12} strokeWidth={1.75} aria-hidden="true" />
      ) : (
        <span className="fa-status__dot" aria-hidden="true" />
      )}
      {children}
    </span>
  )
}
