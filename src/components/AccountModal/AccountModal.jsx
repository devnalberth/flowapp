import { useState } from 'react'
import { X, Trash2, Wallet } from 'lucide-react'
import './AccountModal.css'

const COLORS = ['#0d0d12', '#16a34a', '#1d4ed8', '#ec7000', '#820ad1', '#cc092f', '#0891b2', '#ff4800']
const ICONS = ['🏦', '💰', '👛', '💼', '📈', '🐷', '💵', '🪙']
const TYPES = [
  { id: 'corrente', label: 'Conta corrente' },
  { id: 'poupanca', label: 'Poupança' },
  { id: 'carteira', label: 'Carteira' },
  { id: 'pj', label: 'Conta PJ' },
  { id: 'investimentos', label: 'Investimentos' },
]
const fmtMoney = (n) => (Number(n) || 0).toFixed(2).replace('.', ',')

export default function AccountModal({ account = null, onClose, onSubmit, onDelete }) {
  const isEditing = !!account
  const [form, setForm] = useState(() => ({
    name: account?.name || '',
    type: account?.type || 'corrente',
    icon: account?.icon || ICONS[0],
    color: account?.color || COLORS[0],
    initialBalance: account ? fmtMoney(account.initialBalance) : '',
    includeInTotal: account ? account.includeInTotal !== false : true,
  }))
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.name.trim()) return
    setSaving(true)
    try {
      await onSubmit({
        name: form.name.trim(),
        type: form.type,
        icon: form.icon,
        color: form.color,
        initialBalance: parseFloat((form.initialBalance || '0').replace(/\./g, '').replace(',', '.')) || 0,
        includeInTotal: form.includeInTotal,
      })
      onClose()
    } catch (err) { alert('Erro ao salvar conta: ' + (err?.message || '')) } finally { setSaving(false) }
  }

  return (
    <div className="acctModal" onClick={onClose}>
      <div className="acctModal__panel" onClick={(e) => e.stopPropagation()} style={{ '--accent': form.color }}>
        <header className="acctModal__header">
          <div className="acctModal__avatar" style={{ background: form.color }}>{form.icon}</div>
          <div>
            <p className="acctModal__eyebrow"><Wallet size={12} /> Conta</p>
            <h3>{isEditing ? 'Editar conta' : 'Nova conta'}</h3>
          </div>
          <button type="button" className="acctModal__close" onClick={onClose}><X size={18} /></button>
        </header>

        <form className="acctModal__form" onSubmit={handleSubmit}>
          <label className="acctModal__field">
            <span>Nome da conta</span>
            <input type="text" value={form.name} placeholder="Ex: C6 Bank" autoFocus
              onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </label>

          <label className="acctModal__field">
            <span>Tipo</span>
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
              {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
            </select>
          </label>

          <div className="acctModal__field">
            <span>Ícone</span>
            <div className="acctModal__chips">
              {ICONS.map((b) => (
                <button key={b} type="button" className={form.icon === b ? 'is-on' : ''} onClick={() => setForm({ ...form, icon: b })}>{b}</button>
              ))}
            </div>
          </div>

          <div className="acctModal__field">
            <span>Cor</span>
            <div className="acctModal__colors">
              {COLORS.map((c) => (
                <button key={c} type="button" style={{ background: c }} className={form.color === c ? 'is-on' : ''} onClick={() => setForm({ ...form, color: c })} />
              ))}
            </div>
          </div>

          <label className="acctModal__field">
            <span>Saldo inicial</span>
            <div className="acctModal__money"><span>R$</span>
              <input type="text" value={form.initialBalance} placeholder="0,00"
                onChange={(e) => setForm({ ...form, initialBalance: e.target.value.replace(/[^0-9,]/g, '') })} />
            </div>
          </label>

          <label className="acctModal__check">
            <input type="checkbox" checked={form.includeInTotal} onChange={(e) => setForm({ ...form, includeInTotal: e.target.checked })} />
            <span>Somar no saldo geral</span>
          </label>

          <footer className="acctModal__footer">
            {isEditing && onDelete && (
              <button type="button" className="acctModal__delete" onClick={onDelete}><Trash2 size={16} /></button>
            )}
            <div className="acctModal__footActions">
              <button type="button" className="acctModal__btn acctModal__btn--ghost" onClick={onClose}>Cancelar</button>
              <button type="submit" className="acctModal__btn acctModal__btn--primary" disabled={saving || !form.name.trim()}>
                {saving ? 'Salvando...' : (isEditing ? 'Salvar' : 'Adicionar conta')}
              </button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  )
}
