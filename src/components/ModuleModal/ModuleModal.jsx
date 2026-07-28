import { useEffect, useRef, useState } from 'react'
import { X, Layers, Boxes, BookOpen, PlayCircle, ChevronRight, Calendar, CalendarClock } from 'lucide-react'
import './ModuleModal.css'

export const KIND_META = {
  module: { label: 'Módulo', icon: Layers, color: '#ff4800', desc: 'Grande bloco do curso' },
  submodule: { label: 'Sub-módulo', icon: Boxes, color: '#0ea5e9', desc: 'Divisão dentro de um módulo' },
  subject: { label: 'Matéria', icon: BookOpen, color: '#7c5cff', desc: 'Disciplina que agrupa aulas' },
  lesson: { label: 'Aula', icon: PlayCircle, color: '#16a34a', desc: 'Conteúdo a estudar (vira tarefa se tiver data)' },
}

const FLOW = ['module', 'submodule', 'subject']

const LESSON_PRIORITIES = [
  { id: 'Baixa', label: 'Baixa', color: '#10b981' },
  { id: 'Normal', label: 'Normal', color: '#6b7280' },
  { id: 'Alta', label: 'Alta', color: '#f59e0b' },
  { id: 'Urgente', label: 'Urgente', color: '#ef4444' },
]

