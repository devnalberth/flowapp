import CardHeader from './CardHeader.jsx'
import './KpiCard.css'

export default function KpiCard({
  label,
  value,
  variation,
  context,
  hero = false,
  onAction,
  className = '',
}) {
  return (
    <article className={`fa-kpi ${hero ? 'fa-kpi--hero' : ''} ${className}`}>
      <CardHeader title={label} onAction={onAction} dark={hero} />
      <p className="fa-kpi__value">{value}</p>
      {(variation != null || context) && (
        <p className="fa-kpi__context">
          {variation != null && <span>{variation}</span>}
          {context}
        </p>
      )}
    </article>
  )
}
