// Configuração do Jarvis (provedor de IA) — persistida em localStorage.
// O provedor fica em aberto até o usuário configurar: Anthropic (recomendado)
// ou qualquer endpoint compatível com a API da OpenAI (OpenAI, Groq, OpenRouter,
// Ollama local...). A chave NUNCA vai para o banco — só localStorage do device.

const STORAGE_KEY = 'flowapp_jarvis_config'

export const PROVIDERS = [
  {
    id: 'anthropic',
    label: 'Anthropic (Claude)',
    defaultModel: 'claude-opus-4-8',
    keyHint: 'sk-ant-...',
    keyUrl: 'https://platform.claude.com/',
  },
  {
    id: 'openai',
    label: 'OpenAI / compatível',
    defaultModel: 'gpt-5.2',
    keyHint: 'sk-...',
    keyUrl: 'https://platform.openai.com/api-keys',
    // baseUrl custom cobre Groq, OpenRouter, Ollama etc.
    defaultBaseUrl: 'https://api.openai.com/v1',
  },
]

const DEFAULTS = {
  provider: 'anthropic',
  apiKey: '',
  model: '',
  baseUrl: '',
}

export function getJarvisConfig() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULTS }
    return { ...DEFAULTS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULTS }
  }
}

export function setJarvisConfig(config) {
  const merged = { ...getJarvisConfig(), ...config }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(merged))
  return merged
}

export function isJarvisConfigured(config = getJarvisConfig()) {
  return Boolean(config.apiKey && config.provider)
}

export function providerMeta(providerId) {
  return PROVIDERS.find((p) => p.id === providerId) || PROVIDERS[0]
}

export function effectiveModel(config = getJarvisConfig()) {
  return config.model || providerMeta(config.provider).defaultModel
}
