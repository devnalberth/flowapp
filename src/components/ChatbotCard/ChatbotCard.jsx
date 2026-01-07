import './ChatbotCard.css'

const suggestions = [
  {
    title: 'Visão geral da tarefa',
    text: 'Monitore, gerencie e otimize todas as tarefas do projeto em tempo real.',
  },
  {
    title: 'Eficiência do Projeto',
    text: 'Analise o desempenho para melhorar a velocidade do fluxo de trabalho.',
  },
  {
    title: 'Desempenho',
    text: 'Monitore, meça e aprimore seus hábitos de produtividade.',
  },
]

export default function ChatbotCard({ className = '' }) {
  return (
    <section className={`chat ui-card ${className}`.trim()}>
      <div className="chat__chip">
        <span className="chat__dot chat__dot--orange" />
        <span className="chat__dot chat__dot--green" />
        <span className="chat__glyph chat__glyph--mini" />
        <span className="chat__glyph chat__glyph--bar" />
        <span className="chat__label">Flow Chat</span>
        <span className="chat__window" aria-hidden="true">
          <span className="chat__windowLine" />
        </span>
      </div>

      <div className="chat__hello">
        Bom dia, Nalberth<br />Como posso te ajudar hoje?
      </div>

      <div className="chat__gallery" aria-hidden="true">
        <span className="chat__avatar" />
        <span className="chat__avatar" />
        <span className="chat__avatar chat__avatar--accent" />
      </div>

      <div className="chat__orb" aria-hidden="true" />

      <div className="chat__input" role="textbox" aria-label="Pergunte-me qualquer coisa">
        <div className="chat__inputPrompt">
          <span className="chat__caret" />
          <span>Pergunte-me qualquer coisa sobre...</span>
        </div>

        <div className="chat__inputBtns">
          <button type="button" className="chat__btn chat__btn--ghost" aria-label="Anexar" />
          <button type="button" className="chat__btn chat__btn--primary" aria-label="Enviar">
            <span className="chat__sendIcon" />
          </button>
        </div>
      </div>

      <div className="chat__suggest">
        {suggestions.map((item) => (
          <article key={item.title} className="chat__suggestItem">
            <div className="chat__suggestMedia" aria-hidden="true" />
            <div className="chat__suggestCopy">
              <div className="chat__suggestTitle">{item.title}</div>
              <div className="chat__suggestDesc">{item.text}</div>
            </div>
            <span className="chat__suggestIcon" aria-hidden="true" />
          </article>
        ))}
      </div>
    </section>
  )
}
