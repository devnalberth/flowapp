import { useState, useMemo } from 'react'
import { X, ChevronLeft, ChevronRight, CalendarClock } from 'lucide-react'
import { cardInvoiceTotal, cardAvailable, currentInvoiceMonth, invoiceTransactions, invoiceDueDate } from '../../utils/financeMetrics'
import BankLogo from '../BankLogo/BankLogo.jsx'
import './InvoiceView.css'

const MONTHS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
const fmtMoney = (n) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(n) || 0)
const monthLabel = (ym) => { const [y, m] = (ym || '').split('-').map(Number); return y ? `${MONTHS[m - 1]} ${y}` : '' }
const shiftMonth = (ym, dir) => { let [y, m] = ym.split('-').map(Number); m += dir; if (m > 12) { m = 1; y++ } if (m < 1) { m = 12; y-- } return `${y}-${String(m).padStart(2, '0')}` }
const fmtDay = (iso) => { const d = String(iso).slice(0, 10).split('-'); return `${d[2]}/${d[1]}` }

export default function InvoiceView({ card, transactions = [], catMap = {}, hideValues = false, onClose }) {
  // Preferência global "ocultar valores financeiros"
  const money = (n) => (hideValues ? 'R$ ••••' : fmtMoney(n))
  const [invoiceMonth, setInvoiceMonth] = useState(() => currentInvoiceMonth(card))
  const total = useMemo(() => cardInvoiceTotal(card, transactions, invoiceMonth), [card, transactions, invoiceMonth])
  const items = useMemo(() => invoiceTransactions(card, transactions, invoiceMonth), [card, transactions, invoiceMonth])
  const due = invoiceDueDate(card, invoiceMonth)
  const available = cardAvailable(card, transactions)

  return (
    <div className="invoiceView" onClick={onClose}>
      <div className="invoiceView__panel" onClick={(e) => e.stopPropagation()} style={{ '--accent': card.color }}>
        <header className="invoiceView__header">
          <BankLogo value={card.brand} name={card.name} color={card.color} size={44} radius={11} />
          <div>
            <strong>{card.name}</strong>
            <span>Fecha dia {card.closingDay} · vence dia {card.dueDay}</span>
          </div>
          <button className="invoiceView__close" onClick={onClose}><X size={18} /></button>
        </header>

        <div className="invoiceView__nav">
          <button onClick={() => setInvoiceMonth((m) => shiftMonth(m, -1))}><ChevronLeft size={18} /></button>
          <strong>Fatura {monthLabel(invoiceMonth)}</strong>
          <button onClick={() => setInvoiceMonth((m) => shiftMonth(m, 1))}><ChevronRight size={18} /></button>
        </div>

        <div className="invoiceView__summary">
          <div className="invoiceView__sumCard">
            <span>Valor da fatura</span>
            <strong>{money(total)}</strong>
          </div>
          <div className="invoiceView__sumCard">
            <span><CalendarClock size={12} /> Vencimento</span>
            <strong>{due ? `${String(due.getDate()).padStart(2, '0')}/${String(due.getMonth() + 1).padStart(2, '0')}` : '--'}</strong>
          </div>
          <div className="invoiceView__sumCard">
            <span>Limite disponível</span>
            <strong style={{ color: available < 0 ? '#ef4444' : '#16a34a' }}>{money(available)}</strong>
          </div>
        </div>

        <div className="invoiceView__list">
          <p className="invoiceView__listTitle">Lançamentos</p>
          {items.length === 0 ? (
            <p className="invoiceView__empty">Nenhum lançamento nesta fatura.</p>
          ) : items.map((t) => (
            <div className="invoiceView__item" key={t.id}>
              <span className="invoiceView__itemDate">{fmtDay(t.date)}</span>
              <span className="invoiceView__itemDesc">
                {t.description}
                {t.installment_count > 1 && <em> {t.installment_index}/{t.installment_count}</em>}
              </span>
              <span className="invoiceView__itemCat">
                <i style={{ background: catMap[t.category]?.color || '#9ca3af' }} />
                {catMap[t.category]?.name || t.category}
              </span>
              <span className="invoiceView__itemAmount">{money(t.amount)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
