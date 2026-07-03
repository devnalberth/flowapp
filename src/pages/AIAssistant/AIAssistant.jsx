import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Settings, Trash2, Send, Sparkles, Wrench } from 'lucide-react'
import TopNav from '../../components/TopNav/TopNav.jsx'
import JarvisSettingsModal from '../../components/JarvisSettingsModal/JarvisSettingsModal.jsx'
import { useApp } from '../../context/AppContext.jsx'
import { getJarvisConfig, isJarvisConfigured, providerMeta, effectiveModel } from '../../services/jarvisConfig.js'
import { runJarvisTurn, loadJarvisChat, saveJarvisChat, clearJarvisChat } from '../../services/jarvisService.js'

import './AIAssistant.css'

const SUGGESTIONS = [
  { id: 's-day', title: 'Resuma meu dia', detail: 'Tarefas, hábitos, eventos e foco de hoje' },
  { id: 's-finance', title: 'Como estão minhas finanças este mês?', detail: 'Saldo, gastos por categoria e limites' },
  { id: 's-bills', title: 'O que vence em breve?', detail: 'Contas a pagar e faturas dos cartões' },
  { id: 's-tasks', title: 'Quais tarefas estão atrasadas?', detail: 'Pendências que passaram do prazo' },
]

const uuid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()))

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
      <p>Jarvis está trabalhando...</p>
    </motion.div>
  )
}

