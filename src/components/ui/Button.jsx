import { forwardRef } from 'react'
import './Button.css'

const Button = forwardRef(function Button(
  {
    children,
    icon: Icon,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    className = '',
    type = 'button',
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={`fa-button fa-button--${variant} fa-button--${size} ${className}`}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {Icon && <Icon size={size === 'sm' ? 14 : 16} strokeWidth={1.75} aria-hidden="true" />}
      <span>{loading ? 'Aguarde…' : children}</span>
    </button>
  )
})
export default Button
