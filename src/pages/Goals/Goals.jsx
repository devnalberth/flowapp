import TopNav from '../../components/TopNav/TopNav.jsx'

import './Goals.css'

const LIFE_AREAS = [
  {
    id: 'profissional',
    label: 'Profissional',
    icon: '💼',
    status: 'Em foco',
    goal: 'Escalar FlowOS para 10 squads ativos',
    project: 'FlowOS Expansion',
    task: 'Ritual semanal de clarificação GTD',
    habit: 'Deep Work 2h/dia',
    progress: 0.72,
    metrics: {
      okr: 'OKR 01 · Crescimento',
      projects: '3 projetos',
      cadence: 'Review semanal',
    },
  },
  {
    id: 'pessoal',
    label: 'Pessoal',
    icon: '🌱',
    status: 'Explorando',
    goal: 'Desenhar rotina energizante para o semestre',
    project: 'Trilha "Vida Essencial"',
    task: 'Capturar wins diários no Flow Journal',
    habit: 'Journaling 10 min',
    progress: 0.41,
    metrics: {
      okr: 'OKR 02 · Equilíbrio',
      projects: '2 iniciativas',
      cadence: 'Review quinzenal',
    },
  },
  {
    id: 'saude',
    label: 'Saúde & Energia',
    icon: '⚡️',
    status: 'Consistente',
    goal: 'Completar 16 sessões de treinos FlowFit',
    project: 'FlowFit Sprint 02',
    task: 'Agendar treinos e nutricionista',
    habit: 'Sono 7h30',
    progress: 0.58,
    metrics: {
      okr: 'OKR 03 · Vitalidade',
      projects: '1 programa',
      cadence: 'Check-in terça/quinta',
    },
  },
  {
    id: 'financas',
    label: 'Finanças & Patrimônio',
    icon: '💰',
    status: 'Em revisão',
    goal: 'Garantir 6 meses de runway investido',
    project: 'Atlas Finance Ops',
    task: 'Revisar dashboard de receitas',
    habit: 'Fechamento semanal',
    progress: 0.33,
    metrics: {
      okr: 'OKR 04 · Sustentabilidade',
      projects: '2 rituais',
      cadence: 'Revisão mensal',
    },
  },
]

const CONNECTED_STREAMS = [
  { id: 'flowos', label: 'FlowOS Expansion', area: 'Profissional', focus: 'Sprint 07', links: ['Meta Norte', 'Projeto', 'Tarefas'] },
  { id: 'vida-essencial', label: 'Vida Essencial', area: 'Pessoal', focus: 'Season 01', links: ['Meta', 'Hábitos', 'Journal'] },
  { id: 'flowfit', label: 'FlowFit', area: 'Saúde', focus: 'Programa 02', links: ['Meta', 'Projeto', 'Treinos'] },
  { id: 'atlas-fin', label: 'Atlas Finance', area: 'Finanças', focus: 'Quarter 1', links: ['Meta', 'Projeto', 'Reviews'] },
]

export default function Goals({ onNavigate, user }) {
  return (
    <div className="goalsPage">
      <TopNav user={user} active="Metas" onNavigate={onNavigate} />

      <header className="goalsHero ui-card">
        <div>
          <p className="goalsHero__eyebrow">Playbook integrado</p>
          <h1 className="goalsHero__title">Metas interligadas a projetos e tarefas</h1>
          <p className="goalsHero__subtitle">
            Use as quatro áreas da vida para alinhar metas, iniciativas e próximos passos. A visão GTD garante que
            cada meta tem um projeto e uma tarefa em andamento.
          </p>
        </div>
        <div className="goalsHero__panel">
          <div className="goalsHero__metric">
            <span>Metas ativas</span>
            <strong>08</strong>
          </div>
          <div className="goalsHero__metric">
            <span>Projetos conectados</span>
            <strong>12</strong>
          </div>
          <button type="button" className="goalsHero__action">
            Nova meta integrada
          </button>
        </div>
      </header>

      <section className="goalsAreas">
        {LIFE_AREAS.map((area) => {
          const progressPercent = Math.round(area.progress * 100)
          return (
            <article key={area.id} className={`goalsCard goalsCard--${area.id}`}>
              <header className="goalsCard__header">
                <div className="goalsCard__title">
                  <span className="goalsCard__icon" aria-hidden="true">
                    {area.icon}
                  </span>
                  <div>
                    <p>Área</p>
                    <h3>{area.label}</h3>
                  </div>
                </div>
                <span className="goalsCard__status">{area.status}</span>
              </header>

              <div className="goalsCard__north">
                <p>Meta norte</p>
                <h4>{area.goal}</h4>
                <div className="goalsCard__progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
                  <span style={{ width: `${progressPercent}%` }} />
                </div>
                <div className="goalsCard__links">
                  <div>
                    <span>Projeto</span>
                    <strong>{area.project}</strong>
                  </div>
                  <div>
                    <span>Tarefa</span>
                    <strong>{area.task}</strong>
                  </div>
                  <div>
                    <span>Hábito</span>
                    <strong>{area.habit}</strong>
                  </div>
                </div>
              </div>

              <footer className="goalsCard__footer">
                <span>{area.metrics.okr}</span>
                <span>{area.metrics.projects}</span>
                <span>{area.metrics.cadence}</span>
              </footer>
            </article>
          )
        })}
      </section>

      <section className="goalsNetwork">
        <header>
          <div>
            <p className="goalsNetwork__eyebrow">Rede integrada</p>
            <h2>Trilhas conectando metas · projetos · tarefas</h2>
            <p>
              Cada stream reforça o método GTD: capture, organize e execute. Veja quais projetos sustentam
              diretamente cada meta e os rituais que mantêm o foco.
            </p>
          </div>
          <button type="button">Mapear próxima trilha</button>
        </header>

        <div className="goalsNetwork__grid">
          {CONNECTED_STREAMS.map((stream) => (
            <article key={stream.id} className="goalsStream">
              <div className="goalsStream__head">
                <p>{stream.area}</p>
                <h3>{stream.label}</h3>
                <span>{stream.focus}</span>
              </div>
              <ul>
                {stream.links.map((link) => (
                  <li key={link}>{link}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>
    </div>
  )
}
