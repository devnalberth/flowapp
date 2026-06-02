import { useState, useMemo } from 'react'
import { X, TrendingUp, TrendingDown, ArrowRightLeft, Calendar, CreditCard, Tag, Repeat, ChevronDown, Check, Plus, Pencil, Trash2 } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import './CreateFinanceModal.css'

const TRANSACTION_TYPES = [
  { id: 'RECEITA', label: 'Receita', icon: TrendingUp, color: '#10b981' },
  { id: 'DESPESA', label: 'Despesa', icon: TrendingDown, color: '#ef4444' },
  { id: 'TRANSFERENCIA', label: 'Transferência', icon: ArrowRightLeft, color: '#6366f1' },
]

const ACCOUNTS = [
  { id: 'conta-corrente', label: 'Conta Corrente' },
  { id: 'poupanca', label: 'Poupança' },
  { id: 'carteira', label: 'Carteira' },
]

const PAYMENT_METHODS = [
  { id: 'dinheiro', label: 'Dinheiro' },
  { id: 'pix', label: 'Pix' },
  { id: 'debito', label: 'Débito' },
  { id: 'credito', label: 'Crédito' },
]

const COLOR_PALETTE = ['#ff4800', '#dc2626', '#ea580c', '#f59e0b', '#16a34a', '#15803d', '#0891b2', '#0ea5e9', '#1d4ed8', '#4338ca', '#7c3aed', '#a855f7', '#db2777', '#6b7280', '#0d0d12']
const EMOJI_PALETTE = ['🍽️', '🛒', '🏠', '🚗', '✈️', '🎮', '🎓', '❤️', '🛍️', '💼', '💰', '💻', '📈', '🏦', '⚡', '🔁', '🛠️', '📦', '🎁', '☕', '🐾', '📱', '💊', '🍿']

const slugify = (s) => (s || '')
  .toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'cat'

const buildInitial = (initialData) => {
  if (initialData) {
    const amountNum = Number(initialData.amount) || 0
    return {
      type: (initialData.type || 'DESPESA').toUpperCase(),
      description: initialData.description || '',
      amount: amountNum ? String(amountNum.toFixed(2)).replace('.', ',') : '',
      date: initialData.date ? String(initialData.date).slice(0, 10) : new Date().toISOString().split('T')[0],
      category: initialData.category || '',
      account: initialData.account || 'conta-corrente',
      paymentMethod: initialData.paymentMethod || initialData.payment_method || 'pix',
      tags: Array.isArray(initialData.tags) ? initialData.tags : [],
      isInstallment: !!(initialData.isInstallment ?? initialData.is_installment),
      installmentCount: initialData.installmentCount || initialData.installment_count || 2,
    }
  }
  return {
    type: 'DESPESA', description: '', amount: '',
    date: new Date().toISOString().split('T')[0],
    category: '', account: 'conta-corrente', paymentMethod: 'pix',
    tags: [], isInstallment: false, installmentCount: 2,
  }
}

