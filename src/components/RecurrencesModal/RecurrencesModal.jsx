import { useState } from 'react'
import { X, Plus, Trash2, Pencil, CalendarSync, Check, Pause, Play } from 'lucide-react'
import CategoryIcon from '../CategoryIcon/CategoryIcon.jsx'
import './RecurrencesModal.css'

const fmtMoney = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n) || 0)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

const emptyForm = { description: '', amount: '', type: 'DESPESA', category: '', dayOfMonth: 1, source: '' }

// Gerencia as recorrências mensais (assinaturas, aluguel, salário...).
// Todo mês o app lança automaticamente cada recorrência ativa como "a pagar".
export default function RecurrencesModal({
  recurrences = [], categories = [], accounts = [], cards = [], catMap = {},
  onCreate, onUpdate, onDelete, onClose,
}) {
  const [form, setForm] = useState(emptyForm)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)

  const catOptions = categories.filter((c) => (c.type || '').toUpperCase() === form.type || c.type === 'BOTH')

  const resetForm = () => { setForm(emptyForm); setEditingId(null) }

  const startEdit = (rec) => {
    setEditingId(rec.id)
    setForm({
      description: rec.description,
      amount: String(Number(rec.amount).toFixed(2)).replace('.', ','),
      type: rec.type || 'DESPESA',
      category: rec.category || '',
      dayOfMonth: rec.dayOfMonth || 1,
      source: rec.cardId ? `card:${rec.cardId}` : rec.accountId ? `acc:${rec.accountId}` : '',
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amount = parseFloat((form.amount || '0').replace(/\./g, '').replace(',', '.'))
    if (!form.description.trim() || !amount || amount <= 0) return
    setSaving(true)
    try {
      const payload = {
        description: form.description.trim(),
        amount: amount.toFixed(2),
        type: form.type,
        category: form.category || null,
        dayOfMonth: Number(form.dayOfMonth) || 1,
        accountId: form.source.startsWith('acc:') ? form.source.slice(4) : null,
        cardId: form.source.startsWith('card:') ? form.source.slice(5) : null,
      }
      if (editingId) await onUpdate?.(editingId, payload)
      else await onCreate?.(payload)
      resetForm()
    } catch (err) {
      alert('Erro ao salvar recorrência: ' + (err?.message || ''))
    } finally { setSaving(false) }
  }

  const sourceLabel = (rec) => {
    if (rec.cardId) return cards.find((c) => c.id === rec.cardId)?.name || 'Cartão'
    if (rec.accountId) return accounts.find((a) => a.id === rec.accountId)?.name || 'Conta'
    return null
  }

  return (
    <div className="recModal" onClick={onClose}>
      <div className="recModal__panel" onClick={(e) => e.stopPropagation()}>
        <header className="recModal__header">
          <div className="recModal__avatar"><CalendarSync size={20} /></div>
          <div>
            <p className="recModal__eyebrow">Lançamento automático todo mês</p>
            <h3>Recorrências</h3>
          </div>
          <button className="recModal__close" onClick={onClose}><X size={18} /></button>
        </header>

        <form className="recModal__form" onSubmit={handleSubmit}>
          <div className="recModal__row">
            <label className="recModal__field recModal__field--grow">
              <span>Descrição</span>
              <input type="text" placeholder="Ex: Netflix, Aluguel, Salário..." value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
            </label>
            <label className="recModal__field">
              <span>Valor</span>
              <div className="recModal__money"><span>R$</span>
                <input type="text" inputMode="decimal" placeholder="0,00" value={form.amount}
                  onChange={(e) => setForm((f) => ({ ...f, amount: e.target.value.replace(/[^0-9,]/g, '') }))} />
              </div>
            </label>
          </div>

          <div className="recModal__row">
            <label className="recModal__field">
              <span>Tipo</span>
              <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value, category: '' }))}>
                <option value="DESPESA">Despesa</option>
                <option value="RECEITA">Receita</option>
              </select>
            </label>
            <label className="recModal__field">
              <span>Categoria</span>
              <select value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}>
                <option value="">Selecione…</option>
                {catOptions.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </select>
            </label>
            <label className="recModal__field">
              <span>Todo dia</span>
              <select value={form.dayOfMonth} onChange={(e) => setForm((f) => ({ ...f, dayOfMonth: e.target.value }))}>
                {DAYS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </label>
            <label className="recModal__field">
              <span>Conta / cartão</span>
              <select value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value }))}>
                <option value="">Nenhum</option>
                {accounts.length > 0 && (
                  <optgroup label="Contas">
                    {accounts.map((a) => <option key={a.id} value={`acc:${a.id}`}>{a.name}</option>)}
                  </optgroup>
                )}
                {cards.length > 0 && (
                  <optgroup label="Cartões">
                    {cards.map((c) => <option key={c.id} value={`card:${c.id}`}>{c.name}</option>)}
                  </optgroup>
                )}
              </select>
            </label>
            <button type="submit" className="recModal__addBtn" disabled={saving}>
              {editingId ? <><Check size={15} /> Salvar</> : <><Plus size={15} /> Adicionar</>}
            </button>
            {editingId && (
              <button type="button" className="recModal__cancelBtn" onClick={resetForm}>Cancelar</button>
            )}
          </div>
        </form>

        <div className="recModal__list">
          {recurrences.length === 0 ? (
            <p className="recModal__empty">
              Nenhuma recorrência ainda. Crie acima ou marque "Repetir todo mês" ao lançar uma transação.
            </p>
          ) : (
            recurrences.map((rec) => (
              <div className={`recRow ${rec.active ? '' : 'recRow--paused'}`} key={rec.id}>
                <CategoryIcon slug={rec.category} icon={catMap[rec.category]?.icon} color={catMap[rec.category]?.color || '#6b7280'} size={36} />
                <div className="recRow__body">
                  <div className="recRow__top">
                    <strong>{rec.description}</strong>
                    <span className={`recRow__amount ${rec.type === 'RECEITA' ? 'positive' : ''}`}>
                      {rec.type === 'RECEITA' ? '+' : '-'}{fmtMoney(rec.amount)}
                    </span>
                  </div>
                  <span className="recRow__sub">
                    Todo dia {rec.dayOfMonth}
                    {sourceLabel(rec) ? ` · ${sourceLabel(rec)}` : ''}
                    {!rec.active && ' · pausada'}
                  </span>
                </div>
                <div className="recRow__actions">
                  <button type="button" onClick={() => onUpdate?.(rec.id, { active: !rec.active })}
                    title={rec.active ? 'Pausar (para de lançar)' : 'Reativar'}
                    aria-label={rec.active ? `Pausar recorrência ${rec.description}` : `Reativar recorrência ${rec.description}`}>
                    {rec.active ? <Pause size={14} /> : <Play size={14} />}
                  </button>
                  <button type="button" onClick={() => startEdit(rec)} title="Editar" aria-label={`Editar recorrência ${rec.description}`}><Pencil size={14} /></button>
                  <button type="button" className="recRow__delete" title="Excluir" aria-label={`Excluir recorrência ${rec.description}`}
                    onClick={() => { if (confirm(`Excluir a recorrência "${rec.description}"? Lançamentos já gerados são mantidos.`)) onDelete?.(rec.id) }}>
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
