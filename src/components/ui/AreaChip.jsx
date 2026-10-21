import './AreaChip.css'

export const AREA_KEYS = {
  Profissional: 'profissional',
  Pessoal: 'pessoal',
  Financeiro: 'financeiro',
  Estudos: 'estudos',
  Saúde: 'saude',
  Relacionamento: 'relacionamento',
}
export default function AreaChip({ area, children, icon: Icon, className = '' }) {
  const key = AREA_KEYS[area]
  return (
    <span
      className={`fa-area ${className}`}
      style={
        key
          ? { '--area-color': `var(--fa-area-${key})`, '--area-bg': `var(--fa-area-${key}-bg)` }
          : undefined
      }
    >
      {Icon ? (
        <Icon size={12} strokeWidth={1.75} aria-hidden="true" />
      ) : (
        <span className="fa-area__swatch" aria-hidden="true" />
      )}
      {children || area}
    </span>
  )
}
