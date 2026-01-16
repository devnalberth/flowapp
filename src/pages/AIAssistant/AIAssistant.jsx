import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import TopNav from '../../components/TopNav/TopNav.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { processCommandMock } from '../../services/aiService.js'

import './AIAssistant.css'

const suggestionPrompts = [
  {
    id: 'prompt-expense',
    title: 'Adicionar despesa rápida',
    detail: 'Ex: Comprar equipamento em 3x hoje',
  },
  {
    id: 'prompt-summary',
    title: 'Resumo do dia',
    detail: 'Quais tarefas concluídas + saldo diário',
  },
  {
    id: 'prompt-habit',
    title: 'Registrar hábito',
    detail: 'Marcar Treino + Ritual de leitura',
  },
]

const widgetResponse = {
  id: 'assistant-action-demo',
  role: 'assistant',
  text: 'Interpretei três ações a partir do seu comando. Revise os cartões antes de confirmar.',
  blocks: [
    {
      type: 'task',
      title: 'Entregar site do Dr Guilherme',
      schedule: 'Quinta-feira · 14:00',
      cta: 'Editar',
      status: 'Agendado',
    },
    {
      type: 'finance',
      value: 'R$ 1.500,00',
      category: 'Receita · Freelancer',
      date: '10/01',
      status: 'Confirmado',
    },
    {
      type: 'habit',
      title: 'Treino Muay Thai',
      statusLabel: 'Concluído ✅',
      streak: 'Série: 12 dias',
    },
  ],
  meta: {
    status: 'success',
    label: 'Ações sincronizadas com o workspace',
  },
}

const initialMessages = [
  {
    id: 'assistant-welcome',
    role: 'assistant',
    text: 'Oi, eu sou o FlowChat. Posso criar tarefas, finanças e hábitos a partir de linguagem natural.',
  },
  {
    id: 'user-command-demo',
    role: 'user',
    text: "Flow, crie a tarefa 'Entregar site do Dr Guilherme' para quinta 14h, adicione uma receita de R$1.500 (freela) para dia 10/01 e marque o hábito 'Treino Muay Thai' como concluído.",
  },
  widgetResponse,
]

const mockThinkingDelay = 1400

const uuid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()))

function TaskCard({ title, schedule, cta }) {
  return (
    <div className="flowCard flowCard--task">
      <div className="flowCard__text">
        <span className="flowCard__label">Tarefa criada</span>
        <strong className="flowCard__title">{title}</strong>
        <span className="flowCard__meta">{schedule}</span>
      </div>
      <button type="button" className="flowCard__ghost">
        {cta}
      </button>
    </div>
  )
}

function FinanceCard({ value, category, date, status }) {
  return (
    <div className="flowCard flowCard--finance">
      <div className="flowCard__text">
        <span className="flowCard__label">{status}</span>
        <strong className="flowCard__title">{value}</strong>
        <span className="flowCard__meta">{category}</span>
      </div>
      <span className="flowCard__pill">{date}</span>
    </div>
  )
}

function HabitCard({ title, statusLabel, streak }) {
  return (
    <div className="flowCard flowCard--habit">
      <div className="flowCard__text">
        <span className="flowCard__label">Hábito atualizado</span>
        <strong className="flowCard__title">{title}</strong>
        <span className="flowCard__meta">{statusLabel}</span>
      </div>
      <span className="flowCard__pill">{streak}</span>
    </div>
  )
}

function MessageWidgets({ blocks }) {
  return (
    <div className="flowChatWidgets">
      {blocks.map((block) => {
        if (block.type === 'task') {
          return <TaskCard key={block.title} {...block} />
        }
        if (block.type === 'finance') {
          return <FinanceCard key={block.title ?? block.value} {...block} />
        }
        if (block.type === 'habit') {
          return <HabitCard key={block.title} {...block} />
        }
        return null
      })}
    </div>
  )
}

function ThinkingBubble() {
  return (
    <motion.div
      className="flowChatThinking"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
    >
      <span />
      <span />
      <span />
      <p>Pensando nas ações...</p>
    </motion.div>
  )
}

