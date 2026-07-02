import { useMemo, useState } from 'react'
import { Search, CircleSlash } from 'lucide-react'
import BankLogo from './BankLogo.jsx'
import { BANKS, normalizeText, findBank } from '../../utils/bankCatalog.js'
import './BankPicker.css'

// Seletor de instituição para os modais de conta/cartão.
// Seleção grava "bank:<id>" no campo icon/brand; "Sem logo" grava o sentinela
// 'none' (força o monograma mesmo quando o nome casaria com um banco).
export default function BankPicker({ value, name = '', onSelect, includeNetworks = false }) {
  const [query, setQuery] = useState('')

  const selected = value === 'none' ? null : findBank(value) || findBank(name)

  const list = useMemo(() => {
    const base = BANKS.filter((b) => includeNetworks || !b.network)
    const q = normalizeText(query)
    if (!q) return base
    return base.filter(
      (b) => normalizeText(b.name).includes(q) || b.aliases.some((a) => a.includes(q)),
    )
  }, [query, includeNetworks])

  return (
    <div className="bankPicker">
      <div className="bankPicker__search">
        <Search size={14} />
        <input
          type="text"
          placeholder="Buscar banco ou bandeira..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="bankPicker__grid">
        <button
          type="button"
          className={`bankPicker__item ${value === 'none' ? 'is-on' : ''}`}
          onClick={() => onSelect(null)}
          title="Sem logo (usa as iniciais e a cor escolhida)"
        >
          <span className="bankPicker__none"><CircleSlash size={16} /></span>
          <em>Sem logo</em>
        </button>
        {list.map((bank) => (
          <button
            key={bank.id}
            type="button"
            className={`bankPicker__item ${selected?.id === bank.id ? 'is-on' : ''}`}
            onClick={() => onSelect(bank)}
            title={bank.name}
          >
            <BankLogo value={`bank:${bank.id}`} name={bank.name} size={30} />
            <em>{bank.name}</em>
          </button>
        ))}
        {list.length === 0 && <p className="bankPicker__empty">Nenhum banco encontrado.</p>}
      </div>
    </div>
  )
}
