import { Flame, Target } from 'lucide-react'
import './StreakPill.css'

export default function StreakPill({ days = 0, record = 0 }) {
  return (
    <span className={`fa-streak ${days < 1 ? 'fa-streak--zero' : ''}`}>
      {days > 0 ? (
        <>
          <Flame size={14} strokeWidth={1.75} aria-hidden="true" />
          <strong>
            {days} {days === 1 ? 'dia' : 'dias'}
          </strong>
          <span>· recorde {record}</span>
        </>
      ) : (
        <>
          <Target size={14} strokeWidth={1.75} aria-hidden="true" />
          Comece hoje
        </>
      )}
    </span>
  )
}
