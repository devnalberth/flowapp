import './FloatingCreateButton.css'

/**
 * @typedef {{label?: string, caption?: string, onClick?: ()=>void, icon?: any, ariaLabel?: string}} FloatingCreateButtonProps
 */

/**
 * @param {FloatingCreateButtonProps} props
 */
export default function FloatingCreateButton(props) {
  const { label, caption, onClick, icon, ariaLabel } = props

  const renderIcon = () => {
    if (icon) return icon
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <line x1="12" y1="5" x2="12" y2="19" />
        <line x1="5" y1="12" x2="19" y2="12" />
      </svg>
    )
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
