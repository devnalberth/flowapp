import { useEffect, useRef, useState } from 'react'

import TopNav from '../../components/TopNav/TopNav.jsx'

import './Goals.css'

const TRIMESTERS = ['1º Trimestre', '2º Trimestre', '3º Trimestre', '4º Trimestre']

const LIFE_AREAS = [
  {
    id: 'profissional',
    label: 'Profissional',
    icon: '💼',
    status: 'Em foco',
    northStar: 'Escalar FlowOS para 10 squads ativos',
    progress: 0.72,
    review: 'Review semanal',
    description:
      'Desenvolva uma operação de produto com squads autônomos, governança leve e decisões orientadas por GTD.',
    metas: [
      {
        id: 'prof-meta-flowos',
        title: 'Escalar FlowOS para 10 squads ativos',
        progress: 0.72,
        status: 'Concluído',
        trimester: '1º Trimestre',
        areaLabel: 'Profissional',
        intention: 'Mapear Growth, Produto e Operações dentro do mesmo cockpit, garantindo autonomia e cadência.',
        reason: 'Escolho essa meta para criar previsibilidade de entrega e liberar espaço para inovação.',
        projects: [
          { id: 'prof-proj-1', name: 'FlowOS Expansion', status: 'Em curso' },
          { id: 'prof-proj-2', name: 'Labs de Experimentação', status: 'Planejado' },
          { id: 'prof-proj-3', name: 'Academia de squads', status: 'Concluído' },
        ],
        timeline: [
          { id: 'prof-tl-1', date: 'Jan 12', label: 'Kickoff', description: 'Planejamento tático com core team GTD.' },
          { id: 'prof-tl-2', date: 'Feb 20', label: 'Deploy 5 squads', description: 'Primeiro ciclo completo em produção.' },
          { id: 'prof-tl-3', date: 'Mar 30', label: 'Retrospectiva', description: 'Review com aprendizados e próximos bets.' },
        ],
      },
      {
        id: 'prof-meta-lead',
        title: 'Criar academia de líderes Flow',
        progress: 0.35,
        status: 'Em andamento',
        trimester: '2º Trimestre',
        areaLabel: 'Profissional',
        intention: 'Formar líderes capazes de rodar GTD em qualquer squad da rede.',
        reason: 'Escalar cultura Flow depende de líderes preparados para orientar decisões e manter cadência.',
        projects: [
          { id: 'prof-proj-4', name: 'Trilha de liderança', status: 'Em curso' },
          { id: 'prof-proj-5', name: 'Mentorias 1:1', status: 'Planejado' },
        ],
        timeline: [
          { id: 'prof-tl-4', date: 'Apr 05', label: 'Conteúdo', description: 'Blueprint do programa entregue.' },
          { id: 'prof-tl-5', date: 'May 18', label: '1ª turma', description: 'Ciclo piloto com 8 líderes.' },
        ],
      },
    ],
  },
  {
    id: 'pessoal',
    label: 'Pessoal',
    icon: '🌱',
    status: 'Explorando',
    northStar: 'Desenhar rotina energizante para o semestre',
    progress: 0.41,
    review: 'Review quinzenal',
    description: 'Crie rituais pessoais que sustentem energia criativa e espaço para experiências significativas.',
    metas: [
      {
        id: 'pes-meta-ritual',
        title: 'Meditar diariamente por 10 minutos durante 3 meses',
        progress: 1,
        status: 'Concluído',
        trimester: '1º Trimestre',
        areaLabel: 'Pessoal',
        intention: 'Estabelecer uma rotina matinal com journaling, respiração e silêncio consciente.',
        reason: 'Escolho essa meta para ter uma relação melhor comigo mesma e reduzir ansiedade no semestre.',
        projects: [
          { id: 'pes-proj-1', name: 'Estúdio de meditação', status: 'Concluído' },
          { id: 'pes-proj-2', name: 'Grupo semanal', status: 'Em curso' },
          { id: 'pes-proj-3', name: 'Flow Journal', status: 'Em curso' },
        ],
        timeline: [
          { id: 'pes-tl-1', date: 'Jan 02', label: 'Preparação', description: 'Montar espaço físico e checklist matinal.' },
          { id: 'pes-tl-2', date: 'Feb 15', label: 'Checkpoint', description: 'Review com coach sobre energia e foco.' },
          { id: 'pes-tl-3', date: 'Mar 31', label: 'Celebrar', description: 'Registro no Flow Journal com aprendizados.' },
        ],
      },
      {
        id: 'pes-meta-explorar',
        title: 'Planejar micro sabáticos criativos',
        progress: 0.25,
        status: 'Em andamento',
        trimester: '2º Trimestre',
        areaLabel: 'Pessoal',
        intention: 'Reservar blocos de 3 dias para explorar hobbies e natureza a cada trimestre.',
        reason: 'Criar espaço de imaginação mantém o semestre leve e inspirado.',
        projects: [
          { id: 'pes-proj-4', name: 'Workbook Vida Essencial', status: 'Em curso' },
          { id: 'pes-proj-5', name: 'Retiro criativo', status: 'Planejado' },
        ],
        timeline: [
          { id: 'pes-tl-4', date: 'Apr 10', label: 'Roteiro', description: 'Mapa de experiências essenciais.' },
          { id: 'pes-tl-5', date: 'Jun 02', label: '1º sabático', description: 'Viagem curta com práticas de presença.' },
        ],
      },
    ],
  },
  {
    id: 'saude',
    label: 'Saúde & Energia',
    icon: '⚡️',
    status: 'Consistente',
    northStar: 'Completar 16 sessões de treinos FlowFit',
    progress: 0.58,
    review: 'Check-in terça/quinta',
    description: 'Combine treinos FlowFit, nutrição inteligente e descanso profundo para sustentar vitalidade.',
    metas: [
      {
        id: 'sau-meta-flowfit',
        title: 'Completar 16 sessões FlowFit',
        progress: 0.58,
        status: 'Em andamento',
        trimester: '1º Trimestre',
        areaLabel: 'Saúde & Energia',
        intention: 'Fortalecer base metabólica e recuperar energia para os bets importantes.',
        reason: 'Ao cumprir essa meta, garanto disposição para liderar e criar com clareza.',
        projects: [
          { id: 'sau-proj-1', name: 'FlowFit Sprint 02', status: 'Em curso' },
          { id: 'sau-proj-2', name: 'Plano nutricional', status: 'Em curso' },
        ],
        timeline: [
          { id: 'sau-tl-1', date: 'Jan 05', label: 'Avaliação', description: 'Medições iniciais com coach.' },
          { id: 'sau-tl-2', date: 'Feb 22', label: 'Metade do ciclo', description: '8 sessões concluídas + ajustes.' },
          { id: 'sau-tl-3', date: 'Mar 25', label: 'Entrega final', description: 'Apresentar métricas e aprendizados.' },
        ],
      },
      {
        id: 'sau-meta-sleep',
        title: 'Garantir sono regenerativo 7h30',
        progress: 0.4,
        status: 'Em andamento',
        trimester: '2º Trimestre',
        areaLabel: 'Saúde & Energia',
        intention: 'Sincronizar rotina noturna com hábitos de respiração e digital sunset.',
        reason: 'Sono profundo melhora clareza mental e reduz carga emocional acumulada.',
        projects: [
          { id: 'sau-proj-3', name: 'Protocolo de descanso', status: 'Planejado' },
        ],
        timeline: [
          { id: 'sau-tl-4', date: 'Apr 01', label: 'Setup', description: 'Rotina noturna desenhada.' },
          { id: 'sau-tl-5', date: 'May 20', label: 'Biofeedback', description: 'Ajustes com wearable de sono.' },
        ],
      },
    ],
  },
  {
    id: 'financas',
    label: 'Finanças & Patrimônio',
    icon: '💰',
    status: 'Em revisão',
    northStar: 'Garantir 6 meses de runway investido',
    progress: 0.33,
    review: 'Revisão mensal',
    description: 'Construa reservas inteligentes e proteja decisões estratégicas com dados em tempo real.',
    metas: [
      {
        id: 'fin-meta-runway',
        title: 'Garantir 6 meses de runway investido',
        progress: 0.33,
        status: 'Em andamento',
        trimester: '1º Trimestre',
        areaLabel: 'Finanças & Patrimônio',
        intention: 'Mapear burn rate, renegociar contratos e consolidar reservas.',
        reason: 'Segurança financeira libera foco para executar metas ambiciosas sem ansiedade.',
        projects: [
          { id: 'fin-proj-1', name: 'Atlas Finance Ops', status: 'Em curso' },
          { id: 'fin-proj-2', name: 'Carteira conservadora', status: 'Planejado' },
        ],
        timeline: [
          { id: 'fin-tl-1', date: 'Jan 18', label: 'Radiografia', description: 'Coleta de dados contábeis.' },
          { id: 'fin-tl-2', date: 'Mar 04', label: 'Implementação', description: 'Dashboard vivo entregue.' },
          { id: 'fin-tl-3', date: 'Mar 28', label: 'Fechamento', description: 'Reserva formalizada em renda fixa.' },
        ],
      },
      {
        id: 'fin-meta-diversificar',
        title: 'Diversificar receitas em +15%',
        progress: 0.2,
        status: 'Planejado',
        trimester: '2º Trimestre',
        areaLabel: 'Finanças & Patrimônio',
        intention: 'Criar bundles Flow e novas ofertas premium.',
        reason: 'Reduzir dependência de uma única linha de receita e construir colchão estratégico.',
        projects: [
          { id: 'fin-proj-3', name: 'Sprint de pricing', status: 'Planejado' },
          { id: 'fin-proj-4', name: 'Programa Atlas+', status: 'Planejado' },
        ],
        timeline: [
          { id: 'fin-tl-4', date: 'Apr 15', label: 'Discovery', description: 'Entrevistas com clientes chave.' },
          { id: 'fin-tl-5', date: 'Jun 10', label: 'Lançamento', description: 'Nova oferta ativa no FlowOS.' },
        ],
      },
    ],
  },
]

