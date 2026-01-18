import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import {
  ResponsiveContainer,
  LineChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import TopNav from '../../components/TopNav/TopNav.jsx'

import './Finance.css'

const MONTHS = [
  { value: '01', label: 'Janeiro' },
  { value: '02', label: 'Fevereiro' },
  { value: '03', label: 'Março' },
  { value: '04', label: 'Abril' },
  { value: '05', label: 'Maio' },
  { value: '06', label: 'Junho' },
  { value: '07', label: 'Julho' },
  { value: '08', label: 'Agosto' },
  { value: '09', label: 'Setembro' },
  { value: '10', label: 'Outubro' },
  { value: '11', label: 'Novembro' },
  { value: '12', label: 'Dezembro' },
]

const YEARS = ['2024', '2025', '2026']

const CATEGORY_OPTIONS = [
  { id: 'operacoes', label: 'Operações' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'pessoal', label: 'Pessoal' },
  { id: 'education', label: 'Educação' },
  { id: 'lazer', label: 'Lazer' },
]

const PIE_COLORS = ['#ff4800', '#ff8d00', '#ffc241', '#7c88ff', '#5cd1b3']

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value || 0)

const parseNumber = (value) => {
  const parsed = typeof value === 'number' ? value : Number(String(value).replace(/[^0-9.-]/g, ''))
  return Number.isNaN(parsed) ? 0 : parsed
}

const formatDate = (value) => {
  if (!value) return '--'
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short' }).format(new Date(value))
}

const generateInstallmentSchedule = (dateString, count, dueDay) => {
  const baseDate = dateString ? new Date(dateString) : new Date()
  const installments = []
  for (let index = 0; index < count; index += 1) {
    const projected = new Date(baseDate)
    projected.setMonth(projected.getMonth() + index)
    projected.setDate(dueDay ?? projected.getDate())
    installments.push(
      new Intl.DateTimeFormat('pt-BR', { month: 'short', year: 'numeric' }).format(projected).replace('.', '')
    )
  }
  return installments
}

const createDefaultForm = (type = 'receita') => ({
  type,
  description: '',
  amount: '',
  category: CATEGORY_OPTIONS[0].id,
  date: new Date().toISOString().slice(0, 10),
  isInstallment: false,
  totalAmount: '',
  installmentCount: '2',
})

const generateId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()))

const categoryLabelMap = CATEGORY_OPTIONS.reduce((acc, category) => ({ ...acc, [category.id]: category.label }), {})

