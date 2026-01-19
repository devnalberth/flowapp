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
import CreateFinanceModal from '../../components/CreateFinanceModal/CreateFinanceModal.jsx'
import FloatingCreateButton from '../../components/FloatingCreateButton/FloatingCreateButton.jsx'

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

const categoryLabelMap = CATEGORY_OPTIONS.reduce((acc, category) => ({ ...acc, [category.id]: category.label }), {})

export default function Finance({ user, onNavigate, onLogout }) {
  const { finances, addFinance, updateFinance, deleteFinance, loading } = useApp()
  const [selectedMonth, setSelectedMonth] = useState('12')
  const [selectedYear, setSelectedYear] = useState('2025')

  const [isTransactionModalOpen, setTransactionModalOpen] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)

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
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
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

  const handleOpenTransactionModal = (type) => {
    setTransactionModalOpen(true)
    setEditingTransaction(null)
  }

  const handleEditTransaction = (transaction) => {
    setTransactionModalOpen(true)
    setEditingTransaction(transaction)
  }

  const closeTransactionModal = () => {
    setTransactionModalOpen(false)
    setEditingTransaction(null)
  }

  const handleTransactionSubmit = async (transactionData) => {
    try {
      if (editingTransaction) {
        await updateFinance(editingTransaction.id, transactionData)
      } else {
        await addFinance(transactionData)
      }
      closeTransactionModal()
    } catch (error) {
      console.error('Erro ao salvar transação:', error)
      alert('Erro ao salvar transação: ' + error.message)
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
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => {}}>
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
                <td colSpan={5} style={{textAlign: 'center', padding: '40px'}}>
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
        <CreateFinanceModal
          onClose={closeTransactionModal}
          onSubmit={handleTransactionSubmit}
        />
      )}

      <FloatingCreateButton
        label="Nova transação"
        caption="Adicionar"
        icon={null}
        ariaLabel="Adicionar transação"
        onClick={handleOpenTransactionModal}
      />
      </div>
    </div>
  )
}
