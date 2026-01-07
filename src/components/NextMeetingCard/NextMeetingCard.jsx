import './NextMeetingCard.css'

export default function NextMeetingCard({ meeting }) {
  return (
    <section className="meeting ui-card">
      <header className="meeting__header">
        <span className="meeting__titleLabel">Próximo Compromisso</span>
        <div className="meeting__actions" aria-hidden="true">
          <span className="meeting__dot" />
          <span className="meeting__dot meeting__dot--ghost">
            <span className="meeting__dotIcon" />
          </span>
        </div>
      </header>

      <div className="meeting__card">
        <div className="meeting__title">{meeting?.title}</div>
        <div className="meeting__time">Horário: {meeting?.time}</div>
        <button className="meeting__cta" type="button">
          <span className="meeting__ctaIcon" aria-hidden="true" />
          Iniciar reunião
        </button>
      </div>
    </section>
  )
}
