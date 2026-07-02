import { useState, useMemo } from 'react'
import { X, Plus, Trash2, Pencil, AlertTriangle, Tag, CreditCard, Check } from 'lucide-react'
import { monthSpendByCategory, monthSpendByCard, limitStatus } from '../../utils/financeMetrics'
import BankLogo from '../BankLogo/BankLogo.jsx'
import CategoryIcon from '../CategoryIcon/CategoryIcon.jsx'
import './LimitsModal.css'

const fmtMoney = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n) || 0)

const emptyForm = { scope: 'category', ref: '', amount: '' }

export default function LimitsModal({
  limits = [], categories = [], cards = [], transactions = [], catMap = {}, monthLabel = '',
  onCreate, onUpdate, onDelete, onClose,
}) {
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)

  // Categorias de despesa primeiro (limite faz mais sentido em despesas)
  const expenseCats = useMemo(
    () => categories.filter((c) => (c.type || '').toUpperCase() !== 'RECEITA'),
    [categories]
  )

  const refLabel = (limit) => {
    if (limit.scope === 'card') return cards.find((c) => c.id === limit.ref)?.name || 'Cartão'
    return catMap[limit.ref]?.name || categories.find((c) => c.slug === limit.ref)?.name || limit.ref
  }
  const refColor = (limit) => {
    if (limit.scope === 'card') return cards.find((c) => c.id === limit.ref)?.color || '#6b7280'
    return catMap[limit.ref]?.color || '#6b7280'
  }

  const spentOf = (limit) =>
    limit.scope === 'card' ? monthSpendByCard(transactions, limit.ref) : monthSpendByCategory(transactions, limit.ref)

  // Opções de referência disponíveis (não permite duplicar escopo+ref, exceto no item em edição)
  const refOptions = form.scope === 'card' ? cards : expenseCats
  const usedRefs = new Set(limits.filter((l) => l.scope === form.scope && l.id !== editingId).map((l) => l.ref))

  const resetForm = () => { setForm(emptyForm); setEditingId(null) }

  const startEdit = (limit) => {
    setEditingId(limit.id)
    setForm({ scope: limit.scope, ref: limit.ref, amount: String(limit.amount) })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.ref || !form.amount) return
    const payload = { scope: form.scope, ref: form.ref, amount: Number(form.amount), period: 'month' }
    if (editingId) await onUpdate?.(editingId, payload)
    else await onCreate?.(payload)
    resetForm()
  }

  return (
    <div className="limitsModal" onClick={onClose}>
      <div className="limitsModal__panel" onClick={(e) => e.stopPropagation()}>
        <header className="limitsModal__header">
          <div className="limitsModal__avatar"><AlertTriangle size={20} /></div>
          <div>
            <p className="limitsModal__eyebrow">Alerta · não bloqueia lançamentos</p>
            <h3>Limites de gastos</h3>
          </div>
          <button className="limitsModal__close" onClick={onClose}><X size={18} /></button>
        </header>

        <form className="limitsModal__form" onSubmit={handleSubmit}>
          <div className="limitsModal__scope">
            <button type="button" className={form.scope === 'category' ? 'is-on' : ''} onClick={() => setForm((f) => ({ ...f, scope: 'category', ref: '' }))}>
              <Tag size={14} /> Categoria
            </button>
            <button type="button" className={form.scope === 'card' ? 'is-on' : ''} onClick={() => setForm((f) => ({ ...f, scope: 'card', ref: '' }))}>
              <CreditCard size={14} /> Cartão
            </button>
          </div>
          <div className="limitsModal__formRow">
            <label className="limitsModal__field">
              <span>{form.scope === 'card' ? 'Cartão' : 'Categoria'}</span>
              <select value={form.ref} onChange={(e) => setForm((f) => ({ ...f, ref: e.target.value }))} required>
                <option value="">Selecione…</option>
                {refOptions.map((o) => {
                  const val = form.scope === 'card' ? o.id : o.slug
                  const disabled = usedRefs.has(val)
                  return (
                    <option key={val} value={val} disabled={disabled}>
                      {o.name}{disabled ? ' (já tem limite)' : ''}
                    </option>
                  )
                })}
              </select>
            </label>
            <label className="limitsModal__field limitsModal__field--money">
              <span>Limite mensal</span>
              <div className="limitsModal__money">
                <span>R$</span>
                <input type="number" min="0" step="0.01" inputMode="decimal" placeholder="0,00"
                  value={form.amount} onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value }))} required />
              </div>
            </label>
            <button type="submit" className="limitsModal__addBtn">
              {editingId ? <><Check size={15} /> Salvar</> : <><Plus size={15} /> Adicionar</>}
            </button>
            {editingId && (
              <button type="button" className="limitsModal__cancelBtn" onClick={resetForm}>Cancelar</button>
            )}
          </div>
        </form>

        <div className="limitsModal__list">
          {limits.length === 0 ? (
            <p className="limitsModal__empty">Nenhum limite definido. Crie um para receber alertas quando o gasto do mês passar do teto.</p>
          ) : (
            limits.map((limit) => {
              const st = limitStatus(spentOf(limit), limit.amount)
              return (
                <div className={`limitRow limitRow--${st.status}`} key={limit.id}>
                  {limit.scope === 'card'
                    ? <BankLogo
                        value={cards.find((c) => c.id === limit.ref)?.brand}
                        name={refLabel(limit)}
                        color={refColor(limit)}
                        size={36}
                        radius={10}
                      />
                    : <CategoryIcon slug={limit.ref} icon={catMap[limit.ref]?.icon} color={refColor(limit)} size={36} />}
                  <div className="limitRow__body">
                    <div className="limitRow__top">
                      <strong>{refLabel(limit)}</strong>
                      <span className="limitRow__values">{fmtMoney(st.spent)} / {fmtMoney(st.amount)}</span>
                    </div>
                    <div className="limitRow__bar">
                      <span style={{ width: `${st.pct}%` }} />
                    </div>
                    <div className="limitRow__foot">
                      <span className={`limitRow__badge limitRow__badge--${st.status}`}>
                        {st.status === 'over' && <><AlertTriangle size={12} /> {st.rawPct}% · acima do limite</>}
                        {st.status === 'near' && <><AlertTriangle size={12} /> {st.rawPct}% · perto do limite</>}
                        {st.status === 'ok' && <>{st.rawPct}% utilizado</>}
                      </span>
                      <span className="limitRow__scope">{limit.scope === 'card' ? 'Cartão' : 'Categoria'} · {monthLabel}</span>
                    </div>
                  </div>
                  <div className="limitRow__actions">
                    <button type="button" onClick={() => startEdit(limit)} title="Editar"><Pencil size={14} /></button>
                    <button type="button" className="is-danger" onClick={() => onDelete?.(limit.id)} title="Excluir"><Trash2 size={14} /></button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
