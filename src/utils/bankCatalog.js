// Catálogo de bancos, fintechs e bandeiras (BR) para exibir logos oficiais
// em contas e cartões. O logo é carregado pelo domínio oficial (favicon em alta);
// `color` é a cor da marca, usada no monograma de fallback e como acento.
//
// O vínculo é guardado nos campos já existentes (`icon` da conta / `brand` do
// cartão) como "bank:<id>" — sem mudança de schema. Registros antigos com emoji
// ainda funcionam: o match automático pelo NOME ("C6 Bank" → c6) cobre a maioria.

export const BANKS = [
  // Bancos tradicionais
  { id: 'itau', name: 'Itaú', domain: 'itau.com.br', color: '#ec7000', aliases: ['itau', 'itaú'] },
  { id: 'bradesco', name: 'Bradesco', domain: 'bradesco.com.br', color: '#cc092f', aliases: ['bradesco'] },
  { id: 'santander', name: 'Santander', domain: 'santander.com.br', color: '#ec0000', aliases: ['santander'] },
  { id: 'bb', name: 'Banco do Brasil', domain: 'bb.com.br', color: '#2456a6', aliases: ['bb', 'banco do brasil'] },
  { id: 'caixa', name: 'Caixa', domain: 'caixa.gov.br', color: '#005ca9', aliases: ['caixa', 'cef', 'caixa economica'] },
  { id: 'safra', name: 'Safra', domain: 'safra.com.br', color: '#06213f', aliases: ['safra'] },
  { id: 'banrisul', name: 'Banrisul', domain: 'banrisul.com.br', color: '#0067b1', aliases: ['banrisul'] },
  { id: 'bv', name: 'Banco BV', domain: 'bv.com.br', color: '#2361ad', aliases: ['bv', 'votorantim'] },
  { id: 'bmg', name: 'BMG', domain: 'bancobmg.com.br', color: '#ff6f00', aliases: ['bmg'] },
  { id: 'pan', name: 'Banco Pan', domain: 'bancopan.com.br', color: '#00b2e3', aliases: ['pan'] },
  { id: 'original', name: 'Banco Original', domain: 'original.com.br', color: '#00a857', aliases: ['original'] },
  // Digitais / fintechs
  { id: 'nubank', name: 'Nubank', domain: 'nubank.com.br', color: '#820ad1', aliases: ['nubank', 'nu'] },
  { id: 'inter', name: 'Inter', domain: 'inter.co', color: '#ff7a00', aliases: ['inter', 'banco inter'] },
  { id: 'c6', name: 'C6 Bank', domain: 'c6bank.com.br', color: '#1a1a1a', aliases: ['c6', 'c6 bank'] },
  { id: 'neon', name: 'Neon', domain: 'neon.com.br', color: '#00a3e0', aliases: ['neon'] },
  { id: 'cora', name: 'Cora', domain: 'cora.com.br', color: '#fe3e6d', aliases: ['cora'] },
  { id: 'next', name: 'Next', domain: 'next.me', color: '#00c853', aliases: ['next'] },
  { id: 'will', name: 'Will Bank', domain: 'willbank.com.br', color: '#ffd800', aliases: ['will', 'will bank'] },
  { id: 'picpay', name: 'PicPay', domain: 'picpay.com', color: '#21c25e', aliases: ['picpay'] },
  { id: 'mercadopago', name: 'Mercado Pago', domain: 'mercadopago.com.br', color: '#00b1ea', aliases: ['mercado pago', 'mercadopago'] },
  { id: 'pagbank', name: 'PagBank', domain: 'pagbank.com.br', color: '#4fbf2f', aliases: ['pagbank', 'pagseguro'] },
  { id: 'stone', name: 'Stone', domain: 'stone.com.br', color: '#0db14b', aliases: ['stone', 'ton'] },
  { id: 'iti', name: 'iti (Itaú)', domain: 'iti.itau', color: '#ff2b71', aliases: ['iti'] },
  { id: 'digio', name: 'Digio', domain: 'digio.com.br', color: '#0033ee', aliases: ['digio'] },
  { id: 'nomad', name: 'Nomad', domain: 'nomadglobal.com', color: '#10d48e', aliases: ['nomad'] },
  { id: 'wise', name: 'Wise', domain: 'wise.com', color: '#9fe870', aliases: ['wise'] },
  // Investimentos
  { id: 'btg', name: 'BTG Pactual', domain: 'btgpactual.com', color: '#001e62', aliases: ['btg', 'btg pactual'] },
  { id: 'xp', name: 'XP', domain: 'xpi.com.br', color: '#0d0d12', aliases: ['xp', 'xp investimentos'] },
  { id: 'rico', name: 'Rico', domain: 'rico.com.vc', color: '#f74f00', aliases: ['rico'] },
  // Cooperativas
  { id: 'sicoob', name: 'Sicoob', domain: 'sicoob.com.br', color: '#003641', aliases: ['sicoob'] },
  { id: 'sicredi', name: 'Sicredi', domain: 'sicredi.com.br', color: '#64a70b', aliases: ['sicredi'] },
  // Bandeiras de cartão
  { id: 'visa', name: 'Visa', domain: 'visa.com.br', color: '#1a1f71', aliases: ['visa'], network: true },
  { id: 'mastercard', name: 'Mastercard', domain: 'mastercard.com.br', color: '#eb001b', aliases: ['mastercard', 'master'], network: true },
  { id: 'elo', name: 'Elo', domain: 'elo.com.br', color: '#0d0d12', aliases: ['elo'], network: true },
  { id: 'amex', name: 'American Express', domain: 'americanexpress.com', color: '#016fd0', aliases: ['amex', 'american express'], network: true },
  { id: 'hipercard', name: 'Hipercard', domain: 'hipercard.com.br', color: '#b3131b', aliases: ['hipercard'], network: true },
]

