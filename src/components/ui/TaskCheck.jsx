import { Check } from 'lucide-react'
import './TaskCheck.css'

export default function TaskCheck({ checked, onChange, label, disabled = false, className = '' }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={Boolean(checked)}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange?.(!checked)}
      className={`fa-check ${checked ? 'is-checked' : ''} ${className}`}
    >
      <span>{checked && <Check size={14} strokeWidth={2} aria-hidden="true" />}</span>
    </button>
  )
}
