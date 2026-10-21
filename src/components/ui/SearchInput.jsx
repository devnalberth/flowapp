import { forwardRef } from 'react'
import { Search, X } from 'lucide-react'
import './SearchInput.css'

export default forwardRef(function SearchInput(
  { label = 'Buscar', value, onChange, placeholder, onClear, className = '', ...props },
  ref
) {
  return (
    <label className={`fa-search ${className}`}>
      <Search size={16} strokeWidth={1.75} aria-hidden="true" />
      <span className="fa-sr-only">{label}</span>
      <input
        ref={ref}
        type="search"
        value={value}
        onChange={onChange}
        placeholder={placeholder || label}
        {...props}
      />
      {value && onClear && (
        <button type="button" aria-label="Limpar busca" onClick={onClear}>
          <X size={14} strokeWidth={1.75} aria-hidden="true" />
        </button>
      )}
    </label>
  )
})
