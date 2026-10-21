import { motion, useReducedMotion } from 'framer-motion'
import { pop } from './motion.js'
import './ProgressRing.css'

const sizes = { sm: 40, md: 64, lg: 96 }
export default function ProgressRing({
  value = 0,
  max = 100,
  size = 'sm',
  color,
  label = 'Progresso',
  children,
  className = '',
}) {
  const reduce = useReducedMotion()
  const px = sizes[size] || Number(size) || sizes.sm
  const percent = Math.min(100, Math.max(0, (Number(value) / (max || 1)) * 100)) || 0
  const circumference = 2 * Math.PI * 44
  return (
    <motion.div
      className={`fa-ring fa-ring--${size} ${className}`}
      initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.8 }}
      animate={reduce ? { opacity: 1 } : { opacity: 1, scale: 1 }}
      transition={{ duration: reduce ? 0.15 : 0.45, ease: pop }}
      style={{ width: px, height: px }}
      role="progressbar"
      aria-label={label}
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="fa-ring__track" cx="50" cy="50" r="44" />
        <circle
          className="fa-ring__fill"
          cx="50"
          cy="50"
          r="44"
          strokeDasharray={circumference}
          strokeDashoffset={circumference * (1 - percent / 100)}
          style={{
            stroke: percent >= 100 ? 'var(--fa-progress-done)' : color || 'var(--fa-progress-fill)',
          }}
        />
      </svg>
      <span className="fa-ring__label">{children ?? `${Math.round(percent)}%`}</span>
    </motion.div>
  )
}
