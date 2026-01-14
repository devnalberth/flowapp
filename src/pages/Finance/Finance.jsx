import { useMemo, useState } from 'react'
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

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Dinheiro', helper: 'Pagamentos à vista' },
  { id: 'pix', label: 'Pix', helper: 'Instantâneo' },
  { id: 'debit', label: 'Débito', helper: 'Conta corrente' },
  { id: 'credit', label: 'Cartão de crédito', helper: 'Fatura mensal' },
]

const STATUS_OPTIONS = ['Conciliado', 'Agendado', 'Em revisão', 'Fatura aberta', 'Liquidado']

const CATEGORY_OPTIONS = [
  { id: 'operacoes', label: 'Operações' },
  { id: 'marketing', label: 'Marketing' },
  { id: 'pessoal', label: 'Pessoal' },
  { id: 'education', label: 'Educação' },
  { id: 'lazer', label: 'Lazer' },
]

const GOALS = [
  { id: 'meta1', label: 'Reserva 6 meses' },
  { id: 'meta2', label: 'Meta Q1 Growth' },
  { id: 'meta3', label: 'Viagem Squad' },
]

const TAG_SUGGESTIONS = ['fixo', 'software', 'cartao', 'mentoria', 'aluguel']

const CASHFLOW_SERIES = [
  { month: 'Jan', receita: 22000, despesa: 16800 },
  { month: 'Fev', receita: 24000, despesa: 17600 },
  { month: 'Mar', receita: 25500, despesa: 18500 },
  { month: 'Abr', receita: 26200, despesa: 19100 },
  { month: 'Mai', receita: 27800, despesa: 20500 },
  { month: 'Jun', receita: 29000, despesa: 21400 },
  { month: 'Jul', receita: 30100, despesa: 22200 },
  { month: 'Ago', receita: 31200, despesa: 22700 },
  { month: 'Set', receita: 31800, despesa: 23300 },
  { month: 'Out', receita: 32700, despesa: 24100 },
  { month: 'Nov', receita: 33400, despesa: 24800 },
  { month: 'Dez', receita: 34400, despesa: 25900 },
]

const CATEGORY_BREAKDOWN = [
  { id: 'operacoes', label: 'Operações', value: 8200 },
  { id: 'marketing', label: 'Marketing', value: 5400 },
  { id: 'education', label: 'Educação', value: 3100 },
  { id: 'pessoal', label: 'Pessoal', value: 2800 },
  { id: 'lazer', label: 'Lazer', value: 1700 },
]

const INITIAL_BUDGETS = [
  { id: 'operacoes', label: 'Operações', ceiling: 8000, spent: 6200 },
  { id: 'marketing', label: 'Marketing', ceiling: 6000, spent: 4800 },
  { id: 'education', label: 'Educação', ceiling: 3000, spent: 2950 },
  { id: 'pessoal', label: 'Pessoal', ceiling: 4000, spent: 2200 },
]

const INITIAL_TRANSACTIONS = [
  {
    id: 't-01',
    type: 'receita',
    description: 'Consultoria Flow OS',
    category: 'operacoes',
    date: '2025-12-05',
    amount: 12000,
    account: 'Banco Inter PJ',
    paymentMethod: 'pix',
    status: 'Conciliado',
    tags: ['software', 'recorrente'],
    goalId: 'meta2',
  },
  {
    id: 't-02',
    type: 'receita',
    description: 'Mentoria Squad 12',
    category: 'education',
    date: '2025-12-11',
    amount: 4800,
    account: 'Stripe',
    paymentMethod: 'pix',
    status: 'Conciliado',
    tags: ['mentoria'],
  },
  {
    id: 't-03',
    type: 'despesa',
    description: 'Infra + SaaS',
    category: 'operacoes',
    date: '2025-12-09',
    amount: 3450,
    account: 'Flow Visa Infinite',
    paymentMethod: 'credit',
    status: 'Fatura aberta',
    cardId: 'card-flow',
    tags: ['software'],
  },
  {
    id: 't-04',
    type: 'despesa',
    description: 'Marketing performance',
    category: 'marketing',
    date: '2025-12-13',
    amount: 4300,
    account: 'Nu Empresarial',
    paymentMethod: 'credit',
    status: 'Agendado',
    cardId: 'card-nu',
    tags: ['paid'],
  },
  {
    id: 't-05',
    type: 'despesa',
    description: 'Backup equipe remota',
    category: 'pessoal',
    date: '2025-12-18',
    amount: 2620,
    account: 'Banco Inter PJ',
    paymentMethod: 'pix',
    status: 'Conciliado',
    tags: ['fixo'],
    goalId: 'meta1',
  },
  {
    id: 't-06',
    type: 'receita',
    description: 'Conteúdo patrocinado',
    category: 'marketing',
    date: '2025-12-22',
    amount: 2920,
    account: 'PayPal',
    paymentMethod: 'pix',
    status: 'Em revisão',
    tags: ['conteudo'],
  },
]

