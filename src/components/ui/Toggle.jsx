import './Toggle.css'

export default function Toggle({ checked, onChange, label, disabled = false, ...props }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={Boolean(checked)}
      aria-label={label}
      disabled={disabled}
      className={`fa-toggle ${checked ? 'is-on' : ''}`}
      onClick={() => onChange?.(!checked)}
      {...props}
    >
      <span />
    </button>
  )
}