export default function AIAssistant({ user, onNavigate, onLogout }) {
  const { addTask, addFinance, addHabit, completeHabit } = useApp()
  
  const [messages, setMessages] = useState(initialMessages)
  const [draft, setDraft] = useState('')
  const [isThinking, setThinking] = useState(false)
  const historyRef = useRef(null)
  const textareaRef = useRef(null)

  const showEmptyState = useMemo(() => messages.length === 0, [messages.length])

  useEffect(() => {
    if (!textareaRef.current) return
    const el = textareaRef.current
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [draft])

  useEffect(() => {
    if (!historyRef.current) return
    historyRef.current.scrollTo({ top: historyRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isThinking])

  const handleSend = async (event) => {
    event.preventDefault()
    const value = draft.trim()
    if (!value) return

    const userMessage = { id: uuid(), role: 'user', text: value }
    setMessages((prev) => [...prev, userMessage])
    setDraft('')
    setThinking(true)

    try {
      // Processar comando com IA (usando mock por enquanto)
      const result = await processCommandMock(value)

      // Executar ações retornadas pela IA
      const executedBlocks = []
      
      for (const action of result.actions) {
        if (action.type === 'task') {
          const createdTask = addTask(action.data)
          executedBlocks.push({
            type: 'task',
            title: createdTask.title,
            schedule: createdTask.dueLabel,
            cta: 'Editar',
            status: 'Agendado',
          })
        } else if (action.type === 'finance') {
          const createdFinance = addFinance(action.data)
          executedBlocks.push({
            type: 'finance',
            value: `R$ ${createdFinance.value.toFixed(2).replace('.', ',')}`,
            category: `${createdFinance.type === 'receita' ? 'Receita' : 'Despesa'} · ${createdFinance.category}`,
            date: createdFinance.date,
            status: 'Confirmado',
          })
        } else if (action.type === 'habit') {
          if (action.action === 'complete') {
            // Mock: assume que o hábito existe
            executedBlocks.push({
              type: 'habit',
              title: action.data.habitName || action.data.title,
              statusLabel: 'Concluído ✅',
              streak: 'Série: 1 dia',
            })
          } else {
            const createdHabit = addHabit(action.data)
            executedBlocks.push({
              type: 'habit',
              title: createdHabit.title,
              statusLabel: 'Criado',
              streak: 'Série: 0 dias',
            })
          }
        }
      }

      // Criar mensagem de resposta do assistente
      const assistantMessage = {
        id: uuid(),
        role: 'assistant',
        text: result.text,
        blocks: executedBlocks,
        meta: {
          status: 'success',
          label: executedBlocks.length > 0 ? 'Ações sincronizadas com o workspace' : 'Nenhuma ação identificada',
        },
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error('Erro ao processar comando:', error)
      setMessages((prev) => [
        ...prev,
        {
          id: uuid(),
          role: 'assistant',
          text: 'Desculpe, ocorreu um erro ao processar seu comando. Tente novamente.',
        },
      ])
    } finally {
      setThinking(false)
    }
  }

  const handlePromptClick = (prompt) => {
    setDraft((prev) => (prev ? `${prev} ${prompt}` : prompt))
  }

  return (
    <div className="flowChatPage">
      <TopNav user={user} active="FlowChat" onNavigate={onNavigate} onLogout={onLogout} />

      <div className="flowChatWrapper">
        <section className="flowChatShell">
        <section className="flowChatConversation ui-card">
          <div className="flowChatHistory" ref={historyRef} role="log" aria-live="polite">
            <AnimatePresence initial={false}>
              {showEmptyState && !isThinking ? (
                <motion.div
                  key="empty-state"
                  className="flowChatEmpty ui-card"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                >
                  <p className="txt-pill">FlowChat conectado</p>
                  <h2>Comece uma conversa</h2>
                  <p>Envie um comando ou escolha um dos prompts para gerar tarefas, finanças e hábitos automaticamente.</p>
                  <div className="flowChatEmpty__prompts">
                    {suggestionPrompts.map((prompt) => (
                      <button key={prompt.id} type="button" onClick={() => handlePromptClick(prompt.title)}>
                        <strong>{prompt.title}</strong>
                        <span>{prompt.detail}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                messages.map((message) => (
                  <motion.article
                    key={message.id}
                    className={`flowChatMessage flowChatMessage--${message.role}`}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -16 }}
                  >
                    {message.role === 'assistant' ? (
                      <div className="flowChatMessage__avatar" aria-hidden="true">
                        <span>FC</span>
                      </div>
                    ) : null}
                    <div className="flowChatMessage__bubble">
                      <p>{message.text}</p>
                      {message.blocks ? <MessageWidgets blocks={message.blocks} /> : null}
                      {message.meta?.status ? (
                        <div className="flowChatMessage__meta">
                          <span>{message.meta.label}</span>
                        </div>
                      ) : null}
                    </div>
                  </motion.article>
                ))
              )}
              {isThinking ? <ThinkingBubble key="thinking" /> : null}
            </AnimatePresence>
          </div>
        </section>
        <form className="flowChatComposer ui-card" onSubmit={handleSend}>
          <div className="flowChatComposer__field">
            <textarea
              ref={textareaRef}
              placeholder="Ex: Flow, gere um resumo financeiro da semana e crie uma tarefa com os próximos passos"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={1}
            />
            <div className="flowChatComposer__tools">
              <button type="button" className="flowChatComposer__icon" aria-label="Gravar comando de voz">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path
                    d="M12 3a3 3 0 0 0-3 3v6a3 3 0 1 0 6 0V6a3 3 0 0 0-3-3zm-5 6v2a5 5 0 0 0 10 0V9m-5 8v3m-4 0h8"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <button type="submit" className="flowChatComposer__send" aria-label="Enviar mensagem">
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M5 12L4 4l16 8-16 8 1-8z" fill="currentColor" />
                </svg>
              </button>
            </div>
          </div>
          <div className="flowChatComposer__tips">
            <span>FlowChat valida com dados reais antes de executar.</span>
            <button type="button" onClick={() => handlePromptClick('Adicionar despesa rápida')}>
              Adicionar despesa rápida
            </button>
            <button type="button" onClick={() => handlePromptClick('Resumo do dia')}>
              Resumo do dia
            </button>
          </div>
        </form>

      </section>
      </div>
    </div>
  )
}
