import './NextMeetingCard.css'

export default function NextMeetingCard({ meeting }) {
  return (
    <section className="meeting ui-card">
      <header className="meeting__header">
        <span className="meeting__titleLabel">Próximo Compromisso</span>
        <button className="meeting__arrow" aria-label="Ver detalhes">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17L17 7M17 7H7M17 7V17" />
          </svg>
        </button>
      </header>

      <div className="meeting__card">
        <div className="meeting__title">{meeting?.title}</div>
        <div className="meeting__time">Horário: {meeting?.time}</div>
      </div>
    </section>
  )
}
