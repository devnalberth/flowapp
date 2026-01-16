/**
 * AI Service - Integração com API de IA (OpenAI/Anthropic)
 * 
 * INSTRUÇÕES DE USO:
 * 1. Obtenha uma API Key da OpenAI: https://platform.openai.com/api-keys
 * 2. Adicione no .env.local: VITE_OPENAI_API_KEY=sua-chave-aqui
 * 3. Instale: npm install openai
 * 
 * ALTERNATIVA: Use Anthropic Claude
 * - npm install @anthropic-ai/sdk
 * - VITE_ANTHROPIC_API_KEY=sua-chave-aqui
 */

// Definição das funções que a IA pode chamar
const AVAILABLE_FUNCTIONS = [
  {
    name: 'create_task',
    description: 'Cria uma nova tarefa no sistema',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Título da tarefa',
        },
        dueDate: {
          type: 'string',
          description: 'Data de vencimento no formato ISO (ex: 2026-01-15)',
        },
        dueTime: {
          type: 'string',
          description: 'Hora de vencimento no formato HH:MM (ex: 14:00)',
        },
        priority: {
          type: 'string',
          enum: ['Urgente', 'Alta', 'Normal', 'Baixa'],
          description: 'Prioridade da tarefa',
        },
        context: {
          type: 'string',
          description: 'Contexto ou projeto relacionado',
        },
      },
      required: ['title'],
    },
  },
  {
    name: 'create_finance',
    description: 'Registra uma transação financeira (receita ou despesa)',
    parameters: {
      type: 'object',
      properties: {
        type: {
          type: 'string',
          enum: ['receita', 'despesa'],
          description: 'Tipo da transação',
        },
        value: {
          type: 'number',
          description: 'Valor da transação em reais',
        },
        category: {
          type: 'string',
          description: 'Categoria da transação (ex: Freelancer, Alimentação, Transporte)',
        },
        date: {
          type: 'string',
          description: 'Data da transação no formato DD/MM',
        },
        description: {
          type: 'string',
          description: 'Descrição da transação',
        },
      },
      required: ['type', 'value', 'category'],
    },
  },
  {
    name: 'complete_habit',
    description: 'Marca um hábito como concluído hoje',
    parameters: {
      type: 'object',
      properties: {
        habitName: {
          type: 'string',
          description: 'Nome do hábito a ser marcado como concluído',
        },
      },
      required: ['habitName'],
    },
  },
  {
    name: 'create_habit',
    description: 'Cria um novo hábito para acompanhamento',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Nome do hábito',
        },
        frequency: {
          type: 'string',
          enum: ['diário', 'semanal'],
          description: 'Frequência do hábito',
        },
        category: {
          type: 'string',
          description: 'Categoria do hábito (ex: Saúde, Estudo, Trabalho)',
        },
      },
      required: ['title'],
    },
  },
]

/**
 * Função para interpretar comando usando OpenAI
 * @param {string} userMessage - Mensagem do usuário
 * @param {object} actions - Objeto com funções create_task, create_finance, etc
 * @returns {Promise<object>} Resposta estruturada com texto e ações executadas
 */
