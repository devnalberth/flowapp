import { useEffect, useRef, useState, useMemo } from 'react'
import { useApp } from '../../context/AppContext'

import TopNav from '../../components/TopNav/TopNav.jsx'
import FloatingCreateButton from '../../components/FloatingCreateButton/FloatingCreateButton.jsx'
import CreateGoalModal from '../../components/CreateGoalModal/CreateGoalModal.jsx'
import DreamMapModal from '../../components/DreamMapModal/DreamMapModal.jsx'
import { computeProjectStats } from '../../utils/projectMetrics'
import { getGoalSchedule, TRIMESTER_LABELS } from '../../utils/goalSchedule'
import { Target, FolderKanban, ListChecks, CheckCircle2, CalendarClock, ArrowUpRight, Pencil, Eye, X, Trophy, TrendingUp } from 'lucide-react'

import './Goals.css'

const TRIMESTERS = TRIMESTER_LABELS

// Áreas de vida (alinhadas às categorias de Projetos: Profissional, Pessoal, Financeiro, Estudos)
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
    id: 'financeiro',
    label: 'Financeiro',
    icon: '💰',
    description: 'Organize capital, fluxos e investimentos com transparência e previsibilidade.',
  },
  {
    id: 'estudos',
    label: 'Estudos',
    icon: '📚',
    description: 'Estruture trilhas de aprendizado contínuo que sustentem sua evolução técnica e criativa.',
  },
]

const fmtDate = (value) => {
  if (!value) return null
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  if (Number.isNaN(d.getTime())) return null
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })
}

// Agrega métricas de um conjunto de metas (para os dashboards)
const aggregateGoals = (metas = []) => {
  const total = metas.length
  const done = metas.filter((m) => (m.progressPercent || 0) >= 100).length
  const inProgress = metas.filter((m) => (m.progressPercent || 0) > 0 && (m.progressPercent || 0) < 100).length
  const notStarted = total - done - inProgress
  const avgProgress = total ? Math.round(metas.reduce((a, m) => a + (m.progressPercent || 0), 0) / total) : 0
  const totalTasks = metas.reduce((a, m) => a + (m.totalTasks || 0), 0)
  const doneTasks = metas.reduce((a, m) => a + (m.doneTasks || 0), 0)
  const projects = metas.reduce((a, m) => a + ((m.projects || []).length), 0)
  const byQuarter = [0, 0, 0, 0]
  metas.forEach((m) => { const q = m.schedule?.currentQuarter; if (q >= 1 && q <= 4) byQuarter[q - 1] += 1 })
  return { total, done, inProgress, notStarted, avgProgress, totalTasks, doneTasks, projects, byQuarter }
}

