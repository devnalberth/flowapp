import { motion, useReducedMotion } from 'framer-motion'
import './ProgressBar.css'

export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  detail,
  color,
  className = '',
}) {
  const reduced = useReducedMotion()
  const percent = Math.min(100, Math.max(0, (Number(value) / (max || 1)) * 100)) || 0
  return (
    <div className={`fa-progress ${className}`}>
      {(label || detail) && (
        <div className="fa-progress__header">
          <span>{label}</span>
          <span>{detail ?? `${Math.round(percent)}%`}</span>
        </div>
      )}
      <div
        className="fa-progress__track"
        role="progressbar"
        aria-label={label || 'Progresso'}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <motion.span
          className="fa-progress__fill"
          initial={reduced ? false : { scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          style={{
            width: `${percent}%`,
            background:
              percent >= 100 ? 'var(--fa-progress-done)' : color || 'var(--fa-progress-fill)',
          }}
        />
      </div>
    </div>
  )
}
