import { ChevronDown } from 'lucide-react'
import './FilterPill.css'

export default function FilterPill({
  applied = false,
  children,
  count,
  disclosure = true,
  className = '',
  ...props
}) {
  return (
    <button
      type="button"
      className={`fa-filter ${applied ? 'is-applied' : ''} ${className}`}
      {...props}
    >
      {children}
      {count != null && <span>{count}</span>}
      {disclosure && <ChevronDown size={14} strokeWidth={1.75} aria-hidden="true" />}
    </button>
  )
}