const INITIAL_CARDS = [
  { id: 'card-flow', name: 'Flow Visa Infinite', brand: 'Visa', limit: 25000, used: 0.58, closingDay: 2, dueDay: 10 },
  { id: 'card-nu', name: 'Nu Empresarial', brand: 'Mastercard', limit: 18000, used: 0.41, closingDay: 28, dueDay: 5 },
  { id: 'card-black', name: 'Pessoal Black', brand: 'Visa', limit: 12000, used: 0.73, closingDay: 7, dueDay: 15 },
]

const PIE_COLORS = ['#ff4800', '#ff8d00', '#ffc241', '#7c88ff', '#5cd1b3']
const BASE_BALANCE = 148200

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
  id: null,
  type,
  description: '',
  amount: '',
  category: CATEGORY_OPTIONS[0].id,
  tags: [],
  goalId: '',
  date: new Date().toISOString().slice(0, 10),
  recurring: false,
  paymentMethod: 'pix',
  account: 'Banco Inter PJ',
  status: STATUS_OPTIONS[0],
  cardId: '',
  isInstallment: false,
  totalAmount: '',
  installmentCount: '1',
  notes: '',
})

const generateId = () => (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now()))

const paymentLabelMap = PAYMENT_METHODS.reduce((acc, method) => ({ ...acc, [method.id]: method.label }), {})
const categoryLabelMap = CATEGORY_OPTIONS.reduce((acc, category) => ({ ...acc, [category.id]: category.label }), {})

