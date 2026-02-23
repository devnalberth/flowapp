import './ConfirmModal.css'

export default function ConfirmModal({
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  danger = false,
}) {
  return (
    <div className="confirmModal">
      <div className="confirmModal__backdrop" onClick={onCancel} />
      <div className="confirmModal__panel">
        <header className="confirmModal__header">
          <h3 className="confirmModal__title">{title}</h3>
        </header>
        {message && <p className="confirmModal__message">{message}</p>}
        <footer className="confirmModal__footer">
          <button className="confirmModal__btn confirmModal__btn--cancel" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button
            className={`confirmModal__btn confirmModal__btn--confirm${danger ? ' confirmModal__btn--danger' : ''}`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </footer>
      </div>
    </div>
  )
}
