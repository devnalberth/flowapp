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
import CardModal from '../../components/CardModal/CardModal.jsx'
import AccountModal from '../../components/AccountModal/AccountModal.jsx'
import InvoiceView from '../../components/InvoiceView/InvoiceView.jsx'
import FinanceGoalCard from '../../components/FinanceGoalCard/FinanceGoalCard.jsx'
import CreateGoalModal from '../../components/CreateGoalModal/CreateGoalModal.jsx'
import LimitsModal from '../../components/LimitsModal/LimitsModal.jsx'
import FloatingCreateButton from '../../components/FloatingCreateButton/FloatingCreateButton.jsx'
import { accountBalance, cardInvoiceTotal, cardAvailable, currentInvoiceMonth, monthSpendByCategory, monthSpendByCard, limitStatus } from '../../utils/financeMetrics'
import { Wallet, CreditCard, Plus, Pencil, AlertTriangle, Gauge } from 'lucide-react'

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

// Cores específicas por categoria — mantém consistência visual em toda a página
const CATEGORY_META = {
  alimentacao:       { color: '#dc2626', label: 'Alimentação' },
  assinatura:        { color: '#7c3aed', label: 'Assinatura' },
  casa:              { color: '#0891b2', label: 'Casa' },
  compras:           { color: '#6d28d9', label: 'Compras' },
  educacao:          { color: '#4338ca', label: 'Educação' },
  lazer:             { color: '#ea580c', label: 'Lazer' },
  operacao_bancaria: { color: '#9333ea', label: 'Operação bancária' },
  outros:            { color: '#6b7280', label: 'Outros' },
  pix:               { color: '#8b5cf6', label: 'Pix' },
  saude:             { color: '#16a34a', label: 'Saúde' },
  servicos:          { color: '#15803d', label: 'Serviços' },
  supermercado:      { color: '#ef4444', label: 'Supermercado' },
  transporte:        { color: '#1d4ed8', label: 'Transporte' },
  viagem:            { color: '#06b6d4', label: 'Viagem' },
  salario:           { color: '#10b981', label: 'Salário' },
  freelance:         { color: '#3b82f6', label: 'Freelance' },
  investimentos:     { color: '#a855f7', label: 'Investimentos' },
}

const formatCurrency = (value) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(value || 0)

const formatDate = (value) => {
  if (!value) return '--'
  // Use timeZone: 'UTC' so dates stored at midnight or noon UTC never shift to the previous day in local time
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', timeZone: 'UTC' }).format(new Date(value))
}

const categoryLabelMap = CATEGORY_OPTIONS.reduce((acc, category) => ({ ...acc, [category.id]: category.label }), {})

