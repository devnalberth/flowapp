import { useEffect, useMemo, useState } from 'react'
import { Minus, Plus } from 'lucide-react'
import './BlockMeter.css'

// Acima disso, desenhar um tick por aula vira serrilhado: cai para barra contínua.
const TICK_LIMIT = 24

/**
 * Medidor de um bloco de estudo: quantas aulas do bloco já foram vistas.
 *
 * É um input[type=range] estilizado. Clicar em qualquer ponto, arrastar e usar
 * as setas do teclado funcionam sem código extra, e o controle inteiro é um
 * único ponto de foco — melhor que 24 botões em sequência no Tab.
 */
export default function BlockMeter({ done = 0, total = 0, onChange, onSetTotal, disabled = false, id }) {
  const [draft, setDraft] = useState(String(total || ''))

  useEffect(() => { setDraft(String(total || '')) }, [total])

  const value = Math.min(Math.max(0, done), total)
  const percent = total ? Math.round((value / total) * 100) : 0
  const ticks = useMemo(
    () => (total > 0 && total <= TICK_LIMIT ? Array.from({ length: total }, (_, i) => i) : null),
    [total],
  )

  const commitTotal = () => {
    const next = Math.max(0, Math.floor(Number(draft) || 0))
    if (next !== total) onSetTotal?.(next)
    else setDraft(String(total || ''))
  }

  if (!total) {
    return (
      <div className="blockMeter blockMeter--empty">
        <label htmlFor={`${id}-total`}>Quantas aulas tem este bloco?</label>
        <div className="blockMeter__totalRow">
          <input
            id={`${id}-total`}
            className="blockMeter__totalInput"
            type="number"
            min="0"
            inputMode="numeric"
            value={draft}
            disabled={disabled}
            placeholder="0"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitTotal}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitTotal() } }}
          />
          <span className="blockMeter__hint">Deixe em branco para tratar o bloco como uma única entrega.</span>
        </div>
      </div>
    )
  }

  return (
    <div className="blockMeter">
      <div className="blockMeter__top">
        <label htmlFor={id}>Aulas concluídas</label>
        <output htmlFor={id} className="blockMeter__readout">
          <strong>{value}</strong>
          <span className="blockMeter__of">de</span>
          <input
            className="blockMeter__totalInput blockMeter__totalInput--inline"
            type="number"
            min="0"
            inputMode="numeric"
            value={draft}
            disabled={disabled}
            aria-label="Total de aulas do bloco"
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitTotal}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); commitTotal() } }}
          />
          <span className="blockMeter__pct">{percent}%</span>
        </output>
      </div>

      <div className="blockMeter__control">
        <button
          type="button"
          className="blockMeter__step"
          onClick={() => onChange?.(Math.max(0, value - 1))}
          disabled={disabled || value <= 0}
          aria-label="Tirar uma aula concluída"
        >
          <Minus size={14} />
        </button>

        <div className={`blockMeter__track ${ticks ? 'is-ticked' : ''}`} style={{ '--fill': `${percent}%` }}>
          {ticks ? (
            <div className="blockMeter__ticks" aria-hidden="true">
              {ticks.map((i) => (
                <span key={i} className={`blockMeter__tick ${i < value ? 'is-done' : ''}`} />
              ))}
            </div>
          ) : (
            <div className="blockMeter__bar" aria-hidden="true"><span /></div>
          )}
          <input
            id={id}
            className="blockMeter__range"
            type="range"
            min="0"
            max={total}
            step="1"
            value={value}
            disabled={disabled}
            aria-label={`Aulas concluídas: ${value} de ${total}`}
            aria-valuetext={`${value} de ${total} aulas`}
            onChange={(e) => onChange?.(Number(e.target.value))}
          />
        </div>

        <button
          type="button"
          className="blockMeter__step"
          onClick={() => onChange?.(Math.min(total, value + 1))}
          disabled={disabled || value >= total}
          aria-label="Marcar mais uma aula concluída"
        >
          <Plus size={14} />
        </button>

        <button
          type="button"
          className={`blockMeter__finish ${value >= total ? 'is-done' : ''}`}
          onClick={() => onChange?.(value >= total ? 0 : total)}
          disabled={disabled}
        >
          {value >= total ? 'Reabrir' : 'Concluir bloco'}
        </button>
      </div>
    </div>
  )
}
