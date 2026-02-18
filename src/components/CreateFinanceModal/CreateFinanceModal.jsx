import { useState } from 'react'
import { X, TrendingUp, TrendingDown, ArrowRightLeft, Calendar, CreditCard, Tag, Repeat } from 'lucide-react'
import './CreateFinanceModal.css'

const TRANSACTION_TYPES = [
  { id: 'RECEITA', label: 'Receita', icon: TrendingUp, color: '#10b981' },
  { id: 'DESPESA', label: 'Despesa', icon: TrendingDown, color: '#ef4444' },
  { id: 'TRANSFERENCIA', label: 'Transferência', icon: ArrowRightLeft, color: '#6366f1' },
]

const CATEGORIES = {
  RECEITA: [
    { id: 'salario', label: 'Salário' },
    { id: 'freelance', label: 'Freelance' },
    { id: 'investimentos', label: 'Investimentos' },
    { id: 'outros', label: 'Outros' },
  ],
  DESPESA: [
    { id: 'alimentacao', label: 'Alimentação' },
    { id: 'assinatura', label: 'Assinatura' },
    { id: 'casa', label: 'Casa' },
    { id: 'compras', label: 'Compras' },
    { id: 'educacao', label: 'Educação' },
    { id: 'lazer', label: 'Lazer' },
    { id: 'operacao_bancaria', label: 'Operação bancária' },
    { id: 'outros', label: 'Outros' },
    { id: 'pix', label: 'Pix' },
    { id: 'saude', label: 'Saúde' },
    { id: 'servicos', label: 'Serviços' },
    { id: 'supermercado', label: 'Supermercado' },
    { id: 'transporte', label: 'Transporte' },
    { id: 'viagem', label: 'Viagem' },
  ],
}

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

