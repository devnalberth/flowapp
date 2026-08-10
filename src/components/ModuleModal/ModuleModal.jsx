import { useEffect, useMemo, useRef, useState } from 'react'
import { X, Layers, Boxes, BookOpen, PlayCircle, Calendar, CalendarClock, List, Type } from 'lucide-react'
import './ModuleModal.css'

export const KIND_META = {
  module: { label: 'Módulo', icon: Layers, color: '#ff4800', hint: 'Grande bloco do curso', placeholder: 'Ex: Fundamentos do Front-end' },
  submodule: { label: 'Sub-módulo', icon: Boxes, color: '#0ea5e9', hint: 'Divisão dentro do módulo', placeholder: 'Ex: HTML & CSS' },
  subject: { label: 'Matéria', icon: BookOpen, color: '#7c5cff', hint: 'Agrupa aulas', placeholder: 'Ex: Flexbox e Grid' },
  lesson: { label: 'Aula', icon: PlayCircle, color: '#16a34a', hint: 'Conteúdo individual', placeholder: 'Ex: Introdução ao Flexbox' },
}

const PRIORITIES = [
  { id: 'Baixa', label: 'Baixa', color: '#10b981' },
  { id: 'Normal', label: 'Normal', color: '#6b7280' },
  { id: 'Alta', label: 'Alta', color: '#f59e0b' },
  { id: 'Urgente', label: 'Urgente', color: '#ef4444' },
]

const isFlowPriority = (p) => p === 'Alta' || p === 'Urgente'
const article = (kind) => (kind === 'subject' || kind === 'lesson' ? 'a' : 'o')

// Uma linha por item. Ignora linhas vazias e marcadores comuns de lista
// ("1.", "-", "•"), porque quase todo índice de curso vem colado nesse formato.
const parseBulk = (text) =>
  String(text || '')
    .split('\n')
    .map((line) => line.replace(/^\s*(?:\d+[.)]\s*|[-*•]\s*)?/, '').trim())
    .filter(Boolean)