// Visão geral consolidada (topo da página de Metas)
function MetasOverview({ areas }) {
  const all = areas.flatMap((a) => a.metas)
  const stats = aggregateGoals(all)
  const maxQ = Math.max(1, ...stats.byQuarter)

  return (
    <section className="metasOverview">
      <header className="metasOverview__head">
        <div>
          <p className="metasOverview__eyebrow">Visão geral</p>
          <h2>Painel de Metas</h2>
        </div>
        <div className="metasOverview__big">
          <strong>{stats.avgProgress}%</strong>
          <span>progresso geral</span>
        </div>
      </header>

      <div className="metaStats__kpis">
        <div className="metaKpi"><Target size={17} /><strong>{stats.total}</strong><span>Metas</span></div>
        <div className="metaKpi metaKpi--done"><Trophy size={17} /><strong>{stats.done}</strong><span>Concluídas</span></div>
        <div className="metaKpi"><TrendingUp size={17} /><strong>{stats.inProgress}</strong><span>Em progresso</span></div>
        <div className="metaKpi"><FolderKanban size={17} /><strong>{stats.projects}</strong><span>Projetos</span></div>
        <div className="metaKpi"><ListChecks size={17} /><strong>{stats.doneTasks}/{stats.totalTasks}</strong><span>Tarefas</span></div>
      </div>

      <div className="metasOverview__charts">
        <div className="metasOverview__chart">
          <h4>Metas por trimestre</h4>
          <div className="qbars">
            {stats.byQuarter.map((v, i) => (
              <div key={i} className="qbar">
                <div className="qbar__track"><span style={{ height: `${Math.max((v / maxQ) * 100, v ? 8 : 0)}%` }} /></div>
                <span className="qbar__val">{v}</span>
                <span className="qbar__label">{i + 1}º Tri</span>
              </div>
            ))}
          </div>
        </div>
        <div className="metasOverview__chart">
          <h4>Progresso por área</h4>
          <ul className="areaBars">
            {areas.map((a) => (
              <li key={a.id}>
                <span className="areaBars__name">{a.icon} {a.label}</span>
                <div className="areaBars__track"><span style={{ width: `${a.progressPercent || 0}%` }} /></div>
                <span className="areaBars__pct">{a.progressPercent || 0}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

// Dashboard compacto de uma área (acima do kanban)
function AreaDashboard({ metas }) {
  const stats = aggregateGoals(metas)
  return (
    <div className="metaStats">
      <div className="metaStats__kpis">
        <div className="metaKpi"><Target size={17} /><strong>{stats.avgProgress}%</strong><span>Progresso</span></div>
        <div className="metaKpi metaKpi--done"><Trophy size={17} /><strong>{stats.done}</strong><span>Concluídas</span></div>
        <div className="metaKpi"><TrendingUp size={17} /><strong>{stats.inProgress}</strong><span>Em progresso</span></div>
        <div className="metaKpi"><FolderKanban size={17} /><strong>{stats.projects}</strong><span>Projetos</span></div>
        <div className="metaKpi"><ListChecks size={17} /><strong>{stats.doneTasks}/{stats.totalTasks}</strong><span>Tarefas</span></div>
      </div>
    </div>
  )
}

// Lightbox para ver a imagem completa do mapa dos sonhos
function Lightbox({ image, title, onClose }) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = '' }
  }, [onClose])

  return (
    <div className="dreamLightbox" onClick={onClose}>
      <button className="dreamLightbox__close" onClick={onClose} aria-label="Fechar"><X size={22} /></button>
      <figure className="dreamLightbox__figure" onClick={(e) => e.stopPropagation()}>
        <img src={image} alt={title || ''} />
        {title && <figcaption>{title}</figcaption>}
      </figure>
    </div>
  )
}

function MetaDetail({ meta, onNavigate }) {
  if (!meta) return null

  const progressPercent = meta.progressPercent || 0
  const schedule = meta.schedule
  const projectsList = meta.projects || []
  const statusTone = progressPercent >= 100 ? 'done' : progressPercent > 0 ? 'doing' : 'todo'
  const ring = `conic-gradient(${progressPercent >= 100 ? '#10b981' : '#ff7a18'} ${progressPercent * 3.6}deg, rgba(0,0,0,0.07) 0deg)`
  const periodStart = fmtDate(schedule?.range?.start)
  const periodEnd = fmtDate(schedule?.range?.end)
  const daysLeft = schedule?.daysLeft

  return (
    <section className="metaDash">
      <header className="metaDash__hero">
        <div className="metaDash__heroText">
          <p className="metaDash__eyebrow">Meta</p>
          <h2>{meta.title}</h2>
          <div className="metaDash__tags">
            <span className={`metaDash__statusTag metaDash__statusTag--${statusTone}`}>{meta.status}</span>
            <span className="metaDash__tag">{meta.areaLabel}</span>
            <span className="metaDash__tag">{schedule?.currentLabel || meta.trimester}</span>
          </div>
        </div>
        <div className="metaDash__ring" style={{ background: ring }}>
          <div className="metaDash__ringInner"><strong>{progressPercent}%</strong><span>andamento</span></div>
        </div>
      </header>

      <div className="metaDash__quarters">
        <div className="metaDash__quartersHead">
          <span>Trajetória {schedule?.year || ''}</span>
          <span className="metaDash__period">
            <CalendarClock size={13} /> {periodStart} → {periodEnd}
            {typeof daysLeft === 'number' && !meta.status.includes('Conclu') && (
              <em className={daysLeft < 0 ? 'is-late' : ''}>
                {daysLeft < 0 ? ` · ${Math.abs(daysLeft)}d atrasado` : ` · ${daysLeft}d restantes`}
              </em>
            )}
          </span>
        </div>
        <div className="metaDash__quartersTrack">
          {[1, 2, 3, 4].map((q) => {
            const inRange = schedule && q >= schedule.startQuarter && q <= schedule.endQuarter
            const isCurrent = schedule && q === schedule.currentQuarter
            return (
              <div key={q} className={`metaQuarter ${inRange ? 'in-range' : ''} ${isCurrent ? 'is-current' : ''}`}>
                <span className="metaQuarter__label">{q}º Tri</span>
                {isCurrent && <span className="metaQuarter__now">agora</span>}
              </div>
            )
          })}
        </div>
      </div>

      <div className="metaDash__kpis">
        <div className="metaKpi"><Target size={17} /><strong>{progressPercent}%</strong><span>Progresso</span></div>
        <div className="metaKpi"><FolderKanban size={17} /><strong>{projectsList.length}</strong><span>Projetos</span></div>
        <div className="metaKpi"><ListChecks size={17} /><strong>{meta.totalTasks || 0}</strong><span>Tarefas</span></div>
        <div className="metaKpi metaKpi--done"><CheckCircle2 size={17} /><strong>{meta.doneTasks || 0}</strong><span>Concluídas</span></div>
      </div>

      <article className="metaDash__panel">
        <header className="metaDash__panelHead"><h3>Objetivo</h3><span>Por que esta meta importa</span></header>
        <p className="metaDash__objective">{meta.objective || 'Sem descrição definida.'}</p>
      </article>

      <article className="metaDash__panel">
        <header className="metaDash__panelHead">
          <h3>Projetos vinculados</h3>
          <span>{projectsList.length} {projectsList.length === 1 ? 'projeto' : 'projetos'}</span>
        </header>

        {projectsList.length === 0 ? (
          <div className="metaDash__empty">
            Nenhum projeto vinculado ainda. Vincule um projeto para alimentar o progresso desta meta.
          </div>
        ) : (
          <ul className="metaDash__projects">
            {projectsList.map((project) => {
              const s = project._stats || { progress: 0, totalTasks: 0, doneTasks: 0 }
              const color = `#${(project.color || 'ff9500').replace('#', '')}`
              return (
                <li
                  key={project.id}
                  className="metaProjItem"
                  role="button"
                  tabIndex={0}
                  onClick={() => onNavigate?.('Projetos')}
                  title="Abrir em Projetos"
                >
                  <span className="metaProjItem__dot" style={{ background: color }} />
                  <div className="metaProjItem__body">
                    <div className="metaProjItem__top">
                      <strong>{project.title}</strong>
                      <span className="metaProjItem__count">{s.doneTasks}/{s.totalTasks} tarefas</span>
                    </div>
                    <div className="metaProjItem__bar">
                      <span style={{ width: `${s.progress}%`, background: color }} />
                    </div>
                  </div>
                  <span className="metaProjItem__pct">{s.progress}%</span>
                  <ArrowUpRight size={16} className="metaProjItem__go" />
                </li>
              )
            })}
          </ul>
        )}
      </article>
    </section>
  )
}

function AreaDetail({ area, onBack, onEdit, onNavigate }) {
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

  const handleBack = () => {
    if (view === 'detail') {
      setView('board')
      return
    }
    onBack?.()
  }

  const quarterColumns = TRIMESTERS.map((quarterLabel, index) => ({
    id: `quarter-${index + 1}`,
    label: quarterLabel,
    metas: area.metas.filter((meta) => meta.trimester === quarterLabel),
  }))

  return (
    <section className="areaDetail">
      <div className="areaDetail__shell">
        <header className="areaDetail__head">
          <div className="areaDetail__headTop">
            <button type="button" className="areaDetail__back" onClick={handleBack}>
              {view === 'detail' ? '← Voltar para metas' : '← Voltar para áreas'}
            </button>
            <div className="areaDetail__headActions">
              <span className="areaDetail__badge">{area.status}</span>
              {view === 'detail' && activeMeta ? (
                <button className="btn btn-secondary" onClick={() => onEdit?.(activeMeta)}>Editar meta</button>
              ) : null}
            </div>
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
          <MetaDetail meta={activeMeta} onNavigate={onNavigate} />
        ) : (
          <section className="areaMetaBoard">
            <header>
              <div>
                <p className="areaMetaBoard__eyebrow">Metas</p>
                <h2>Escolha uma meta para visualizar</h2>
                <span>{area.metas.length} metas conectadas a esta área</span>
              </div>
            </header>
            <AreaDashboard metas={area.metas} />
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
                      const progressPercent = meta.progressPercent || 0
                      const isActive = meta.id === activeMetaId
                      return (
                        <article
                          key={meta.id}
                          className={`metaCard metaCard--kanban ${isActive ? 'metaCard--active' : ''}`}
                          role="button"
                          tabIndex={0}
                          aria-pressed={isActive}
                          onClick={() => openMetaDetail(meta.id)}
                        >
                          <div className="metaCard__head">
                            <span>{meta.trimester}</span>
                            <strong>{meta.status}</strong>
                          </div>
                          <h3>{meta.title}</h3>
                          <div className="metaCard__progress">
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
      </div>
    </section>
  )
}

export default function Goals({ onNavigate, onLogout, user }) {
  // CORREÇÃO: Pegando deleteGoal do contexto
  const { goals, projects, tasks, dreamMaps, financeCategories, addGoal, addDreamMap, updateDreamMap, deleteDreamMap, updateGoal, deleteGoal, updateProject, loading } = useApp()
  const [selectedAreaId, setSelectedAreaId] = useState(null)
  const [isDreamModalOpen, setIsDreamModalOpen] = useState(false)
  const [editingDream, setEditingDream] = useState(null)
  const [lightbox, setLightbox] = useState(null)
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false)
  const [editGoal, setEditGoal] = useState(null)
  const [emptyAreaPulseId, setEmptyAreaPulseId] = useState(null)
  const emptyPulseTimerRef = useRef(null)

  const LIFE_AREAS = useMemo(() => {
    return DEFAULT_LIFE_AREAS.map(area => {
      const areaGoals = goals
        .filter(goal =>
          goal.area?.toLowerCase() === area.id ||
          goal.area?.toLowerCase() === area.label.toLowerCase()
        )
        .map(goal => {
          const schedule = getGoalSchedule(goal)

          // Projetos vinculados + progresso DERIVADO (média do andamento dos projetos)
          const goalProjects = (projects || []).filter(p => p.goalId === goal.id || p.goal_id === goal.id)
          const enrichedProjects = goalProjects.map(p => ({ ...p, _stats: computeProjectStats(p, tasks) }))
          const totalTasks = enrichedProjects.reduce((a, p) => a + p._stats.totalTasks, 0)
          const doneTasks = enrichedProjects.reduce((a, p) => a + p._stats.doneTasks, 0)
          const progressPercent = enrichedProjects.length
            ? Math.round(enrichedProjects.reduce((a, p) => a + p._stats.progress, 0) / enrichedProjects.length)
            : Math.round((goal.progress || 0) * 100) // fallback ao valor salvo (0/100)

          return {
            ...goal,
            schedule,
            trimester: schedule.currentLabel, // posiciona no trimestre REAL de hoje (auto-avanço)
            areaLabel: area.label,
            progressPercent,
            totalTasks,
            doneTasks,
            status: progressPercent >= 100 ? 'Concluída' : progressPercent > 0 ? 'Em progresso' : 'Não iniciada',
            objective: goal.target || '',
            projects: enrichedProjects,
          }
        })

      const progressPercent = areaGoals.length > 0
        ? Math.round(areaGoals.reduce((sum, g) => sum + (g.progressPercent || 0), 0) / areaGoals.length)
        : 0

      return {
        ...area,
        status: areaGoals.length > 0 ? 'Ativo' : 'Sem metas',
        northStar: areaGoals[0]?.title || 'Nenhuma meta definida',
        progressPercent,
        review: 'Review trimestral',
        metas: areaGoals,
      }
    })
  }, [goals, projects, tasks])

  const selectedArea = LIFE_AREAS.find((area) => area.id === selectedAreaId) ?? null

  useEffect(() => {
    return () => {
      if (emptyPulseTimerRef.current) {
        window.clearTimeout(emptyPulseTimerRef.current)
        emptyPulseTimerRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    if (loading) return
    if (!selectedAreaId) return

    const currentArea = LIFE_AREAS.find((area) => area.id === selectedAreaId)
    if (!currentArea || !Array.isArray(currentArea.metas) || currentArea.metas.length === 0) {
      setSelectedAreaId(null)
    }
  }, [loading, selectedAreaId, LIFE_AREAS])

  const pulseEmptyArea = (areaId) => {
    setEmptyAreaPulseId(areaId)
    if (emptyPulseTimerRef.current) {
      window.clearTimeout(emptyPulseTimerRef.current)
    }
    emptyPulseTimerRef.current = window.setTimeout(() => {
      setEmptyAreaPulseId(null)
      emptyPulseTimerRef.current = null
    }, 320)
  }

  const handleCardSelect = (area) => {
    if (!area) return
    if (loading) return

    const metasCount = Array.isArray(area.metas) ? area.metas.length : 0
    if (metasCount === 0) {
      pulseEmptyArea(area.id)
      return
    }

    setSelectedAreaId(area.id)
  }

  const openNewDream = () => { setEditingDream(null); setIsDreamModalOpen(true) }
  const openEditDream = (dream) => { setEditingDream(dream); setIsDreamModalOpen(true) }
  const closeDreamModal = () => { setIsDreamModalOpen(false); setEditingDream(null) }

  const handleDreamSubmit = async (form, imageFile) => {
    try {
      if (editingDream) {
        await updateDreamMap(editingDream.id, { title: form.title, goalId: form.goalId || null }, imageFile)
      } else {
        await addDreamMap(form, imageFile)
      }
      closeDreamModal()
    } catch (error) {
      console.error('Erro ao salvar imagem:', error)
      alert(`Erro ao salvar imagem: ${error?.message || error}`)
    }
  }

  const handleDeleteDream = async () => {
    if (!editingDream) return
    if (!window.confirm('Remover esta imagem do mapa?')) return
    try {
      await deleteDreamMap(editingDream.id)
      closeDreamModal()
    } catch (error) {
      console.error(error)
      alert('Erro ao remover imagem.')
    }
  }

  const handleGoalSubmit = async (payload) => {
    try {
      const { projectId, ...goalData } = payload
      let finalGoalId = editGoal ? editGoal.id : null

      if (editGoal) {
        // Se estiver editando, removemos vínculos anteriores se o projeto mudou
        if (editGoal.projects && editGoal.projects.length > 0) {
          const oldProjectIds = editGoal.projects.map(p => p.id)
          // Se escolheu um projeto diferente (ou nenhum), remove dos antigos
          if (!projectId || !oldProjectIds.includes(projectId)) {
            for (const p of editGoal.projects) {
              await updateProject(p.id, { goalId: null })
            }
          }
        }
        await updateGoal(editGoal.id, goalData)
      } else {
        const newGoal = await addGoal(goalData)
        if (newGoal) finalGoalId = newGoal.id
      }

      // Se selecionou um projeto, vincula ele à meta
      if (finalGoalId && projectId) {
        await updateProject(projectId, { goalId: finalGoalId })
      }

      setIsGoalModalOpen(false)
      setEditGoal(null)
    } catch (error) {
      console.error(error)
      alert('Não conseguimos salvar a meta.')
    }
  }

  // --- NOVA FUNÇÃO DE DELETAR ---
  const handleDeleteGoal = async () => {
    if (!editGoal) return
    if (window.confirm('Tem certeza que deseja excluir esta meta? Isso pode afetar projetos vinculados.')) {
      try {
        await deleteGoal(editGoal.id)
        setIsGoalModalOpen(false)
        setEditGoal(null)
        // Se a área ficar vazia, voltamos para a lista principal
        // mas o react state deve cuidar disso via re-render
      } catch (error) {
        alert('Erro ao excluir meta')
      }
    }
  }

  return (
    <div className="goalsPage">
      <TopNav user={user} active="Metas" onNavigate={onNavigate} onLogout={onLogout} />

      <FloatingCreateButton label="Nova meta" onClick={() => setIsGoalModalOpen(true)} />

      {selectedArea ? (
        <AreaDetail
          area={selectedArea}
          onNavigate={onNavigate}
          onBack={() => setSelectedAreaId(null)}
          onEdit={(meta) => {
            setEditGoal(meta)
            setIsGoalModalOpen(true)
          }}
        />
      ) : (
        <>
          <section className="goalsAreasBoard">
            {!loading && LIFE_AREAS.some((a) => a.metas.length > 0) && <MetasOverview areas={LIFE_AREAS} />}

            <div className="goalsAreas">
              {LIFE_AREAS.map((area) => {
                const progressPercent = area.progressPercent || 0
                const hasMetas = Array.isArray(area.metas) && area.metas.length > 0
                const isEmptyArea = !loading && !hasMetas
                const isPulse = emptyAreaPulseId === area.id
                return (
                  <article
                    key={area.id}
                    className={`goalsCard goalsCard--${area.id} ${isEmptyArea ? 'goalsCard--empty' : ''} ${isPulse ? 'goalsCard--pulse' : ''}`}
                    onClick={() => handleCardSelect(area)}
                  >
                    <header className="goalsCard__header">
                      <div className="goalsCard__title">
                        <span className="goalsCard__icon">{area.icon}</span>
                        <div><p>Área</p><h3>{area.label}</h3></div>
                      </div>
                      <span className="goalsCard__status">{area.status}</span>
                    </header>
                    <div className="goalsCard__north">
                      <p>Meta norte</p>
                      <h4>{area.northStar}</h4>
                      <div className="goalsCard__progress">
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
                </div>
                <button type="button" className="dreamMap__addButton" onClick={openNewDream}>
                  Adicionar imagem
                </button>
              </header>

              {dreamMaps.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: '#666' }}>Seu mapa está vazio</div>
              ) : (
                <div className="dreamMasonry">
                  {dreamMaps.map((dream) => {
                    const url = dream.imageUrl || dream.image_url
                    return (
                      <figure key={dream.id} className="dreamTile">
                        <img src={url} alt={dream.title} loading="lazy" />
                        <figcaption className="dreamTile__caption">{dream.title}</figcaption>
                        <div className="dreamTile__actions">
                          <button type="button" className="dreamTile__btn" title="Ver imagem completa" onClick={() => setLightbox({ url, title: dream.title })}>
                            <Eye size={16} />
                          </button>
                          <button type="button" className="dreamTile__btn" title="Editar" onClick={() => openEditDream(dream)}>
                            <Pencil size={15} />
                          </button>
                        </div>
                      </figure>
                    )
                  })}
                </div>
              )}
            </div>
          </section>
        </>
      )}

      {isGoalModalOpen && (
        <CreateGoalModal
          open={isGoalModalOpen}
          onClose={() => {
            setIsGoalModalOpen(false)
            setEditGoal(null)
          }}
          onSubmit={handleGoalSubmit}
          onDelete={editGoal ? handleDeleteGoal : undefined} // Passa a função de deletar apenas se for edição
          areaOptions={DEFAULT_LIFE_AREAS.map((area) => area.label)}
          projectOptions={projects}
          financeCategories={financeCategories}
          initialData={editGoal}
        />
      )}

      {isDreamModalOpen && (
        <DreamMapModal
          open={true}
          onClose={closeDreamModal}
          onSubmit={handleDreamSubmit}
          onDelete={editingDream ? handleDeleteDream : undefined}
          goals={goals}
          initialData={editingDream}
        />
      )}

      {lightbox && (
        <Lightbox image={lightbox.url} title={lightbox.title} onClose={() => setLightbox(null)} />
      )}
    </div>
  )
}