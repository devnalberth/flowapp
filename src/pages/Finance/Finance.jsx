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

// Expandido para incluir 2026
const YEARS = ['2024', '2025', '2026']

const CATEGORY_OPTIONS = [
  // Despesa
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
  // Receita
  { id: 'salario', label: 'Salário' },
  { id: 'freelance', label: 'Freelance' },
  { id: 'investimentos', label: 'Investimentos' },
]

const PIE_COLORS = ['#ff4800', '#ff8d00', '#ffc241', '#7c88ff', '#5cd1b3']

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value || 0)

const formatDate = (value) => {
  if (!value) return '--'
  // Use timeZone: 'UTC' so dates stored at midnight or noon UTC never shift to the previous day in local time
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(value))
}

const categoryLabelMap = CATEGORY_OPTIONS.reduce((acc, category) => ({ ...acc, [category.id]: category.label }), {})

export default function Finance({ user, onNavigate, onLogout }) {
  const { finances, addFinance, updateFinance, deleteFinance, loading } = useApp()
  
  // CORREÇÃO: Inicializa com a data atual do sistema
  const today = new Date()
  const [selectedMonth, setSelectedMonth] = useState(String(today.getMonth() + 1).padStart(2, '0'))
  const [selectedYear, setSelectedYear] = useState(String(today.getFullYear()))

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

      // Lógica simplificada de troca de ano
      if (yearDelta !== 0) {
        setSelectedYear((prevYear) => {
          const yearNum = parseInt(prevYear) + yearDelta
          return String(yearNum)
        })
      }
      return MONTHS[monthIndex].value
    })
  }

  const periodKey = `${selectedYear}-${selectedMonth}`

  const filteredTransactions = useMemo(() => {
    return finances
      .map(t => ({
        ...t,
        amount: Number(t.amount) || 0,
        // Garante que a data seja string ISO para comparação
        dateString: t.date instanceof Date ? t.date.toISOString().split('T')[0] : new Date(t.date).toISOString().split('T')[0]
      }))
        .filter((transaction) => transaction.dateString.startsWith(periodKey))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [finances, periodKey])

  // CORREÇÃO: Filtro robusto para Receita e Despesa (Case insensitive)
  const monthlyRevenue = useMemo(
    () => filteredTransactions
      .filter((item) => {
        const type = (item.type || '').toUpperCase()
        return type === 'RECEITA' || type === 'INCOME'
      })
      .reduce((sum, item) => sum + item.amount, 0),
    [filteredTransactions]
  )

  const monthlyExpenses = useMemo(
    () => filteredTransactions
      .filter((item) => {
        const type = (item.type || '').toUpperCase()
        return type === 'DESPESA' || type === 'EXPENSE'
      })
      .reduce((sum, item) => sum + item.amount, 0),
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
        helper: 'Total de entradas',
      },
      {
        id: 'expense',
        label: 'Despesas do mês',
        value: formatCurrency(monthlyExpenses),
        helper: 'Total de saídas',
      },
    ],
    [monthlyRevenue, monthlyExpenses]
  )

  const categoryBreakdown = useMemo(() => {
    const breakdown = {}
    filteredTransactions
      .filter(t => (t.type || '').toUpperCase() === 'DESPESA')
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

  // Chart Series
  const cashflowSeries = useMemo(() => {
    const series = []
    for (let i = 0; i < 12; i++) {
      const monthValue = String(i + 1).padStart(2, '0')
      const monthKey = `${selectedYear}-${monthValue}`
      const monthTransactions = finances
        .map(t => ({
          ...t,
          amount: Number(t.amount) || 0,
          dateString: new Date(t.date).toISOString().split('T')[0]
        }))
        .filter(t => t.dateString.startsWith(monthKey))
      
      const receitas = monthTransactions.filter(t => (t.type||'').toUpperCase() === 'RECEITA').reduce((sum, t) => sum + t.amount, 0)
      const despesas = monthTransactions.filter(t => (t.type||'').toUpperCase() === 'DESPESA').reduce((sum, t) => sum + t.amount, 0)
      
      series.push({
        name: MONTHS[i].label.substring(0, 3),
        receita: receitas,
        despesa: despesas
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
                <strong style={{color: kpi.id === 'balance' ? (monthlyRevenue - monthlyExpenses >= 0 ? '#10b981' : '#ef4444') : 'inherit'}}>
                    {kpi.value}
                </strong>
                <span>{kpi.helper}</span>
              </article>
            ))}
          </section>
          <div className="financeHeader__controls">
            <div className="financeHeader__carousel" aria-label="Selecionar período">
              <button type="button" aria-label="Mês anterior" onClick={() => handleShiftMonth(-1)}>
                <svg viewBox="0 0 24 24" aria-hidden="true" width="20">
                  <path d="M15 19l-7-7 7-7" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
              <div className="financeHeader__period">
                <strong>{currentMonthMeta?.label}</strong>
                <span>{selectedYear}</span>
              </div>
              <button type="button" aria-label="Próximo mês" onClick={() => handleShiftMonth(1)}>
                <svg viewBox="0 0 24 24" aria-hidden="true" width="20">
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
              <XAxis dataKey="name" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${Math.round(value / 1000)}k`} />
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
              <Line type="monotone" dataKey="receita" stroke="#10b981" strokeWidth={3} dot={false} name="Receitas" />
              <Line type="monotone" dataKey="despesa" stroke="#ef4444" strokeWidth={3} dot={false} name="Despesas" />
            </LineChart>
          </ResponsiveContainer>
        </article>

        <article className="ui-card financeChart">
          <header>
            <div>
              <p>Distribuição</p>
              <h2>Gastos por categoria</h2>
            </div>
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
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 && (
              <tr>
                <td colSpan={5} style={{textAlign: 'center', padding: '40px', color: '#666'}}>
                  Nenhuma transação encontrada em {currentMonthMeta?.label}/{selectedYear}.
                </td>
              </tr>
            )}
            {filteredTransactions.map((transaction) => {
               const type = (transaction.type || '').toUpperCase()
               const isExpense = type === 'DESPESA'
               return (
                <tr key={transaction.id}>
                  <td>
                    <div className="cellMain">
                      <span className={`pill pill--${type.toLowerCase()}`}>{transaction.type}</span>
                      <div>
                        <strong>{transaction.description}</strong>
                      </div>
                    </div>
                  </td>
                  <td>{categoryLabelMap[transaction.category] || transaction.category}</td>
                  <td>{formatDate(transaction.date)}</td>
                  <td className={isExpense ? 'negative' : 'positive'}>
                    {isExpense ? '-' : '+'}
                    {formatCurrency(transaction.amount)}
                  </td>
                  <td>
                    <div style={{display: 'flex', gap: '8px'}}>
                        <button type="button" className="btn btn--ghost btn--sm" onClick={() => handleEditTransaction(transaction)}>
                        Editar
                        </button>
                        <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => handleDeleteTransaction(transaction.id)}
                        style={{color: '#ef4444'}}
                        >
                        Excluir
                        </button>
                    </div>
                  </td>
                </tr>
            )})}
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
        ariaLabel="Adicionar transação"
        onClick={handleOpenTransactionModal}
      />
      </div>
    </div>
  )
}