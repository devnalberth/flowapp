import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Settings,
  Trash2,
  ArrowUp,
  Sparkles,
  Wrench,
  CalendarCheck,
  Wallet,
  CalendarClock,
  ListTodo,
} from 'lucide-react'
import TopNav from '../../components/TopNav/TopNav.jsx'
import JarvisSettingsModal from '../../components/JarvisSettingsModal/JarvisSettingsModal.jsx'
import { useJarvisToolCtx } from '../../hooks/useJarvisToolCtx.js'
import { getJarvisConfig, isJarvisConfigured, providerMeta, effectiveModel } from '../../services/jarvisConfig.js'
import { runJarvisTurn, loadJarvisChat, saveJarvisChat, clearJarvisChat } from '../../services/jarvisService.js'

import './AIAssistant.css'

const SUGGESTIONS = [
  { id: 's-day', icon: CalendarCheck, title: 'Resuma meu dia', detail: 'Tarefas, hábitos, eventos e foco de hoje' },
  { id: 's-finance', icon: Wallet, title: 'Como estão minhas finanças este mês?', detail: 'Saldo, gastos por categoria e limites' },
  { id: 's-bills', icon: CalendarClock, title: 'O que vence em breve?', detail: 'Contas a pagar e faturas dos cartões' },
  { id: 's-tasks', icon: ListTodo, title: 'Quais tarefas estão atrasadas?', detail: 'Pendências que passaram do prazo' },
]

const uuid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()))

const greeting = () => {
  const hour = new Date().getHours()
  if (hour < 6) return 'Boa madrugada'
  if (hour < 12) return 'Bom dia'
  if (hour < 18) return 'Boa tarde'
  return 'Boa noite'
}

const capitalize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s)

export default function AIAssistant({ user, onNavigate, onLogout }) {
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

  // Mesmo nome exibido no Dashboard (perfil real) — nunca o prefixo do e-mail
  const userName = useMemo(
    () => capitalize(user?.name?.trim()?.split(' ')[0] || ''),
    [user],
  )

  // Contexto entregue às ferramentas — compartilhado com o card do Dashboard
  const toolCtx = useJarvisToolCtx(userName)

  useEffect(() => {
    if (!textareaRef.current) return
    const el = textareaRef.current
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`
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
      const assistantMessage = { id: uuid(), role: 'assistant', text: result.text, tools: result.toolLabels }
      setMessages((prev) => {
        const next = [...prev, assistantMessage]
        saveJarvisChat(next, historyRef.current)
        return next
      })
    } catch (error) {
      console.error('FlowChat:', error)
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
    if (!confirm('Limpar toda a conversa?')) return
    clearJarvisChat()
    historyRef.current = []
    setMessages([])
  }

  const showEmptyState = messages.length === 0 && !isThinking

  return (
    <div className="fcPage">
      <TopNav user={user} active="FlowChat" onNavigate={onNavigate} onLogout={onLogout} />

      {showSettings && (
        <JarvisSettingsModal
          config={config}
          onSaved={(saved) => setConfig(saved)}
          onClose={() => setShowSettings(false)}
        />
      )}

      <div className="fcShell">
        <header className="fcHeader">
          <div className="fcHeader__brand">
            <span className="fcOrb fcOrb--sm" aria-hidden="true"><Sparkles size={17} /></span>
            <div>
              <h1>FlowChat</h1>
              <p className="fcHeader__status">
                <span className={`fcHeader__dot ${configured ? 'is-on' : ''}`} />
                {configured
                  ? `${providerMeta(config.provider).label} · ${effectiveModel(config)}`
                  : 'Aguardando configuração'}
              </p>
            </div>
          </div>
          <div className="fcHeader__actions">
            {messages.length > 0 && (
              <button type="button" onClick={handleClear} title="Limpar conversa" aria-label="Limpar conversa">
                <Trash2 size={16} />
              </button>
            )}
            <button type="button" onClick={() => setShowSettings(true)} title="Configurações" aria-label="Configurações do FlowChat">
              <Settings size={16} />
            </button>
          </div>
        </header>

        <div className="fcBody">
          <div className="fcHistory" ref={historyElRef} role="log" aria-live="polite">
            {showEmptyState ? (
              <div className="fcHero">
                <span className="fcOrb fcOrb--lg" aria-hidden="true"><Sparkles size={26} /></span>
                <h2>
                  {greeting()}{userName ? `, ${userName}` : ''}.
                </h2>
                <p className="fcHero__sub">
                  Sou o assistente do seu FlowApp. Pergunte sobre tarefas, finanças e hábitos —
                  ou peça para eu criar algo por você.
                </p>
                {!configured && (
                  <button type="button" className="fcSetupBtn" onClick={() => setShowSettings(true)}>
                    <Settings size={15} /> Conectar provedor de IA
                  </button>
                )}
                <div className="fcSuggestions">
                  {SUGGESTIONS.map((prompt) => {
                    const Icon = prompt.icon
                    return (
                      <button key={prompt.id} type="button" className="fcSuggestion" onClick={() => sendMessage(prompt.title)}>
                        <span className="fcSuggestion__icon"><Icon size={17} /></span>
                        <span className="fcSuggestion__text">
                          <strong>{prompt.title}</strong>
                          <span>{prompt.detail}</span>
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="fcThread">
                <AnimatePresence initial={false}>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      className={`fcMsg fcMsg--${message.role}`}
                      initial={{ opacity: 0, y: 14 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, ease: 'easeOut' }}
                    >
                      {message.role === 'assistant' && (
                        <span className="fcOrb fcOrb--msg" aria-hidden="true"><Sparkles size={13} /></span>
                      )}
                      <div className={`fcMsg__bubble ${message.error ? 'fcMsg__bubble--error' : ''}`}>
                        <p>{message.text}</p>
                        {message.tools?.length ? (
                          <div className="fcMsg__tools">
                            {[...new Set(message.tools)].map((label) => (
                              <span key={label}><Wrench size={10} /> {label}</span>
                            ))}
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
                  ))}
                  {isThinking && (
                    <motion.div
                      key="thinking"
                      className="fcMsg fcMsg--assistant"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <span className="fcOrb fcOrb--msg fcOrb--pulse" aria-hidden="true"><Sparkles size={13} /></span>
                      <div className="fcMsg__bubble fcMsg__bubble--thinking">
                        <span className="fcDots"><i /><i /><i /></span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <form className="fcComposer" onSubmit={handleSend}>
            <div className="fcComposer__box">
              <textarea
                ref={textareaRef}
                placeholder={configured ? 'Pergunte ou peça algo ao FlowChat...' : 'Conecte um provedor de IA para começar'}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={handleKeyDown}
                rows={1}
                aria-label="Mensagem para o FlowChat"
              />
              <button type="submit" className="fcComposer__send" aria-label="Enviar mensagem" disabled={isThinking || !draft.trim()}>
                <ArrowUp size={17} strokeWidth={2.5} />
              </button>
            </div>
            <p className="fcComposer__hint">
              O FlowChat consulta seus dados reais antes de responder · Enter envia, Shift+Enter quebra linha
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}
