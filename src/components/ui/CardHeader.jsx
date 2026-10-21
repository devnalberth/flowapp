import { ArrowUpRight } from 'lucide-react'
import './CardHeader.css'

export default function CardHeader({
  title,
  subtitle,
  onAction,
  actionLabel,
  icon: Icon = ArrowUpRight,
  dark = false,
  children,
  className = '',
}) {
  return (
    <header className={`fa-card-header ${dark ? 'fa-card-header--dark' : ''} ${className}`}>
      <div className="fa-card-header__text">
        <h2>{title}</h2>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {children}
      {onAction && (
        <button
          className="fa-card-header__action"
          type="button"
          onClick={onAction}
          aria-label={actionLabel || `Abrir ${title}`}
        >
          <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>
      )}
    </header>
  )
}
