import { useEffect, useRef, useState } from 'react'
import { X, Layers, Boxes, Calendar, CalendarClock, Link2, Trash2, Plus, Star } from 'lucide-react'
import { BLOCK_PRIORITIES, isFlowPriority } from '../../utils/studyMetrics'
import './BlockModal.css'

export const KIND_META = {
  module: { label: 'Módulo', icon: Layers, desc: 'Grande bloco do curso. Pode ser dividido em sub-módulos.' },
  submodule: { label: 'Sub-módulo', icon: Boxes, desc: 'A divisão que você estuda de uma vez.' },
}

const emptyResource = () => ({ id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, label: '', url: '' })

/**
 * Cria e edita um bloco de estudo — módulo ou sub-módulo.
 *
 * O agendamento só aparece quando o bloco é agendável: um módulo perde o
 * agendamento assim que ganha sub-módulos, porque quem passa a ir para as
 * Tarefas são eles.
 */
export default function BlockModal({
  open,
  onClose,
  onSubmit,
  mode = 'create',
  kind = 'module',
  initial = null,
  parentLabel = null,
  parentOptions = null,
  schedulable = true,
  scheduleMovedToChildren = false,
}) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [lessonsTotal, setLessonsTotal] = useState('')
  const [parentId, setParentId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [priority, setPriority] = useState('Normal')
  const [notes, setNotes] = useState('')
  const [rating, setRating] = useState(0)
  const [resources, setResources] = useState([])
  const [saving, setSaving] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    setTitle(initial?.title || '')
    setDescription(initial?.description || '')
    setLessonsTotal(initial?.lessonsTotal ? String(initial.lessonsTotal) : '')
    setParentId(initial?.parentModuleId || '')
    setScheduledDate(initial?.scheduledDate || '')
    setScheduledTime(initial?.scheduledTime || '')
    setPriority(initial?.priority || 'Normal')
    setNotes(initial?.notes || '')
    setRating(Number(initial?.rating) || 0)
    setResources(Array.isArray(initial?.resources) ? initial.resources : [])
    requestAnimationFrame(() => titleRef.current?.focus())
    document.body.style.overflow = 'hidden'
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
  const Icon = meta.icon
  const showMove = mode === 'edit' && Array.isArray(parentOptions) && parentOptions.length > 0

  const updateResource = (id, patch) =>
    setResources((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSubmit?.({
        title: title.trim(),
        description: description.trim() || null,
        lessonsTotal: Math.max(0, Math.floor(Number(lessonsTotal) || 0)),
        notes: notes.trim() || null,
        rating: rating || null,
        resources: resources.filter((r) => r.url?.trim() || r.label?.trim()),
        ...(schedulable
          ? {
              scheduledDate: scheduledDate || null,
              scheduledTime: scheduledDate ? (scheduledTime || null) : null,
              priority: scheduledDate ? priority : null,
            }
          : {}),
        ...(showMove ? { parentModuleId: parentId || null } : {}),
      })
      onClose?.()
    } catch (err) {
      console.error('Erro ao salvar bloco:', err)
      alert('Não foi possível salvar: ' + (err?.message || 'erro desconhecido'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="blockModal" role="dialog" aria-modal="true" aria-label={`${mode === 'edit' ? 'Editar' : 'Novo'} ${meta.label.toLowerCase()}`}>
      <div className="blockModal__backdrop" onClick={onClose} />
      <form className="blockModal__panel" onSubmit={handleSubmit}>
        <header className="blockModal__header">
          <span className="blockModal__badge"><Icon size={15} /> {meta.label}</span>
          <h3>{mode === 'edit' ? `Editar ${meta.label.toLowerCase()}` : `Novo ${meta.label.toLowerCase()}`}</h3>
          <p>{parentLabel ? <>Dentro de <strong>{parentLabel}</strong></> : meta.desc}</p>
          <button type="button" className="blockModal__close" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </header>

        <div className="blockModal__body">
          <div className="blockModal__field">
            <label htmlFor="block-title">Nome {kind === 'module' ? 'do módulo' : 'do sub-módulo'}</label>
            <input
              id="block-title"
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={kind === 'module' ? 'Ex: Fundamentos do Front-end' : 'Ex: JavaScript Básico'}
              required
            />
          </div>

          <div className="blockModal__field">
            <label htmlFor="block-total">Aulas neste bloco <span className="blockModal__opt">(opcional)</span></label>
            <input
              id="block-total"
              type="number"
              min="0"
              inputMode="numeric"
              className="blockModal__num"
              value={lessonsTotal}
              onChange={(e) => setLessonsTotal(e.target.value)}
              placeholder="0"
            />
            <p className="blockModal__hint">
              {kind === 'module'
                ? 'Vira o medidor de progresso do módulo. Ao adicionar sub-módulos, o progresso passa a ser a soma deles.'
                : 'Vira o medidor: você marca quantas viu ao fim de cada sessão.'}
            </p>
          </div>

          {schedulable ? (
            <fieldset className="blockModal__field blockModal__field--group">
              <legend><Calendar size={14} /> Agendar bloco <span className="blockModal__opt">(opcional)</span></legend>
              <div className="blockModal__row2">
                <input
                  type="date"
                  aria-label="Data do estudo"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                />
                <input
                  type="time"
                  aria-label="Horário do estudo"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  disabled={!scheduledDate}
                  title={scheduledDate ? 'Horário' : 'Defina a data primeiro'}
                />
              </div>
              <p className="blockModal__hint"><CalendarClock size={12} /> Com data, o bloco aparece na aba Tarefas com o pomodoro.</p>

              {scheduledDate && (
                <div className="blockModal__prios" role="group" aria-label="Prioridade">
                  {BLOCK_PRIORITIES.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      className={`blockModal__prio ${priority === p.id ? 'is-active' : ''}`}
                      style={{ '--pc': p.color }}
                      aria-pressed={priority === p.id}
                      onClick={() => setPriority(p.id)}
                    >
                      {p.label}
                      {isFlowPriority(p.id) && <span className="blockModal__flowTag">Flow</span>}
                    </button>
                  ))}
                </div>
              )}
            </fieldset>
          ) : (
            <p className="blockModal__notice">
              {scheduleMovedToChildren
                ? 'Este módulo tem sub-módulos, então quem vai para as Tarefas são eles. Agende cada sub-módulo separadamente.'
                : 'O agendamento fica no bloco que você estuda de uma vez.'}
            </p>
          )}

          {showMove && (
            <div className="blockModal__field">
              <label htmlFor="block-parent">Mover para</label>
              <select id="block-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
                {parentOptions.map((opt) => (
                  <option key={opt.id ?? 'root'} value={opt.id ?? ''}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="blockModal__field">
            <label htmlFor="block-desc">Descrição <span className="blockModal__opt">(opcional)</span></label>
            <textarea
              id="block-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Objetivo, ementa, pré-requisitos..."
              rows={2}
            />
          </div>

          <div className="blockModal__field">
            <label htmlFor="block-notes">Anotações <span className="blockModal__opt">(opcional)</span></label>
            <textarea
              id="block-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="O que ficou de aprendizado, dúvidas, pontos para revisar..."
              rows={3}
            />
          </div>

          <div className="blockModal__field">
            <span className="blockModal__label">Como foi este bloco?</span>
            <div className="blockModal__stars" role="group" aria-label="Avaliação do bloco">
              {[1, 2, 3, 4, 5].map((i) => (
                <button
                  type="button"
                  key={i}
                  className={`blockModal__star ${i <= rating ? 'is-active' : ''}`}
                  aria-label={`${i} de 5`}
                  aria-pressed={i <= rating}
                  onClick={() => setRating(rating === i ? 0 : i)}
                >
                  <Star size={16} fill={i <= rating ? 'currentColor' : 'none'} />
                </button>
              ))}
            </div>
          </div>

          <div className="blockModal__field">
            <span className="blockModal__label"><Link2 size={14} /> Links e materiais</span>
            <div className="blockModal__resources">
              {resources.length === 0 && (
                <p className="blockModal__hint">Nenhum link ainda. Adicione a aula, o repositório ou o material de apoio.</p>
              )}
              {resources.map((r) => (
                <div className="blockModal__resource" key={r.id}>
                  <input
                    type="text"
                    aria-label="Nome do material"
                    value={r.label}
                    placeholder="Nome"
                    onChange={(e) => updateResource(r.id, { label: e.target.value })}
                  />
                  <input
                    type="url"
                    aria-label="Endereço do material"
                    value={r.url}
                    placeholder="https://"
                    onChange={(e) => updateResource(r.id, { url: e.target.value })}
                  />
                  <button
                    type="button"
                    className="blockModal__resourceDel"
                    aria-label={`Remover ${r.label || 'material'}`}
                    onClick={() => setResources((prev) => prev.filter((x) => x.id !== r.id))}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button type="button" className="blockModal__addResource" onClick={() => setResources((prev) => [...prev, emptyResource()])}>
                <Plus size={14} /> Adicionar link
              </button>
            </div>
          </div>
        </div>

        <footer className="blockModal__footer">
          <button type="button" className="blockModal__btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="blockModal__btn blockModal__btn--primary" disabled={saving || !title.trim()}>
            {saving ? 'Salvando...' : mode === 'edit' ? 'Salvar' : `Criar ${meta.label.toLowerCase()}`}
          </button>
        </footer>
      </form>
    </div>
  )
}
