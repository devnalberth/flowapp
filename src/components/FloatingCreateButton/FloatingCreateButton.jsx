import './FloatingCreateButton.css'
import { isValidElement } from 'react'

/**
 * @typedef {{label?: string, caption?: string, onClick?: ()=>void, icon?: any, ariaLabel?: string}} FloatingCreateButtonProps
 */

/**
 * @param {FloatingCreateButtonProps} props
 */
export default function FloatingCreateButton(props) {
  const { label, caption, onClick, icon, ariaLabel } = props

  const renderIcon = () => {
    if (!icon) {
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
      )
    }

    // If `icon` is already a React element, render it
    if (isValidElement(icon)) return icon

    // If `icon` is a component (function or object like forwardRef), render as element
    // If icon is a plain string or number, render it as text (e.g., "+")
    if (typeof icon === 'string' || typeof icon === 'number') {
      return <span className="floatingCreateButton__iconText">{icon}</span>
    }

    const IconComponent = icon
    try {
      return <IconComponent />
    } catch (err) {
      // Fallback: render it as-is (may show nothing) and log for debugging
      console.error('FloatingCreateButton: failed to render icon', err, icon)
      return null
    }
  }

  return (
    <button
      type="button"
      className="floatingCreateButton"
      aria-label={ariaLabel || label || 'Criar novo item'}
      onClick={onClick}
    >
      <span className="floatingCreateButton__glow" aria-hidden="true" />
      <span className="floatingCreateButton__icon" aria-hidden="true">
        {renderIcon()}
      </span>
      {caption ? <span className="floatingCreateButton__caption">{caption}</span> : null}
    </button>
  )
}