export default function ModuleModal({
  open,
  onClose,
  onSubmit,
  onBulkSubmit,
  mode = 'create',
  allowedKinds = ['module'],
  initial = null,
  parentLabel = null,
  parentOptions = null,
}) {
  const [kind, setKind] = useState(allowedKinds[0])
  const [title, setTitle] = useState('')
  const [bulkText, setBulkText] = useState('')
  const [isBulk, setIsBulk] = useState(false)
  const [description, setDescription] = useState('')
  const [parentId, setParentId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [priority, setPriority] = useState('Normal')
  const [saving, setSaving] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    setKind(initial?.kind || allowedKinds[0])
    setTitle(initial?.title || '')
    setBulkText('')
    setIsBulk(false)
    setDescription(initial?.description || '')
    setParentId(initial?.parentId || '')
    setScheduledDate(initial?.scheduledDate || '')
    setScheduledTime(initial?.scheduledTime || '')
    setPriority(initial?.priority || 'Normal')
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

  const bulkTitles = useMemo(() => parseBulk(bulkText), [bulkText])

  if (!open) return null

  const meta = KIND_META[kind] || KIND_META.module
  const isEdit = mode === 'edit'
  const showPicker = !isEdit && allowedKinds.length > 1
  const showMove = isEdit && Array.isArray(parentOptions) && parentOptions.length > 0
  // Lote só faz sentido criando vários irmãos do mesmo tipo.
  const canBulk = !isEdit && typeof onBulkSubmit === 'function'
  const canSubmit = isBulk ? bulkTitles.length > 0 : title.trim().length > 0

  const submitLabel = () => {
    if (saving) return 'Salvando...'
    if (isEdit) return 'Salvar'
    if (isBulk) return bulkTitles.length === 1 ? 'Criar 1 item' : `Criar ${bulkTitles.length} itens`
    return `Criar ${meta.label.toLowerCase()}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!canSubmit || saving) return
    setSaving(true)
    try {
      if (isBulk) {
        await onBulkSubmit?.({ kind, titles: bulkTitles })
      } else {
        await onSubmit?.({
          title: title.trim(),
          description: description.trim() || null,
          kind,
          scheduledDate: scheduledDate || null,
          scheduledTime: scheduledDate ? (scheduledTime || null) : null,
          priority: scheduledDate ? priority : null,
          ...(showMove ? { parentModuleId: parentId || null } : {}),
        })
      }
      onClose?.()
    } catch (err) {
      console.error('Erro ao salvar:', err)
      alert('Não foi possível salvar: ' + (err?.message || 'erro desconhecido'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="moduleModal" role="dialog" aria-modal="true" aria-label={isEdit ? 'Editar item' : 'Adicionar conteúdo'}>
      <div className="moduleModal__backdrop" onClick={onClose} />
      <form className="moduleModal__panel" onSubmit={handleSubmit} style={{ '--accent': meta.color }}>
        <header className="moduleModal__header">
          <div className="moduleModal__headText">
            <h3>{isEdit ? `Editar ${meta.label.toLowerCase()}` : 'Adicionar conteúdo'}</h3>
            {parentLabel
              ? <p>Dentro de <strong>{parentLabel}</strong></p>
              : <p>{isEdit ? meta.hint : 'Escolha o tipo e dê um nome.'}</p>}
          </div>
          <button type="button" className="moduleModal__close" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </header>

        <div className="moduleModal__body">
          {showPicker && (
            <div className="moduleModal__field">
              <span className="moduleModal__label">Tipo</span>
              <div className="moduleModal__types" role="group" aria-label="Tipo de conteúdo">
                {allowedKinds.map((k) => {
                  const km = KIND_META[k]
                  const Icon = km.icon
                  const active = kind === k
                  return (
                    <button
                      type="button"
                      key={k}
                      className={`moduleModal__type ${active ? 'is-active' : ''}`}
                      style={{ '--c': km.color }}
                      aria-pressed={active}
                      onClick={() => setKind(k)}
                    >
                      <Icon size={17} />
                      <span className="moduleModal__typeLabel">{km.label}</span>
                      <span className="moduleModal__typeHint">{km.hint}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="moduleModal__field">
            <div className="moduleModal__labelRow">
              <label htmlFor="mm-title">
                {isBulk ? `Nome de cada ${meta.label.toLowerCase()}` : `Nome ${article(kind)} ${meta.label.toLowerCase()}`}
              </label>
              {canBulk && (
                <button
                  type="button"
                  className="moduleModal__bulkToggle"
                  aria-pressed={isBulk}
                  onClick={() => setIsBulk((v) => !v)}
                >
                  {isBulk ? <><Type size={13} /> Adicionar um só</> : <><List size={13} /> Colar vários de uma vez</>}
                </button>
              )}
            </div>

            {isBulk ? (
              <>
                <textarea
                  id="mm-title"
                  ref={titleRef}
                  className="moduleModal__bulk"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  placeholder={'Um por linha. Ex:\nVariáveis e Constantes\nCondicionais\nFunções'}
                  rows={7}
                />
                <p className="moduleModal__hint">
                  {bulkTitles.length > 0
                    ? `${bulkTitles.length} ${bulkTitles.length === 1 ? 'item será criado' : 'itens serão criados'}, na ordem da lista.`
                    : 'Cole o índice do curso. Numeração e marcadores no começo da linha são removidos.'}
                </p>
              </>
            ) : (
              <input
                id="mm-title"
                ref={titleRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={meta.placeholder}
                required
              />
            )}
          </div>

          {/* Agendar vale para QUALQUER tipo: é o que permite acompanhar o
              estudo e medir o tempo sem cadastrar aula por aula. */}
          {!isBulk && (
            <fieldset className="moduleModal__field moduleModal__schedule">
              <legend><Calendar size={14} /> Agendar <span className="moduleModal__opt">(opcional)</span></legend>
              <div className="moduleModal__row2">
                <input type="date" aria-label="Data" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
                <input
                  type="time"
                  aria-label="Horário"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  disabled={!scheduledDate}
                  title={scheduledDate ? 'Horário' : 'Defina a data primeiro'}
                />
              </div>
              <p className="moduleModal__hint">
                <CalendarClock size={12} /> Com data, {article(kind)} {meta.label.toLowerCase()} aparece na aba Tarefas com o pomodoro.
              </p>

              {scheduledDate && (
                <div className="moduleModal__prios" role="group" aria-label="Prioridade">
                  {PRIORITIES.map((p) => (
                    <button
                      type="button"
                      key={p.id}
                      className={`moduleModal__prio ${priority === p.id ? 'is-active' : ''}`}
                      style={{ '--pc': p.color }}
                      aria-pressed={priority === p.id}
                      onClick={() => setPriority(p.id)}
                    >
                      {p.label}
                      {isFlowPriority(p.id) && <span className="moduleModal__flowTag">Flow</span>}
                    </button>
                  ))}
                </div>
              )}
            </fieldset>
          )}

          {showMove && (
            <div className="moduleModal__field">
              <label htmlFor="mm-parent">Mover para</label>
              <select id="mm-parent" value={parentId} onChange={(e) => setParentId(e.target.value)}>
                {parentOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}

          {!isBulk && (
            <div className="moduleModal__field">
              <label htmlFor="mm-desc">Descrição <span className="moduleModal__opt">(opcional)</span></label>
              <textarea
                id="mm-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Objetivo, ementa, pré-requisitos..."
                rows={2}
              />
            </div>
          )}
        </div>

        <footer className="moduleModal__footer">
          <button type="button" className="moduleModal__btn moduleModal__btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="moduleModal__btn moduleModal__btn--primary" disabled={saving || !canSubmit}>
            {submitLabel()}
          </button>
        </footer>
      </form>
    </div>
  )
}
