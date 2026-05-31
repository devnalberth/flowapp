import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import './ClientModal.css'

const DEFAULT_FORM = {
  name: '',
  company: '',
  email: '',
  phone: '',
  notes: '',
}

export default function ClientModal({ open, onClose, onSubmit, initialData = null }) {
  const [form, setForm] = useState(() => ({ ...DEFAULT_FORM }))
  const [saving, setSaving] = useState(false)
  const nameRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); onClose?.() } }
    window.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => nameRef.current?.focus())
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  useEffect(() => {
    if (!open) return
    setForm(initialData ? { ...DEFAULT_FORM, ...initialData } : { ...DEFAULT_FORM })
  }, [open, initialData])

  if (!open) return null

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim() || saving) return
    try {
      setSaving(true)
      await onSubmit?.(form)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="clientModal" role="dialog" aria-modal="true">
      <div className="clientModal__backdrop" onClick={onClose} />
      <section className="clientModal__panel">
        <header className="clientModal__header">
          <h2 className="clientModal__title">{initialData ? 'Editar cliente' : 'Novo cliente'}</h2>
          <button type="button" className="clientModal__close" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        <form className="clientModal__form" onSubmit={handleSubmit}>
          <label className="clientModal__field">
            <span className="clientModal__label">Nome / Cliente*</span>
            <input
              ref={nameRef}
              className="clientModal__input"
              type="text"
              placeholder="Ex.: Dr. Túlio Andrade"
              value={form.name}
              onChange={update('name')}
              required
            />
          </label>

          <label className="clientModal__field">
            <span className="clientModal__label">Empresa</span>
            <input
              className="clientModal__input"
              type="text"
              placeholder="Ex.: Clínica Andrade"
              value={form.company}
              onChange={update('company')}
            />
          </label>

          <div className="clientModal__row">
            <label className="clientModal__field">
              <span className="clientModal__label">E-mail</span>
              <input
                className="clientModal__input"
                type="email"
                placeholder="email@cliente.com"
                value={form.email}
                onChange={update('email')}
              />
            </label>
            <label className="clientModal__field">
              <span className="clientModal__label">Telefone</span>
              <input
                className="clientModal__input"
                type="text"
                placeholder="(00) 00000-0000"
                value={form.phone}
                onChange={update('phone')}
              />
            </label>
          </div>

          <label className="clientModal__field">
            <span className="clientModal__label">Notas</span>
            <textarea
              className="clientModal__textarea"
              placeholder="Observações sobre o cliente..."
              value={form.notes}
              onChange={update('notes')}
            />
          </label>

          <footer className="clientModal__footer">
            <button type="button" className="clientModal__btn clientModal__btn--ghost" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="clientModal__btn clientModal__btn--primary" disabled={saving || !form.name.trim()}>
              {saving ? 'Salvando...' : initialData ? 'Salvar' : 'Criar cliente'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