export default function Finance({ user, onNavigate, onLogout }) {
  const {
    finances, addFinance, updateFinance, deleteFinance, financeCategories, loading,
    financeAccounts, addFinanceAccount, updateFinanceAccount, deleteFinanceAccount,
    financeCards, addFinanceCard, updateFinanceCard, deleteFinanceCard,
    financeLimits, addFinanceLimit, updateFinanceLimit, deleteFinanceLimit,
    goals, addGoal, updateGoal, deleteGoal,
  } = useApp()

  const [cardModal, setCardModal] = useState(null)     // { card } | { } (novo)
  const [accountModal, setAccountModal] = useState(null)
  const [invoiceCard, setInvoiceCard] = useState(null)
  const [goalModal, setGoalModal] = useState(null)     // { goal } | { } (nova) | null
  const [limitsModalOpen, setLimitsModalOpen] = useState(false)

  // Metas com área Financeiro (acompanhadas pelas receitas da categoria no mês)
  const financeGoals = useMemo(
    () => (goals || []).filter((g) => String(g.area || '').toLowerCase() === 'financeiro'),
    [goals]
  )

  // Mapa slug → { name, color, icon } a partir das categorias do usuário (com fallback nos defaults fixos)
  const catMap = useMemo(() => {
    const map = {}
    ;(financeCategories || []).forEach((c) => { map[c.slug] = { name: c.name, color: c.color, icon: c.icon } })
    Object.entries(CATEGORY_META).forEach(([slug, meta]) => { if (!map[slug]) map[slug] = { name: meta.label, color: meta.color } })
    return map
  }, [financeCategories])
  const catLabel = (slug) => catMap[slug]?.name || categoryLabelMap[slug] || slug
  const catColor = (slug) => catMap[slug]?.color || '#6b7280'
  
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
            label: catLabel(t.category),
            value: 0
          }
        }
        breakdown[t.category].value += t.amount
      })
    return Object.values(breakdown).sort((a, b) => b.value - a.value)
  }, [filteredTransactions])

  // Limites de gasto x gasto do mês (alerta, nunca impeditivo)
  const limitsWithStatus = useMemo(
    () => (financeLimits || []).map((l) => {
      const spent = l.scope === 'card'
        ? monthSpendByCard(filteredTransactions, l.ref)
        : monthSpendByCategory(filteredTransactions, l.ref)
      return { ...l, ...limitStatus(spent, l.amount) }
    }),
    [financeLimits, filteredTransactions]
  )
  const categoryLimitStatus = useMemo(() => {
    const map = {}
    limitsWithStatus.forEach((l) => { if (l.scope === 'category') map[l.ref] = l }) ; return map
  }, [limitsWithStatus])
  const cardLimitStatus = useMemo(() => {
    const map = {}
    limitsWithStatus.forEach((l) => { if (l.scope === 'card') map[l.ref] = l }) ; return map
  }, [limitsWithStatus])
  const alertCount = useMemo(() => limitsWithStatus.filter((l) => l.status === 'over').length, [limitsWithStatus])

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

  // Contas e cartões
  const handleSaveCard = async (data) => {
    if (cardModal?.card) await updateFinanceCard(cardModal.card.id, data)
    else await addFinanceCard(data)
  }
  const handleDeleteCard = async () => {
    if (cardModal?.card && window.confirm(`Excluir o cartão "${cardModal.card.name}"?`)) {
      await deleteFinanceCard(cardModal.card.id); setCardModal(null)
    }
  }
  const handleSaveAccount = async (data) => {
    if (accountModal?.account) await updateFinanceAccount(accountModal.account.id, data)
    else await addFinanceAccount(data)
  }
  const handleDeleteAccount = async () => {
    if (accountModal?.account && window.confirm(`Excluir a conta "${accountModal.account.name}"?`)) {
      await deleteFinanceAccount(accountModal.account.id); setAccountModal(null)
    }
  }
  const ACCOUNT_TYPE_LABEL = { corrente: 'Conta corrente', poupanca: 'Poupança', carteira: 'Carteira', pj: 'Conta PJ', investimentos: 'Investimentos' }

  // Metas financeiras
  const AREA_OPTIONS = ['Profissional', 'Pessoal', 'Financeiro', 'Estudos']
  const handleGoalSubmit = async (payload) => {
    try {
      const { projectId, ...goalData } = payload
      if (goalModal?.goal) await updateGoal(goalModal.goal.id, goalData)
      else await addGoal(goalData)
      setGoalModal(null)
    } catch (error) {
      console.error('Erro ao salvar meta financeira:', error)
      alert('Erro ao salvar meta: ' + (error?.message || error))
    }
  }
  const handleGoalDelete = async () => {
    if (goalModal?.goal && window.confirm('Excluir esta meta financeira?')) {
      await deleteGoal(goalModal.goal.id)
      setGoalModal(null)
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

      <FinanceGoalCard
        goals={financeGoals}
        transactions={filteredTransactions}
        catMap={catMap}
        monthLabel={`${currentMonthMeta?.label || ''} ${selectedYear}`}
        onCreate={() => setGoalModal({})}
        onEdit={(goal) => setGoalModal({ goal })}
      />

      <section className="financeWallet">
        <article className="ui-card financeWallet__col">
          <header className="financeWallet__head">
            <div className="financeWallet__title"><Wallet size={16} /><h3>Minhas contas</h3></div>
            <button className="financeWallet__add" onClick={() => setAccountModal({})}><Plus size={14} /> Conta</button>
          </header>
          {financeAccounts.length === 0 ? (
            <p className="financeWallet__empty">Adicione sua primeira conta para acompanhar o saldo.</p>
          ) : financeAccounts.map((acc) => (
            <button type="button" className="walletItem" key={acc.id} onClick={() => setAccountModal({ account: acc })}>
              <span className="walletItem__icon" style={{ background: acc.color }}>{acc.icon || '🏦'}</span>
              <div className="walletItem__meta"><strong>{acc.name}</strong><span>{ACCOUNT_TYPE_LABEL[acc.type] || 'Conta'}</span></div>
              <span className="walletItem__value">{formatCurrency(accountBalance(acc, finances))}</span>
              <Pencil size={13} className="walletItem__edit" />
            </button>
          ))}
        </article>

        <article className="ui-card financeWallet__col">
          <header className="financeWallet__head">
            <div className="financeWallet__title"><CreditCard size={16} /><h3>Meus cartões</h3></div>
            <button className="financeWallet__add" onClick={() => setCardModal({})}><Plus size={14} /> Cartão</button>
          </header>
          {financeCards.length === 0 ? (
            <p className="financeWallet__empty">Adicione seu primeiro cartão de crédito.</p>
          ) : financeCards.map((card) => {
            const inv = cardInvoiceTotal(card, finances, currentInvoiceMonth(card))
            const avail = cardAvailable(card, finances)
            const cardLim = cardLimitStatus[card.id]
            return (
              <div className="cardItem" key={card.id}>
                <button type="button" className="cardItem__top" onClick={() => setCardModal({ card })}>
                  <span className="cardItem__brand" style={{ background: card.color }}>{card.brand || '💳'}</span>
                  <div className="cardItem__meta"><strong>{card.name}</strong><span>Fecha dia {card.closingDay} · vence dia {card.dueDay}</span></div>
                  {cardLim && cardLim.status !== 'ok' && (
                    <span className={`cardItem__limitBadge cardItem__limitBadge--${cardLim.status}`}>
                      <AlertTriangle size={12} /> {cardLim.rawPct}%
                    </span>
                  )}
                  <Pencil size={13} className="cardItem__edit" />
                </button>
                <div className="cardItem__stats">
                  <div><span>Fatura atual</span><strong className="negative">{formatCurrency(inv)}</strong></div>
                  <div><span>Limite disponível</span><strong style={{ color: avail < 0 ? '#ef4444' : '#16a34a' }}>{formatCurrency(avail)}</strong></div>
                  <button type="button" className="cardItem__invoice" onClick={() => setInvoiceCard(card)}>Ver fatura</button>
                </div>
              </div>
            )
          })}
        </article>
      </section>

      <section className="financeLimits ui-card">
        <header className="financeLimits__head">
          <div className="financeLimits__title">
            <span className="financeLimits__badge"><Gauge size={16} /></span>
            <div>
              <p>Limites de gastos · {currentMonthMeta?.label}</p>
              <h3>
                {alertCount > 0
                  ? <span className="financeLimits__alertText"><AlertTriangle size={14} /> {alertCount} {alertCount === 1 ? 'limite ultrapassado' : 'limites ultrapassados'}</span>
                  : 'Tudo dentro do planejado'}
              </h3>
            </div>
          </div>
          <button type="button" className="financeLimits__manage" onClick={() => setLimitsModalOpen(true)}>
            {financeLimits.length === 0 ? <><Plus size={14} /> Definir limites</> : 'Gerenciar'}
          </button>
        </header>

        {limitsWithStatus.length === 0 ? (
          <p className="financeLimits__empty">Defina tetos por categoria ou cartão e receba um alerta (sem bloqueio) ao ultrapassá-los.</p>
        ) : (
          <div className="financeLimits__grid">
            {limitsWithStatus.map((l) => {
              const meta = l.scope === 'card'
                ? financeCards.find((c) => c.id === l.ref)
                : catMap[l.ref]
              const name = l.scope === 'card' ? (meta?.name || 'Cartão') : (meta?.name || l.ref)
              const icon = l.scope === 'card' ? (meta?.brand || '💳') : (meta?.icon || '🏷️')
              const color = (l.scope === 'card' ? meta?.color : meta?.color) || '#6b7280'
              return (
                <article className={`limitChip limitChip--${l.status}`} key={l.id}>
                  <header>
                    <span className="limitChip__icon" style={{ background: color }}>{icon}</span>
                    <strong>{name}</strong>
                    {l.status === 'over' && <AlertTriangle size={14} className="limitChip__warn" />}
                  </header>
                  <div className="limitChip__bar"><span style={{ width: `${l.pct}%` }} /></div>
                  <footer>
                    <span>{formatCurrency(l.spent)} / {formatCurrency(l.amount)}</span>
                    <span className="limitChip__pct">{l.rawPct}%</span>
                  </footer>
                </article>
              )
            })}
          </div>
        )}
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
                      <Cell key={entry.id} fill={catMap[entry.id]?.color || PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name) => [formatCurrency(value), name]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="financeChart__legend">
              {categoryBreakdown.map((entry, index) => {
                const lim = categoryLimitStatus[entry.id]
                return (
                  <li key={entry.id}>
                    <span style={{ background: catMap[entry.id]?.color || PIE_COLORS[index % PIE_COLORS.length] }} />
                    <div>
                      <strong>{entry.label}</strong>
                      <small>{formatCurrency(entry.value)}</small>
                    </div>
                    {lim && lim.status !== 'ok' && (
                      <span className={`legendAlert legendAlert--${lim.status}`} title={`Limite: ${formatCurrency(lim.amount)} · ${lim.rawPct}%`}>
                        <AlertTriangle size={12} /> {lim.rawPct}%
                      </span>
                    )}
                  </li>
                )
              })}
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
                  <td>
                    <div className="categoryCell">
                      <span className="categoryCell__dot" style={{ background: catColor(transaction.category) }} />
                      {catMap[transaction.category]?.icon ? `${catMap[transaction.category].icon} ` : ''}{catLabel(transaction.category)}
                    </div>
                  </td>
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
          initialData={editingTransaction}
        />
      )}

      {cardModal && (
        <CardModal
          card={cardModal.card || null}
          onClose={() => setCardModal(null)}
          onSubmit={handleSaveCard}
          onDelete={cardModal.card ? handleDeleteCard : null}
        />
      )}

      {accountModal && (
        <AccountModal
          account={accountModal.account || null}
          onClose={() => setAccountModal(null)}
          onSubmit={handleSaveAccount}
          onDelete={accountModal.account ? handleDeleteAccount : null}
        />
      )}

      {invoiceCard && (
        <InvoiceView card={invoiceCard} transactions={finances} catMap={catMap} onClose={() => setInvoiceCard(null)} />
      )}

      {goalModal && (
        <CreateGoalModal
          open
          onClose={() => setGoalModal(null)}
          onSubmit={handleGoalSubmit}
          onDelete={goalModal.goal ? handleGoalDelete : undefined}
          areaOptions={AREA_OPTIONS}
          financeCategories={financeCategories}
          defaultArea="Financeiro"
          initialData={goalModal.goal || null}
        />
      )}

      {limitsModalOpen && (
        <LimitsModal
          limits={financeLimits}
          categories={financeCategories}
          cards={financeCards}
          transactions={filteredTransactions}
          catMap={catMap}
          monthLabel={`${currentMonthMeta?.label || ''}/${selectedYear}`}
          onCreate={addFinanceLimit}
          onUpdate={updateFinanceLimit}
          onDelete={deleteFinanceLimit}
          onClose={() => setLimitsModalOpen(false)}
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