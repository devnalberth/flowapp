import { useEffect, useId, useLayoutEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import './Modal.css'

// Native dialog owns focus containment, inert background, Escape and focus return.
export default function Modal({
  open = true,
  onClose,
  title,
  subtitle,
  icon: Icon,
  children,
  footer,
  hint,
  className = '',
  width,
  drawer = false,
}) {
  const dialogRef = useRef(null)
  const onCloseRef = useRef(onClose)
  const titleId = useId()
  const subtitleId = useId()
  onCloseRef.current = onClose
  useLayoutEffect(() => {
    const dialog = dialogRef.current
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])
  useLayoutEffect(() => {
    const previousFocus = document.activeElement
    const dialog = dialogRef.current
    // Close before removal so the browser restores the trigger's focus.
    return () => {
      if (dialog.open) dialog.close()
      if (
        previousFocus?.isConnected &&
        previousFocus !== document.body &&
        !dialog.contains(previousFocus)
      )
        previousFocus.focus()
    }
  }, [])
  useEffect(() => {
    if (!open) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])
  const trapFocus = (event) => {
    if (event.key !== 'Tab') return
    const dialog = dialogRef.current
    const controls = [
      ...dialog.querySelectorAll('a[href], button, input, select, textarea, [tabindex]'),
    ].filter(
      (element) => !element.disabled && element.tabIndex >= 0 && element.getClientRects().length > 0
    )
    const first = controls[0]
    const last = controls.at(-1)
    if (!first) {
      event.preventDefault()
      dialog.focus()
      return
    }
    if (
      event.shiftKey &&
      (document.activeElement === first || !dialog.contains(document.activeElement))
    ) {
      event.preventDefault()
      last.focus()
    } else if (
      !event.shiftKey &&
      (document.activeElement === last || !dialog.contains(document.activeElement))
    ) {
      event.preventDefault()
      first.focus()
    }
  }
  return createPortal(
    <dialog
      ref={dialogRef}
      className={`fa-overlay fa-modal ${drawer ? 'fa-modal--drawer' : ''} ${className}`}
      style={
        width ? { '--modal-width': typeof width === 'number' ? `${width}px` : width } : undefined
      }
      aria-labelledby={titleId}
      aria-describedby={subtitle ? subtitleId : undefined}
      onKeyDown={trapFocus}
      onCancel={(event) => {
        event.preventDefault()
        onCloseRef.current?.()
      }}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return
        const rect = event.currentTarget.getBoundingClientRect()
        if (
          event.clientX < rect.left ||
          event.clientX > rect.right ||
          event.clientY < rect.top ||
          event.clientY > rect.bottom
        )
          onCloseRef.current?.()
      }}
    >
      <header className="fa-modal__header">
        {Icon && (
          <span className="fa-modal__icon">
            <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
          </span>
        )}
        <div className="fa-modal__titles">
          <h2 id={titleId}>{title}</h2>
          {subtitle && <p id={subtitleId}>{subtitle}</p>}
        </div>
        <button type="button" className="fa-modal__close" aria-label="Fechar" onClick={onClose}>
          <X size={16} strokeWidth={1.75} aria-hidden="true" />
        </button>
      </header>
      <div className="fa-modal__body">{children}</div>
      {(footer || hint) && (
        <footer className="fa-modal__footer">
          {hint && <span className="fa-modal__hint">{hint}</span>}
          <div className="fa-modal__actions">{footer}</div>
        </footer>
      )}
    </dialog>,
    document.body
  )
}
