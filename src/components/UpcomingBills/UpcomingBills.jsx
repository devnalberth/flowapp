import { useMemo, useState } from 'react'
import { CalendarClock, Check, CalendarSync, ChevronDown, PartyPopper } from 'lucide-react'
import BankLogo from '../BankLogo/BankLogo.jsx'
import CategoryIcon from '../CategoryIcon/CategoryIcon.jsx'
import { cardInvoiceTotal, currentInvoiceMonth, invoiceDueDate } from '../../utils/financeMetrics'
import './UpcomingBills.css'

const fmtMoney = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n) || 0)
const VISIBLE_DEFAULT = 6

const todayKey = () => {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().split('T')[0]
}

// Diferença em dias entre uma chave YYYY-MM-DD e hoje (0 = hoje, negativo = vencida)
const daysUntil = (dateKey) => {
  const [y, m, d] = dateKey.split('-').map(Number)
  const due = new Date(y, m - 1, d)
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.round((due.getTime() - now.getTime()) / 86400000)
}

const dueLabel = (days) => {
  if (days < -1) return `venceu há ${-days} dias`
  if (days === -1) return 'venceu ontem'
  if (days === 0) return 'vence hoje'
  if (days === 1) return 'vence amanhã'
  return `em ${days} dias`
}

// Contas a pagar: lançamentos não pagos (recorrências, parcelas futuras, boletos)
// + faturas dos cartões, ordenados por vencimento. Independe do mês selecionado.
export default function UpcomingBills({ transactions, cards, catMap, onMarkPaid, onOpenInvoice, onManageRecurrences }) {
  const [expanded, setExpanded] = useState(false)

  const items = useMemo(() => {
    const tKey = todayKey()
    const list = []

    // Lançamentos de despesa não pagos (mostra vencidos até 60 dias atrás; legado antigo fica fora).
    // Compras no cartão ficam de fora: são cobradas pela FATURA (linha própria abaixo).
    for (const t of transactions || []) {
      if ((t.type || '').toUpperCase() !== 'DESPESA' || t.paid) continue
      if (t.cardId || t.card_id) continue
      const dateKey = String(t.date || '').slice(0, 10)
      if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) continue
      const days = daysUntil(dateKey)
      if (days < -60) continue
      list.push({
        kind: 'tx',
        id: `tx-${t.id}`,
        tx: t,
        dateKey,
        days,
        label: t.description,
        amount: Number(t.amount) || 0,
        category: t.category,
      })
    }

    // Faturas em aberto dos cartões (mês de fatura corrente)
    for (const card of cards || []) {
      const invMonth = currentInvoiceMonth(card)
      const total = cardInvoiceTotal(card, transactions || [], invMonth)
      if (total <= 0) continue
      const due = invoiceDueDate(card, invMonth)
      const dateKey = due
        ? `${due.getFullYear()}-${String(due.getMonth() + 1).padStart(2, '0')}-${String(due.getDate()).padStart(2, '0')}`
        : tKey
      list.push({
        kind: 'invoice',
        id: `inv-${card.id}`,
        card,
        dateKey,
        days: daysUntil(dateKey),
        label: `Fatura ${card.name}`,
        amount: total,
      })
    }

    return list.sort((a, b) => a.dateKey.localeCompare(b.dateKey))
  }, [transactions, cards])

  const visible = expanded ? items : items.slice(0, VISIBLE_DEFAULT)
  const hidden = items.length - visible.length

  return (
    <section className="upcomingBills ui-card">
      <header className="upcomingBills__head">
        <div className="upcomingBills__title">
          <span className="upcomingBills__badge"><CalendarClock size={16} /></span>
          <div>
            <p>Próximos vencimentos</p>
            <h3>
              {items.length === 0
                ? 'Nada a pagar por enquanto'
                : `${items.length} ${items.length === 1 ? 'conta pendente' : 'contas pendentes'}`}
            </h3>
          </div>
        </div>
        <button type="button" className="upcomingBills__manage" onClick={onManageRecurrences}>
          <CalendarSync size={14} /> Recorrências
        </button>
      </header>

      {items.length === 0 ? (
        <p className="upcomingBills__empty">
          <PartyPopper size={15} /> Nenhuma conta pendente. Lançamentos futuros e recorrências aparecem aqui.
        </p>
      ) : (
        <>
          <div className="upcomingBills__list">
            {visible.map((item) => (
              <div key={item.id} className={`billRow ${item.days < 0 ? 'billRow--overdue' : item.days <= 3 ? 'billRow--soon' : ''}`}>
                {item.kind === 'invoice'
                  ? <BankLogo value={item.card.brand} name={item.card.name} color={item.card.color} size={34} radius={9} />
                  : <CategoryIcon slug={item.category} icon={catMap?.[item.category]?.icon} color={catMap?.[item.category]?.color || '#6b7280'} size={34} />}
                <div className="billRow__meta">
                  <strong>{item.label}</strong>
                  <span className="billRow__due">
                    {dueLabel(item.days)} · {item.dateKey.slice(8, 10)}/{item.dateKey.slice(5, 7)}
                  </span>
                </div>
                <strong className="billRow__amount">{fmtMoney(item.amount)}</strong>
                {item.kind === 'tx' ? (
                  <button type="button" className="billRow__action" onClick={() => onMarkPaid?.(item.tx)} title="Marcar como pago">
                    <Check size={14} /> Pagar
                  </button>
                ) : (
                  <button type="button" className="billRow__action billRow__action--invoice" onClick={() => onOpenInvoice?.(item.card)}>
                    Ver fatura
                  </button>
                )}
              </div>
            ))}
          </div>
          {hidden > 0 && (
            <button type="button" className="upcomingBills__more" onClick={() => setExpanded(true)}>
              <ChevronDown size={14} /> Mostrar mais {hidden}
            </button>
          )}
        </>
      )}
    </section>
  )
}
