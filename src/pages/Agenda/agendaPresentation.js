import { calendarDayKey } from '../Dashboard/dashboardPresentation'
import { parseDateForForm } from '../../components/CreateTaskModal/CreateTaskModal'
import { normalizeTaskStatus } from '../../utils/taskStatus'
import { cardInvoiceTotal, currentInvoiceMonth, invoiceDueDate } from '../../utils/financeMetrics'
import { localDateKey } from '../../utils/habitStats'

// Presentation adapters only: events and tasks retain their existing date semantics.
export function agendaItems(tasks, events, finances, cards, now = new Date()) {
  const items = []
  for (const event of events) {
    const day = calendarDayKey(event.date)
    if (!day) continue
    items.push({
      key: `event-${event.id}`,
      kind: 'event',
      day,
      time: event.isAllDay ? '' : (event.time || '').slice(0, 5),
      title: event.title,
      source: event,
    })
  }
  for (const task of tasks) {
    const status = normalizeTaskStatus(task)
    if (status === 'archived') continue
    const { dueDate: day, dueTime: time } = parseDateForForm(task.due_date)
    if (!day) continue
    items.push({
      key: `task-${task.id}`,
      kind: 'task',
      day,
      time,
      title: task.title,
      done: status === 'done',
      source: task,
    })
  }
  // Same pending-expense and current-invoice rules as UpcomingBills. No new
  // recurrence expansion, invoice calculation or financial mutation is introduced.
  for (const tx of finances) {
    if ((tx.type || '').toUpperCase() !== 'DESPESA' || tx.paid || tx.cardId || tx.card_id) continue
    const day = String(tx.date || '').slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) continue
    const [y, m, d] = day.split('-').map(Number)
    const midnight = new Date(now)
    midnight.setHours(0, 0, 0, 0)
    if (Math.round((new Date(y, m - 1, d) - midnight) / 86400000) < -60) continue
    items.push({
      key: `bill-${tx.id}`,
      kind: 'bill',
      day,
      time: '',
      title: tx.description || tx.category || 'Conta a pagar',
      amount: Number(tx.amount) || 0,
      source: tx,
    })
  }
  for (const card of cards) {
    const month = currentInvoiceMonth(card)
    const total = cardInvoiceTotal(card, finances, month)
    if (total <= 0) continue
    const due = invoiceDueDate(card, month)
    items.push({
      key: `invoice-${card.id}`,
      kind: 'bill',
      day: due ? localDateKey(due) : localDateKey(now),
      time: '',
      title: `Fatura ${card.name}`,
      amount: total,
      source: card,
    })
  }
  return items.sort(
    (a, b) =>
      a.day.localeCompare(b.day) || a.time.localeCompare(b.time) || a.key.localeCompare(b.key)
  )
}

export function monthDays(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1)
  const count = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  const start = 1 - first.getDay()
  return Array.from(
    { length: Math.ceil((first.getDay() + count) / 7) * 7 },
    (_, i) => new Date(date.getFullYear(), date.getMonth(), start + i)
  )
}

export function eventStart(event) {
  if (!event.date) return null
  const day = calendarDayKey(event.date)
  const date = new Date(`${day}T${event.time || '00:00'}`)
  return Number.isNaN(date.getTime()) ? null : date
}

export const maskAgendaText = (value, hidden) =>
  hidden
    ? String(value || '').replace(/R\$\s*[\d.,]+(?:\s*(?:mil|milhões?|mi))?/gi, 'R$ ••••')
    : value
