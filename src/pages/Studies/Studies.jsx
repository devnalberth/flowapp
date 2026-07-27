import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import TopNav from '../../components/TopNav/TopNav.jsx'
import CreateStudyModal from '../../components/CreateStudyModal/CreateStudyModal.jsx'
import BlockModal from '../../components/BlockModal/BlockModal.jsx'
import BlockMeter from '../../components/BlockMeter/BlockMeter.jsx'
import FloatingCreateButton from '../../components/FloatingCreateButton/FloatingCreateButton.jsx'
import {
  Pencil, Trash2, ArrowLeft, ChevronDown, Plus, Calendar, CalendarClock, Check,
  Layers, Boxes, BookOpen, GraduationCap, Book, Compass, Star, TrendingUp, Sparkles, Link2, Zap,
} from 'lucide-react'
import {
  STUDY_TYPE_META, STUDY_STATUS_META, moduleProgress, blockCounts, ownCounts,
  childBlocks, hasChildren, isBlockDone, isFlowPriority,
  studyOverview, aggregateStudies, deriveStudyStatus,
} from '../../utils/studyMetrics'

import './Studies.css'

const TYPE_ICON = { COURSE: BookOpen, UNIVERSITY: GraduationCap, BOOK: Book, MENTORSHIP: Compass }

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
const fmtShort = (iso) => {
  if (!iso) return ''
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  if (!y) return ''
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]}`
}

const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`

// Destinos válidos ao mover um bloco. Só existem dois níveis, então:
// - sub-módulo pode ir para qualquer módulo, ou virar módulo;
// - módulo só pode virar sub-módulo se ainda não tiver filhos (senão criaria
//   um terceiro nível).
function buildParentOptions(study, block) {
  if (!study || !block) return null
  if (hasChildren(block)) return null

  const opts = [{ id: null, label: 'Nível de módulo (sem pai)' }]
  for (const mod of study.modules || []) {
    if (mod.id === block.id) continue
    opts.push({ id: mod.id, label: `Dentro de: ${mod.title}` })
  }
  return opts.length > 1 ? opts : null
}

/* ---------- Progress ring (conic-gradient) ---------- */
function ProgressRing({ value = 0, size = 64, stroke = 7, children }) {
  return (
    <div
      className="ringProg"
      style={{ width: size, height: size, background: `conic-gradient(#ff6a00 ${value * 3.6}deg, #ececf0 0deg)` }}
    >
      <div className="ringProg__hole" style={{ inset: stroke }}>
        {children ?? <span className="ringProg__val">{value}%</span>}
      </div>
    </div>
  )
}

/* ---------- Chips de agendamento de um bloco ---------- */
function ScheduleChips({ block }) {
  if (!block?.scheduledDate) return null
  return (
    <>
      <span className="stChipDate">
        <Calendar size={11} />
        {fmtShort(block.scheduledDate)}{block.scheduledTime ? ` · ${block.scheduledTime}` : ''}
      </span>
      <span className="stChipTask" title="Este bloco aparece na aba Tarefas">
        <CalendarClock size={11} /> nas Tarefas
      </span>
      {isFlowPriority(block.priority) && (
        <span className="stChipFlow" title={`Prioridade ${block.priority} — vai para o Flow`}>
          <Zap size={11} /> {block.priority}
        </span>
      )}
    </>
  )
}

