import { useState } from 'react'
import TopNav from '../../components/TopNav/TopNav.jsx'

import './AIAssistant.css'

const INITIAL_MESSAGES = [
  {
    id: 'msg-01',
    role: 'assistant',
    text: 'Oi, eu sou o Flow Chat. Posso ler metas, projetos, finanças e hábitos para executar ações ou responder com contexto.',
    chips: ['Financeiro', 'Metas', 'Estudos'],
  },
  {
    id: 'msg-02',
    role: 'user',
    text: 'Mostre minhas despesas parceladas e diga quanto falta pagar neste mês.',
  },
  {
    id: 'msg-03',
    role: 'assistant',
    text: 'Identifiquei 3 despesas parceladas para dezembro. Ainda restam R$ 4.870 a pagar este mês.',
    actions: [
      { label: 'Cartão Flow Visa', detail: 'Calça Marca X · 3x · faltam 2 parcelas' },
      { label: 'Educação', detail: 'Curso Flow Systems · 6x · faltam 4 parcelas' },
      { label: 'Tecnologia', detail: 'MacBook Pro · 12x · faltam 9 parcelas' },
    ],
    followUps: ['Gerar lembrete antes do vencimento', 'Reclassificar despesa', 'Exportar para CSV'],
  },
]

const QUICK_ACTIONS = [
  {
    id: 'parcelada',
    title: 'Registrar compra parcelada 3x',
    description: 'Calça Marca X · R$ 490 · cartão Flow Visa · compra em 08/01',
    command: 'Adicione uma compra parcelada de R$ 490 da Marca X em 3x no cartão Flow Visa feita em 08/01.',
  },
  {
    id: 'receita',
    title: 'Cadastrar nova receita',
    description: 'Mentoria Flow Squad · Stripe · entrada em 12/01',
    command: 'Cadastre receita de mentoria Flow Squad recebida via Stripe em 12/01.',
  },
  {
    id: 'metas',
    title: 'Alinhar meta financeira',
    description: 'Pergunte quais projetos impactam o runway atual',
    command: 'Quais projetos impactam o runway financeiro e quais ações devo priorizar esta semana?',
  },
]

const KNOWLEDGE_BLOCKS = [
  {
    id: 'finance',
    title: 'Financeiro · dezembro',
    entries: ['Receitas: R$ 30.120', 'Despesas: R$ 22.470', 'Saldo: +R$ 7.650'],
  },
  {
    id: 'projects',
    title: 'Projetos ativos',
    entries: ['FlowOS Expansion', 'Vida Essencial', 'FlowFit Sprint 02'],
  },
  {
    id: 'habits',
    title: 'Hábitos hoje',
    entries: ['4/5 concluídos', 'Gratidão ✔', 'Estudos pendente'],
  },
]

const CONNECTORS = [
  { id: 'banks', name: 'Bancos + Cartões', detail: 'Inter, Nubank, BTG, Visa Infinite' },
  { id: 'notion', name: 'Notion Template', detail: 'Sincronizado com Flow OS' },
  { id: 'files', name: 'Docs & Planilhas', detail: 'Drive · CSVs · Integrações' },
]

const FLOW_PROTOCOLS = [
  'Ler dados sempre com contexto (metas → projetos → tarefas).',
  'Confirmar antes de executar ações críticas (ex: transferências).',
  'Retornar plano em etapas para solicitações complexas.',
]

export default function AIAssistant({ user, onNavigate }) {
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [draft, setDraft] = useState('')

  const handleSend = (event) => {
    event.preventDefault()
    const trimmed = draft.trim()
    if (!trimmed) return

    const userMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      text: trimmed,
    }

    const assistantMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      text: 'Entendi. Vou interpretar os dados do sistema, executar a ação solicitada e retornar um resumo com os impactos.',
      followUps: ['Ver detalhes da operação', 'Criar lembrete associado', 'Atualizar dashboards'],
    }

    setMessages((prev) => [...prev, userMessage, assistantMessage])
    setDraft('')
  }

  return (
    <div className="aiPage">
      <TopNav user={user} active="AI Assistant" onNavigate={onNavigate} />

      <section className="aiShell">
        <div className="aiChat ui-card">
          <header>
            <div>
              <p>Flow Chat</p>
              <h2>Assistente conectado ao seu workspace</h2>
            </div>
            <span>Modo seguro · requer confirmação antes de executar</span>
          </header>

          <div className="aiMessages" role="log" aria-live="polite">
            {messages.map((message) => (
              <article key={message.id} className={`aiMessage aiMessage--${message.role}`}>
                <div className="aiMessage__bubble">
                  <p>{message.text}</p>
                  {message.chips ? (
                    <div className="aiMessage__chips">
                      {message.chips.map((chip) => (
                        <span key={chip}>{chip}</span>
                      ))}
                    </div>
                  ) : null}
                  {message.actions ? (
                    <ul className="aiMessage__actions">
                      {message.actions.map((action) => (
                        <li key={action.label}>
                          <strong>{action.label}</strong>
                          <span>{action.detail}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {message.followUps ? (
                    <div className="aiMessage__follow">
                      {message.followUps.map((item) => (
                        <button key={item} type="button">
                          {item}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>

          <form className="aiComposer" onSubmit={handleSend}>
            <label htmlFor="flow-chat-input" className="sr-only">
              Enviar mensagem para o Flow Chat
            </label>
            <textarea
              id="flow-chat-input"
              placeholder="Ex: Adicione uma compra parcelada em 3x da marca X no cartão Flow Visa"
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
            />
            <div className="aiComposer__actions">
              <span>O Flow Chat valida dados financeiros antes de executar.</span>
              <button type="submit">Enviar</button>
            </div>
          </form>
        </div>

        <aside className="aiSidebar">
          <section className="aiSidebar__section">
            <div className="aiSidebar__head">
              <p>Ações rápidas</p>
              <span>compreende linguagem natural</span>
            </div>
            <div className="aiQuickActions">
              {QUICK_ACTIONS.map((action) => (
                <article key={action.id}>
                  <strong>{action.title}</strong>
                  <p>{action.description}</p>
                  <button type="button" onClick={() => setDraft(action.command)}>
                    Usar comando
                  </button>
                </article>
              ))}
            </div>
          </section>

          <section className="aiSidebar__section">
            <div className="aiSidebar__head">
              <p>Contexto carregado</p>
              <span>extratos + metas + hábitos</span>
            </div>
            <div className="aiKnowledge">
              {KNOWLEDGE_BLOCKS.map((block) => (
                <article key={block.id}>
                  <h4>{block.title}</h4>
                  <ul>
                    {block.entries.map((entry) => (
                      <li key={entry}>{entry}</li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </section>

          <section className="aiSidebar__section">
            <div className="aiSidebar__head">
              <p>Conectores & protocolos</p>
              <span>para entender o sistema</span>
            </div>
            <div className="aiConnectors">
              {CONNECTORS.map((connector) => (
                <article key={connector.id}>
                  <strong>{connector.name}</strong>
                  <p>{connector.detail}</p>
                </article>
              ))}
            </div>
            <ul className="aiProtocols">
              {FLOW_PROTOCOLS.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </section>
        </aside>
      </section>
    </div>
  )
}
