// Saneamento de URLs vindas do usuário antes de irem para um href.
//
// `<input type="url">` NÃO protege: `javascript:alert(1)` é uma URL absoluta
// válida e passa na validação do browser. Como a chave da IA vive no
// localStorage, um href malicioso clicado consegue exfiltrá-la.
//
// Só http e https passam. Qualquer outro esquema (javascript:, data:, vbscript:,
// file:) vira null, e quem chama decide o que fazer — normalmente não renderizar
// o link.

const ALLOWED_PROTOCOLS = new Set(['http:', 'https:'])

export function safeExternalUrl(value) {
  if (!value || typeof value !== 'string') return null

  const trimmed = value.trim()
  if (!trimmed) return null

  try {
    // Sem esquema explícito assumimos https, senão "exemplo.com" viraria um
    // caminho relativo e o link apontaria para dentro do próprio app.
    const parsed = new URL(/^[a-z][a-z0-9+.-]*:/i.test(trimmed) ? trimmed : `https://${trimmed}`)
    return ALLOWED_PROTOCOLS.has(parsed.protocol) ? parsed.href : null
  } catch {
    return null
  }
}

export const isSafeExternalUrl = (value) => safeExternalUrl(value) !== null