export default function AIAssistant({ user, onNavigate, onLogout }) {
  const app = useApp()

  const [config, setConfig] = useState(() => getJarvisConfig())
  const configured = isJarvisConfigured(config)

  const [{ display: initialDisplay, history: initialHistory }] = useState(() => loadJarvisChat())
  const [messages, setMessages] = useState(initialDisplay)
  const historyRef = useRef(initialHistory)

  const [draft, setDraft] = useState('')
  const [isThinking, setThinking] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const historyElRef = useRef(null)
  const textareaRef = useRef(null)

  // Contexto entregue às ferramentas — sempre com o estado mais recente
  const toolCtx = useMemo(() => {
    const catName = (slug) => app.financeCategories?.find((c) => c.slug === slug)?.name || slug || 'Outros'
    return {
      userName: user?.name || user?.email?.split('@')[0] || null,
      tasks: app.tasks || [],
      projects: app.projects || [],
      goals: app.goals || [],
      habits: app.habits || [],
      events: app.events || [],
      finances: app.finances || [],
      financeAccounts: app.financeAccounts || [],
      financeCards: app.financeCards || [],
      financeLimits: app.financeLimits || [],
      financeCategories: app.financeCategories || [],
      catName,
      actions: {
        addTask: app.addTask,
        updateTask: app.updateTask,
        addFinance: app.addFinance,
        completeHabit: app.completeHabit,
      },
    }
  }, [app, user])

  useEffect(() => {
    if (!textareaRef.current) return
    const el = textareaRef.current
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [draft])

  useEffect(() => {
    if (!historyElRef.current) return
    historyElRef.current.scrollTo({ top: historyElRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isThinking])

  const sendMessage = async (text) => {
    const value = text.trim()
    if (!value || isThinking) return

    if (!configured) {
      setShowSettings(true)
      return
    }

    const userMessage = { id: uuid(), role: 'user', text: value }
    setMessages((prev) => [...prev, userMessage])
    setDraft('')
    setThinking(true)

    try {
      const result = await runJarvisTurn({ history: historyRef.current, userText: value, ctx: toolCtx })
      const assistantMessage = {
        id: uuid(),
        role: 'assistant',
        text: result.text,
        tools: result.toolLabels,
      }
      setMessages((prev) => {
        const next = [...prev, assistantMessage]
        saveJarvisChat(next, historyRef.current)
        return next
      })
    } catch (error) {
      console.error('Jarvis:', error)
      setMessages((prev) => [
        ...prev,
        { id: uuid(), role: 'assistant', text: error?.message || 'Algo deu errado. Tente novamente.', error: true },
      ])
    } finally {
      setThinking(false)
    }
  }

  const handleSend = (event) => {
    event.preventDefault()
    sendMessage(draft)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage(draft)
    }
  }

  const handleClear = () => {
    if (!confirm('Limpar toda a conversa com o Jarvis?')) return
    clearJarvisChat()
    historyRef.current = []
    setMessages([])
  }

  const showEmptyState = messages.length === 0

  return (
    <div className="flowChatPage">
      <TopNav user={user} active="FlowChat" onNavigate={onNavigate} onLogout={onLogout} />

      {showSettings && (
        <JarvisSettingsModal
          config={config}
          onSaved={(saved) => setConfig(saved)}
          onClose={() => setShowSettings(false)}
        />
      )}

      <div className="flowChatWrapper">
        <section className="flowChatShell">
          <header className="jarvisBar">
            <div className="jarvisBar__id">
              <span className="jarvisBar__avatar"><Sparkles size={18} /></span>
              <div>
                <h1>Jarvis</h1>
                <p className="jarvisBar__status">
                  <span className={`jarvisBar__dot ${configured ? 'is-on' : ''}`} />
                  {configured
                    ? `${providerMeta(config.provider).label} · ${effectiveModel(config)}`
                    : 'Não configurado — clique na engrenagem'}
                </p>
              </div>
            </div>
            <div className="jarvisBar__actions">
              {messages.length > 0 && (
                <button type="button" onClick={handleClear} title="Limpar conversa" aria-label="Limpar conversa">
                  <Trash2 size={16} />
                </button>
              )}
              <button type="button" onClick={() => setShowSettings(true)} title="Configurações do Jarvis" aria-label="Configurações do Jarvis">
                <Settings size={16} />
              </button>
            </div>
          </header>

          <section className="flowChatConversation ui-card">
            <div className="flowChatHistory" ref={historyElRef} role="log" aria-live="polite">
              <AnimatePresence initial={false}>
                {showEmptyState && !isThinking ? (
                  <motion.div
                    key="empty-state"
                    className="flowChatEmpty ui-card"
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -30 }}
                  >
                    <p className="txt-pill">{configured ? 'Jarvis online' : 'Jarvis aguardando configuração'}</p>
                    <h2>Às ordens{toolCtx.userName ? `, ${toolCtx.userName}` : ''}.</h2>
                    <p>
                      Posso consultar e criar tarefas, registrar lançamentos, resumir seu dia e analisar
                      suas finanças — tudo dentro do FlowApp.
                    </p>
                    {!configured && (
                      <button type="button" className="jarvisSetupBtn" onClick={() => setShowSettings(true)}>
                        <Settings size={15} /> Configurar provedor de IA
                      </button>
                    )}
                    <div className="flowChatEmpty__prompts">
                      {SUGGESTIONS.map((prompt) => (
                        <button key={prompt.id} type="button" onClick={() => sendMessage(prompt.title)}>
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
                          <Sparkles size={16} />
                        </div>
                      ) : null}
                      <div className={`flowChatMessage__bubble ${message.error ? 'flowChatMessage__bubble--error' : ''}`}>
                        <p className="jarvisText">{message.text}</p>
                        {message.tools?.length ? (
                          <div className="jarvisTools">
                            {[...new Set(message.tools)].map((label) => (
                              <span key={label} className="jarvisTools__chip">
                                <Wrench size={11} /> {label}
                              </span>
                            ))}
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
                placeholder={configured
                  ? 'Ex: registre R$ 45 de almoço em alimentação e me diga quanto já gastei no mês'
                  : 'Configure o provedor de IA na engrenagem acima para começar'}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                aria-label="Mensagem para o Jarvis"
              />
              <div className="flowChatComposer__tools">
                <button type="submit" className="flowChatComposer__send" aria-label="Enviar mensagem" disabled={isThinking || !draft.trim()}>
                  <Send size={16} />
                </button>
              </div>
            </div>
            <div className="flowChatComposer__tips">
              <span>O Jarvis consulta seus dados reais antes de responder e pede confirmação antes de ações ambíguas.</span>
            </div>
          </form>
        </section>
      </div>
    </div>
  )
}
