import { CircleCheck, Info, TriangleAlert } from 'lucide-react'
import './Banner.css'

const icons = { success: CircleCheck, danger: TriangleAlert, warning: TriangleAlert, info: Info }
export default function Banner({ tone = 'info', children, title }) {
  const Icon = icons[tone] || Info
  return (
    <div className={`fa-banner fa-banner--${tone}`} role={tone === 'danger' ? 'alert' : 'status'}>
      <Icon size={18} strokeWidth={1.75} aria-hidden="true" />
      <div>
        {title && <strong>{title}</strong>}
        {children}
      </div>
    </div>
  )
}
