import { useReducedMotion } from 'framer-motion'

export const ease = [0.16, 1, 0.3, 1]
export const pop = [0.34, 1.56, 0.64, 1]
export const grid = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.25 } },
}
export const card = {
  hidden: { opacity: 0, y: 28, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.55, ease } },
}
export const row = {
  hidden: { opacity: 0, y: 8 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease } },
}

// Reduced motion preserves feedback, without displacement or stagger.
export function useMotionPresets() {
  const reduce = useReducedMotion()
  const fade = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { duration: 0.15 } } }
  return {
    reduce: Boolean(reduce),
    grid: reduce ? { hidden: {}, show: {} } : grid,
    card: reduce ? fade : card,
    row: reduce ? fade : row,
  }
}