export default function Finance({ user, onNavigate }) {
  const [selectedMonth, setSelectedMonth] = useState('12')
  const [selectedYear, setSelectedYear] = useState('2025')
  const [transactions, setTransactions] = useState(INITIAL_TRANSACTIONS)
  const [cards, setCards] = useState(INITIAL_CARDS)
  const [budgets, setBudgets] = useState(INITIAL_BUDGETS)

  const [isTransactionModalOpen, setTransactionModalOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('receita')
  const [formData, setFormData] = useState(createDefaultForm())
  const [editingTransactionId, setEditingTransactionId] = useState(null)
  const [tagDraft, setTagDraft] = useState('')

  const [isCardModalOpen, setCardModalOpen] = useState(false)
  const [cardForm, setCardForm] = useState({ name: '', brand: '', closingDay: '1', dueDay: '10', limit: '' })

  const [isBudgetModalOpen, setBudgetModalOpen] = useState(false)
  const [budgetForm, setBudgetForm] = useState({ category: CATEGORY_OPTIONS[0].id, limit: '' })

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
    return transactions
      .filter((transaction) => transaction.date.startsWith(periodKey))
      .sort((a, b) => new Date(b.date) - new Date(a.date))
  }, [transactions, periodKey])

  const monthlyRevenue = useMemo(
    () => filteredTransactions.filter((item) => item.type === 'receita').reduce((sum, item) => sum + item.amount, 0),
    [filteredTransactions]
  )

  const monthlyExpenses = useMemo(
    () => filteredTransactions.filter((item) => item.type === 'despesa').reduce((sum, item) => sum + item.amount, 0),
    [filteredTransactions]
  )

  const creditUsage = useMemo(() => {
    const totalLimit = cards.reduce((acc, card) => acc + card.limit, 0)
    const used = cards.reduce((acc, card) => acc + card.limit * card.used, 0)
    return { totalLimit, used, available: totalLimit - used }
  }, [cards])

  const openCardInvoices = useMemo(
    () => transactions.filter((t) => t.paymentMethod === 'credit' && t.status !== 'Liquidado').reduce((sum, t) => sum + t.amount, 0),
    [transactions]
  )

  const kpiMetrics = useMemo(
    () => [
      {
        id: 'balance',
        label: 'Saldo atual',
        value: formatCurrency(BASE_BALANCE + monthlyRevenue - monthlyExpenses),
        helper: 'Consolidado geral',
      },
      {
        id: 'revenue',
        label: 'Receitas do mês',
        value: formatCurrency(monthlyRevenue),
        helper: `${filteredTransactions.filter((item) => item.type === 'receita').length} entradas`,
      },
      {
        id: 'expense',
        label: 'Despesas do mês',
        value: formatCurrency(monthlyExpenses),
        helper: `${filteredTransactions.filter((item) => item.type === 'despesa').length} saídas`,
      },
      {
        id: 'invoice',
        label: 'Faturas abertas',
        value: formatCurrency(openCardInvoices),
        helper: 'Cartões em uso',
      },
      {
        id: 'limit',
        label: 'Limite disponível',
        value: formatCurrency(creditUsage.available),
        helper: formatCurrency(creditUsage.totalLimit),
      },
    ],
    [monthlyRevenue, monthlyExpenses, filteredTransactions, openCardInvoices, creditUsage]
  )

  const selectedCard = useMemo(() => cards.find((card) => card.id === formData.cardId), [cards, formData.cardId])

  const installmentDetails = useMemo(() => {
    if (formData.paymentMethod !== 'credit' || !selectedCard) return null
    if (!formData.isInstallment) return null
    const installmentCount = Math.max(1, Number(formData.installmentCount) || 1)
    const total = parseNumber(formData.totalAmount || formData.amount)
    if (!total) return null
    const valuePerInstallment = total / installmentCount
    const schedule = generateInstallmentSchedule(formData.date, installmentCount, selectedCard.dueDay)
    return { total, installmentCount, valuePerInstallment, schedule }
  }, [formData, selectedCard])

  const handleOpenTransactionModal = (type = 'receita') => {
    setTransactionModalOpen(true)
    setActiveTab(type)
    setEditingTransactionId(null)
    setFormData(createDefaultForm(type))
    setTagDraft('')
  }

  const handleEditTransaction = (transaction) => {
    setTransactionModalOpen(true)
    setActiveTab(transaction.type)
    setEditingTransactionId(transaction.id)
    setFormData({
      ...createDefaultForm(transaction.type),
      ...transaction,
      amount: transaction.amount.toString(),
      totalAmount: transaction.installments && transaction.installments > 1 ? (transaction.installmentValue * transaction.installments).toString() : '',
      installmentCount: transaction.installments ? String(transaction.installments) : '1',
      isInstallment: Boolean(transaction.installments && transaction.installments > 1),
    })
    setTagDraft('')
  }

  const closeTransactionModal = () => {
    setTransactionModalOpen(false)
    setEditingTransactionId(null)
    setFormData(createDefaultForm(activeTab))
    setTagDraft('')
  }

  const handleFormChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleTagAdd = () => {
    const value = tagDraft.trim()
    if (!value || formData.tags.includes(value)) return
    setFormData((prev) => ({ ...prev, tags: [...prev.tags, value] }))
    setTagDraft('')
  }

  const handleTagKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault()
      handleTagAdd()
    }
  }

  const handleTagRemove = (tag) => {
    setFormData((prev) => ({ ...prev, tags: prev.tags.filter((item) => item !== tag) }))
  }

  const handleTransactionSubmit = (event) => {
    event.preventDefault()
    const amount = parseNumber(formData.amount)
    if (!amount || !formData.description) return

    const payload = {
      id: editingTransactionId ?? generateId(),
      type: activeTab,
      description: formData.description,
      category: formData.category,
      date: formData.date,
      amount,
      account: formData.account,
      paymentMethod: formData.paymentMethod,
      status: formData.status,
      tags: formData.tags,
      goalId: formData.goalId,
      recurring: formData.recurring,
      cardId: formData.paymentMethod === 'credit' ? formData.cardId : undefined,
      installments:
        formData.paymentMethod === 'credit' && formData.isInstallment ? Math.max(1, Number(formData.installmentCount) || 1) : 1,
      installmentValue:
        formData.paymentMethod === 'credit' && formData.isInstallment && installmentDetails
          ? installmentDetails.valuePerInstallment
          : amount,
    }

    setTransactions((prev) => {
      if (editingTransactionId) {
        return prev.map((transaction) => (transaction.id === editingTransactionId ? payload : transaction))
      }
      return [payload, ...prev]
    })

    closeTransactionModal()
  }

  const handleCardSubmit = (event) => {
    event.preventDefault()
    if (!cardForm.name || !cardForm.limit) return
    setCards((prev) => [
      ...prev,
      {
        id: generateId(),
        name: cardForm.name,
        brand: cardForm.brand || 'Outro',
        limit: parseNumber(cardForm.limit),
        used: 0,
        closingDay: Number(cardForm.closingDay) || 1,
        dueDay: Number(cardForm.dueDay) || 10,
      },
    ])
    setCardForm({ name: '', brand: '', closingDay: '1', dueDay: '10', limit: '' })
    setCardModalOpen(false)
  }

  const handleBudgetSubmit = (event) => {
    event.preventDefault()
    if (!budgetForm.limit) return
    const limitValue = parseNumber(budgetForm.limit)
    setBudgets((prev) => {
      const exists = prev.find((item) => item.id === budgetForm.category)
      if (exists) {
        return prev.map((item) => (item.id === budgetForm.category ? { ...item, ceiling: limitValue } : item))
      }
      return [
        ...prev,
        {
          id: budgetForm.category,
          label: categoryLabelMap[budgetForm.category] ?? 'Categoria',
          ceiling: limitValue,
          spent: 0,
        },
      ]
    })
    setBudgetForm({ category: CATEGORY_OPTIONS[0].id, limit: '' })
    setBudgetModalOpen(false)
  }

  return (
    <div className="financePage">
      <TopNav user={user} active="Financeiro" onNavigate={onNavigate} />

      <section className="financeHeader ui-card">
        <div>
          <p>Saúde financeira</p>
          <h1>Finanças · {periodLabel}</h1>
        </div>
        <div className="financeHeader__controls">
          <div className="financeHeader__carousel" aria-label="Selecionar período">
            <button type="button" aria-label="Mês anterior" onClick={() => handleShiftMonth(-1)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M15 19l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div>
              <strong>{currentMonthMeta?.label}</strong>
              <span>{selectedYear}</span>
            </div>
            <button type="button" aria-label="Próximo mês" onClick={() => handleShiftMonth(1)}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>
          <button type="button" className="btn btn--primary" onClick={() => handleOpenTransactionModal('receita')}>
            Nova transação
          </button>
        </div>
      </section>

      <section className="financeKpis">
        {kpiMetrics.map((kpi) => (
          <article key={kpi.id} className="ui-card">
            <p>{kpi.label}</p>
            <strong>{kpi.value}</strong>
            <span>{kpi.helper}</span>
          </article>
        ))}
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
            <LineChart data={CASHFLOW_SERIES} margin={{ top: 10, right: 10, bottom: 0, left: -10 }}>
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
                    data={CATEGORY_BREAKDOWN}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                  >
                    {CATEGORY_BREAKDOWN.map((entry, index) => (
                      <Cell key={entry.id} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="financeChart__legend">
              {CATEGORY_BREAKDOWN.map((entry, index) => (
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

        <article className="ui-card financeBudgets">
          <header>
            <div>
              <p>Limites</p>
              <h2>Budget vs realizado</h2>
            </div>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setBudgetModalOpen(true)}>
              Gerenciar limites
            </button>
          </header>
          <div className="financeBudgets__list">
            {budgets.map((budget) => {
              const progress = Math.min(100, Math.round((budget.spent / budget.ceiling) * 100))
              const isAlert = budget.spent >= budget.ceiling
              return (
                <article key={budget.id} className={isAlert ? 'is-alert' : ''}>
                  <div>
                    <strong>{budget.label}</strong>
                    <span>
                      {formatCurrency(budget.spent)} / {formatCurrency(budget.ceiling)}
                    </span>
                  </div>
                  <div className="budgetBar">
                    <span style={{ width: `${progress}%` }} />
                  </div>
                </article>
              )
            })}
          </div>
        </article>
      </section>

      <section className="financeCardsPanel ui-card">
        <header>
          <div>
            <p>Cartões de crédito</p>
            <h2>Limites e fechamento</h2>
          </div>
          <button type="button" className="btn btn--ghost btn--sm" onClick={() => setCardModalOpen(true)}>
            Gerenciar cartões
          </button>
        </header>
        <div className="financeCardsPanel__grid">
          {cards.map((card) => {
            const usedPercent = Math.round(card.used * 100)
            const available = card.limit - card.limit * card.used
            return (
              <article key={card.id}>
                <div className="financeCard__head">
                  <h3>{card.name}</h3>
                  <span>{formatCurrency(card.limit)}</span>
                </div>
                <div className="financeCard__usage">
                  <div className="budgetBar">
                    <span style={{ width: `${usedPercent}%` }} />
                  </div>
                  <div className="financeCard__meta">
                    <small>Utilizado</small>
                    <strong>{usedPercent}%</strong>
                    <small>Disponível</small>
                    <strong>{formatCurrency(available)}</strong>
                  </div>
                </div>
                <footer>
                  <div>
                    <p>Fechamento</p>
                    <strong>Dia {card.closingDay}</strong>
                  </div>
                  <div>
                    <p>Vencimento</p>
                    <strong>Dia {card.dueDay}</strong>
                  </div>
                </footer>
              </article>
            )
          })}
        </div>
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
              <th>Pagamento</th>
              <th>Valor</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.slice(0, 8).map((transaction) => (
              <tr key={transaction.id}>
                <td>
                  <div className="cellMain">
                    <span className={`pill pill--${transaction.type}`}>{transaction.type}</span>
                    <div>
                      <strong>{transaction.description}</strong>
                      {transaction.tags?.length ? (
                        <div className="tagRow">
                          {transaction.tags.map((tag) => (
                            <small key={tag}>#{tag}</small>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                </td>
                <td>{categoryLabelMap[transaction.category]}</td>
                <td>{formatDate(transaction.date)}</td>
                <td>{paymentLabelMap[transaction.paymentMethod]}</td>
                <td className={transaction.type === 'despesa' ? 'negative' : 'positive'}>
                  {transaction.type === 'despesa' ? '-' : '+'}
                  {formatCurrency(transaction.amount)}
                </td>
                <td>
                  <span className="statusPill" data-status={transaction.status}>
                    {transaction.status}
                  </span>
                </td>
                <td>
                  <button type="button" className="btn btn--ghost btn--sm" onClick={() => handleEditTransaction(transaction)}>
                    Editar
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

      {isCardModalOpen && (
        <div className="financeModal__backdrop" role="dialog" aria-modal="true">
          <form className="configModal" onSubmit={handleCardSubmit}>
            <header>
              <h3>Gerenciar cartões</h3>
              <button type="button" className="btn btn--ghostInverse btn--sm" onClick={() => setCardModalOpen(false)}>
                Fechar
              </button>
            </header>
            <div className="configGrid">
              <label>
                <span>Nome do cartão</span>
                <input value={cardForm.name} onChange={(event) => setCardForm((prev) => ({ ...prev, name: event.target.value }))} />
              </label>
              <label>
                <span>Bandeira</span>
                <input value={cardForm.brand} onChange={(event) => setCardForm((prev) => ({ ...prev, brand: event.target.value }))} />
              </label>
              <label>
                <span>Dia de fechamento</span>
                <input
                  type="number"
                  value={cardForm.closingDay}
                  onChange={(event) => setCardForm((prev) => ({ ...prev, closingDay: event.target.value }))}
                />
              </label>
              <label>
                <span>Dia de vencimento</span>
                <input
                  type="number"
                  value={cardForm.dueDay}
                  onChange={(event) => setCardForm((prev) => ({ ...prev, dueDay: event.target.value }))}
                />
              </label>
              <label>
                <span>Limite total</span>
                <input
                  type="number"
                  value={cardForm.limit}
                  onChange={(event) => setCardForm((prev) => ({ ...prev, limit: event.target.value }))}
                />
              </label>
            </div>
            <footer>
              <button type="button" className="btn btn--ghostInverse" onClick={() => setCardModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primary">
                Salvar cartão
              </button>
            </footer>
          </form>
        </div>
      )}

      {isBudgetModalOpen && (
        <div className="financeModal__backdrop" role="dialog" aria-modal="true">
          <form className="configModal" onSubmit={handleBudgetSubmit}>
            <header>
              <h3>Categorias & limites</h3>
              <button type="button" className="btn btn--ghostInverse btn--sm" onClick={() => setBudgetModalOpen(false)}>
                Fechar
              </button>
            </header>
            <div className="configGrid">
              <label>
                <span>Categoria</span>
                <select
                  value={budgetForm.category}
                  onChange={(event) => setBudgetForm((prev) => ({ ...prev, category: event.target.value }))}
                >
                  {CATEGORY_OPTIONS.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Teto de gastos</span>
                <input
                  type="number"
                  value={budgetForm.limit}
                  onChange={(event) => setBudgetForm((prev) => ({ ...prev, limit: event.target.value }))}
                />
              </label>
            </div>
            <footer>
              <button type="button" className="btn btn--ghostInverse" onClick={() => setBudgetModalOpen(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primary">
                Salvar limite
              </button>
            </footer>
          </form>
        </div>
      )}
    </div>
  )
}
