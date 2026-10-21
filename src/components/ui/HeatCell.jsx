import './HeatCell.css'

export default function HeatCell({ level = 0, label }) {
  return (
    <span
      className="fa-heat"
      role="img"
      aria-label={label}
      title={label}
      style={{ background: `var(--fa-heat-${Math.max(0, Math.min(4, Math.round(level)))})` }}
    />
  )
}
