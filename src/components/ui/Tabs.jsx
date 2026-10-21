import './Tabs.css'

export function Segmented({ options, value, onChange, label, className = '', tabs = false }) {
  const move = (event) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const enabled = options.filter((option) => !option.disabled)
    if (!enabled.length) return
    const current = enabled.findIndex((option) => option.value === value)
    const index =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? enabled.length - 1
          : (current + (event.key === 'ArrowRight' ? 1 : -1) + enabled.length) % enabled.length
    const next = enabled[index]
    onChange(next.value)
    const buttons = [...event.currentTarget.querySelectorAll('button:not(:disabled)')]
    buttons[index]?.focus()
  }
  return (
    <div
      role={tabs ? 'tablist' : 'group'}
      aria-label={label}
      className={`fa-tabs ${className}`}
      onKeyDown={move}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          id={option.id}
          role={tabs ? 'tab' : undefined}
          aria-selected={tabs ? value === option.value : undefined}
          aria-pressed={!tabs ? value === option.value : undefined}
          aria-controls={option.panelId}
          tabIndex={tabs ? (value === option.value ? 0 : -1) : 0}
          disabled={option.disabled}
          className={`fa-tabs__tab ${value === option.value ? 'is-active' : ''}`}
          onClick={() => onChange(option.value)}
        >
          {option.label}
          {option.count != null && <span>{option.count}</span>}
        </button>
      ))}
    </div>
  )
}
export default function Tabs(props) {
  return <Segmented {...props} tabs />
}
