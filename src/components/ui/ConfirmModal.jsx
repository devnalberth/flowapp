import { TriangleAlert } from 'lucide-react'
import Modal from './Modal.jsx'
import Button from './Button.jsx'
import './ConfirmModal.css'

export default function ConfirmModal({
  title,
  icon = TriangleAlert,
  confirmIcon,
  children,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  danger = false,
  alternativeLabel,
  onAlternative,
  pending = false,
  width,
  className = '',
}) {
  return (
    <Modal
      title={title}
      icon={icon}
      onClose={pending ? undefined : onCancel}
      className={`fa-confirm ${className}`}
      width={width}
      footer={
        <>
          {onAlternative && (
            <Button variant="secondary" onClick={onAlternative} disabled={pending}>
              {alternativeLabel || 'Arquivar em vez disso'}
            </Button>
          )}
          <Button variant="ghost" onClick={onCancel} disabled={pending}>
            {cancelLabel}
          </Button>
          <Button
            icon={confirmIcon}
            variant={danger ? 'danger' : 'primary'}
            onClick={onConfirm}
            loading={pending}
          >
            {confirmLabel}
          </Button>
        </>
      }
    >
      {message && <p className="fa-confirm__message">{message}</p>}
      {children}
    </Modal>
  )
}
