// Ferramentas do Jarvis: definições (JSON Schema, formato Anthropic — o
// adaptador OpenAI traduz) + executor que opera sobre o estado/ações do
// AppContext. Tudo roda no cliente; nenhum dado sai do app além do que o
// modelo precisa ver para responder.
import { localDateKey, getDayStats, computeStreaks, formatMinutes } from '../utils/habitStats.js'
import { accountBalance, cardInvoiceTotal, currentInvoiceMonth, invoiceDueDate } from '../utils/financeMetrics'
import { focusLogService } from './focusLogService.js'

const norm = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
const money = (n) => Number(Number(n || 0).toFixed(2))
const dateOf = (value) => String(value || '').slice(0, 10)

export const JARVIS_TOOLS = [
  {
    name: 'get_day_summary',
    description:
      'Resumo completo de um dia: tarefas (pendentes, atrasadas, concluídas), eventos, hábitos (feitos/agendados) e minutos de foco (trabalho/estudo). Use para "resuma meu dia", "como está meu dia" etc.',
    input_schema: {
      type: 'object',
      properties: {
        date: { type: 'string', description: 'Data YYYY-MM-DD. Omita para hoje.' },
      },
    },
  },
  {
    name: 'list_tasks',
    description: 'Lista tarefas do usuário com um filtro. Retorna título, vencimento, prioridade e projeto.',
    input_schema: {
      type: 'object',
      properties: {
        filter: {
          type: 'string',
          enum: ['today', 'overdue', 'week', 'pending', 'completed'],
          description: 'today=vencem hoje, overdue=atrasadas, week=próximos 7 dias, pending=todas pendentes, completed=concluídas recentes',
        },
      },
      required: ['filter'],
    },
  },
  {
    name: 'create_task',
    description: 'Cria uma nova tarefa. Confirme com o usuário antes se o pedido for ambíguo.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Título da tarefa' },
        dueDate: { type: 'string', description: 'Data de vencimento YYYY-MM-DD (opcional)' },
        dueTime: { type: 'string', description: 'Horário HH:MM (opcional)' },
        priority: { type: 'string', enum: ['low', 'medium', 'high'], description: 'Prioridade (padrão medium)' },
      },
      required: ['title'],
    },
  },
  {
    name: 'complete_task',
    description: 'Marca uma tarefa pendente como concluída, localizada pelo título (busca aproximada).',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Título (ou parte) da tarefa a concluir' },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_finance_summary',
    description:
      'Resumo financeiro de um mês: receitas, despesas, saldo, gastos por categoria, limites de gasto (com alertas), saldos das contas, faturas dos cartões e próximos vencimentos. Use para qualquer pergunta sobre dinheiro/finanças.',
    input_schema: {
      type: 'object',
      properties: {
        month: { type: 'string', description: 'Mês YYYY-MM. Omita para o mês atual.' },
      },
    },
  },
  {
    name: 'create_transaction',
    description: 'Registra uma transação financeira (receita ou despesa). Confirme valor e categoria com o usuário antes se houver dúvida.',
    input_schema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['RECEITA', 'DESPESA'], description: 'Tipo da transação' },
        amount: { type: 'number', description: 'Valor em reais (ex: 150.50)' },
        description: { type: 'string', description: 'Descrição do lançamento' },
        category: { type: 'string', description: 'Slug da categoria (a lista de slugs válidos está no contexto do sistema)' },
        date: { type: 'string', description: 'Data YYYY-MM-DD (padrão hoje)' },
        paid: { type: 'boolean', description: 'Já foi pago/recebido? Padrão true.' },
      },
      required: ['type', 'amount', 'description', 'category'],
    },
  },
  {
    name: 'get_habits',
    description: 'Situação dos hábitos de hoje: agendados, concluídos, pendentes, sequências (streaks) e progresso das metas de foco.',
    input_schema: { type: 'object', properties: {} },
  },
  {
    name: 'complete_habit',
    description: 'Marca um hábito de hoje como concluído, localizado pelo nome (busca aproximada).',
    input_schema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Nome (ou parte) do hábito' },
      },
      required: ['name'],
    },
  },
  {
    name: 'get_goals_and_projects',
    description: 'Lista metas (com progresso) e projetos (com status) do usuário.',
    input_schema: { type: 'object', properties: {} },
  },
]

// ---------- Executor ----------

const isCompleted = (task) => task.completed === true || task.status === 'done'