const byId = new Map(BANKS.map((b) => [b.id, b]))

// Normaliza para comparação: minúsculas, sem acento, só alfanumérico + espaços
export function normalizeText(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

// Um alias casa se aparecer como sequência de TOKENS inteiros do nome
// ("c6" casa "C6 Bank"; "inter" NÃO casa "Conta Internacional").
function aliasMatches(nameTokens, alias) {
  const aliasTokens = alias.split(' ')
  outer: for (let i = 0; i <= nameTokens.length - aliasTokens.length; i++) {
    for (let j = 0; j < aliasTokens.length; j++) {
      if (nameTokens[i + j] !== aliasTokens[j]) continue outer
    }
    return true
  }
  return false
}

// Resolve um valor ("bank:c6", nome da conta/cartão, etc.) para um banco do catálogo.
export function findBank(value) {
  if (!value || typeof value !== 'string') return null
  if (value.startsWith('bank:')) return byId.get(value.slice(5)) || null

  const tokens = normalizeText(value).split(' ').filter(Boolean)
  if (tokens.length === 0) return null

  let best = null
  for (const bank of BANKS) {
    for (const alias of bank.aliases) {
      if (aliasMatches(tokens, alias)) {
        // Prefere o alias mais específico (mais longo) em caso de duplo match
        if (!best || alias.length > best.aliasLength) best = { bank, aliasLength: alias.length }
      }
    }
  }
  return best?.bank || null
}

// Detecta valores legados (emoji) guardados em icon/brand
export function isEmojiIcon(value) {
  if (!value || typeof value !== 'string' || value.startsWith('bank:')) return false
  try {
    return /\p{Extended_Pictographic}/u.test(value)
  } catch {
    return false
  }
}

// URL do logo oficial (favicon em alta resolução via serviço do Google)
export function bankLogoUrl(bank, size = 128) {
  return `https://www.google.com/s2/favicons?domain=${bank.domain}&sz=${size}`
}

// Fonte alternativa caso a primária falhe
export function bankLogoFallbackUrl(bank) {
  return `https://icon.horse/icon/${bank.domain}`
}