export default function CreateFinanceModal({ onClose, onSubmit, initialData = null }) {
  const isEditing = !!initialData
  const { financeCategories, financeTags, addFinanceCategory, updateFinanceCategory, deleteFinanceCategory, addFinanceTag } = useApp()

  const [formData, setFormData] = useState(() => buildInitial(initialData))
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [catEditor, setCatEditor] = useState(null) // { mode, id, name, color, icon }
  const [tagDraft, setTagDraft] = useState('')

  // Categorias visíveis conforme o tipo (DESPESA/RECEITA), incluindo as BOTH
  const categories = useMemo(() => {
    if (formData.type === 'TRANSFERENCIA') return []
    return (financeCategories || []).filter((c) => c.type === formData.type || c.type === 'BOTH')
  }, [financeCategories, formData.type])

  const activeCategory = (financeCategories || []).find((c) => c.slug === formData.category)

  // Default category quando troca de tipo / abre
  const ensureCategory = (list) => {
    if (formData.category && list.some((c) => c.slug === formData.category)) return
    if (list[0]) setFormData((prev) => ({ ...prev, category: list[0].slug }))
  }
  useMemo(() => ensureCategory(categories), [categories]) // eslint-disable-line

  const handleChange = (field, value) => {
    setFormData((prev) => {
      const updated = { ...prev, [field]: value }
      if (field === 'type') {
        updated.category = ''
        if (value !== 'DESPESA') updated.isInstallment = false
      }
      if (field === 'paymentMethod' && value !== 'credito') updated.isInstallment = false
      return updated
    })
  }

  const handleAmountChange = (e) => handleChange('amount', e.target.value.replace(/[^0-9,]/g, ''))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.description.trim() || !formData.amount) return
    const amount = parseFloat(formData.amount.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) return
    const installmentCount = formData.isInstallment ? (Number(formData.installmentCount) || 2) : null

    onSubmit({
      description: formData.description.trim(),
      amount: amount.toFixed(2),
      type: formData.type,
      category: formData.category,
      date: formData.date + 'T12:00:00.000Z',
      paymentMethod: formData.paymentMethod,
      tags: formData.tags,
      isInstallment: formData.isInstallment,
      installmentCount,
      installmentTotal: formData.isInstallment ? amount.toFixed(2) : null,
    })
    if (!isEditing) setFormData(buildInitial(null))
    onClose()
  }

  // ----- Categoria: editor inline -----
  const openNewCategory = () => setCatEditor({ mode: 'create', name: '', color: COLOR_PALETTE[0], icon: EMOJI_PALETTE[0] })
  const openEditCategory = (cat) => setCatEditor({ mode: 'edit', id: cat.id, slug: cat.slug, name: cat.name, color: cat.color, icon: cat.icon || '📦' })

  const saveCategory = async () => {
    if (!catEditor?.name.trim()) return
    try {
      if (catEditor.mode === 'edit') {
        await updateFinanceCategory(catEditor.id, { name: catEditor.name.trim(), color: catEditor.color, icon: catEditor.icon })
      } else {
        let slug = slugify(catEditor.name)
        const taken = new Set((financeCategories || []).map((c) => c.slug))
        if (taken.has(slug)) slug = `${slug}-${Date.now().toString(36).slice(-4)}`
        const created = await addFinanceCategory({ slug, name: catEditor.name.trim(), color: catEditor.color, icon: catEditor.icon, type: formData.type === 'RECEITA' ? 'RECEITA' : 'DESPESA' })
        if (created) setFormData((prev) => ({ ...prev, category: created.slug }))
      }
      setCatEditor(null)
    } catch (err) { alert('Erro ao salvar categoria: ' + (err?.message || '')) }
  }

  const removeCategory = async (cat) => {
    if (!confirm(`Excluir a categoria "${cat.name}"? As transações existentes mantêm o registro.`)) return
    await deleteFinanceCategory(cat.id)
    if (formData.category === cat.slug) setFormData((prev) => ({ ...prev, category: '' }))
  }

  // ----- Tags -----
  const toggleTag = (name) => setFormData((prev) => ({
    ...prev,
    tags: prev.tags.includes(name) ? prev.tags.filter((t) => t !== name) : [...prev.tags, name],
  }))
  const addNewTag = async () => {
    const name = tagDraft.trim()
    if (!name) return
    const exists = (financeTags || []).find((t) => t.name.toLowerCase() === name.toLowerCase())
    if (!exists) { try { await addFinanceTag({ name }) } catch (e) { /* ignora dup */ } }
    if (!formData.tags.includes(name)) setFormData((prev) => ({ ...prev, tags: [...prev.tags, name] }))
    setTagDraft('')
  }

  return (
    <div className="finance-modal-overlay" onClick={onClose}>
      <div className="finance-modal" onClick={(e) => e.stopPropagation()}>
        <header className="finance-modal__header">
          <h2>{isEditing ? 'Editar transação' : 'Nova Transação'}</h2>
          <button className="finance-modal__close" onClick={onClose}><X size={20} /></button>
        </header>

        <form className="finance-modal__form" onSubmit={handleSubmit}>
          <div className="finance-modal__field">
            <label>Tipo</label>
            <div className="finance-modal__types">
              {TRANSACTION_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <button key={type.id} type="button"
                    className={`finance-modal__type ${formData.type === type.id ? 'active' : ''}`}
                    onClick={() => handleChange('type', type.id)}
                    style={{ '--type-color': type.color }}>
                    <Icon size={18} /><span>{type.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="finance-modal__field">
            <label htmlFor="finance-description">Descrição</label>
            <input id="finance-description" type="text" placeholder="Ex: Almoço no restaurante"
              value={formData.description} onChange={(e) => handleChange('description', e.target.value)} autoFocus />
          </div>

          <div className="finance-modal__row">
            <div className="finance-modal__field">
              <label htmlFor="finance-amount">Valor</label>
              <div className="finance-modal__amount-input">
                <span>R$</span>
                <input id="finance-amount" type="text" placeholder="0,00" value={formData.amount} onChange={handleAmountChange} />
              </div>
            </div>
            <div className="finance-modal__field">
              <label htmlFor="finance-date"><Calendar size={14} /> Data</label>
              <input id="finance-date" type="date" value={formData.date} onChange={(e) => handleChange('date', e.target.value)} />
            </div>
          </div>

          <div className="finance-modal__row">
            <div className="finance-modal__field">
              <label htmlFor="finance-account">Conta/Cartão</label>
              <select id="finance-account" value={formData.account} onChange={(e) => handleChange('account', e.target.value)}>
                {ACCOUNTS.map((acc) => <option key={acc.id} value={acc.id}>{acc.label}</option>)}
              </select>
            </div>

            {formData.type !== 'TRANSFERENCIA' && (
              <div className="finance-modal__field">
                <label><Tag size={14} /> Categoria</label>
                <div className="fm-cat-selector">
                  <button type="button" className="fm-cat-trigger" onClick={() => setShowCategoryDropdown((p) => !p)}>
                    <span className="fm-cat-emoji">{activeCategory?.icon || '📦'}</span>
                    <span className="fm-cat-trigger__label">{activeCategory?.name || 'Selecionar'}</span>
                    <ChevronDown size={14} className={`fm-cat-chevron ${showCategoryDropdown ? 'fm-cat-chevron--open' : ''}`} />
                  </button>
                  {showCategoryDropdown && (
                    <>
                      <div className="fm-cat-overlay" onClick={() => { setShowCategoryDropdown(false); setCatEditor(null) }} />
                      <div className="fm-cat-list">
                        {categories.map((cat) => (
                          <div key={cat.id} className={`fm-cat-item ${formData.category === cat.slug ? 'fm-cat-item--active' : ''}`}>
                            <button type="button" className="fm-cat-item__main" onClick={() => { handleChange('category', cat.slug); setShowCategoryDropdown(false) }}>
                              <span className="fm-cat-emoji" style={{ background: `${cat.color}22` }}>{cat.icon || '📦'}</span>
                              <span>{cat.name}</span>
                              {formData.category === cat.slug && <Check size={14} className="fm-cat-check" />}
                            </button>
                            <span className="fm-cat-item__actions">
                              <button type="button" onClick={() => openEditCategory(cat)} title="Editar"><Pencil size={12} /></button>
                              {!cat.isDefault && <button type="button" onClick={() => removeCategory(cat)} title="Excluir"><Trash2 size={12} /></button>}
                            </span>
                          </div>
                        ))}
                        <button type="button" className="fm-cat-add" onClick={openNewCategory}><Plus size={14} /> Nova categoria</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Editor de categoria (inline) */}
          {catEditor && (
            <div className="fm-cat-editor">
              <div className="fm-cat-editor__head">
                <strong>{catEditor.mode === 'edit' ? 'Editar categoria' : 'Nova categoria'}</strong>
                <button type="button" onClick={() => setCatEditor(null)}><X size={14} /></button>
              </div>
              <input className="fm-cat-editor__name" type="text" placeholder="Nome da categoria"
                value={catEditor.name} onChange={(e) => setCatEditor({ ...catEditor, name: e.target.value })} autoFocus />
              <div className="fm-cat-editor__row">
                <span>Ícone</span>
                <div className="fm-cat-editor__emojis">
                  {EMOJI_PALETTE.map((em) => (
                    <button key={em} type="button" className={catEditor.icon === em ? 'is-on' : ''} onClick={() => setCatEditor({ ...catEditor, icon: em })}>{em}</button>
                  ))}
                </div>
              </div>
              <div className="fm-cat-editor__row">
                <span>Cor</span>
                <div className="fm-cat-editor__colors">
                  {COLOR_PALETTE.map((col) => (
                    <button key={col} type="button" style={{ background: col }} className={catEditor.color === col ? 'is-on' : ''} onClick={() => setCatEditor({ ...catEditor, color: col })} />
                  ))}
                </div>
              </div>
              <div className="fm-cat-editor__actions">
                <button type="button" className="finance-modal__cancel" onClick={() => setCatEditor(null)}>Cancelar</button>
                <button type="button" className="finance-modal__submit" onClick={saveCategory} disabled={!catEditor.name.trim()}>Salvar categoria</button>
              </div>
            </div>
          )}

          {/* Tags */}
          {formData.type !== 'TRANSFERENCIA' && (
            <div className="finance-modal__field">
              <label><Tag size={14} /> Etiquetas <span className="fm-opt">(opcional)</span></label>
              <div className="fm-tags">
                {formData.tags.map((t) => (
                  <span key={t} className="fm-tag fm-tag--on" onClick={() => toggleTag(t)}>{t} <X size={11} /></span>
                ))}
                {(financeTags || []).filter((t) => !formData.tags.includes(t.name)).map((t) => (
                  <span key={t.id} className="fm-tag" onClick={() => toggleTag(t.name)}>{t.name}</span>
                ))}
              </div>
              <div className="fm-tag-add">
                <input type="text" placeholder="Nova etiqueta" value={tagDraft}
                  onChange={(e) => setTagDraft(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addNewTag() } }} />
                <button type="button" onClick={addNewTag}><Plus size={14} /></button>
              </div>
            </div>
          )}

          {formData.type !== 'TRANSFERENCIA' && (
            <div className="finance-modal__field">
              <label><CreditCard size={14} /> Forma de Pagamento</label>
              <div className="finance-modal__payment-methods">
                {PAYMENT_METHODS.map((method) => (
                  <button key={method.id} type="button"
                    className={`finance-modal__payment-method ${formData.paymentMethod === method.id ? 'active' : ''}`}
                    onClick={() => handleChange('paymentMethod', method.id)}>
                    {method.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {formData.paymentMethod === 'credito' && formData.type === 'DESPESA' && (
            <>
              <div className="finance-modal__field">
                <label className="finance-modal__checkbox">
                  <input type="checkbox" checked={formData.isInstallment} onChange={(e) => handleChange('isInstallment', e.target.checked)} />
                  <Repeat size={16} /><span>Parcelar compra</span>
                </label>
              </div>
              {formData.isInstallment && (
                <div className="finance-modal__installment">
                  <div className="finance-modal__field">
                    <label htmlFor="finance-installments">Número de parcelas</label>
                    <input id="finance-installments" type="number" min="2" max="48" value={formData.installmentCount}
                      onChange={(e) => handleChange('installmentCount', e.target.value === '' ? '' : parseInt(e.target.value))} />
                  </div>
                  {formData.amount && (
                    <div className="finance-modal__installment-info">
                      <p>{formData.installmentCount || 0}x de <strong>R$ {((parseFloat(formData.amount.replace(',', '.') || '0')) / (formData.installmentCount || 1)).toFixed(2).replace('.', ',')}</strong></p>
                      <p className="finance-modal__installment-total">Total: R$ {(parseFloat(formData.amount.replace(',', '.') || '0')).toFixed(2).replace('.', ',')}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="finance-modal__actions">
            <button type="button" className="finance-modal__cancel" onClick={onClose}>Cancelar</button>
            <button type="submit" className="finance-modal__submit" disabled={!formData.description.trim() || !formData.amount}>
              {isEditing ? 'Salvar alterações' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
