import { Circle, TriangleAlert, Zap } from 'lucide-react'
import './PriorityTag.css'

const priorities = {
  Urgente: ['danger', TriangleAlert],
  Alta: ['warning', Zap],
  Normal: ['neutral', Circle],
  Baixa: ['low', Circle],
}
export default function PriorityTag({ priority = 'Normal', flow = false }) {
  const [tone, Icon] = priorities[priority] || priorities.Normal
  return (
    <span className="fa-priority-group">
      <span className={`fa-priority fa-priority--${tone}`}>
        <Icon size={12} strokeWidth={1.75} aria-hidden="true" />
        {priority}
      </span>
      {flow && ['Urgente', 'Alta'].includes(priority) && (
        <span className="fa-priority__flow">Flow</span>
      )}
    </span>
  )
}
