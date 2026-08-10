import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import TopNav from '../../components/TopNav/TopNav.jsx'
import CreateStudyModal from '../../components/CreateStudyModal/CreateStudyModal.jsx'
import LessonModal from '../../components/LessonModal/LessonModal.jsx'
import ModuleModal from '../../components/ModuleModal/ModuleModal.jsx'
import FloatingCreateButton from '../../components/FloatingCreateButton/FloatingCreateButton.jsx'
import {
  Pencil, Trash2, ArrowLeft, ChevronDown, Plus, Calendar, CalendarClock, Check,
  Layers, Boxes, BookOpen, GraduationCap, Book, Compass, Star, ListChecks, TrendingUp, Sparkles, Link2, Play, Zap,
} from 'lucide-react'
import {
  STUDY_TYPE_META, STUDY_STATUS_META, moduleProgress,
  countProgressUnits, studyOverview, aggregateStudies, deriveStudyStatus,
  isEmptyLeaf, isNodeComplete,
} from '../../utils/studyMetrics'
import { compareMixedNodes } from '../../services/studyService'

import './Studies.css'

const TYPE_ICON = { COURSE: BookOpen, UNIVERSITY: GraduationCap, BOOK: Book, MENTORSHIP: Compass }

const MONTHS = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
// "3/8 aulas" só faz sentido quando as unidades contadas são aulas mesmo.
// Blocos sem aulas contam como itens, então o rótulo acompanha.
const unitLabel = ({ lessons = 0, blocks = 0 }) => {
  if (blocks === 0) return 'aulas'
  if (lessons === 0) return blocks === 1 ? 'item' : 'itens'
  return 'itens'
}

const fmtShort = (iso) => {
  if (!iso) return ''
  const [y, m, d] = String(iso).slice(0, 10).split('-').map(Number)
  if (!y) return ''
  return `${String(d).padStart(2, '0')} ${MONTHS[m - 1]}`
}

// Lista de destinos válidos ("mover para") ao editar uma matéria/sub-módulo.
// - Matéria pode ir para qualquer módulo OU sub-módulo do estudo.
// - Sub-módulo só pode ficar dentro de um módulo.
function buildParentOptions(study, kind, excludeId) {
  if (!study || kind === 'module') return null
  const opts = []
  for (const mod of study.modules || []) {
    if (mod.id !== excludeId) opts.push({ id: mod.id, label: `Módulo: ${mod.title}` })
    if (kind === 'subject') {
      for (const child of mod.submodules || []) {
        if (child.kind === 'submodule' && child.id !== excludeId) {
          opts.push({ id: child.id, label: `↳ ${mod.title} › ${child.title}` })
        }
      }
    }
  }
  return opts
}

/* ---------- Checkmark (opticamente centralizado) ---------- */
function CheckIcon({ size = 13 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ display: 'block' }}>
      <path d="M5 12.5l4 4 9.5-9" />
    </svg>
  )
}

/* ---------- Progress ring (conic-gradient) ---------- */
function ProgressRing({ value = 0, size = 64, stroke = 7, children }) {
  return (
    <div
      className="ringProg"
      style={{
        width: size, height: size,
        background: `conic-gradient(#ff6a00 ${value * 3.6}deg, #ececf0 0deg)`,
      }}
    >
      <div className="ringProg__hole" style={{ inset: stroke }}>
        {children ?? <span className="ringProg__val">{value}%</span>}
      </div>
    </div>
  )
}

