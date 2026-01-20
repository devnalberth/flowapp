import { useEffect, useRef, useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'

import TopNav from '../../components/TopNav/TopNav.jsx'
import FloatingCreateButton from '../../components/FloatingCreateButton/FloatingCreateButton.jsx'
import CreateGoalModal from '../../components/CreateGoalModal/CreateGoalModal.jsx'
import DreamMapModal from '../../components/DreamMapModal/DreamMapModal.jsx'

import './Goals.css'

const TRIMESTERS = ['1º Trimestre', '2º Trimestre', '3º Trimestre', '4º Trimestre']

// Estrutura de áreas de vida padrão
const DEFAULT_LIFE_AREAS = [
  {
    id: 'profissional',
    label: 'Profissional',
    icon: '💼',
    description: 'Desenvolva uma operação de produto com squads autônomos, governança leve e decisões orientadas por GTD.',
  },
  {
    id: 'pessoal',
    label: 'Pessoal',
    icon: '🌱',
    description: 'Crie rituais pessoais que sustentem energia criativa e espaço para experiências significativas.',
  },
  {
    id: 'saude',
    label: 'Saúde',
    icon: '⚡',
    description: 'Construa rotinas de exercício e nutrição que sustentem performance e bem-estar consistente.',
  },
  {
    id: 'financeiro',
    label: 'Finanças',
    icon: '💰',
    description: 'Organize capital, fluxos e investimentos com transparência e previsibilidade.',
  },
]

function MetaDetail({ meta, onBack }) {
  if (!meta) {
    return null
  }

  const progressPercent = Math.round((meta.progress || 0) * 100)
  const infoItems = [
    { label: 'Status', value: meta.status },
    { label: 'Trimestre', value: meta.trimester },
    { label: 'Área', value: meta.areaLabel },
  ]

  // Garante que projetos seja um array
  const projectsList = meta.projects || []

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
              {projectsList.length === 0 ? (
                <li style={{ padding: '1rem', color: 'var(--text-tertiary)' }}>Nenhum projeto vinculado</li>
              ) : (
                projectsList.map((project) => {
                  const statusClass = (project.status || 'active')
                    .normalize('NFD')
                    .replace(/[\u0300-\u036f]/g, '')
                    .replace(/\s+/g, '')
                    .toLowerCase()

                  return (
                    <li key={project.id} className="metaProject">
                      <div className="metaProject__info">
                        <strong>{project.title}</strong>
                      </div>
                      <div className="metaProject__statusWrap">
                        <span className={`metaProject__status metaProject__status--${statusClass}`}>
                          {project.status || 'Ativo'}
                        </span>
                        <button type="button" className="metaProject__cta">
                          Abrir
                        </button>
                      </div>
                    </li>
                  )
                })
              )}
            </ul>
          </div>
          <div className="metaDetail__projectsTimeline">
            <div className="metaTimeline__head">
              <p>Linha do tempo</p>
              <span>{meta.timeline.length} marcos</span>
            </div>

            <div className="metaTimeline__gantt">
              <div className="metaTimeline__ganttHeader">
                <strong>Linha do Tempo</strong>
                {/* Visualização simplificada da timeline */}
              </div>

              <div className="metaTimeline__ganttBody">
                <div className="metaTimeline__ganttTrack">
                  {meta.timeline.map((event, index) => (
                    <div
                      key={event.id}
                      className="metaTimeline__ganttBar"
                      style={{ left: `${index * 150 + 24}px`, width: '140px' }}
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
                    const progressPercent = Math.round((meta.progress || 0) * 100)
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
  // CORREÇÃO: Adicionado 'projects' aqui para vincular nas metas
  const { goals, projects, dreamMaps, addGoal, addDreamMap, deleteDreamMap, loading } = useApp()
  const [selectedAreaId, setSelectedAreaId] = useState(null)
  const [isDreamModalOpen, setIsDreamModalOpen] = useState(false)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)

  // Agrupar metas por área
  const LIFE_AREAS = useMemo(() => {
    return DEFAULT_LIFE_AREAS.map(area => {
      const areaGoals = goals
        .filter(goal => 
          goal.area?.toLowerCase() === area.id || 
          goal.area?.toLowerCase() === area.label.toLowerCase()
        )
        .map(goal => {
          // Calcular trimestres se não estiver definido
          let trimester = '1º Trimestre'
          
          if (goal.trimesters) {
            trimester = goal.trimesters
          } else if (goal.startDate) {
            const start = new Date(goal.startDate)
            const startMonth = start.getMonth() + 1
            const quarterIndex = Math.ceil(startMonth / 3)
            trimester = TRIMESTERS[quarterIndex - 1] || '4º Trimestre'
          }

          // CORREÇÃO: Filtrar projetos vinculados a esta meta
          const goalProjects = (projects || []).filter(p => p.goalId === goal.id || p.goal_id === goal.id)
          
          return {
            ...goal,
            trimester,
            areaLabel: area.label,
            status: (goal.progress || 0) >= 1 ? 'Concluída' : (goal.progress || 0) > 0 ? 'Em progresso' : 'Não iniciada',
            reason: goal.target || 'Sem descrição',
            intention: goal.target || 'Sem intenção definida',
            projects: goalProjects, // Adiciona os projetos à meta
            timeline: [
              { id: 1, label: 'Início', date: goal.startDate ? new Date(goal.startDate).toLocaleDateString('pt-BR') : 'A definir' },
              { id: 2, label: 'Fim', date: goal.endDate ? new Date(goal.endDate).toLocaleDateString('pt-BR') : 'A definir' },
            ],
          }
        })
      
      const totalProgress = areaGoals.length > 0
        ? areaGoals.reduce((sum, goal) => sum + (goal.progress || 0), 0) / areaGoals.length
        : 0
      
      return {
        ...area,
        status: areaGoals.length > 0 ? 'Ativo' : 'Sem metas',
        northStar: areaGoals[0]?.title || 'Nenhuma meta definida',
        progress: totalProgress / 100,
        review: 'Review mensal',
        metas: areaGoals,
      }
    })
  }, [goals, projects]) // Adicionado projects nas dependências

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

  const handleDreamSubmit = async (form, imageFile) => {
    try {
      await addDreamMap(form, imageFile)
      setIsDreamModalOpen(false)
    } catch (error) {
      console.error('Erro ao adicionar ao mapa dos sonhos:', error)
      alert('Não conseguimos adicionar a imagem. Tente novamente.')
    }
  }

  const handleDeleteDream = async (dreamId) => {
    if (!window.confirm('Deseja mesmo remover esta imagem do mapa dos sonhos?')) return
    try {
      await deleteDreamMap(dreamId)
    } catch (error) {
      console.error('Erro ao remover do mapa dos sonhos:', error)
    }
  }

  const handleGoalSubmit = async (payload) => {
    console.debug('Goals.handleGoalSubmit payload:', payload)
    try {
      await addGoal({
        title: payload.title,
        area: payload.area,
        target: payload.target,
        startDate: payload.startDate,
        endDate: payload.endDate,
        type: payload.type,
        trimesters: payload.trimesters,
        trimester_values: payload.trimesterValues,
      })
      console.debug('Goals.handleGoalSubmit: addGoal resolved')
      setIsGoalModalOpen(false)
    } catch (error) {
      console.error('Erro ao criar meta:', error)
      alert('Não conseguimos criar a meta. Tente novamente.')
    }
  }

  return (
    <div className="goalsPage">
      <TopNav user={user} active="Metas" onNavigate={onNavigate} onLogout={onLogout} />

      <FloatingCreateButton label="Nova meta" caption="Adicionar meta" icon={null} ariaLabel="Adicionar meta" onClick={() => setIsGoalModalOpen(true)} />

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
              <button 
                type="button" 
                className="dreamMap__addButton"
                onClick={() => setIsDreamModalOpen(true)}
              >
                Adicionar imagem
              </button>
            </header>

            {dreamMaps.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: '#6b7280' }}>
                <p style={{ fontSize: '18px', marginBottom: '8px' }}>Seu mapa dos sonhos está vazio</p>
                <p style={{ fontSize: '14px' }}>Clique em "Adicionar imagem" para começar a visualizar seus objetivos</p>
              </div>
            ) : (
              <div className="dreamMap__grid">
                {dreamMaps.map((dream) => (
                  <figure key={dream.id} className="dreamCard">
                    <img src={dream.imageUrl || dream.image_url} alt={dream.title} loading="lazy" />
                    <figcaption>
                      <span>{goals.find(g => g.id === dream.goalId || g.id === dream.goal_id)?.title || 'Meta'}</span>
                      <strong>{dream.title}</strong>
                    </figcaption>
                    <button
                      type="button"
                      onClick={() => handleDeleteDream(dream.id)}
                      style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        background: 'rgba(0,0,0,0.6)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        padding: '4px 8px',
                        cursor: 'pointer',
                        fontSize: '12px'
                      }}
                    >
                      ✕
                    </button>
                  </figure>
                ))}
              </div>
            )}
          </div>
        </section>
        </>
      )}

      {/* Modais */}
      {isGoalModalOpen && (
        <CreateGoalModal
          open={isGoalModalOpen}
          onClose={() => setIsGoalModalOpen(false)}
          onSubmit={handleGoalSubmit}
          areaOptions={DEFAULT_LIFE_AREAS.map((area) => area.label)}
        />
      )}

      {isDreamModalOpen && (
        <DreamMapModal
          open={isDreamModalOpen}
          onClose={() => setIsDreamModalOpen(false)}
          onSubmit={handleDreamSubmit}
          goals={goals}
        />
      )}
    </div>
  )
}