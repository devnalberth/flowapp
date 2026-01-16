import { useState } from 'react'
import './ChatbotCard.css'

const demoMessages = [
  {
    id: 'assistant-preview',
    role: 'assistant',
    text: 'Bom dia! Posso transformar seus pedidos em tarefas, finanças ou hábitos.',
  },
  {
    id: 'user-preview',
    role: 'user',
    text: 'Resuma minhas entregas de hoje e destaque os bloqueios.',
  },
]

export default function ChatbotCard({ className = '' }) {
  const [draft, setDraft] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    setDraft('')
  }

  return (
    <section className={`chat ui-card ${className}`.trim()}>
      <header className="chat__header">
        <p className="chat__eyebrow">Flow Chat</p>
        <span className="chat__status">Online</span>
      </header>

      <div className="chat__body">
        <div className="chat__history">
          {demoMessages.map((message) => (
            <div key={message.id} className={`chat__bubble chat__bubble--${message.role}`}>
              <p>{message.text}</p>
            </div>
          ))}
        </div>

        <form className="chat__composer" onSubmit={handleSubmit}>
          <label htmlFor="chat-minimal-input" className="chat__srOnly">
            Digite sua mensagem para o Flow Chat
          </label>
          <div className="chat__composerField">
            <textarea
              id="chat-minimal-input"
              placeholder="Descreva rapidamente o que precisa que eu automatize..."
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              rows={2}
            />
            <button type="button" className="chat__micBtn" aria-label="Gravar comando de voz">
              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                <path d="M12 15a3 3 0 0 0 3-3V7a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3Zm6-3a6 6 0 0 1-12 0M12 18v3" />
              </svg>
            </button>
            <button type="submit" className="chat__sendBtn" aria-label="Enviar mensagem">
              <svg viewBox="0 0 24 24" focusable="false" aria-hidden="true">
                <path d="M8 5l11 7-11 7z" />
              </svg>
            </button>
          </div>
          <p className="chat__hint">Ex.: “Crie um resumo do dia e sinalize o foco para amanhã”.</p>
        </form>
      </div>
    </section>
  )
}