function taskRow(task) {
  return {
    titulo: task.title,
    vence: task.dueDate ? String(task.dueDate).slice(0, 16).replace('T', ' ') : null,
    prioridade: task.priority || 'medium',
    concluida: isCompleted(task),
  }
}

function findByName(list, query, getLabel) {
  const q = norm(query)
  return (
    list.find((item) => norm(getLabel(item)) === q) ||
    list.find((item) => norm(getLabel(item)).includes(q)) ||
    list.find((item) => q.includes(norm(getLabel(item))))
  )
}

export async function executeJarvisTool(name, input, ctx) {
  const today = localDateKey()

  switch (name) {
    case 'get_day_summary': {
      const dateKey = input.date || today
      const [y, m, d] = dateKey.split('-').map(Number)
      const dateObj = new Date(y, m - 1, d)
      const pending = ctx.tasks.filter((t) => !isCompleted(t))
      const dueToday = pending.filter((t) => dateOf(t.dueDate) === dateKey)
      const overdue = pending.filter((t) => t.dueDate && dateOf(t.dueDate) < today)
      const doneToday = ctx.tasks.filter(
        (t) => isCompleted(t) && (dateOf(t.completed_at) === dateKey || dateOf(t.dueDate) === dateKey),
      )
      const events = ctx.events.filter((e) => dateOf(e.date) === dateKey).map((e) => e.title)
      const habitStats = getDayStats(ctx.habits, dateObj)
      const habitsPending = ctx.habits
        .filter((h) => !(h.completions || []).includes(dateKey))
        .map((h) => h.label || h.name)
      const focus = dateKey === today ? focusLogService.getCategoryTotals(1) : null
      return {
        data: dateKey,
        tarefas: {
          vencem_no_dia: dueToday.map(taskRow),
          atrasadas: overdue.slice(0, 10).map(taskRow),
          concluidas_no_dia: doneToday.length,
        },
        eventos: events,
        habitos: {
          agendados: habitStats.scheduled,
          concluidos: habitStats.completed,
          pendentes: habitsPending.slice(0, 10),
        },
        foco: focus
          ? { trabalho: formatMinutes(focus.work), estudo: formatMinutes(focus.study) }
          : 'sem dados para dias passados',
      }
    }

    case 'list_tasks': {
      const pending = ctx.tasks.filter((t) => !isCompleted(t))
      let list
      switch (input.filter) {
        case 'today':
          list = pending.filter((t) => dateOf(t.dueDate) === today)
          break
        case 'overdue':
          list = pending.filter((t) => t.dueDate && dateOf(t.dueDate) < today)
          break
        case 'week': {
          const end = new Date()
          end.setDate(end.getDate() + 7)
          const endKey = localDateKey(end)
          list = pending.filter((t) => t.dueDate && dateOf(t.dueDate) >= today && dateOf(t.dueDate) <= endKey)
          break
        }
        case 'completed':
          list = ctx.tasks.filter(isCompleted).slice(0, 15)
          break
        default:
          list = pending
      }
      return { total: list.length, tarefas: list.slice(0, 25).map(taskRow) }
    }

    case 'create_task': {
      const due = input.dueDate
        ? input.dueTime ? `${input.dueDate}T${input.dueTime}:00` : input.dueDate
        : null
      const created = await ctx.actions.addTask({
        title: input.title,
        dueDate: due,
        priority: input.priority || 'medium',
      })
      return { ok: true, tarefa_criada: { titulo: created?.title || input.title, vence: due } }
    }

    case 'complete_task': {
      const pending = ctx.tasks.filter((t) => !isCompleted(t))
      const task = findByName(pending, input.query, (t) => t.title)
      if (!task) {
        return { ok: false, erro: 'Nenhuma tarefa pendente encontrada com esse título.', pendentes: pending.slice(0, 10).map((t) => t.title) }
      }
      await ctx.actions.updateTask(task.id, { completed: true })
      return { ok: true, tarefa_concluida: task.title }
    }

    case 'get_finance_summary': {
      const monthKey = input.month || today.slice(0, 7)
      const txs = ctx.finances
        .map((t) => ({ ...t, amount: Number(t.amount) || 0, dateKey: dateOf(t.date) }))
        .filter((t) => t.dateKey.startsWith(monthKey))
      const receitas = txs.filter((t) => (t.type || '').toUpperCase() === 'RECEITA').reduce((s, t) => s + t.amount, 0)
      const despesas = txs.filter((t) => (t.type || '').toUpperCase() === 'DESPESA').reduce((s, t) => s + t.amount, 0)

      const porCategoria = {}
      for (const t of txs) {
        if ((t.type || '').toUpperCase() !== 'DESPESA') continue
        porCategoria[t.category] = (porCategoria[t.category] || 0) + t.amount
      }
      const topCategorias = Object.entries(porCategoria)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 6)
        .map(([slug, total]) => ({ categoria: ctx.catName(slug), total: money(total) }))

      const limites = ctx.financeLimits.map((l) => {
        const gasto = l.scope === 'card'
          ? txs.filter((t) => (t.cardId || t.card_id) === l.ref && (t.type || '').toUpperCase() === 'DESPESA').reduce((s, t) => s + t.amount, 0)
          : porCategoria[l.ref] || 0
        const nome = l.scope === 'card'
          ? ctx.financeCards.find((c) => c.id === l.ref)?.name || 'Cartão'
          : ctx.catName(l.ref)
        return { nome, limite: money(l.amount), gasto: money(gasto), estourado: gasto > Number(l.amount) }
      })

      const contas = ctx.financeAccounts.map((a) => ({ conta: a.name, saldo: money(accountBalance(a, ctx.finances)) }))
      const faturas = ctx.financeCards.map((card) => {
        const invMonth = currentInvoiceMonth(card)
        const total = cardInvoiceTotal(card, ctx.finances, invMonth)
        const due = invoiceDueDate(card, invMonth)
        return { cartao: card.name, fatura_atual: money(total), vence: due ? localDateKey(due) : null }
      })

      const aPagar = ctx.finances
        .filter((t) => (t.type || '').toUpperCase() === 'DESPESA' && !t.paid && !(t.cardId || t.card_id))
        .map((t) => ({ descricao: t.description, valor: money(t.amount), vence: dateOf(t.date) }))
        .filter((t) => t.vence >= today)
        .sort((a, b) => a.vence.localeCompare(b.vence))
        .slice(0, 8)

      return {
        mes: monthKey,
        receitas: money(receitas),
        despesas: money(despesas),
        saldo_do_mes: money(receitas - despesas),
        gastos_por_categoria: topCategorias,
        limites,
        contas,
        faturas_cartoes: faturas,
        proximos_vencimentos: aPagar,
      }
    }

    case 'create_transaction': {
      const validSlugs = ctx.financeCategories.map((c) => c.slug)
      const category = validSlugs.includes(input.category) ? input.category : 'outros'
      const dateKey = input.date || today
      await ctx.actions.addFinance({
        description: input.description,
        amount: Number(input.amount).toFixed(2),
        type: input.type,
        category,
        date: `${dateKey}T12:00:00.000Z`,
        paid: input.paid !== false,
        tags: [],
      })
      return {
        ok: true,
        lancamento: { tipo: input.type, valor: money(input.amount), descricao: input.description, categoria: ctx.catName(category), data: dateKey },
      }
    }

    case 'get_habits': {
      const focus = focusLogService.getCategoryTotals(1)
      const habitos = ctx.habits.map((h) => {
        const done = (h.completions || []).includes(today)
        const { current } = computeStreaks(h)
        const row = { nome: h.label || h.name, concluido_hoje: done, sequencia_dias: current }
        if (h.timerCategory && h.timerGoalMinutes) {
          const got = h.timerCategory === 'study' ? focus.study : focus.work
          row.automatico_por_foco = `${formatMinutes(got)} de ${formatMinutes(h.timerGoalMinutes)} (${h.timerCategory === 'study' ? 'estudo' : 'trabalho'})`
        }
        return row
      })
      return { data: today, habitos }
    }

    case 'complete_habit': {
      const pending = ctx.habits.filter((h) => !(h.completions || []).includes(today))
      const habit = findByName(pending, input.name, (h) => h.label || h.name)
      if (!habit) {
        return { ok: false, erro: 'Hábito não encontrado ou já concluído hoje.', pendentes: pending.map((h) => h.label || h.name) }
      }
      await ctx.actions.completeHabit(habit.id)
      return { ok: true, habito_concluido: habit.label || habit.name }
    }

    case 'get_goals_and_projects': {
      return {
        metas: ctx.goals.map((g) => ({ titulo: g.title, area: g.area, progresso: `${g.progress || 0}%` })),
        projetos: ctx.projects.map((p) => ({ titulo: p.title, status: p.status })),
      }
    }

    default:
      return { erro: `Ferramenta desconhecida: ${name}` }
  }
}
