import { useEffect, useRef, useState } from 'react'
import { X, Layers, Boxes, BookOpen, PlayCircle, ChevronRight } from 'lucide-react'
import './ModuleModal.css'

export const KIND_META = {
  module: { label: 'Módulo', icon: Layers, color: '#ff4800', desc: 'Grande bloco do curso' },
  submodule: { label: 'Sub-módulo', icon: Boxes, color: '#0ea5e9', desc: 'Divisão dentro de um módulo' },
  subject: { label: 'Matéria', icon: BookOpen, color: '#7c5cff', desc: 'Disciplina que agrupa aulas' },
}

const FLOW = ['module', 'submodule', 'subject']

export default function ModuleModal({
  open,
  onClose,
  onSubmit,
  mode = 'create',
  allowedKinds = ['module'],
  initial = null,
  parentLabel = null,
}) {
  const [kind, setKind] = useState(allowedKinds[0])
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [saving, setSaving] = useState(false)
  const titleRef = useRef(null)

  useEffect(() => {
    if (open) {
      setKind(initial?.kind || allowedKinds[0])
      setTitle(initial?.title || '')
      setDescription(initial?.description || '')
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await onSubmit?.({ title: title.trim(), description: description.trim() || null, kind })
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
            <h3>{mode === 'edit' ? `Editar ${meta.label.toLowerCase()}` : showPicker ? 'Adicionar conteúdo' : `Novo ${meta.label.toLowerCase()}`}</h3>
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
            <span className="moduleModal__flowChip"><PlayCircle size={13} /> Aula</span>
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
          <label>Nome {meta.label.toLowerCase()}</label>
          <input
            ref={titleRef}
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={kind === 'module' ? 'Ex: Fundamentos do Front-end' : kind === 'submodule' ? 'Ex: HTML & CSS' : 'Ex: Flexbox e Grid'}
            required
          />
        </div>

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