export default function Finance({ user, onNavigate, onLogout }) {
  const { finances, addFinance, updateFinance, deleteFinance, loading } = useApp()
  const [selectedMonth, setSelectedMonth] = useState('12')
  const [selectedYear, setSelectedYear] = useState('2025')

  const [isTransactionModalOpen, setTransactionModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('receita')
  const [formData, setFormData] = useState(createDefaultForm())
  const [editingTransactionId, setEditingTransactionId] = useState(null)

  const currentMonthMeta = useMemo(() => MONTHS.find((month) => month.value === selectedMonth), [selectedMonth])

  const handleShiftMonth = (direction) => {
    setSelectedMonth((prevMonth) => {
      let monthIndex = MONTHS.findIndex((month) => month.value === prevMonth)
      if (monthIndex === -1) monthIndex = 0
      monthIndex += direction
      let yearDelta = 0
      if (monthIndex < 0) {
        monthIndex = MONTHS.length - 1
        yearDelta = -1
      } else if (monthIndex >= MONTHS.length) {
        monthIndex = 0
        yearDelta = 1
      }

      const currentYearIndex = YEARS.indexOf(selectedYear)
      const hitsLowerBound = yearDelta < 0 && currentYearIndex === 0
      const hitsUpperBound = yearDelta > 0 && currentYearIndex === YEARS.length - 1
      if (hitsLowerBound || hitsUpperBound) {
        return prevMonth
      }

      if (yearDelta !== 0) {
        setSelectedYear((prevYear) => {
          const yearIndex = YEARS.indexOf(prevYear)
          const nextIndex = Math.min(Math.max(yearIndex + yearDelta, 0), YEARS.length - 1)
          return YEARS[nextIndex] ?? prevYear
        })
      }
      return MONTHS[monthIndex].value
    })
  }

  const periodKey = `${selectedYear}-${selectedMonth}`
  const periodLabel = `${currentMonthMeta?.label ?? ''} · ${selectedYear}`

  const filteredTransactions = useMemo(() => {
    return finances
      .map(t => ({
        ...t,
        amount: typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount),
        date: t.date instanceof Date ? t.date.toISOString().split('T')[0] : new Date(t.date).toISOString().split('T')[0]
      }))
      .filter((transaction) => transaction.date.startsWith(periodKey))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [finances, periodKey])

  const monthlyRevenue = useMemo(
    () => filteredTransactions.filter((item) => item.type === 'receita').reduce((sum, item) => sum + item.amount, 0),
    [filteredTransactions]
  )

  const monthlyExpenses = useMemo(
    () => filteredTransactions.filter((item) => item.type === 'DESPESA').reduce((sum, item) => sum + item.amount, 0),
    [filteredTransactions]
  )

  const kpiMetrics = useMemo(
    () => [
      {
        id: 'balance',
        label: 'Saldo do mês',
        value: formatCurrency(monthlyRevenue - monthlyExpenses),
        helper: 'Receitas - Despesas',
      },
      {
        id: 'revenue',
        label: 'Receitas do mês',
        value: formatCurrency(monthlyRevenue),
        helper: `${filteredTransactions.filter((item) => item.type === 'RECEITA').length} entradas`,
      },
      {
        id: 'expense',
        label: 'Despesas do mês',
        value: formatCurrency(monthlyExpenses),
        helper: `${filteredTransactions.filter((item) => item.type === 'DESPESA').length} saídas`,
      },
    ],
    [monthlyRevenue, monthlyExpenses, filteredTransactions]
  )

  const categoryBreakdown = useMemo(() => {
    const breakdown = {}
    filteredTransactions
      .filter(t => t.type === 'DESPESA')
      .forEach(t => {
        if (!breakdown[t.category]) {
          breakdown[t.category] = {
            id: t.category,
            label: categoryLabelMap[t.category] || t.category,
            value: 0
          }
        }
        breakdown[t.category].value += t.amount
      })
    return Object.values(breakdown).sort((a, b) => b.value - a.value)
  }, [filteredTransactions])

  const cashflowSeries = useMemo(() => {
    const series = []
    for (let i = 0; i < 12; i++) {
      const monthValue = String(i + 1).padStart(2, '0')
      const monthKey = `${selectedYear}-${monthValue}`
      const monthTransactions = finances
        .map(t => ({
          ...t,
          amount: typeof t.amount === 'string' ? parseFloat(t.amount) : Number(t.amount),
          date: t.date instanceof Date ? t.date.toISOString().split('T')[0] : new Date(t.date).toISOString().split('T')[0]
        }))
        .filter(t => t.date.startsWith(monthKey))
      
      const receitas = monthTransactions.filter(t => t.type === 'RECEITA').reduce((sum, t) => sum + t.amount, 0)
      const despesas = monthTransactions.filter(t => t.type === 'DESPESA').reduce((sum, t) => sum + t.amount, 0)
      
      series.push({
        name: MONTHS[i].label.substring(0, 3),
        receitas,
        despesas
      })
    }
    return series
  }, [finances, selectedYear])

  const selectedCard = null

  const installmentDetails = useMemo(() => {
    if (!formData.isInstallment) return null
    const installmentCount = Math.max(2, Number(formData.installmentCount) || 2)
    const total = parseNumber(formData.totalAmount || formData.amount)
    if (!total) return null
    const valuePerInstallment = total / installmentCount
    return { total, installmentCount, valuePerInstallment }
  }, [formData])

  const handleOpenTransactionModal = (type = 'receita') => {
    setTransactionModalOpen(true)
    setActiveTab(type)
    setEditingTransactionId(null)
    setFormData(createDefaultForm(type))
    setTagDraft('')
  }

  const handleEditTransaction = (transaction) => {
    setTransactionModalOpen(true)
    setActiveTab(transaction.type.toLowerCase())
    setEditingTransactionId(transaction.id)
    setFormData({
      ...createDefaultForm(transaction.type.toLowerCase()),
      description: transaction.description,
      amount: transaction.amount.toString(),
      category: transaction.category,
      date: transaction.date,
      isInstallment: transaction.isInstallment || false,
      installmentCount: transaction.installmentCount ? String(transaction.installmentCount) : '2',
      totalAmount: transaction.installmentTotal ? transaction.installmentTotal.toString() : '',
    })
  }

  const closeTransactionModal = () => {
    setTransactionModalOpen(false)
    setEditingTransactionId(null)
    setFormData(createDefaultForm(activeTab))
  }

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTransactionSubmit = async (event) => {
    event.preventDefault()
    const amount = parseNumber(formData.amount)
    if (!amount || !formData.description) return

    const payload = {
      type: activeTab.toUpperCase(),
      description: formData.description,
      category: formData.category,
      date: formData.date,
      amount,
      isInstallment: formData.isInstallment || false,
      installmentCount: formData.isInstallment ? Math.max(1, Number(formData.installmentCount) || 1) : null,
      installmentTotal: formData.isInstallment && installmentDetails ? installmentDetails.total : null,
    }

    try {
      if (editingTransactionId) {
        await updateFinance(editingTransactionId, payload)
      } else {
        await addFinance(payload)
      }
      closeTransactionModal()
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
    }
  }

  const handleDeleteTransaction = async (transactionId) => {
    if (!window.confirm('Deseja mesmo excluir esta transação?')) return
    try {
      await deleteFinance(transactionId)
    } catch (error) {
      console.error('Erro ao excluir transação:', error)
    }
  }

  return (
    <div className="financePage">
      <TopNav user={user} active="Financeiro" onNavigate={onNavigate} onLogout={onLogout} />

      <div className="financeWrapper">
        <section className="financeHeader ui-card">
          <section className="financeKpis">
            {kpiMetrics.map((kpi) => (
              <article key={kpi.id} className="financeKpi__card">
                <p>{kpi.label}</p>
                <strong>{kpi.value}</strong>
                <span>{kpi.helper}</span>
              </article>
            ))}
          </section>
          <div className="financeHeader__controls">
            <div className="financeHeader__carousel" aria-label="Selecionar período">
              <button type="button" aria-label="Mês anterior" onClick={() => handleShiftMonth(-1)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M15 19l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="financeHeader__period">
                <strong>{currentMonthMeta?.label}</strong>
                <span>{selectedYear}</span>
              </div>
              <button type="button" aria-label="Próximo mês" onClick={() => handleShiftMonth(1)}>
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>
        </section>

      <section className="financeAnalytics">
        <article className="ui-card financeChart">
          <header>
            <div>
              <p>Evolução anual</p>
              <h2>Receitas x Despesas</h2>
            </div>
            <span>{selectedYear}</span>
          </header>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={cashflowSeries} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
              <Tooltip formatter={(value) => formatCurrency(value)} labelFormatter={(label) => `Mês ${label}`} />
              <Legend />
              <Line type="monotone" dataKey="receita" stroke="#ff4800" strokeWidth={3} dot={false} name="Receitas" />
              <Line type="monotone" dataKey="despesa" stroke="#1c2a44" strokeWidth={3} dot={false} name="Despesas" />
            </LineChart>
          </ResponsiveContainer>
        </article>

        <article className="ui-card financeChart">
          <header>
            <div>
              <p>Distribuição</p>
              <h2>Gastos por categoria</h2>
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setBudgetModalOpen(true)}>
              Categorias & limites
            </button>
          </header>
          <div className="financeChart__split">
            <div className="financeChart__pie">
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={categoryBreakdown}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    {categoryBreakdown.map((entry, index) => (
                      <Cell key={entry.id} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="financeChart__legend">
              {categoryBreakdown.map((entry, index) => (
                <li key={entry.id}>
                  <span style={{ background: PIE_COLORS[index % PIE_COLORS.length] }} />
                  <div>
                    <strong>{entry.label}</strong>
                    <small>{formatCurrency(entry.value)}</small>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </article>
      </section>

      <section className="financeTransactions ui-card">
        <header>
          <div>
            <p>Transações recentes</p>
            <h2>Últimas movimentações</h2>
          </div>
          <button type="button" className="btn btn--secondary" onClick={() => handleOpenTransactionModal('receita')}>
            Nova transação
          </button>
        </header>
        <table>
          <thead>
            <tr>
              <th>Descrição</th>
              <th>Categoria</th>
              <th>Data</th>
              <th>Valor</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan="5" style={{textAlign: 'center', padding: '40px'}}>
                  Nenhuma transação neste período. Clique em "Nova transação" para adicionar.
                </td>
              </tr>
            )}
            {filteredTransactions.slice(0, 8).map((transaction) => (
              <tr key={transaction.id}>
                <td>
                  <div className="cellMain">
                    <span className={`pill pill--${transaction.type.toLowerCase()}`}>{transaction.type}</span>
                    <div>
                      <strong>{transaction.description}</strong>
                    </div>
                  </div>
                </td>
                <td>{categoryLabelMap[transaction.category] || transaction.category}</td>
                <td>{formatDate(transaction.date)}</td>
                <td className={transaction.type === 'DESPESA' ? 'negative' : 'positive'}>
                  {transaction.type === 'DESPESA' ? '-' : '+'}
                  {formatCurrency(transaction.amount)}
                </td>
                <td>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => handleEditTransaction(transaction)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className="btn btn--ghost btn--sm"
                    onClick={() => handleDeleteTransaction(transaction.id)}
                    style={{marginLeft: '8px', color: '#ef4444'}}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {isTransactionModalOpen && (
        <div className="financeModal__backdrop" role="dialog" aria-modal="true">
          <form className="financeModal" onSubmit={handleTransactionSubmit}>
            <header>
              <div>
                <p>Nova transação</p>
                <h3>Modal inteligente</h3>
              </div>
              <button type="button" className="btn btn--ghostInverse btn--sm" onClick={closeTransactionModal}>
                Fechar
              </button>
            </header>

            <div className="financeModal__tabs">
              {['receita', 'despesa', 'transferencia'].map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={activeTab === tab ? 'is-active' : ''}
                  onClick={() => {
                    setActiveTab(tab)
                    handleFormChange('type', tab)
                  }}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <section className="financeModal__section">
              <h4>Detalhes</h4>
              <div className="financeModal__grid">
                <label>
                  <span>Valor</span>
                  <input
                    type="number"
                    inputMode="decimal"
                    value={formData.amount}
                    onChange={(event) => handleFormChange('amount', event.target.value)}
                    required
                  />
                </label>
                <label>
                  <span>Descrição</span>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(event) => handleFormChange('description', event.target.value)}
                    placeholder="Ex: Pagamento SaaS"
                    required
                  />
                </label>
                <label>
                  <span>Categoria</span>
                  <select value={formData.category} onChange={(event) => handleFormChange('category', event.target.value)}>
                    {CATEGORY_OPTIONS.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Meta financeira (opcional)</span>
                  <select value={formData.goalId} onChange={(event) => handleFormChange('goalId', event.target.value)}>
                    <option value="">Nenhuma</option>
                    {GOALS.map((goal) => (
                      <option key={goal.id} value={goal.id}>
                        {goal.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Data</span>
                  <input type="date" value={formData.date} onChange={(event) => handleFormChange('date', event.target.value)} />
                </label>
                <label className="checkboxField">
                  <input
                    type="checkbox"
                    checked={formData.recurring}
                    onChange={(event) => handleFormChange('recurring', event.target.checked)}
                  />
                  <span>Transação recorrente</span>
                </label>
                <label>
                  <span>Status</span>
                  <select value={formData.status} onChange={(event) => handleFormChange('status', event.target.value)}>
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  <span>Conta</span>
                  <input
                    type="text"
                    value={formData.account}
                    onChange={(event) => handleFormChange('account', event.target.value)}
                  />
                </label>
              </div>
            </section>

            <section className="financeModal__section">
              <h4>Tags & notas</h4>
              <div className="financeModal__tags">
                <div className="tagInput">
                  <input
                    type="text"
                    value={tagDraft}
                    onChange={(event) => setTagDraft(event.target.value)}
                    onKeyDown={handleTagKeyDown}
                    placeholder="Adicionar tag e pressione Enter"
                  />
                  <button type="button" onClick={handleTagAdd}>
                    Adicionar
                  </button>
                </div>
                {formData.tags.length ? (
                  <div className="tagChips">
                    {formData.tags.map((tag) => (
                      <span key={tag} onClick={() => handleTagRemove(tag)}>
                        #{tag}
                      </span>
                    ))}
                  </div>
                ) : null}
                <div className="tagSuggestions">
                  {TAG_SUGGESTIONS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      className={formData.tags.includes(tag) ? 'selected' : ''}
                      onClick={() => {
                        if (!formData.tags.includes(tag)) {
                          setFormData((prev) => ({ ...prev, tags: [...prev.tags, tag] }))
                        }
                      }}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            </section>

            <section className="financeModal__section">
              <h4>Forma de pagamento</h4>
              <div className="paymentMethods">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method.id}
                    type="button"
                    className={formData.paymentMethod === method.id ? 'is-active' : ''}
                    onClick={() => handleFormChange('paymentMethod', method.id)}
                  >
                    <strong>{method.label}</strong>
                    <small>{method.helper}</small>
                  </button>
                ))}
              </div>

              {formData.paymentMethod === 'credit' && (
                <div className="creditFields">
                  <label>
                    <span>Qual cartão?</span>
                    <select value={formData.cardId} onChange={(event) => handleFormChange('cardId', event.target.value)} required>
                      <option value="">Selecione</option>
                      {cards.map((card) => (
                        <option key={card.id} value={card.id}>
                          {card.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="checkboxField">
                    <input
                      type="checkbox"
                      checked={formData.isInstallment}
                      onChange={(event) => handleFormChange('isInstallment', event.target.checked)}
                    />
                    <span>Compra parcelada?</span>
                  </label>

                  {formData.isInstallment && (
                    <div className="installmentGrid">
                      <label>
                        <span>Valor total da compra</span>
                        <input
                          type="number"
                          inputMode="decimal"
                          value={formData.totalAmount}
                          onChange={(event) => handleFormChange('totalAmount', event.target.value)}
                        />
                      </label>
                      <label>
                        <span>Número de parcelas</span>
                        <input
                          type="number"
                          min="1"
                          value={formData.installmentCount}
                          onChange={(event) => handleFormChange('installmentCount', event.target.value)}
                        />
                      </label>
                    </div>
                  )}

                  {installmentDetails && (
                    <div className="financeModal__summary">
                      <p>
                        Serão criadas <strong>{installmentDetails.installmentCount} parcelas</strong> de{' '}
                        <strong>{formatCurrency(installmentDetails.valuePerInstallment)}</strong>
                      </p>
                      <small>Projeção: {installmentDetails.schedule.join(' · ')}</small>
                    </div>
                  )}
                </div>
              )}
            </section>

            <footer className="financeModal__footer">
              <button type="button" className="btn btn--ghostInverse" onClick={closeTransactionModal}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primary">
                Salvar transação
              </button>
            </footer>
          </form>
        </div>
      )}
      </div>
    </div>
  )
}
