import { CircleCheck, TriangleAlert, X } from 'lucide-react'
import './Toast.css'

export default function Toast({
  title,
  detail,
  tone = 'success',
  action,
  onAction,
  onClose,
  ...props
}) {
  const Icon = tone === 'danger' ? TriangleAlert : CircleCheck
  return (
    <div className="fa-toast" role={tone === 'danger' ? 'alert' : 'status'} {...props}>
      <span className={`fa-toast__icon ${tone === 'danger' ? 'is-danger' : ''}`}>
        <Icon size={16} strokeWidth={1.75} aria-hidden="true" />
      </span>
      <div className="fa-toast__text">
        <strong>{title}</strong>
        {detail && <span>{detail}</span>}
      </div>
      {action && onAction && (
        <button type="button" className="fa-toast__action" onClick={onAction}>
          {action}
        </button>
      )}
      <button type="button" className="fa-toast__close" aria-label="Fechar aviso" onClick={onClose}>
        <X size={14} strokeWidth={1.75} aria-hidden="true" />
      </button>
    </div>
  )
}