/* ---------- Painel geral (topo do hub) ---------- */
function StudiesDashboard({ agg }) {
  const kpis = [
    { label: 'Estudos', value: agg.totalStudies, icon: Layers },
    { label: 'Em andamento', value: agg.inProgress, icon: TrendingUp },
    { label: 'Concluídos', value: agg.completed, icon: Check },
    { label: 'Blocos esta semana', value: agg.blocksThisWeek, icon: CalendarClock },
  ]
  const types = Object.entries(agg.byType)

  return (
    <section className="stDash">
      <div className="stDash__hero">
        <ProgressRing value={agg.overallProgress} size={108} stroke={11} />
        <div className="stDash__heroText">
          <span className="stDash__eyebrow">Painel de estudos</span>
          <h2>{agg.overallProgress}% da jornada concluída</h2>
          <p>
            {agg.completedLessons} de {agg.totalLessons} aulas registradas
            {agg.avgRating > 0 ? ` · nota média ${agg.avgRating}★` : ''}
          </p>
        </div>
      </div>

      <div className="stDash__kpis">
        {kpis.map((k) => {
          const Icon = k.icon
          return (
            <div className="stKpi" key={k.label}>
              <span className="stKpi__icon"><Icon size={16} /></span>
              <strong>{k.value}</strong>
              <span className="stKpi__label">{k.label}</span>
            </div>
          )
        })}
      </div>

      <div className="stDash__cols">
        <div className="stDash__panel">
          <h4>Próximos blocos</h4>
          {agg.upcoming.length === 0 ? (
            <p className="stDash__empty">Nenhum bloco agendado. Defina uma data em um módulo ou sub-módulo para vê-lo aqui e nas Tarefas.</p>
          ) : (
            <ul className="stUpcoming">
              {agg.upcoming.map((b) => (
                <li key={b.id}>
                  <span className="stUpcoming__date">{fmtShort(b.scheduledDate)}</span>
                  <span className="stUpcoming__title">{b.title}</span>
                  <span className="stUpcoming__study">{b.studyTitle}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="stDash__panel">
          <h4>Por tipo</h4>
          {types.length === 0 ? (
            <p className="stDash__empty">Sem estudos cadastrados.</p>
          ) : (
            <div className="stTypeBars">
              {types.map(([key, t]) => {
                const meta = STUDY_TYPE_META[key] || STUDY_TYPE_META.COURSE
                const p = t.total ? Math.round((t.done / t.total) * 100) : 0
                return (
                  <div className="stTypeBar" key={key}>
                    <div className="stTypeBar__top">
                      <span>{meta.icon} {meta.label}</span>
                      <span className="stTypeBar__count">{t.count}</span>
                    </div>
                    <div className="stTypeBar__track"><span style={{ width: `${p}%`, background: meta.color }} /></div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

/* ---------- Resumo do estudo aberto ---------- */
function StudyOverviewPanel({ overview }) {
  const kpis = [
    { label: 'Módulos', value: overview.modulesCount, icon: Layers },
    { label: 'Sub-módulos', value: overview.submodulesCount, icon: Boxes },
    { label: 'Blocos feitos', value: `${overview.doneBlocks}/${overview.blocksCount}`, icon: Check },
    { label: 'Agendados', value: overview.scheduledCount, icon: Calendar },
  ]
  return (
    <section className="stOverview">
      <div className="stOverview__ring">
        <ProgressRing value={overview.progress} size={120} stroke={12} />
        <span className="stOverview__ringLabel">{overview.completedLessons}/{overview.totalLessons} aulas</span>
      </div>
      <div className="stOverview__right">
        <div className="stOverview__kpis">
          {kpis.map((k) => {
            const Icon = k.icon
            return (
              <div className="stKpi stKpi--plain" key={k.label}>
                <span className="stKpi__icon"><Icon size={16} /></span>
                <strong>{k.value}</strong>
                <span className="stKpi__label">{k.label}</span>
              </div>
            )
          })}
        </div>
        <div className="stOverview__foot">
          {overview.avgRating > 0 && (
            <span className="stChip"><Star size={13} fill="#ff7a00" color="#ff7a00" /> {overview.avgRating} média</span>
          )}
          {overview.nextBlock ? (
            <span className="stChip stChip--accent">
              <CalendarClock size={13} /> Próximo: {overview.nextBlock.title} · {fmtShort(overview.nextBlock.scheduledDate)}
            </span>
          ) : (
            <span className="stChip stChip--muted">Nenhum bloco agendado</span>
          )}
        </div>
      </div>
    </section>
  )
}

export default function Studies({ user, onNavigate, onLogout }) {
  const {
    studies, addStudy, deleteStudy,
    addStudyModule, updateStudyModule, deleteStudyModule,
    setStudyBlockCounter, loading,
  } = useApp()

  const [activeStudyId, setActiveStudyId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [isModalOpen, setModalOpen] = useState(false)
  const [expanded, setExpanded] = useState({})
  const [blockModal, setBlockModal] = useState(null)

  const activeStudy = useMemo(() => studies.find((s) => s.id === activeStudyId) ?? null, [studies, activeStudyId])
  const agg = useMemo(() => aggregateStudies(studies), [studies])

  const filteredStudies = useMemo(() => studies.filter((study) => {
    const liveStatus = deriveStudyStatus(study)
    const statusOk = statusFilter === 'ALL' || liveStatus === statusFilter
    const typeOk = typeFilter === 'ALL' || study.type === typeFilter
    return statusOk && typeOk
  }), [studies, statusFilter, typeFilter])

  const toggle = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }))

  const handleCreateStudy = async (studyData) => {
    try {
      await addStudy(studyData)
      setModalOpen(false)
    } catch (error) {
      console.error('Error creating study:', error)
      alert('Não foi possível criar o estudo: ' + error.message)
    }
  }

  const handleBlockSubmit = async (data) => {
    if (!activeStudy) return
    if (blockModal?.mode === 'edit') {
      await updateStudyModule(blockModal.initial.id, data)
      return
    }
    const parentId = blockModal?.parentId || null
    await addStudyModule(activeStudy.id, { ...data, parentModuleId: parentId })
    if (parentId) setExpanded((p) => ({ ...p, [parentId]: true }))
  }

  const openCreate = (kind, parentId = null, parentLabel = null) =>
    setBlockModal({ mode: 'create', kind, parentId, parentLabel, schedulable: true })

  const openEdit = (block) =>
    setBlockModal({
      mode: 'edit',
      kind: block.parentModuleId ? 'submodule' : 'module',
      initial: block,
      parentOptions: buildParentOptions(activeStudy, block),
      schedulable: !hasChildren(block),
      scheduleMovedToChildren: hasChildren(block),
    })

  const handleDeleteStudy = async () => {
    if (!activeStudy) return
    if (!confirm(`Excluir "${activeStudy.title}"? Todos os módulos e sub-módulos serão perdidos.`)) return
    try {
      await deleteStudy(activeStudy.id)
      setActiveStudyId(null)
    } catch {
      alert('Não foi possível excluir o estudo.')
    }
  }

  const handleDeleteBlock = async (block) => {
    const kindLabel = block.parentModuleId ? 'sub-módulo' : 'módulo'
    const extra = hasChildren(block) ? ` e seus ${plural(childBlocks(block).length, 'sub-módulo', 'sub-módulos')}` : ''
    if (!confirm(`Excluir o ${kindLabel} "${block.title}"${extra}?`)) return
    try {
      await deleteStudyModule(block.id)
    } catch {
      alert('Não foi possível excluir.')
    }
  }

  const setCounter = (block, patch) => setStudyBlockCounter(block.id, patch)

  /* ---------- Detalhes de um bloco (medidor + agenda + materiais) ---------- */
  const renderBlockDetail = (block) => {
    const own = ownCounts(block)
    const links = Array.isArray(block.resources) ? block.resources.filter((r) => r.url) : []
    return (
      <div className="stBlockDetail">
        <BlockMeter
          id={`meter-${block.id}`}
          done={own.done}
          total={own.total}
          onChange={(done) => setCounter(block, { lessonsDone: done })}
          onSetTotal={(total) => setCounter(block, { lessonsTotal: total, lessonsDone: Math.min(own.done, total) })}
        />

        {block.description && <p className="stBlockDetail__desc">{block.description}</p>}

        {block.notes && (
          <details className="stNotes">
            <summary>Anotações</summary>
            <p>{block.notes}</p>
          </details>
        )}

        {links.length > 0 && (
          <ul className="stLinks">
            {links.map((r) => (
              <li key={r.id}>
                <a href={r.url} target="_blank" rel="noreferrer">
                  <Link2 size={12} /> {r.label || r.url}
                </a>
              </li>
            ))}
          </ul>
        )}

        <button type="button" className="stBlockDetail__edit" onClick={() => openEdit(block)}>
          {block.scheduledDate ? 'Editar bloco e agendamento' : 'Agendar bloco e mais opções'}
        </button>
      </div>
    )
  }

  /* ---------- Sub-módulo: linha pendurada no trilho do módulo ---------- */
  const renderSubmodule = (sub) => {
    const counts = ownCounts(sub)
    const progress = moduleProgress(sub)
    const isOpen = expanded[sub.id]
    const done = isBlockDone(sub)

    return (
      <article key={sub.id} className={`stBlock ${done ? 'is-done' : ''} ${isOpen ? 'is-open' : ''}`}>
        <div className="stBlock__row">
          <button
            type="button"
            className="stBlock__toggle"
            aria-expanded={isOpen}
            onClick={() => toggle(sub.id)}
          >
            <span className="stBlock__node" aria-hidden="true">{done ? <Check size={11} strokeWidth={3.4} /> : null}</span>
            <span className="stBlock__title">{sub.title}</span>
            <span className="stBlock__chips"><ScheduleChips block={sub} /></span>
            <span className="stBlock__stat">
              {counts.total > 0
                ? <span className="stBlock__count"><b>{counts.done}</b>/{counts.total}</span>
                : <span className="stBlock__count stBlock__count--empty">sem contador</span>}
              <span className="stBlock__pct">{progress}%</span>
            </span>
            <ChevronDown size={15} className={`stChevron ${isOpen ? 'is-open' : ''}`} />
          </button>

          <div className="stRowActions">
            <button className="stRowActions__btn" onClick={() => openEdit(sub)} aria-label={`Editar ${sub.title}`}><Pencil size={13} /></button>
            <button className="stRowActions__btn stRowActions__btn--danger" onClick={() => handleDeleteBlock(sub)} aria-label={`Excluir ${sub.title}`}><Trash2 size={13} /></button>
          </div>
        </div>

        {isOpen && <div className="stBlock__body">{renderBlockDetail(sub)}</div>}
      </article>
    )
  }

  /* ---------- Módulo ---------- */
  const renderModule = (mod, index, showIndex) => {
    const isOpen = expanded[mod.id]
    const progress = moduleProgress(mod)
    const counts = blockCounts(mod)
    const children = childBlocks(mod)
    const isSplit = children.length > 0

    return (
      <section key={mod.id} className={`stModule ${isOpen ? 'is-expanded' : ''}`}>
        <div className="stModule__head">
          <button type="button" className="stModule__toggle" aria-expanded={isOpen} onClick={() => toggle(mod.id)}>
            {showIndex && <span className="stModule__index">{String(index + 1).padStart(2, '0')}</span>}
            <ProgressRing value={progress} size={44} stroke={5} />
            <span className="stModule__meta">
              <span className="stModule__title">{mod.title}</span>
              <span className="stModule__stat">
                <span>
                  {isSplit
                    ? `${plural(children.length, 'sub-módulo', 'sub-módulos')} · ${counts.done}/${counts.total} aulas`
                    : counts.total > 0
                      ? `${counts.done}/${counts.total} aulas`
                      : 'sem contador definido'}
                </span>
                <span className="stModule__pct">{progress}%</span>
              </span>
              <span className="stModule__chips">{!isSplit && <ScheduleChips block={mod} />}</span>
            </span>
            <ChevronDown size={18} className={`stChevron ${isOpen ? 'is-open' : ''}`} />
          </button>

          <div className="stRowActions">
            <button className="stRowActions__btn" onClick={() => openEdit(mod)} aria-label={`Editar ${mod.title}`}><Pencil size={14} /></button>
            <button className="stRowActions__btn stRowActions__btn--danger" onClick={() => handleDeleteBlock(mod)} aria-label={`Excluir ${mod.title}`}><Trash2 size={14} /></button>
          </div>
        </div>

        {isOpen && (
          <div className="stModule__body">
            {mod.description && <p className="stNodeDesc">{mod.description}</p>}

            {isSplit ? (
              <div className="stTrack">
                {children.map(renderSubmodule)}
                <button type="button" className="stTrack__add" onClick={() => openCreate('submodule', mod.id, mod.title)}>
                  <Plus size={14} /> Novo sub-módulo
                </button>
              </div>
            ) : (
              <>
                {renderBlockDetail(mod)}
                <button type="button" className="stModule__split" onClick={() => openCreate('submodule', mod.id, mod.title)}>
                  <Boxes size={14} /> Dividir em sub-módulos
                </button>
              </>
            )}
          </div>
        )}
      </section>
    )
  }

  const statusFilters = [
    { id: 'ALL', label: 'Todos' },
    { id: 'IN_PROGRESS', label: 'Em andamento' },
    { id: 'NOT_STARTED', label: 'Não iniciados' },
    { id: 'COMPLETED', label: 'Concluídos' },
  ]
  const typeFilters = [
    { id: 'ALL', label: 'Todos' },
    { id: 'COURSE', label: 'Cursos' },
    { id: 'UNIVERSITY', label: 'Faculdade' },
    { id: 'MENTORSHIP', label: 'Mentorias' },
    { id: 'BOOK', label: 'Livros' },
  ]

  return (
    <div className="studiesPage">
      <TopNav user={user} onNavigate={onNavigate} active="Estudos" onLogout={onLogout} />

      <div className="studiesWrapper">
        {!activeStudy ? (
          <>
            <StudiesDashboard agg={agg} />

            <section className="stFilters">
              <div className="stFilters__group">
                {statusFilters.map((f) => (
                  <button key={f.id} className={statusFilter === f.id ? 'is-active' : ''} onClick={() => setStatusFilter(f.id)}>{f.label}</button>
                ))}
              </div>
              <div className="stFilters__group">
                {typeFilters.map((f) => (
                  <button key={f.id} className={typeFilter === f.id ? 'is-active' : ''} onClick={() => setTypeFilter(f.id)}>{f.label}</button>
                ))}
              </div>
            </section>

            <section className="stGrid">
              {loading ? (
                <p className="stGrid__empty">Carregando…</p>
              ) : filteredStudies.length === 0 ? (
                <div className="stGrid__empty">
                  <Sparkles size={28} />
                  <p>Nenhum estudo por aqui. Crie um curso, faculdade, mentoria ou livro para começar.</p>
                </div>
              ) : (
                filteredStudies.map((study, i) => {
                  const ov = studyOverview(study)
                  const meta = STUDY_TYPE_META[study.type] || STUDY_TYPE_META.COURSE
                  const Icon = TYPE_ICON[study.type] || BookOpen
                  const st = STUDY_STATUS_META[ov.status]
                  return (
                    <article
                      key={study.id}
                      className="stCard"
                      style={{ animationDelay: `${i * 50}ms` }}
                      onClick={() => setActiveStudyId(study.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setActiveStudyId(study.id) } }}
                    >
                      <div className="stCard__cover">
                        {study.coverUrl
                          ? <img src={study.coverUrl} alt="" />
                          : <div className="stCard__coverFallback" style={{ '--accent': meta.color }}><Icon size={30} /></div>}
                        <span className="stCard__type" style={{ '--accent': meta.color }}>{meta.icon} {meta.label}</span>
                      </div>
                      <div className="stCard__body">
                        <div className="stCard__top">
                          <h3>{study.title}</h3>
                          <ProgressRing value={ov.progress} size={44} stroke={5} />
                        </div>
                        {study.category && <span className="stCard__cat">{study.category}</span>}
                        <div className="stCard__meta">
                          <span><Boxes size={13} /> {ov.doneBlocks}/{ov.blocksCount} blocos</span>
                          {ov.nextBlock
                            ? <span className="stCard__next"><Calendar size={13} /> {fmtShort(ov.nextBlock.scheduledDate)}</span>
                            : <span className="stCard__status" style={{ color: st.color }}>{st.label}</span>}
                        </div>
                        <div className="stCard__bar"><span style={{ width: `${ov.progress}%` }} /></div>
                      </div>
                    </article>
                  )
                })
              )}
            </section>
          </>
        ) : (
          <div className="stDetail">
            <button className="stDetail__back" onClick={() => setActiveStudyId(null)}>
              <ArrowLeft size={18} /> Voltar para Estudos
            </button>

            {(() => {
              const ov = studyOverview(activeStudy)
              const meta = STUDY_TYPE_META[activeStudy.type] || STUDY_TYPE_META.COURSE
              const Icon = TYPE_ICON[activeStudy.type] || BookOpen
              const st = STUDY_STATUS_META[ov.status]
              const modules = activeStudy.modules || []
              return (
                <>
                  <header className="stDetail__header">
                    <div className="stDetail__cover" style={{ '--accent': meta.color }}>
                      {activeStudy.coverUrl ? <img src={activeStudy.coverUrl} alt="" /> : <Icon size={34} />}
                    </div>
                    <div className="stDetail__headText">
                      <div className="stDetail__chips">
                        <span className="stChip" style={{ '--accent': meta.color }}>{meta.icon} {meta.label}</span>
                        {activeStudy.category && <span className="stChip stChip--muted">{activeStudy.category}</span>}
                        <span className="stChip stChip--status" style={{ color: st.color, borderColor: st.color }}>{st.label}</span>
                      </div>
                      <h2>{activeStudy.title}</h2>
                      {activeStudy.url && <a className="stDetail__link" href={activeStudy.url} target="_blank" rel="noreferrer">Acessar plataforma →</a>}
                    </div>
                    <button className="stDetail__del" onClick={handleDeleteStudy} aria-label="Excluir estudo"><Trash2 size={16} /></button>
                  </header>

                  <StudyOverviewPanel overview={ov} />

                  <div className="stDetail__modulesHead">
                    <h3>Conteúdo</h3>
                    <button className="stDetail__addModule" onClick={() => openCreate('module')}>
                      <Plus size={15} /> Novo módulo
                    </button>
                  </div>

                  <div className="stModules">
                    {modules.length === 0 ? (
                      <div className="stModules__empty">
                        <Layers size={26} />
                        <p>Comece pelo primeiro módulo. Se ele for grande demais para uma sessão, divida em sub-módulos — é o sub-módulo que vai para as Tarefas com o pomodoro.</p>
                        <button onClick={() => openCreate('module')}><Plus size={15} /> Criar módulo</button>
                      </div>
                    ) : (
                      modules.map((mod, i) => renderModule(mod, i, modules.length > 1))
                    )}
                  </div>
                </>
              )
            })()}
          </div>
        )}

        {isModalOpen && (
          <CreateStudyModal onClose={() => setModalOpen(false)} onSubmit={handleCreateStudy} userId={user?.id} />
        )}

        {blockModal && (
          <BlockModal
            open
            mode={blockModal.mode}
            kind={blockModal.kind}
            initial={blockModal.initial}
            parentLabel={blockModal.parentLabel}
            parentOptions={blockModal.parentOptions}
            schedulable={blockModal.schedulable}
            scheduleMovedToChildren={blockModal.scheduleMovedToChildren}
            onClose={() => setBlockModal(null)}
            onSubmit={handleBlockSubmit}
          />
        )}

        {!activeStudy && (
          <FloatingCreateButton label="Novo estudo" caption="Criar estudo" ariaLabel="Criar novo estudo" onClick={() => setModalOpen(true)} />
        )}
      </div>
    </div>
  )
}
