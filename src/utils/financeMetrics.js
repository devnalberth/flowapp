// Métricas de contas e cartões (derivadas das transações).

const num = (v) => Number(v) || 0
const accId = (t) => t.accountId || t.account_id || null
const cardId = (t) => t.cardId || t.card_id || null
const invMonth = (t) => t.invoiceMonth || t.invoice_month || null
const typeOf = (t) => (t.type || '').toUpperCase()

// Saldo de uma conta = saldo inicial + receitas − despesas lançadas nela.
export function accountBalance(account, transactions = []) {
  const delta = transactions
    .filter((t) => accId(t) === account.id)
    .reduce((s, t) => {
      const amt = num(t.amount)
      if (typeOf(t) === 'RECEITA') return s + amt
      if (typeOf(t) === 'DESPESA') return s - amt
      return s
    }, 0)
  return (account.initialBalance || 0) + delta
}

// Total de uma fatura específica (mês YYYY-MM) do cartão.
export function cardInvoiceTotal(card, transactions = [], invoiceMonth) {
  return transactions
    .filter((t) => cardId(t) === card.id && invMonth(t) === invoiceMonth && typeOf(t) === 'DESPESA')
    .reduce((s, t) => s + num(t.amount), 0)
}

// Despesas no cartão ainda não pagas (base do limite disponível).
export function cardOpenTotal(card, transactions = []) {
  return transactions
    .filter((t) => cardId(t) === card.id && typeOf(t) === 'DESPESA' && !t.paid)
    .reduce((s, t) => s + num(t.amount), 0)
}

export function cardAvailable(card, transactions = []) {
  return (card.creditLimit || 0) - cardOpenTotal(card, transactions)
}

// Mês de fatura "atual" do cartão, conforme o dia de fechamento e a data de referência.
export function currentInvoiceMonth(card, ref = new Date()) {
  const d = ref.getDate()
  let y = ref.getFullYear()
  let m = ref.getMonth() + 1
  if (d > (card.closingDay || 1)) { m += 1; if (m > 12) { m = 1; y += 1 } }
  return `${y}-${String(m).padStart(2, '0')}`
}

// Lançamentos de uma fatura (ordenados por data desc).
export function invoiceTransactions(card, transactions = [], invoiceMonth) {
  return transactions
    .filter((t) => cardId(t) === card.id && invMonth(t) === invoiceMonth)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

// Data de vencimento (Date) da fatura de um mês YYYY-MM.
export function invoiceDueDate(card, invoiceMonth) {
  if (!invoiceMonth) return null
  const [y, m] = invoiceMonth.split('-').map(Number)
  return new Date(y, m - 1, card.dueDay || 10)
}
