import './FloatingCreateButton.css'
import { isValidElement, useState } from 'react'
import { Plus, X } from 'lucide-react'

/**
 * @typedef {{label: string, icon: any, onClick: () => void, color?: string}} SpeedDialOption
 * @typedef {{label?: string, caption?: string, onClick?: ()=>void, icon?: any, ariaLabel?: string, options?: SpeedDialOption[]}} FloatingCreateButtonProps
 */

/**
 * @param {FloatingCreateButtonProps} props
 */
export default function FloatingCreateButton(props) {
  const { label, caption, onClick, icon, ariaLabel, options } = props
  const [isOpen, setIsOpen] = useState(false)

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

  const handleMainClick = () => {
    if (options && options.length > 0) {
      setIsOpen(!isOpen)
    } else {
      onClick?.()
    }
  }

  return (
    <div className={`floatingCreateContainer ${isOpen ? 'open' : ''}`}>
      {options && isOpen && (
        <div className="floatingCreateOptions">
          {options.map((opt, idx) => {
            const OptIcon = opt.icon
            return (
              <button
                key={idx}
                className="floatingCreateOption"
                onClick={() => {
                  opt.onClick()
                  setIsOpen(false)
                }}
                style={{ '--delay': `${idx * 0.05}s`, '--opt-color': opt.color || '#3b82f6' }}
                aria-label={opt.label}
              >
                <span className="floatingCreateOption__label">{opt.label}</span>
                <span className="floatingCreateOption__icon">
                  {isValidElement(OptIcon) ? OptIcon : <OptIcon size={20} />}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Backdrop para fechar ao clicar fora quando aberto */}
      {isOpen && <div className="floatingCreateBackdrop" onClick={() => setIsOpen(false)} />}

      <button
        type="button"
        className={`floatingCreateButton ${isOpen ? 'active' : ''}`}
        aria-label={ariaLabel || label || 'Criar novo item'}
        onClick={handleMainClick}
      >
        <span className="floatingCreateButton__glow" aria-hidden="true" />
        <span className="floatingCreateButton__icon" aria-hidden="true">
          {options ? (
            isOpen ? <X size={28} /> : (icon ? renderIcon() : <Plus size={28} />)
          ) : (
            renderIcon()
          )}
        </span>
        {caption ? <span className="floatingCreateButton__caption">{caption}</span> : null}
      </button>
    </div>
  )
}
