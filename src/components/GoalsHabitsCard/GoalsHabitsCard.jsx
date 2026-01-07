import './GoalsHabitsCard.css'

const goalGrid = Array.from({ length: 16 }).map((_, index) => ({
  highlight: index % 5 === 0,
}))

export default function GoalsHabitsCard({ className = '' }) {
  return (
    <section className={`gh ui-card ${className}`.trim()}>
      <div className="gh__habits">
        <div className="gh__halo" aria-hidden="true">
          <span className="gh__ring gh__ring--outer" />
          <span className="gh__ring gh__ring--mid" />
          <span className="gh__ring gh__ring--inner" />
        </div>
        <div className="gh__habitsMeta">
          <span className="gh__habitsLabel">Hábitos</span>
          <span className="gh__habitsValue">86/100</span>
          <span className="gh__pill">
            6.2%
            <span className="gh__arrow" aria-hidden="true" />
          </span>
        </div>
      </div>

      <div className="gh__goals">
        <header className="gh__goalsHeader">
          <div className="gh__goalsTitle">Metas</div>
          <div className="gh__filter">
            <span>Mês</span>
            <span className="gh__chev" />
          </div>
        </header>

        <div className="gh__grid" aria-hidden="true">
          {goalGrid.map((cell, index) => (
            // eslint-disable-next-line react/no-array-index-key
            <span key={index} className={cell.highlight ? 'gh__cell gh__cell--highlight' : 'gh__cell'} />
          ))}
          <div className="gh__focus">
            <div className="gh__focusLabel">Meta Atual</div>
            <div className="gh__focusValue">72%</div>
          </div>
        </div>

        <div className="gh__months">
          {['May', 'June', 'July', 'August'].map((m) => (
            <span key={m} className="gh__month">
              {m}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
