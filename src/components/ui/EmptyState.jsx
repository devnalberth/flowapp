import { ListChecks } from 'lucide-react'
import Button from './Button.jsx'
import './EmptyState.css'

export default function EmptyState({
  title,
  description,
  icon: Icon = ListChecks,
  action,
  onAction,
  className = '',
}) {
  return (
    <div className={`fa-empty ${className}`}>
      <span className="fa-empty__icon">
        <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      <p>{description}</p>
      {action && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {action}
        </Button>
      )}
    </div>
  )
}