export async function processCommand(userMessage, actions) {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY

  if (!apiKey) {
    return {
      text: '⚠️ Configure sua API Key da OpenAI no arquivo .env.local (VITE_OPENAI_API_KEY)',
      actions: [],
    }
  }

  try {
    // Chamada para OpenAI com function calling
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `Você é o FlowChat, assistente do FlowApp. Interprete comandos do usuário e execute ações usando as funções disponíveis. 
            
Regras importantes:
- Para datas: interprete "quinta" ou "quinta-feira" como a próxima quinta-feira
- Para horários: interprete "14h" ou "14:00" como 14:00
- Para valores: interprete "R$ 1.500" ou "1500" como 1500
- Seja conciso e confirme as ações executadas
- Se o usuário mencionar múltiplas ações, execute todas em paralelo`,
          },
          {
            role: 'user',
            content: userMessage,
          },
        ],
        functions: AVAILABLE_FUNCTIONS,
        function_call: 'auto',
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const message = data.choices[0].message

    const executedActions = []

    // Se a IA decidiu chamar funções
    if (message.function_call) {
      const functionName = message.function_call.name
      const functionArgs = JSON.parse(message.function_call.arguments)

      // Executar a ação correspondente
      let result = null
      switch (functionName) {
        case 'create_task':
          result = actions.addTask({
            title: functionArgs.title,
            dueLabel: formatDueLabel(functionArgs.dueDate, functionArgs.dueTime),
            priority: functionArgs.priority || 'Normal',
            context: functionArgs.context || 'Inbox',
            stage: 'Capturar',
            status: 'Flow',
            timeline: 'today',
            energy: 'Estratégico',
            horizon: "Focus 45'",
            xp: 10,
            tags: ['flow'],
          })
          executedActions.push({ type: 'task', data: result })
          break

        case 'create_finance':
          result = actions.addFinance({
            type: functionArgs.type,
            value: functionArgs.value,
            category: functionArgs.category,
            date: functionArgs.date || new Date().toLocaleDateString('pt-BR'),
            description: functionArgs.description || '',
          })
          executedActions.push({ type: 'finance', data: result })
          break

        case 'complete_habit':
          // Buscar hábito pelo nome (simplificado)
          result = { habitName: functionArgs.habitName }
          executedActions.push({ type: 'habit', data: result, action: 'complete' })
          break

        case 'create_habit':
          result = actions.addHabit({
            title: functionArgs.title,
            frequency: functionArgs.frequency || 'diário',
            category: functionArgs.category || 'Geral',
          })
          executedActions.push({ type: 'habit', data: result })
          break
      }
    }

    // Retornar resposta da IA + ações executadas
    return {
      text: message.content || 'Ações executadas com sucesso.',
      actions: executedActions,
    }
  } catch (error) {
    console.error('Erro ao processar comando:', error)
    return {
      text: `Erro ao processar comando: ${error.message}`,
      actions: [],
    }
  }
}

/**
 * Formata data e hora para o padrão do app
 */
function formatDueLabel(dateStr, timeStr) {
  if (!dateStr) return 'Sem prazo'

  const date = new Date(dateStr)
  const weekday = date.toLocaleDateString('pt-BR', { weekday: 'long' })
  const time = timeStr || '09:00'

  return `${weekday.charAt(0).toUpperCase() + weekday.slice(1)} · ${time}`
}

/**
 * MOCK: Simula processamento de comando sem API key
 * Use esta função para testar sem gastar créditos da API
 */
export async function processCommandMock(userMessage) {
  // Simula delay de rede
  await new Promise((resolve) => setTimeout(resolve, 1500))

  const lower = userMessage.toLowerCase()

  const actions = []

  // Detecta criação de tarefa
  if (lower.includes('tarefa') || lower.includes('task')) {
    const titleMatch = userMessage.match(/['""](.+?)['""]|tarefa\s+(.+?)(?:\s+para|\s+em|$)/i)
    const title = titleMatch ? titleMatch[1] || titleMatch[2] : 'Nova tarefa'

    actions.push({
      type: 'task',
      data: {
        id: `task-${Date.now()}`,
        title: title.trim(),
        dueLabel: 'Hoje · 14:00',
        priority: 'Normal',
        context: 'Inbox',
        stage: 'Capturar',
        status: 'Flow',
        timeline: 'today',
      },
    })
  }

  // Detecta transação financeira
  if (lower.includes('receita') || lower.includes('despesa') || lower.includes('r$')) {
    const valueMatch = userMessage.match(/r?\$?\s*(\d+[.,]?\d*)/i)
    const value = valueMatch ? parseFloat(valueMatch[1].replace(',', '.')) : 0

    const type = lower.includes('despesa') ? 'despesa' : 'receita'

    actions.push({
      type: 'finance',
      data: {
        id: `finance-${Date.now()}`,
        type,
        value,
        category: type === 'receita' ? 'Freelancer' : 'Diversos',
        date: new Date().toLocaleDateString('pt-BR'),
      },
    })
  }

  // Detecta hábito
  if (lower.includes('hábito') || lower.includes('treino') || lower.includes('leitura')) {
    const habitMatch = userMessage.match(/hábito\s+['""]?(.+?)['""]?(?:\s|$)/i) || 
                       userMessage.match(/(treino|leitura|meditação|exercício)/i)
    
    const habitName = habitMatch ? habitMatch[1] : 'Novo hábito'

    actions.push({
      type: 'habit',
      data: {
        id: `habit-${Date.now()}`,
        title: habitName.trim(),
        statusLabel: 'Concluído ✅',
        streak: 1,
      },
      action: 'complete',
    })
  }

  return {
    text: `Interpretei ${actions.length} ${actions.length === 1 ? 'ação' : 'ações'} a partir do seu comando. Revise os cartões antes de confirmar.`,
    actions,
  }
}