/* ---------- General dashboard (top of hub) ---------- */
function StudiesDashboard({ agg }) {
  const kpis = [
    { label: 'Estudos', value: agg.totalStudies, icon: Layers },
    { label: 'Em andamento', value: agg.inProgress, icon: TrendingUp },
    { label: 'Concluídos', value: agg.completed, icon: Check },
    { label: 'Agendados na semana', value: agg.lessonsThisWeek, icon: CalendarClock },
  ]
  const types = Object.entries(agg.byType)

  return (
    <section className="stDash">
      <div className="stDash__hero">
        <ProgressRing value={agg.overallProgress} size={108} stroke={11} />
        <div className="stDash__heroText">
          <span className="stDash__eyebrow">Painel de estudos</span>
          <h2>{agg.overallProgress}% da jornada concluída</h2>
          <p>{agg.completedLessons} de {agg.totalLessons} concluídos{agg.avgRating > 0 ? ` · nota média ${agg.avgRating}★` : ''}</p>
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
          <h4>Próximos estudos</h4>
          {agg.upcoming.length === 0 ? (
            <p className="stDash__empty">Nada agendado. Defina uma data num módulo, sub-módulo ou aula para vê-lo aqui e na aba Tarefas.</p>
          ) : (
            <ul className="stUpcoming">
              {agg.upcoming.map((l) => (
                <li key={l.id}>
                  <span className="stUpcoming__date">{fmtShort(l.scheduledDate)}</span>
                  <span className="stUpcoming__title">{l.title}</span>
                  <span className="stUpcoming__study">{l.studyTitle}</span>
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
                const p = t.total ? Math.round((t.completed / t.total) * 100) : 0
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

/* ---------- Per-study overview (inside detail) ---------- */
function StudyOverviewPanel({ overview }) {
  const kpis = [
    { label: 'Módulos', value: overview.modulesCount, icon: Layers },
    { label: 'Matérias', value: overview.materiasCount, icon: BookOpen },
    { label: 'Concluídos', value: `${overview.completedLessons}/${overview.totalLessons}`, icon: ListChecks },
    { label: 'Agendados', value: overview.scheduledCount, icon: Calendar },
  ]
  return (
    <section className="stOverview">
      <div className="stOverview__ring">
        <ProgressRing value={overview.progress} size={120} stroke={12} />
        <span className="stOverview__ringLabel">
          {overview.completedLessons}/{overview.totalLessons} concluídos
        </span>
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
          {overview.submodulesCount > 0 && (
            <span className="stChip" style={{ '--accent': '#0ea5e9', background: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}>
              <Boxes size={13} /> {overview.submodulesCount} sub-módulo{overview.submodulesCount > 1 ? 's' : ''}
            </span>
          )}
          {overview.avgRating > 0 && (
            <span className="stChip"><Star size={13} fill="#ff7a00" color="#ff7a00" /> {overview.avgRating} média</span>
          )}
          {overview.nextLesson ? (
            <span className="stChip stChip--accent">
              <CalendarClock size={13} /> Próximo: {overview.nextLesson.title} · {fmtShort(overview.nextLesson.scheduledDate)}
            </span>
          ) : (
            <span className="stChip stChip--muted">Nada agendado</span>
          )}
        </div>
      </div>
    </section>
  )
}

export default function Studies({ user, onNavigate, onLogout }) {
  const {
    studies, addStudy, deleteStudy,
    addStudyModule, addStudyModulesBulk, updateStudyModule, deleteStudyModule, toggleStudyModule,
    addStudyLesson, updateStudyLesson, deleteStudyLesson,
    toggleStudyLesson, loading,
  } = useApp()
  const [activeStudyId, setActiveStudyId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [isModalOpen, setModalOpen] = useState(false)
  const [expandedModules, setExpandedModules] = useState({})
  const [expandedMaterias, setExpandedMaterias] = useState({})
  const [expandedSubmodules, setExpandedSubmodules] = useState({})
  const [selectedLesson, setSelectedLesson] = useState(null)
  // Modal de criar/editar módulo, sub-módulo ou matéria
  const [moduleModal, setModuleModal] = useState(null)

  const activeStudy = useMemo(() => studies.find((s) => s.id === activeStudyId) ?? null, [studies, activeStudyId])
  const agg = useMemo(() => aggregateStudies(studies), [studies])

  const filteredStudies = useMemo(() => {
    return studies.filter((study) => {
      const liveStatus = deriveStudyStatus(study)
      const statusOk = statusFilter === 'ALL' || liveStatus === statusFilter
      const typeOk = typeFilter === 'ALL' || study.type === typeFilter
      return statusOk && typeOk
    })
  }, [studies, statusFilter, typeFilter])

  // keep selected lesson in sync with reloaded studies
  const liveSelectedLesson = useMemo(() => {
    if (!selectedLesson) return null
    const overview = activeStudy
    const find = (mods) => {
      for (const m of mods || []) {
        const f = (m.lessons || []).find((l) => l.id === selectedLesson.id)
        if (f) return f
        const n = find(m.submodules || [])
        if (n) return n
      }
      return null
    }
    return find(overview?.modules) || selectedLesson
  }, [selectedLesson, activeStudy])

  const handleCreateStudy = async (studyData) => {
    try {
      await addStudy(studyData)
      setModalOpen(false)
    } catch (error) {
      console.error('Error creating study:', error)
      alert('Erro ao criar estudo: ' + error.message)
    }
  }

  const openModuleModal = (cfg) => setModuleModal(cfg)
  const closeModuleModal = () => setModuleModal(null)

  // Abre os containers pais para o item recém-criado ficar visível.
  const revealParent = (pid) => {
    if (!pid) return
    setExpandedModules((prev) => ({ ...prev, [pid]: true }))
    setExpandedSubmodules((prev) => ({ ...prev, [pid]: true }))
    setExpandedMaterias((prev) => ({ ...prev, [pid]: true }))
  }

  // Cadastro em lote: uma linha por item, tudo irmão dentro do mesmo pai.
  const handleBulkSubmit = async ({ kind, titles }) => {
    if (!activeStudy || !titles?.length) return
    const parentId = moduleModal?.parentId || null
    if (kind === 'lesson') {
      for (const title of titles) {
        await addStudyLesson(parentId, { title })
      }
    } else {
      await addStudyModulesBulk(activeStudy.id, titles.map((title) => ({ title, kind, parentModuleId: parentId })))
    }
    revealParent(parentId)
  }

  const handleModuleSubmit = async (data) => {
    if (!activeStudy) return
    if (moduleModal?.mode === 'edit') {
      await updateStudyModule(moduleModal.initial.id, {
        title: data.title,
        description: data.description,
        kind: data.kind,
        scheduledDate: data.scheduledDate,
        scheduledTime: data.scheduledTime,
        priority: data.priority,
        ...(data.parentModuleId !== undefined ? { parentModuleId: data.parentModuleId } : {}),
      })
    } else if (data.kind === 'lesson') {
      // Aula é criada dentro do container (módulo/sub-módulo/matéria) selecionado
      await addStudyLesson(moduleModal.parentId, {
        title: data.title,
        scheduledDate: data.scheduledDate || null,
        description: data.description,
      })
      const pid = moduleModal?.parentId
      if (pid) {
        setExpandedModules((prev) => ({ ...prev, [pid]: true }))
        setExpandedSubmodules((prev) => ({ ...prev, [pid]: true }))
        setExpandedMaterias((prev) => ({ ...prev, [pid]: true }))
      }
    } else {
      await addStudyModule(activeStudy.id, {
        title: data.title,
        description: data.description,
        kind: data.kind,
        scheduledDate: data.scheduledDate || null,
        scheduledTime: data.scheduledTime || null,
        priority: data.priority || null,
        parentModuleId: moduleModal?.parentId || null,
      })
      if (moduleModal?.parentId) {
        setExpandedModules((prev) => ({ ...prev, [moduleModal.parentId]: true }))
        setExpandedSubmodules((prev) => ({ ...prev, [moduleModal.parentId]: true }))
      }
    }
  }

  const handleToggleLesson = async (lessonId, current) => {
    try { await toggleStudyLesson(lessonId, !current) }
    catch (error) { alert('Erro ao atualizar aula: ' + error.message) }
  }

  const handleDeleteStudy = async () => {
    if (!activeStudy) return
    if (!confirm(`Excluir "${activeStudy.title}"? Todos os módulos e aulas serão perdidos.`)) return
    try { await deleteStudy(activeStudy.id); setActiveStudyId(null) }
    catch { alert('Erro ao excluir estudo') }
  }

  const editModule = (node, kind) =>
    openModuleModal({
      mode: 'edit',
      allowedKinds: [kind],
      initial: {
        id: node.id, title: node.title, description: node.description, kind,
        parentId: node.parentModuleId || '',
        scheduledDate: node.scheduledDate || '',
        scheduledTime: node.scheduledTime || '',
        priority: node.priority || 'Normal',
      },
      parentOptions: buildParentOptions(activeStudy, kind, node.id),
    })

  const handleDeleteModule = async (id, title, kindLabel = 'módulo') => {
    if (!confirm(`Excluir ${kindLabel} "${title}"? Todo o conteúdo dentro dele será perdido.`)) return
    try { await deleteStudyModule(id) } catch { alert('Erro ao excluir') }
  }

  const handleDeleteLesson = async (id, title) => {
    if (!confirm(`Excluir aula "${title}"?`)) return
    try { await deleteStudyLesson(id) } catch { alert('Erro ao excluir aula') }
  }

  const handleSaveLesson = async (lessonId, updates) => { await updateStudyLesson(lessonId, updates) }

  /* ---------- Lesson row ---------- */
  const renderLessonRow = (lesson) => {
    const ratingStars = lesson.rating > 0 ? '★'.repeat(lesson.rating) : ''
    const resCount = Array.isArray(lesson.resources) ? lesson.resources.length : 0
    return (
      <div key={lesson.id} className={`stLesson ${lesson.isCompleted ? 'is-done' : ''}`}>
        <button
          type="button"
          className={`stLesson__check ${lesson.isCompleted ? 'is-done' : ''}`}
          onClick={() => handleToggleLesson(lesson.id, lesson.isCompleted)}
          aria-label={lesson.isCompleted ? 'Desmarcar' : 'Concluir'}
        >
          {lesson.isCompleted ? <CheckIcon size={13} /> : null}
        </button>

        <button type="button" className="stLesson__title" onClick={() => setSelectedLesson(lesson)}>
          <span className="stLesson__name">{lesson.title}</span>
          <span className="stLesson__badges">
            {lesson.scheduledDate && (
              <span className="stLesson__badge stLesson__badge--date">
                <Calendar size={11} /> {fmtShort(lesson.scheduledDate)}{lesson.scheduledTime ? ` · ${lesson.scheduledTime}` : ''}
              </span>
            )}
            {lesson.scheduledDate && (lesson.priority === 'Alta' || lesson.priority === 'Urgente') && (
              <span className="stLesson__badge stLesson__badge--flow" title={`Prioridade ${lesson.priority} — no Flow`}>
                ⚡ {lesson.priority}
              </span>
            )}
            {lesson.scheduledDate && (
              <span className="stLesson__badge stLesson__badge--task" title="Esta aula aparece na aba Tarefas">
                <CalendarClock size={11} /> nas Tarefas
              </span>
            )}
            {resCount > 0 && (
              <span className="stLesson__badge"><Link2 size={11} /> {resCount}</span>
            )}
            {ratingStars && <span className="stLesson__rating">{ratingStars}</span>}
          </span>
        </button>

        <div className="stLesson__actions">
          <button className="stLesson__act" onClick={() => setSelectedLesson(lesson)} title="Detalhes / revisão"><Pencil size={13} /></button>
          <button className="stLesson__act stLesson__act--danger" onClick={() => handleDeleteLesson(lesson.id, lesson.title)} title="Excluir"><Trash2 size={13} /></button>
        </div>
      </div>
    )
  }

  /* ---------- Controles compartilhados de um bloco ---------- */
  // Vale para módulo, sub-módulo e matéria. O checkbox só aparece quando o bloco
  // está vazio: é aí que ele deixa de ser um container e vira a própria unidade
  // de progresso, para quem não quer cadastrar aula por aula.
  const renderBlockCheck = (node) => {
    if (!isEmptyLeaf(node)) return null
    const done = Boolean(node.isCompleted)
    return (
      <button
        type="button"
        className={`stBlockCheck ${done ? 'is-done' : ''}`}
        onClick={(e) => { e.stopPropagation(); toggleStudyModule(node.id, !done) }}
        aria-pressed={done}
        aria-label={done ? `Reabrir ${node.title}` : `Concluir ${node.title}`}
        title={done ? 'Reabrir' : 'Concluir'}
      >
        {done ? <CheckIcon size={12} /> : null}
      </button>
    )
  }

  const renderBlockChips = (node) => {
    if (!node.scheduledDate) return null
    return (
      <span className="stBlockChips">
        <span className="stBlockChip stBlockChip--date">
          <Calendar size={10} /> {fmtShort(node.scheduledDate)}{node.scheduledTime ? ` · ${node.scheduledTime}` : ''}
        </span>
        <span className="stBlockChip stBlockChip--task" title="Aparece na aba Tarefas">
          <CalendarClock size={10} /> nas Tarefas
        </span>
        {(node.priority === 'Alta' || node.priority === 'Urgente') && (
          <span className="stBlockChip stBlockChip--flow" title={`Prioridade ${node.priority}`}>
            <Zap size={10} /> {node.priority}
          </span>
        )}
      </span>
    )
  }

  // Leva direto para o pomodoro com este bloco em foco, sem precisar agendar
  // nem criar tarefa. O tempo entra na métrica de Estudos.
  const renderStudyNow = (node) => (
    <button
      type="button"
      className="stStudyNow"
      onClick={(e) => {
        e.stopPropagation()
        onNavigate?.('Tarefas', {
          initialFilter: 'flow',
          studyTarget: { id: node.id, title: node.title, studyTitle: activeStudy?.title || null },
        })
      }}
      title="Estudar agora com o pomodoro"
    >
      <Play size={12} /> Estudar
    </button>
  )

  /* ---------- Matéria (kind=subject) ---------- */
  const renderMateria = (materia) => {
    const progress = moduleProgress(materia)
    const isOpen = expandedMaterias[materia.id]
    const counts = countProgressUnits([materia])
    return (
      <article key={materia.id} className={`stMateria ${isNodeComplete(materia) ? 'is-done' : ''}`}>
        <header className="stMateria__head">
          {renderBlockCheck(materia)}
          <button type="button" className="stMateria__toggle" onClick={() => setExpandedMaterias((p) => ({ ...p, [materia.id]: !p[materia.id] }))}>
            <span className="stMateria__tag">Matéria</span>
            <h4>{materia.title}</h4>
            {renderBlockChips(materia)}
            <span className="stMateria__stat">{counts.completed}/{counts.total} · {progress}%</span>
            <ChevronDown size={15} className={`stChevron ${isOpen ? 'is-open' : ''}`} />
          </button>
          <div className="stRowActions">
            {renderStudyNow(materia)}
            <button className="stRowActions__btn" onClick={() => editModule(materia, 'subject')} title="Editar"><Pencil size={13} /></button>
            <button className="stRowActions__btn stRowActions__btn--danger" onClick={() => handleDeleteModule(materia.id, materia.title, 'matéria')} title="Excluir"><Trash2 size={13} /></button>
          </div>
        </header>
        <div className={`stCollapse ${isOpen ? 'is-open' : ''}`}>
          <div className="stMateria__body">
            <div className="stMateria__bar"><span style={{ width: `${progress}%` }} /></div>
            {materia.description && <p className="stNodeDesc">{materia.description}</p>}
            <div className="stLessons">
              {materia.lessons.length > 0 ? materia.lessons.map(renderLessonRow) : <p className="stEmpty">Nenhuma aula nesta matéria.</p>}
            </div>
            <button type="button" className="stAddMateria" onClick={() => openModuleModal({ mode: 'create', allowedKinds: ['lesson'], parentId: materia.id, parentLabel: materia.title })}>
              <Plus size={14} /> Adicionar aulas
            </button>
          </div>
        </div>
      </article>
    )
  }

  /* ---------- Despacha um nó da lista intercalada ---------- */
  // Aulas vêm de study_lessons e sub-módulos/matérias de study_modules. Só os
  // segundos passam por normalizeModule, que sempre cria o array `submodules`.
  const renderMixedNode = (node) => {
    if (!Array.isArray(node.submodules)) return renderLessonRow(node)
    return node.kind === 'submodule' ? renderSubmodule(node) : renderMateria(node)
  }

  /* ---------- Sub-módulo (kind=submodule) ---------- */
  const renderSubmodule = (sub) => {
    const progress = moduleProgress(sub)
    const isOpen = expandedSubmodules[sub.id]
    const counts = countProgressUnits([sub])
    const directLessons = Array.isArray(sub.lessons) ? sub.lessons : []
    const materias = (sub.submodules || []).filter((c) => c.kind !== 'submodule')
    // Aulas e matérias na ordem em que foram criadas, intercaladas.
    const mixed = [...directLessons, ...materias].sort(compareMixedNodes)
    return (
      <article key={sub.id} className={`stSub ${isNodeComplete(sub) ? 'is-done' : ''}`}>
        <header className="stSub__head">
          {renderBlockCheck(sub)}
          <button type="button" className="stSub__toggle" onClick={() => setExpandedSubmodules((p) => ({ ...p, [sub.id]: !p[sub.id] }))}>
            <span className="stSub__tag"><Boxes size={12} /> Sub-módulo</span>
            <h4>{sub.title}</h4>
            {renderBlockChips(sub)}
            <span className="stSub__stat">{counts.completed}/{counts.total} · {progress}%</span>
            <ChevronDown size={15} className={`stChevron ${isOpen ? 'is-open' : ''}`} />
          </button>
          <div className="stRowActions">
            {renderStudyNow(sub)}
            <button className="stRowActions__btn" onClick={() => editModule(sub, 'submodule')} title="Editar"><Pencil size={13} /></button>
            <button className="stRowActions__btn stRowActions__btn--danger" onClick={() => handleDeleteModule(sub.id, sub.title, 'sub-módulo')} title="Excluir"><Trash2 size={13} /></button>
          </div>
        </header>
        <div className={`stCollapse ${isOpen ? 'is-open' : ''}`}>
          <div className="stSub__body">
            <div className="stSub__bar"><span style={{ width: `${progress}%` }} /></div>
            {sub.description && <p className="stNodeDesc">{sub.description}</p>}
            {mixed.length > 0 && <div className="stMixed">{mixed.map(renderMixedNode)}</div>}
            <button type="button" className="stAddMateria" onClick={() => openModuleModal({ mode: 'create', allowedKinds: ['lesson'], parentId: sub.id, parentLabel: sub.title })}>
              <Plus size={14} /> Adicionar aulas
            </button>
          </div>
        </div>
      </article>
    )
  }

  /* ---------- Módulo (card; expande full-width) ---------- */
  const renderModule = (mod, index) => {
    const isOpen = expandedModules[mod.id]
    const progress = moduleProgress(mod)
    const counts = countProgressUnits([mod])
    const directLessons = Array.isArray(mod.lessons) ? mod.lessons : []
    const children = mod.submodules || []
    // Aulas soltas, sub-módulos e matérias numa lista só, na ordem em que foram
    // criados. Renderizar em containers separados fazia toda aula subir para o
    // topo, independentemente de quando foi cadastrada.
    const mixed = [...directLessons, ...children].sort(compareMixedNodes)
    return (
      <section key={mod.id} className={`stModule ${isOpen ? 'is-expanded' : ''}`}>
        <header className="stModule__head" onClick={() => setExpandedModules((p) => ({ ...p, [mod.id]: !p[mod.id] }))}>
          <div className="stModule__lead">
            <div className="stModule__index">{String(index + 1).padStart(2, '0')}</div>
            <div className="stModule__ring"><ProgressRing value={progress} size={44} stroke={5} /></div>
          </div>

          <div className="stModule__meta">
            <span className="stModule__eyebrow">Módulo</span>
            <h3>{mod.title}</h3>
            <span className="stModule__stat">{counts.total > 0 ? `${counts.completed}/${counts.total} ${unitLabel(counts)} · ` : ''}{progress}%</span>
            {renderBlockChips(mod)}
          </div>

          <div className="stModule__tail">
            <div className="stRowActions" onClick={(e) => e.stopPropagation()}>
              {renderBlockCheck(mod)}
              {renderStudyNow(mod)}
              <button className="stRowActions__btn" onClick={() => editModule(mod, 'module')} title="Editar"><Pencil size={14} /></button>
              <button className="stRowActions__btn stRowActions__btn--danger" onClick={() => handleDeleteModule(mod.id, mod.title)} title="Excluir"><Trash2 size={14} /></button>
            </div>
            <ChevronDown size={18} className={`stChevron stModule__chevron ${isOpen ? 'is-open' : ''}`} />
          </div>
        </header>

        {isOpen && (
          <div className="stModule__body">
            {mod.description && <p className="stNodeDesc">{mod.description}</p>}

            {mixed.length > 0 && <div className="stMixed">{mixed.map(renderMixedNode)}</div>}

            <button type="button" className="stAddMateria stAddMateria--module" onClick={() => openModuleModal({ mode: 'create', allowedKinds: ['submodule', 'lesson'], parentId: mod.id, parentLabel: mod.title })}>
              <Plus size={14} /> Adicionar conteúdo
            </button>
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
                    >
                      <div className="stCard__cover">
                        {study.coverUrl
                          ? <img src={study.coverUrl} alt={study.title} />
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
                          <span><ListChecks size={13} /> {ov.completedLessons}/{ov.totalLessons} concluídos</span>
                          {ov.nextLesson
                            ? <span className="stCard__next"><Calendar size={13} /> {fmtShort(ov.nextLesson.scheduledDate)}</span>
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
              return (
                <>
                  <header className="stDetail__header">
                    <div className="stDetail__cover" style={{ '--accent': meta.color }}>
                      {activeStudy.coverUrl ? <img src={activeStudy.coverUrl} alt={activeStudy.title} /> : <Icon size={34} />}
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
                    <button className="stDetail__del" onClick={handleDeleteStudy} title="Excluir estudo"><Trash2 size={16} /></button>
                  </header>

                  <StudyOverviewPanel overview={ov} />

                  <div className="stDetail__modulesHead">
                    <h3>Conteúdo</h3>
                    <button className="stDetail__addModule" onClick={() => openModuleModal({ mode: 'create', allowedKinds: ['module'] })}>
                      <Plus size={15} /> Novo módulo
                    </button>
                  </div>

                  <div className="stModules">
                    {activeStudy.modules.length === 0 ? (
                      <div className="stModules__empty">
                        <Layers size={26} />
                        <p>Comece criando o primeiro módulo. Dentro dele você adiciona sub-módulos e aulas — e pode agendar qualquer um deles para a aba Tarefas.</p>
                        <button onClick={() => openModuleModal({ mode: 'create', allowedKinds: ['module'] })}><Plus size={15} /> Criar módulo</button>
                      </div>
                    ) : (
                      activeStudy.modules.map((mod, i) => renderModule(mod, i))
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

        {selectedLesson && (
          <LessonModal
            lesson={liveSelectedLesson}
            onClose={() => setSelectedLesson(null)}
            onSave={handleSaveLesson}
            onToggleComplete={(id, value) => toggleStudyLesson(id, value)}
          />
        )}

        {moduleModal && (
          <ModuleModal
            open
            mode={moduleModal.mode}
            allowedKinds={moduleModal.allowedKinds}
            initial={moduleModal.initial}
            parentLabel={moduleModal.parentLabel}
            parentOptions={moduleModal.parentOptions}
            onClose={closeModuleModal}
            onSubmit={handleModuleSubmit}
            onBulkSubmit={handleBulkSubmit}
          />
        )}

        {!activeStudy && (
          <FloatingCreateButton label="Novo estudo" caption="Criar estudo" ariaLabel="Criar novo estudo" onClick={() => setModalOpen(true)} />
        )}
      </div>
    </div>
  )
}