const INITIAL_DREAM_MAP = [
  {
    id: 'dream-flowos',
    title: 'FlowOS vivo e em escala',
    metaLabel: 'Escalar FlowOS para 10 squads',
    image:
      'https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?auto=format&fit=crop&w=900&q=60',
  },
  {
    id: 'dream-retreat',
    title: 'Retiro criativo no campo',
    metaLabel: 'Planejar micro sabáticos',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=60',
  },
  {
    id: 'dream-flowfit',
    title: 'Energia para liderar',
    metaLabel: 'Completar 16 sessões FlowFit',
    image:
      'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=60',
  },
]

function MetaDetail({ meta, onBack }) {
  if (!meta) {
    return null
  }

  const progressPercent = Math.round(meta.progress * 100)
  const infoItems = [
    { label: 'Status', value: meta.status },
    { label: 'Trimestre', value: meta.trimester },
    { label: 'Área', value: meta.areaLabel },
  ]

  return (
    <section className="metaDetail">
      <div className="metaDetail__backRow">
        <button type="button" className="metaDetail__back" onClick={onBack}>
          ← Voltar para metas
        </button>
      </div>
      <header className="metaDetail__summary">
        <div>
          <p className="metaDetail__eyebrow">Meta</p>
          <h2>{meta.title}</h2>
        </div>
        <div className="metaDetail__progress">
          <span>{progressPercent}%</span>
          <div role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
            <span style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      </header>

      <div className="metaDetail__infoGrid">
        {infoItems.map((item) => (
          <div key={item.label} className="metaDetail__infoCard">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      <article className="metaDetail__card metaDetail__summaryCard">
        <header className="metaDetail__summaryCardHead">
          <h3>Resumo</h3>
          <span>Objetivo e intenção em 2 blocos</span>
        </header>
        <div className="metaDetail__summaryGrid">
          <div className="metaDetail__summaryItem">
            <span>Por quê</span>
            <p>{meta.reason}</p>
          </div>
          <div className="metaDetail__summaryItem">
            <span>Intenção</span>
            <p>{meta.intention}</p>
          </div>
        </div>
      </article>

      <section className="metaDetail__projects">
        <header>
          <div>
            <p>Projetos</p>
            <h3>Projetos vinculados e timeline</h3>
          </div>
          <button type="button">Novo projeto</button>
        </header>
        <div className="metaDetail__projectsLayout">
          <div className="metaDetail__projectsList">
            <div className="metaDetail__listHead">
              <span>Projeto</span>
              <span>Status</span>
            </div>
            <ul>
              {meta.projects.map((project) => {
                const statusClass = project.status
                  .normalize('NFD')
                  .replace(/[\u0300-\u036f]/g, '')
                  .replace(/\s+/g, '')
                  .toLowerCase()

                return (
                  <li key={project.id} className="metaProject">
                    <div className="metaProject__info">
                      <strong>{project.name}</strong>
                    </div>
                    <div className="metaProject__statusWrap">
                      <span className={`metaProject__status metaProject__status--${statusClass}`}>
                        {project.status}
                      </span>
                      <button type="button" className="metaProject__cta">
                        Abrir
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="metaDetail__projectsTimeline">
            <div className="metaTimeline__head">
              <p>Linha do tempo</p>
              <span>{meta.timeline.length} marcos</span>
            </div>

            <div className="metaTimeline__gantt">
              <div className="metaTimeline__ganttHeader">
                <strong>janeiro de 2026</strong>
                <div className="metaTimeline__ganttDays">
                  {[9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31].map((day) => (
                    <span key={day}>{day}</span>
                  ))}
                </div>
              </div>

              <div className="metaTimeline__ganttBody">
                <div className="metaTimeline__ganttTrack">
                  {meta.timeline.map((event, index) => (
                    <div
                      key={event.id}
                      className="metaTimeline__ganttBar"
                      style={{ left: `${index * 220 + 24}px`, width: '200px' }}
                    >
                      <div className="metaTimeline__ganttBarHeader">
                        <span className="metaTimeline__ganttIcon" aria-hidden="true" />
                        <p>{event.label}</p>
                        <small>{event.date}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </section>
  )
}

function AreaDetail({ area, onBack }) {
  const [activeMetaId, setActiveMetaId] = useState(area.metas[0]?.id ?? null)
  const [view, setView] = useState('board')

  useEffect(() => {
    setActiveMetaId(area.metas[0]?.id ?? null)
    setView('board')
  }, [area])

  const activeMeta = area.metas.find((meta) => meta.id === activeMetaId) ?? area.metas[0]

  const openMetaDetail = (metaId) => {
    setActiveMetaId(metaId)
    setView('detail')
  }

  const quarterColumns = TRIMESTERS.map((quarterLabel, index) => ({
    id: `quarter-${index + 1}`,
    label: quarterLabel,
    metas: area.metas.filter((meta) => meta.trimester === quarterLabel),
  }))

  return (
    <section className="areaDetail">
      <header className="areaDetail__head">
        <div className="areaDetail__headTop">
          <button type="button" className="areaDetail__back" onClick={onBack}>
            ← Voltar para áreas
          </button>
          <span className="areaDetail__badge">{area.status}</span>
        </div>
        <div className="areaDetail__identity">
          <span className="areaDetail__icon" aria-hidden="true">
            {area.icon}
          </span>
          <div>
            <p>Área</p>
            <h1>{area.label}</h1>
          </div>
        </div>
        <p className="areaDetail__description">{area.description}</p>
      </header>

      {view === 'detail' && activeMeta ? (
        <MetaDetail meta={activeMeta} onBack={() => setView('board')} />
      ) : (
        <section className="areaMetaBoard">
          <header>
            <div>
              <p className="areaMetaBoard__eyebrow">Metas</p>
              <h2>Escolha uma meta para visualizar</h2>
              <span>{area.metas.length} metas conectadas a esta área</span>
            </div>
          </header>
          <div className="kanbanGrid">
            {quarterColumns.map((column) => (
              <article key={column.id} className="kanbanColumn">
                <header>
                  <p>{column.label}</p>
                  <span>{column.metas.length ? `${column.metas.length} metas` : '0 metas'}</span>
                </header>
                <div className="kanbanColumn__body">
                  {column.metas.length === 0 && <p className="kanbanColumn__empty">Ainda sem metas neste trimestre</p>}
                  {column.metas.map((meta) => {
                    const progressPercent = Math.round(meta.progress * 100)
                    const isActive = meta.id === activeMetaId
                    return (
                      <article
                        key={meta.id}
                        className={`metaCard metaCard--kanban ${isActive ? 'metaCard--active' : ''}`}
                        role="button"
                        tabIndex={0}
                        aria-pressed={isActive}
                        onClick={() => openMetaDetail(meta.id)}
                        onKeyDown={(event) => {
                          if (event.key === 'Enter' || event.key === ' ') {
                            event.preventDefault()
                            openMetaDetail(meta.id)
                          }
                        }}
                      >
                        <div className="metaCard__head">
                          <span>{meta.trimester}</span>
                          <strong>{meta.status}</strong>
                        </div>
                        <h3>{meta.title}</h3>
                        <div className="metaCard__progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
                          <span style={{ width: `${progressPercent}%` }} />
                        </div>
                        <footer>
                          <span>{progressPercent}%</span>
                          <span>{meta.areaLabel}</span>
                        </footer>
                      </article>
                    )
                  })}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}
    </section>
  )
}

export default function Goals({ onNavigate, onLogout, user }) {
  const [selectedAreaId, setSelectedAreaId] = useState(null)
  const [dreamBoard, setDreamBoard] = useState(INITIAL_DREAM_MAP)
  const [dreamMetaName, setDreamMetaName] = useState('')
  const dreamUploadRef = useRef(null)
  const selectedArea = LIFE_AREAS.find((area) => area.id === selectedAreaId) ?? null

  const handleCardSelect = (areaId) => {
    setSelectedAreaId(areaId)
  }

  const handleCardKeyDown = (event, areaId) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      handleCardSelect(areaId)
    }
  }

  const handleDreamUpload = (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setDreamBoard((current) => [
        {
          id: `dream-${Date.now()}`,
          title: dreamMetaName || 'Visual sem nome',
          metaLabel: dreamMetaName || 'Meta sem nome',
          image: reader.result,
        },
        ...current,
      ])
      setDreamMetaName('')
    }
    reader.readAsDataURL(file)
    event.target.value = ''
  }

  return (
    <div className="goalsPage">
      <TopNav user={user} active="Metas" onNavigate={onNavigate} onLogout={onLogout} />

      {selectedArea ? (
        <AreaDetail area={selectedArea} onBack={() => setSelectedAreaId(null)} />
      ) : (
        <>
              <section className="goalsAreasBoard">
                <div className="goalsAreas">
                  {LIFE_AREAS.map((area) => {
                    const progressPercent = Math.round(area.progress * 100)
                    return (
                      <article
                        key={area.id}
                        className={`goalsCard goalsCard--${area.id}`}
                        role="button"
                        tabIndex={0}
                        aria-pressed={selectedAreaId === area.id}
                        onClick={() => handleCardSelect(area.id)}
                        onKeyDown={(event) => handleCardKeyDown(event, area.id)}
                      >
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
                          <h4>{area.northStar}</h4>
                          <div className="goalsCard__progress" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progressPercent}>
                            <span style={{ width: `${progressPercent}%` }} />
                          </div>
                        </div>

                        <footer className="goalsCard__footer">
                          <span>{area.metas.length} metas ativas</span>
                          <span>{area.review}</span>
                        </footer>
                      </article>
                    )
                  })}
                </div>

                <div className="dreamMap dreamMap--inline">
            <header>
              <div>
                <p className="dreamMap__eyebrow">Mapa dos sonhos</p>
                <h2>Visualize o que quer construir</h2>
                <p>Suba imagens que representem as suas metas principais e mantenha o quadro sempre visível.</p>
              </div>
              <form
                className="dreamMap__form"
                onSubmit={(event) => {
                  event.preventDefault()
                  dreamUploadRef.current?.click()
                }}
              >
                <label className="dreamMap__label">
                  <span>Meta</span>
                  <input
                    type="text"
                    placeholder="Nome da meta"
                    value={dreamMetaName}
                    onChange={(event) => setDreamMetaName(event.target.value)}
                  />
                </label>
                <input ref={dreamUploadRef} type="file" accept="image/*" hidden onChange={handleDreamUpload} />
                <button type="submit">Adicionar imagem</button>
              </form>
            </header>

            <div className="dreamMap__grid">
              {dreamBoard.map((dream) => (
                <figure key={dream.id} className="dreamCard">
                  <img src={dream.image} alt={dream.title} loading="lazy" />
                  <figcaption>
                    <span>{dream.metaLabel}</span>
                    <strong>{dream.title}</strong>
                  </figcaption>
                </figure>
              ))}
            </div>
                </div>
              </section>
        </>
      )}
    </div>
  )
}
