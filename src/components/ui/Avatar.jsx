import './Avatar.css'

export default function Avatar({ user, size = 'sm', className = '' }) {
  const source = (user?.name || user?.email || '?').trim()
  const parts = source.split(/\s+/)
  const initials = (
    parts.length > 1 ? `${parts[0][0]}${parts.at(-1)[0]}` : source.slice(0, 2)
  ).toUpperCase()
  return (
    <span className={`fa-avatar fa-avatar--${size} ${className}`} aria-hidden="true">
      {initials}
    </span>
  )
}
