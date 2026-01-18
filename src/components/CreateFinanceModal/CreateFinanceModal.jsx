import { useEffect, useRef, useState } from 'react'

import './CreateFinanceModal.css'

const TRANSACTION_TYPES = [
  { value: 'receita', label: 'Receita', icon: '📈' },
  { value: 'despesa', label: 'Despesa', icon: '📉' },
]

const INCOME_CATEGORIES = [
  'Salário',
  'Freelancer',
  'Investimentos',
  'Outros',
]

const EXPENSE_CATEGORIES = [
  'Alimentação',
  'Transporte',
  'Moradia',
  'Saúde',
  'Educação',
  'Lazer',
  'Outros',
]

export default function CreateFinanceModal({ open, onClose, onSubmit }) {
  const [form, setForm] = useState({
    type: 'despesa',
    value: '',
    category: EXPENSE_CATEGORIES[0],
    date: new Date().toISOString().split('T')[0],
    description: '',
  })
  const valueRef = useRef(null)

  useEffect(() => {
    if (open) {
      setForm({
        type: 'despesa',
        value: '',
        category: EXPENSE_CATEGORIES[0],
        date: new Date().toISOString().split('T')[0],
        description: '',
      })
      requestAnimationFrame(() => valueRef.current?.focus())
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Update category list when type changes
  useEffect(() => {
    const categories = form.type === 'receita' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
    if (!categories.includes(form.category)) {
      setForm((prev) => ({ ...prev, category: categories[0] }))
    }
  }, [form.type, form.category])

  if (!open) {
    return null
  }

  const updateField = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const numericValue = parseFloat(form.value.replace(/[^\d,.-]/g, '').replace(',', '.'))
    if (isNaN(numericValue) || numericValue <= 0) {
      alert('Digite um valor válido')
      return
    }
    onSubmit?.({
      ...form,
      value: numericValue,
    })
  }

  const categories = form.type === 'receita' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES

  return (
    <div className="createFinanceModal" role="dialog" aria-modal="true">
      <div className="createFinanceModal__backdrop" onClick={onClose} />
      <section className="createFinanceModal__panel">
        <header className="createFinanceModal__header">
          <div>
            <p className="createFinanceModal__eyebrow">Nova transação</p>
            <h3>Registre receitas e despesas</h3>
          </div>
          <button type="button" className="createFinanceModal__close" onClick={onClose} aria-label="Fechar modal">
            ✕
          </button>
        </header>

        <form className="createFinanceModal__form" onSubmit={handleSubmit}>
          <div className="createFinanceModal__field">
            <span>Tipo de transação</span>
            <div className="createFinanceModal__typeGrid">
              {TRANSACTION_TYPES.map((type) => (
                <button
                  key={type.value}
                  type="button"
                  className={`typeChip typeChip--${type.value} ${form.type === type.value ? 'typeChip--active' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, type: type.value }))}
                >
                  <span className="typeChip__icon">{type.icon}</span>
                  <span>{type.label}</span>
                </button>
              ))}
            </div>
          </div>

          <label className="createFinanceModal__field">
            <span>Valor*</span>
            <div className="createFinanceModal__valueInput">
              <span className="createFinanceModal__currency">R$</span>
              <input
                ref={valueRef}
                type="text"
                inputMode="decimal"
                placeholder="0,00"
                value={form.value}
                onChange={updateField('value')}
                required
              />
            </div>
          </label>

          <label className="createFinanceModal__field">
            <span>Categoria</span>
            <select value={form.category} onChange={updateField('category')}>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>

          <label className="createFinanceModal__field">
            <span>Data</span>
            <input type="date" value={form.date} onChange={updateField('date')} required />
          </label>

          <label className="createFinanceModal__field">
            <span>Descrição (opcional)</span>
            <input
              type="text"
              placeholder="Ex: Almoço com cliente"
              value={form.description}
              onChange={updateField('description')}
            />
          </label>

          <footer className="createFinanceModal__footer">
            <button type="button" onClick={onClose} className="btn btn--ghost">
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary">
              Registrar transação
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
