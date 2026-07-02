import { useState, useEffect } from 'react'
import { findBank, isEmojiIcon, bankLogoUrl, bankLogoFallbackUrl } from '../../utils/bankCatalog.js'
import './BankLogo.css'

// Avatar de conta/cartão com o logo oficial da instituição.
// Resolução: campo salvo ("bank:<id>") → match automático pelo nome → emoji
// legado → monograma com a cor escolhida. Logos falham offline? Cai no monograma.
export default function BankLogo({ value, name = '', color = '#0d0d12', size = 38, radius }) {
  // 'none' é o sentinela de "sem logo": pula o match e vai direto pro monograma
  const bank = value === 'none' ? null : findBank(value) || findBank(name)
  // 0 = favicon Google, 1 = icon.horse, 2 = fallback local
  const [step, setStep] = useState(0)
  useEffect(() => { setStep(0) }, [bank?.id])

  const style = {
    width: size,
    height: size,
    borderRadius: radius ?? Math.round(size * 0.26),
  }

  if (bank && step < 2) {
    const src = step === 0 ? bankLogoUrl(bank) : bankLogoFallbackUrl(bank)
    return (
      <span className="bankLogo" style={style} title={bank.name}>
        <img
          src={src}
          alt={bank.name}
          loading="lazy"
          onError={() => setStep((s) => s + 1)}
        />
      </span>
    )
  }

  // Emoji legado (dados antigos sem banco identificável)
  if (isEmojiIcon(value)) {
    return (
      <span className="bankLogo bankLogo--emoji" style={{ ...style, background: color }}>
        {value}
      </span>
    )
  }

  // Monograma: iniciais do nome sobre a cor da marca/escolhida
  const initials = (name || bank?.name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase()

  return (
    <span
      className="bankLogo bankLogo--monogram"
      style={{ ...style, background: bank?.color || color, fontSize: Math.max(11, Math.round(size * 0.34)) }}
    >
      {initials}
    </span>
  )
}