export default function ModuleModal({
  open,
  onClose,
  onSubmit,
  mode = 'create',
  allowedKinds = ['module'],
  initial = null,
  parentLabel = null,
  parentOptions = null,
}) {
  const [kind, setKind] = useState(allowedKinds[0])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [priority, setPriority] = useState('Normal')
  const [saving, setSaving] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    if (open) {
      setKind(initial?.kind || allowedKinds[0])
      setTitle(initial?.title || '')
      setDescription(initial?.description || '')
      setParentId(initial?.parentId || '')
      setScheduledDate(initial?.scheduledDate || '')
      setScheduledTime(initial?.scheduledTime || '')
      setPriority(initial?.priority || 'Normal')
      requestAnimationFrame(() => titleRef.current?.focus())
      document.body.style.overflow = 'hidden'
    }
    return () => { document.body.style.overflow = '' }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const meta = KIND_META[kind] || KIND_META.module
  const showPicker = allowedKinds.length > 1
  const showMove = mode === 'edit' && Array.isArray(parentOptions) && parentOptions.length > 0
  const isLesson = kind === 'lesson'
  const fem = kind === 'subject' || kind === 'lesson'
  const artNovo = fem ? 'Nova' : 'Novo'
  const artDo = fem ? 'da' : 'do'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSubmit?.({
        title: title.trim(),
        description: description.trim() || null,
        kind,
        ...(isLesson ? { scheduledDate: scheduledDate || null, scheduledTime: scheduledTime || null, priority } : {}),
        ...(showMove ? { parentModuleId: parentId || null } : {}),
      })
      onClose?.()
    } catch (err) {
      console.error('Erro ao salvar módulo:', err)
      alert('Erro ao salvar: ' + (err?.message || ''))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="moduleModal" role="dialog" aria-modal="true">
      <div className="moduleModal__backdrop" onClick={onClose} />
      <form className="moduleModal__panel" onSubmit={handleSubmit} style={{ '--accent': meta.color }}>
        <header className="moduleModal__header">
          <div>
            <span className="moduleModal__eyebrow">Estrutura do curso</span>
            <h3>{mode === 'edit' ? `Editar ${meta.label.toLowerCase()}` : showPicker ? 'Adicionar conteúdo' : `${artNovo} ${meta.label.toLowerCase()}`}</h3>
          </div>
          <button type="button" className="moduleModal__close" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </header>

        {/* Legenda do fluxo */}
        <div className="moduleModal__flow">
          {FLOW.map((k, i) => {
            const km = KIND_META[k]
            const Icon = km.icon
            const active = k === kind
            return (
              <span key={k} className="moduleModal__flowItem">
                <span className={`moduleModal__flowChip ${active ? 'is-active' : ''}`} style={active ? { '--c': km.color } : undefined}>
                  <Icon size={13} /> {km.label}{k === 'submodule' ? ' (opc.)' : ''}
                </span>
                {i < FLOW.length - 1 && <ChevronRight size={13} className="moduleModal__flowArrow" />}
              </span>
            )
          })}
          <span className="moduleModal__flowItem">
            <ChevronRight size={13} className="moduleModal__flowArrow" />
            <span className={`moduleModal__flowChip ${isLesson ? 'is-active' : ''}`} style={isLesson ? { '--c': KIND_META.lesson.color } : undefined}>
              <PlayCircle size={13} /> Aula
            </span>
          </span>
        </div>

        {parentLabel && (
          <p className="moduleModal__parent">Dentro de: <strong>{parentLabel}</strong></p>
        )}

        {/* Seletor de tipo */}
        {showPicker && (
          <div className="moduleModal__field">
            <label>O que você quer adicionar?</label>
            <div className="moduleModal__types">
              {allowedKinds.map((k) => {
                const km = KIND_META[k]
                const Icon = km.icon
                return (
                  <button
                    type="button"
                    key={k}
                    className={`moduleModal__type ${kind === k ? 'is-active' : ''}`}
                    style={{ '--c': km.color }}
                    onClick={() => setKind(k)}
                  >
                    <span className="moduleModal__typeIcon"><Icon size={18} /></span>
                    <span className="moduleModal__typeLabel">{km.label}</span>
                    <span className="moduleModal__typeDesc">{km.desc}</span>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        <div className="moduleModal__field">
          <label>Nome {artDo} {meta.label.toLowerCase()}</label>
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={kind === 'module' ? 'Ex: Fundamentos do Front-end' : kind === 'submodule' ? 'Ex: HTML & CSS' : kind === 'lesson' ? 'Ex: Introdução ao Flexbox' : 'Ex: Flexbox e Grid'}
            required
          />
        </div>

        {isLesson && (
          <>
            <div className="moduleModal__field">
              <label><Calendar size={14} /> Agendar aula <span className="moduleModal__opt">(opcional)</span></label>
              <div className="moduleModal__row2">
                <input className="moduleModal__select" type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                <input className="moduleModal__select" type="time" value={scheduledTime} onChange={(e) => setScheduledTime(e.target.value)} disabled={!scheduledDate} title={scheduledDate ? 'Horário' : 'Defina a data primeiro'} />
              </div>
              <p className="moduleModal__moveHint"><CalendarClock size={12} /> Com data, a aula aparece automaticamente na aba Tarefas.</p>
            </div>

            <div className="moduleModal__field">
              <label>Prioridade</label>
              <div className="moduleModal__prios">
                {LESSON_PRIORITIES.map((p) => (
                  <button
                    type="button"
                    key={p.id}
                    className={`moduleModal__prio ${priority === p.id ? 'is-active' : ''}`}
                    style={{ '--pc': p.color }}
                    onClick={() => setPriority(p.id)}
                  >
                    {p.label}
                    {(p.id === 'Alta' || p.id === 'Urgente') && <span className="moduleModal__flowTag">Flow</span>}
                  </button>
                ))}
              </div>
              {(priority === 'Alta' || priority === 'Urgente') && (
                <p className="moduleModal__moveHint" style={{ color: '#ef4444' }}>⚡ Vai direto para o Flow na aba Tarefas.</p>
              )}
            </div>
          </>
        )}

        {showMove && (
          <div className="moduleModal__field">
            <label>Mover para</label>
            <select className="moduleModal__select" value={parentId} onChange={(e) => setParentId(e.target.value)}>
              {parentOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>{opt.label}</option>
              ))}
            </select>
            <p className="moduleModal__moveHint">Reorganize o fluxo movendo {meta.label.toLowerCase()} para outro módulo ou sub-módulo.</p>
          </div>
        )}

        <div className="moduleModal__field">
          <label>Descrição <span className="moduleModal__opt">(opcional)</span></label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Objetivo, ementa, pré-requisitos..."
            rows={2}
          />
        </div>

        <footer className="moduleModal__footer">
          <button type="button" className="moduleModal__btn moduleModal__btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="moduleModal__btn moduleModal__btn--primary" disabled={saving || !title.trim()}>
            {saving ? 'Salvando...' : mode === 'edit' ? 'Salvar' : `Criar ${meta.label.toLowerCase()}`}
          </button>
        </footer>
      </form>
    </div>
  )
}
