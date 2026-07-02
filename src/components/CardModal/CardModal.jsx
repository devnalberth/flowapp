import { useState } from 'react'
import { X, Trash2, CreditCard } from 'lucide-react'
import BankLogo from '../BankLogo/BankLogo.jsx'
import BankPicker from '../BankLogo/BankPicker.jsx'
import './CardModal.css'

const COLORS = ['#0d0d12', '#820ad1', '#ec7000', '#cc092f', '#00a868', '#2a2a72', '#ff4800', '#1d4ed8', '#db2777', '#0891b2']
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

const fmtMoney = (n) => (Number(n) || 0).toFixed(2).replace('.', ',')

export default function CardModal({ card = null, onClose, onSubmit, onDelete }) {
  const isEditing = !!card
  const [form, setForm] = useState(() => ({
    name: card?.name || '',
    brand: card?.brand || '',
    color: card?.color || COLORS[0],
    creditLimit: card ? fmtMoney(card.creditLimit) : '',
    closingDay: card?.closingDay || 1,
    dueDay: card?.dueDay || 10,
  }))
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await onSubmit({
        name: form.name.trim(),
        brand: form.brand,
        color: form.color,
        creditLimit: parseFloat((form.creditLimit || '0').replace(/\./g, '').replace(',', '.')) || 0,
        closingDay: Number(form.closingDay) || 1,
        dueDay: Number(form.dueDay) || 10,
      })
      onClose()
    } catch (err) { alert('Erro ao salvar cartão: ' + (err?.message || '')) } finally { setSaving(false) }
  }

  return (
    <div className="cardModal" onClick={onClose}>
      <div className="cardModal__panel" onClick={(e) => e.stopPropagation()} style={{ '--accent': form.color }}>
        <header className="cardModal__header">
          <BankLogo value={form.brand} name={form.name} color={form.color} size={44} />
          <div>
            <p className="cardModal__eyebrow"><CreditCard size={12} /> Cartão de crédito</p>
            <h3>{isEditing ? 'Editar cartão' : 'Novo cartão'}</h3>
          </div>
          <button type="button" className="cardModal__close" onClick={onClose}><X size={18} /></button>
        </header>

        <form className="cardModal__form" onSubmit={handleSubmit}>
          <label className="cardModal__field">
            <span>Nome do cartão</span>
            <input type="text" value={form.name} placeholder="Ex: Nubank" autoFocus
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>

          <div className="cardModal__field">
            <span>Banco / bandeira</span>
            <BankPicker
              value={form.brand}
              name={form.name}
              includeNetworks
              onSelect={(bank) => setForm((f) => bank
                ? { ...f, brand: `bank:${bank.id}`, color: bank.color }
                : { ...f, brand: 'none' })}
            />
          </div>

          <div className="cardModal__field">
            <span>Cor</span>
            <div className="cardModal__colors">
              {COLORS.map((c) => (
                <button key={c} type="button" style={{ background: c }} className={form.color === c ? 'is-on' : ''} onClick={() => setForm({ ...form, color: c })} />
              ))}
            </div>
          </div>

          <label className="cardModal__field">
            <span>Limite</span>
            <div className="cardModal__money"><span>R$</span>
              <input type="text" value={form.creditLimit} placeholder="0,00"
                onChange={(e) => setForm({ ...form, creditLimit: e.target.value.replace(/[^0-9,]/g, '') })} />
            </div>
          </label>

          <div className="cardModal__row">
            <label className="cardModal__field">
              <span>Fecha dia</span>
              <select value={form.closingDay} onChange={(e) => setForm({ ...form, closingDay: e.target.value })}>
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label className="cardModal__field">
              <span>Vence dia</span>
              <select value={form.dueDay} onChange={(e) => setForm({ ...form, dueDay: e.target.value })}>
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
          </div>

          <footer className="cardModal__footer">
            {isEditing && onDelete && (
              <button type="button" className="cardModal__delete" onClick={onDelete}><Trash2 size={16} /></button>
            )}
            <div className="cardModal__footActions">
              <button type="button" className="cardModal__btn cardModal__btn--ghost" onClick={onClose}>Cancelar</button>
              <button type="submit" className="cardModal__btn cardModal__btn--primary" disabled={saving || !form.name.trim()}>
                {saving ? 'Salvando...' : (isEditing ? 'Salvar' : 'Adicionar cartão')}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  )
}
