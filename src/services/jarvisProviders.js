// Camada de provedores do Jarvis. Formato canônico = Anthropic Messages
// (mensagens com blocos de conteúdo: text / tool_use / tool_result / thinking).
// O adaptador OpenAI-compatível traduz de/para esse formato, então o loop
// agêntico em jarvisService.js não sabe qual provedor está por trás.
//
// Interface: send({ system, messages, tools, config }) →
//   { content: [blocos], stopReason: 'end_turn' | 'tool_use' }
import Anthropic from '@anthropic-ai/sdk'
import { effectiveModel, providerMeta } from './jarvisConfig.js'

// ---------- Anthropic (SDK oficial) ----------

async function sendAnthropic({ system, messages, tools, config }) {
  // App 100% client-side de usuário único: a chave vive só neste device,
  // por isso o acesso direto do browser é aceitável aqui.
  const client = new Anthropic({ apiKey: config.apiKey, dangerouslyAllowBrowser: true })

  try {
    const response = await client.messages.create({
      model: effectiveModel(config),
      max_tokens: 8192,
      thinking: { type: 'adaptive' },
      system,
      messages,
      tools: tools?.length ? tools : undefined,
    })
    return { content: response.content, stopReason: response.stop_reason }
  } catch (error) {
    throw normalizeAnthropicError(error)
  }
}

function normalizeAnthropicError(error) {
  if (error instanceof Anthropic.AuthenticationError) {
    return new Error('Chave de API inválida. Confira a chave nas configurações do Jarvis.')
  }
  if (error instanceof Anthropic.RateLimitError) {
    return new Error('Limite de requisições atingido. Aguarde alguns segundos e tente de novo.')
  }
  if (error instanceof Anthropic.APIConnectionError) {
    return new Error('Não consegui conectar à API da Anthropic. Verifique sua internet.')
  }
  if (error instanceof Anthropic.APIError) {
    return new Error(`Erro da API (${error.status}): ${error.message}`)
  }
  return error
}

// ---------- OpenAI-compatível (OpenAI, Groq, OpenRouter, Ollama...) ----------

function toOpenAIMessages(system, messages) {
  const out = [{ role: 'system', content: system }]
  for (const msg of messages) {
    if (typeof msg.content === 'string') {
      out.push({ role: msg.role, content: msg.content })
      continue
    }
    if (msg.role === 'assistant') {
      const text = msg.content.filter((b) => b.type === 'text').map((b) => b.text).join('\n')
      const toolCalls = msg.content
        .filter((b) => b.type === 'tool_use')
        .map((b) => ({
          id: b.id,
          type: 'function',
          function: { name: b.name, arguments: JSON.stringify(b.input || {}) },
        }))
      const entry = { role: 'assistant', content: text || null }
      if (toolCalls.length) entry.tool_calls = toolCalls
      out.push(entry)
    } else {
      // user: tool_results viram mensagens role:"tool"; textos viram user
      for (const block of msg.content) {
        if (block.type === 'tool_result') {
          out.push({
            role: 'tool',
            tool_call_id: block.tool_use_id,
            content: typeof block.content === 'string' ? block.content : JSON.stringify(block.content),
          })
        } else if (block.type === 'text') {
          out.push({ role: 'user', content: block.text })
        }
      }
    }
  }
  return out
}

function toOpenAITools(tools) {
  return (tools || []).map((t) => ({
    type: 'function',
    function: { name: t.name, description: t.description, parameters: t.input_schema },
  }))
}

async function sendOpenAICompatible({ system, messages, tools, config }) {
  const baseUrl = (config.baseUrl || providerMeta('openai').defaultBaseUrl).replace(/\/$/, '')
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: effectiveModel(config),
      messages: toOpenAIMessages(system, messages),
      tools: tools?.length ? toOpenAITools(tools) : undefined,
    }),
  })

  if (!response.ok) {
    if (response.status === 401) throw new Error('Chave de API inválida. Confira a chave nas configurações do Jarvis.')
    if (response.status === 429) throw new Error('Limite de requisições atingido. Aguarde e tente de novo.')
    const body = await response.text().catch(() => '')
    throw new Error(`Erro da API (${response.status}): ${body.slice(0, 200)}`)
  }

  const data = await response.json()
  const message = data.choices?.[0]?.message || {}
  const content = []
  if (message.content) content.push({ type: 'text', text: message.content })
  for (const call of message.tool_calls || []) {
    let input = {}
    try { input = JSON.parse(call.function?.arguments || '{}') } catch { /* input inválido → {} */ }
    content.push({ type: 'tool_use', id: call.id, name: call.function?.name, input })
  }
  return {
    content,
    stopReason: message.tool_calls?.length ? 'tool_use' : 'end_turn',
  }
}

// ---------- Dispatcher ----------

export async function sendChat(params) {
  if (params.config.provider === 'openai') return sendOpenAICompatible(params)
  return sendAnthropic(params)
}
