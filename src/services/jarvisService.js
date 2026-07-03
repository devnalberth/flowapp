// FlowChat (arquivos internos mantêm o codinome "jarvis") — orquestração do
// chat: persona, loop agêntico (modelo ↔ ferramentas)
// e persistência da conversa. O loop é manual para funcionar igual em qualquer
// provedor: envia mensagens, executa TODOS os tool_use retornados, devolve os
// tool_results numa ÚNICA mensagem de usuário e repete até o modelo concluir.
import { sendChat } from './jarvisProviders.js'
import { JARVIS_TOOLS, executeJarvisTool } from './jarvisTools.js'
import { getJarvisConfig } from './jarvisConfig.js'

const MAX_TOOL_ROUNDS = 6
const STORAGE_KEY = 'flowapp_jarvis_chat'
const MAX_STORED_MESSAGES = 60

const TOOL_LABEL = {
  get_day_summary: 'Consultou o resumo do dia',
  list_tasks: 'Consultou tarefas',
  create_task: 'Criou uma tarefa',
  complete_task: 'Concluiu uma tarefa',
  get_finance_summary: 'Consultou as finanças',
  create_transaction: 'Registrou um lançamento',
  get_habits: 'Consultou os hábitos',
  complete_habit: 'Concluiu um hábito',
  get_goals_and_projects: 'Consultou metas e projetos',
}

export function buildSystemPrompt(ctx) {
  const now = new Date()
  const categories = ctx.financeCategories
    .map((c) => `${c.slug} (${c.name}, ${c.type})`)
    .join(', ')

  return `Você é o FlowChat, o assistente pessoal do FlowApp — sistema de organização pessoal do ${ctx.userName || 'usuário'} com tarefas, projetos, metas, hábitos, estudos e finanças. Sua personalidade é inspirada no Jarvis do Homem de Ferro (competente, direto, levemente espirituoso, sempre respeitoso), mas seu nome é FlowChat. Responda SEMPRE em português do Brasil.

Data e hora atuais: ${now.toLocaleString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.

Regras:
- Você atua APENAS dentro do sistema, através das ferramentas disponíveis. Não invente dados: consulte as ferramentas antes de afirmar qualquer coisa sobre tarefas, finanças ou hábitos.
- Valores monetários em reais (R$), formato brasileiro.
- Para criar tarefas/lançamentos: se o pedido estiver claro, execute direto e confirme o que fez. Se faltar informação essencial (valor, categoria, data ambígua), pergunte antes.
- Interprete datas relativas ("amanhã", "sexta") a partir da data atual acima.
- Categorias financeiras válidas (use o slug): ${categories || 'nenhuma cadastrada'}.
- Seja conciso: responda o que foi perguntado, destaque números importantes e no máximo uma sugestão de próximo passo quando fizer sentido.
- Se uma ferramenta retornar erro, explique em linguagem simples e sugira o que o usuário pode fazer.`
}

// Executa um turno completo: retorna { text, toolLabels } e muta `history`
// (array canônico no formato Anthropic) com todos os passos intermediários.
export async function runJarvisTurn({ history, userText, ctx }) {
  const config = getJarvisConfig()
  const system = buildSystemPrompt(ctx)
  const toolLabels = []

  history.push({ role: 'user', content: userText })

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    const response = await sendChat({ system, messages: history, tools: JARVIS_TOOLS, config })

    // Preserva o conteúdo completo (inclui blocos thinking/tool_use) no histórico
    history.push({ role: 'assistant', content: response.content })

    const toolUses = response.content.filter((b) => b.type === 'tool_use')
    if (response.stopReason !== 'tool_use' || toolUses.length === 0) {
      const text = response.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim()
      return { text: text || 'Feito.', toolLabels }
    }

    if (round === MAX_TOOL_ROUNDS) {
      return { text: 'Precisei de passos demais para essa solicitação — pode reformular de forma mais específica?', toolLabels }
    }

    // Executa todas as ferramentas do turno e devolve os resultados juntos
    const results = []
    for (const call of toolUses) {
      toolLabels.push(TOOL_LABEL[call.name] || call.name)
      let result
      try {
        result = await executeJarvisTool(call.name, call.input || {}, ctx)
      } catch (error) {
        result = { erro: error?.message || 'Falha ao executar a ação.' }
      }
      results.push({
        type: 'tool_result',
        tool_use_id: call.id,
        content: JSON.stringify(result),
        is_error: Boolean(result?.erro),
      })
    }
    history.push({ role: 'user', content: results })
  }

  return { text: 'Não consegui concluir a solicitação.', toolLabels }
}

// ---------- Persistência da conversa (localStorage) ----------

export function loadJarvisChat() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { display: [], history: [] }
    const parsed = JSON.parse(raw)
    return {
      display: Array.isArray(parsed.display) ? parsed.display : [],
      history: Array.isArray(parsed.history) ? parsed.history : [],
    }
  } catch {
    return { display: [], history: [] }
  }
}

// Corta o histórico sem quebrar pares tool_use/tool_result: o corte só pode
// começar numa mensagem de usuário com texto puro (início de turno).
function trimHistory(history) {
  let trimmed = history.slice(-MAX_STORED_MESSAGES)
  while (trimmed.length && !(trimmed[0].role === 'user' && typeof trimmed[0].content === 'string')) {
    trimmed = trimmed.slice(1)
  }
  return trimmed
}

export function saveJarvisChat(display, history) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        display: display.slice(-MAX_STORED_MESSAGES),
        history: trimHistory(history),
      }),
    )
  } catch { /* storage cheio: conversa segue só em memória */ }
}

export function clearJarvisChat() {
  localStorage.removeItem(STORAGE_KEY)
}