export default function CreateFinanceModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    type: 'DESPESA',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
    category: 'alimentacao',
    account: 'conta-corrente',
    paymentMethod: 'pix',
    isInstallment: false,
    installmentCount: 2,
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.description.trim() || !formData.amount) return

    const amount = parseFloat(formData.amount.replace(',', '.'))
    if (isNaN(amount) || amount <= 0) return

    // Garante que installmentCount seja um número válido no envio
    const installmentCount = formData.isInstallment ? (Number(formData.installmentCount) || 2) : null;

    onSubmit({
      description: formData.description.trim(),
      amount: amount.toFixed(2),
      type: formData.type,
      category: formData.category,
      // Store at noon UTC so any ±12h timezone offset never shifts the calendar day
      date: formData.date + 'T12:00:00.000Z',
      isInstallment: formData.isInstallment,
      installmentCount: installmentCount,
      // installmentTotal = total purchase price (what the user entered), NOT price × N
      installmentTotal: formData.isInstallment ? amount.toFixed(2) : null,
    })

    setFormData({
      type: 'DESPESA',
      description: '',
      amount: '',
      date: new Date().toISOString().split('T')[0],
      category: 'alimentacao',
      account: 'conta-corrente',
      paymentMethod: 'pix',
      isInstallment: false,
      installmentCount: 2,
    })
    onClose()
  }

  const handleChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      
      if (field === 'type') {
        updated.category = value === 'RECEITA' ? 'salario' : 'alimentacao'
        updated.isInstallment = false
      }
      
      if (field === 'paymentMethod' && value !== 'credito') {
        updated.isInstallment = false
      }
      
      return updated
    })
  }

  const handleAmountChange = (e) => {
    const value = e.target.value.replace(/[^0-9,]/g, '')
    handleChange('amount', value)
  }

  const categories = formData.type === 'TRANSFERENCIA' ? [] : CATEGORIES[formData.type]

  return (
    <div className="finance-modal-overlay" onClick={onClose}>
      <div className="finance-modal" onClick={(e) => e.stopPropagation()}>
        <header className="finance-modal__header">
          <h2>Nova Transação</h2>
          <button className="finance-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <form className="finance-modal__form" onSubmit={handleSubmit}>
          <div className="finance-modal__field">
            <label>Tipo</label>
            <div className="finance-modal__types">
              {TRANSACTION_TYPES.map((type) => {
                const Icon = type.icon
                return (
                    <button
                    key={type.id}
                    type="button"
                    className={`finance-modal__type ${formData.type === type.id ? 'active' : ''}`}
                    onClick={() => handleChange('type', type.id)}
                    style={/** @type {any} */ ({ '--type-color': type.color })}
                  >
                    <Icon size={18} />
                    <span>{type.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="finance-modal__field">
            <label htmlFor="finance-description">Descrição</label>
            <input
              id="finance-description"
              type="text"
              placeholder="Ex: Almoço no restaurante"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              autoFocus
            />
          </div>

          <div className="finance-modal__row">
            <div className="finance-modal__field">
              <label htmlFor="finance-amount">Valor</label>
              <div className="finance-modal__amount-input">
                <span>R$</span>
                <input
                  id="finance-amount"
                  type="text"
                  placeholder="0,00"
                  value={formData.amount}
                  onChange={handleAmountChange}
                />
              </div>
            </div>

            <div className="finance-modal__field">
              <label htmlFor="finance-date">
                <Calendar size={14} />
                Data
              </label>
              <input
                id="finance-date"
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
              />
            </div>
          </div>

          <div className="finance-modal__row">
            <div className="finance-modal__field">
              <label htmlFor="finance-account">Conta/Cartão</label>
              <select
                id="finance-account"
                value={formData.account}
                onChange={(e) => handleChange('account', e.target.value)}
              >
                {ACCOUNTS.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.label}</option>
                ))}
              </select>
            </div>

            {categories && categories.length > 0 && (
              <div className="finance-modal__field">
                <label htmlFor="finance-category">
                  <Tag size={14} />
                  Categoria
                </label>
                <select
                  id="finance-category"
                  value={formData.category}
                  onChange={(e) => handleChange('category', e.target.value)}
                >
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.label}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {formData.type !== 'TRANSFERENCIA' && (
            <div className="finance-modal__field">
              <label>
                <CreditCard size={14} />
                Forma de Pagamento
              </label>
              <div className="finance-modal__payment-methods">
                {PAYMENT_METHODS.map(method => (
                  <button
                    key={method.id}
                    type="button"
                    className={`finance-modal__payment-method ${formData.paymentMethod === method.id ? 'active' : ''}`}
                    onClick={() => handleChange('paymentMethod', method.id)}
                  >
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
                  <input
                    type="checkbox"
                    checked={formData.isInstallment}
                    onChange={(e) => handleChange('isInstallment', e.target.checked)}
                  />
                  <Repeat size={16} />
                  <span>Parcelar compra</span>
                </label>
              </div>

              {formData.isInstallment && (
                <div className="finance-modal__installment">
                  <div className="finance-modal__field">
                    <label htmlFor="finance-installments">Número de parcelas</label>
                    <input
                      id="finance-installments"
                      type="number"
                      min="2"
                      max="48"
                      value={formData.installmentCount}
                      // CORREÇÃO 1: Trata campo vazio para não gerar NaN
                      onChange={(e) => handleChange('installmentCount', e.target.value === '' ? '' : parseInt(e.target.value))}
                    />
                  </div>
                  {formData.amount && (
                    <div className="finance-modal__installment-info">
                      <p>
                        {formData.installmentCount || 0}x de <strong>R$ {((parseFloat(formData.amount.replace(',', '.') || '0')) / (formData.installmentCount || 1)).toFixed(2).replace('.', ',')}</strong>
                      </p>
                      <p className="finance-modal__installment-total">
                        Total: R$ {(parseFloat(formData.amount.replace(',', '.') || '0')).toFixed(2).replace('.', ',')}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="finance-modal__actions">
            <button type="button" className="finance-modal__cancel" onClick={onClose}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className="finance-modal__submit"
              disabled={!formData.description.trim() || !formData.amount}
            >
              Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}