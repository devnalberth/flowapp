import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowUpRight, Settings, Sparkles } from 'lucide-react'
import { isJarvisConfigured } from '../../services/jarvisConfig.js'
import { runJarvisTurn, loadJarvisChat, saveJarvisChat } from '../../services/jarvisService.js'
import { useJarvisToolCtx } from '../../hooks/useJarvisToolCtx.js'
import './ChatbotCard.css'

const QUICK_PROMPTS = [
  'Resuma meu dia',
  'O que vence em breve?',
  'Quais tarefas estão atrasadas?',
]

const uuid = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()))

// Mini FlowChat do Dashboard: mesma conversa, config e ferramentas da página
// FlowChat (histórico compartilhado via localStorage).
export default function ChatbotCard({ className = '', user, onOpenFlowChat }) {
  const configured = useMemo(() => isJarvisConfigured(), [])

  const [{ display: initialDisplay, history: initialHistory }] = useState(() => loadJarvisChat())
  const [messages, setMessages] = useState(initialDisplay)
  const historyRef = useRef(initialHistory)

  const [draft, setDraft] = useState('')
  const [isThinking, setThinking] = useState(false)
  const historyElRef = useRef(null)

  const userName = useMemo(
    () => {
      const first = user?.name?.trim()?.split(' ')[0] || ''
      return first ? first.charAt(0).toUpperCase() + first.slice(1) : ''
    },
    [user],
  )

  const toolCtx = useJarvisToolCtx(userName)

  useEffect(() => {
    if (!historyElRef.current) return
    historyElRef.current.scrollTo({ top: historyElRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, isThinking])

  const sendMessage = async (text) => {
    const value = text.trim()
    if (!value || isThinking) return

    if (!configured) {
      onOpenFlowChat?.()
      return
    }

    setMessages((prev) => [...prev, { id: uuid(), role: 'user', text: value }])
    setDraft('')
    setThinking(true)

    try {
      const result = await runJarvisTurn({ history: historyRef.current, userText: value, ctx: toolCtx })
      setMessages((prev) => {
        const next = [...prev, { id: uuid(), role: 'assistant', text: result.text, tools: result.toolLabels }]
        saveJarvisChat(next, historyRef.current)
        return next
      })
    } catch (error) {
      console.error('FlowChat (dashboard):', error)
      setMessages((prev) => [
        ...prev,
        { id: uuid(), role: 'assistant', text: error?.message || 'Algo deu errado. Tente novamente.', error: true },
      ])
    } finally {
      setThinking(false)
    }
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    sendMessage(draft)
  }

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage(draft)
    }
  }

  // Só as últimas mensagens cabem no card; a conversa completa fica na página
  const visibleMessages = messages.slice(-8)

  return (
    <section className={`chat ui-card ${className}`.trim()}>
      <header className="chat__header">
        <p className="chat__eyebrow">Flow Chat</p>
        <div className="chat__headerRight">
          <span className={`chat__status ${configured ? '' : 'chat__status--off'}`}>
            {configured ? 'Online' : 'Não configurado'}
          </span>
          <button
            type="button"
            className="chat__openBtn"
            aria-label="Abrir FlowChat completo"
            title="Abrir FlowChat completo"
            onClick={() => onOpenFlowChat?.()}
          >
            <ArrowUpRight size={15} />
          </button>
        </div>
      </header>

      <div className="chat__body">
        <div className="chat__history" ref={historyElRef} role="log" aria-live="polite">
          {!configured ? (
            <div className="chat__setup">
              <Sparkles size={22} />
              <p>Conecte um provedor de IA para conversar sobre suas tarefas, finanças e hábitos.</p>
              <button type="button" className="chat__setupBtn" onClick={() => onOpenFlowChat?.()}>
                <Settings size={14} /> Configurar FlowChat
              </button>
            </div>
          ) : visibleMessages.length === 0 && !isThinking ? (
            <div className="chat__empty">
              <div className="chat__bubble chat__bubble--assistant">
                <p>{userName ? `Olá, ${userName}! ` : 'Olá! '}Pergunte algo ou escolha um atalho:</p>
              </div>
              <div className="chat__quick">
                {QUICK_PROMPTS.map((prompt) => (
                  <button key={prompt} type="button" onClick={() => sendMessage(prompt)}>
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <>
              {visibleMessages.map((message) => (
                <div
                  key={message.id}
                  className={`chat__bubble chat__bubble--${message.role} ${message.error ? 'chat__bubble--error' : ''}`}
                >
                  <p>{message.text}</p>
                </div>
              ))}
              {isThinking && (
                <div className="chat__bubble chat__bubble--assistant chat__bubble--thinking">
                  <span className="chat__dots"><i /><i /><i /></span>
                </div>
              )}
            </>
          )}
        </div>

        <form className="chat__composer" onSubmit={handleSubmit}>
          <label htmlFor="chat-minimal-input" className="chat__srOnly">
            Digite sua mensagem para o Flow Chat
          </label>
          <div className="chat__composerField">
            <textarea
              id="chat-minimal-input"
              placeholder={configured ? 'Pergunte ou peça algo ao FlowChat...' : 'Configure o FlowChat para começar'}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              disabled={!configured}
            />
            <button type="submit" className="chat__sendBtn" aria-label="Enviar mensagem" disabled={isThinking || !draft.trim()}>
              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                <path d="M8 5l11 7-11 7z" />
              </svg>
            </button>
          </div>
          <p className="chat__hint">
            {configured
              ? 'O FlowChat consulta seus dados reais antes de responder.'
              : 'A conversa completa fica na aba FlowChat.'}
          </p>
        </form>
      </div>
    </section>
  )
}
