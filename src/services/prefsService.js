// Preferências do app — salvas apenas neste dispositivo (localStorage).
// Consumidas de forma reativa via AppContext (prefs / updatePrefs).
const STORAGE_KEY = 'flowapp_prefs'

export const DEFAULT_PREFS = {
  startPage: 'Dashboard',      // página aberta após o login
  hideFinanceValues: false,    // mascara valores na aba Financeiro
}

export function getPrefs() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PREFS }
    const parsed = JSON.parse(raw)
    return { ...DEFAULT_PREFS, ...(parsed && typeof parsed === 'object' ? parsed : {}) }
  } catch {
    return { ...DEFAULT_PREFS }
  }
}

export function savePrefs(prefs) {
  const merged = { ...DEFAULT_PREFS, ...prefs }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  } catch { /* storage indisponível: preferências valem só para a sessão */ }
  return merged
}
