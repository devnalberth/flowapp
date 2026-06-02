import { getSupabaseClient } from '../lib/supabaseClient';

// Expõe aliases camelCase mantendo o snake_case original (não quebra o que já lê snake_case).
const normalizeTransaction = (t) => {
  if (!t) return t;
  return {
    ...t,
    accountId: t.account_id ?? null,
    cardId: t.card_id ?? null,
    paymentMethod: t.payment_method ?? null,
    purchaseDate: t.purchase_date ?? null,
    invoiceMonth: t.invoice_month ?? null,
    tags: Array.isArray(t.tags) ? t.tags : [],
    notes: t.notes ?? null,
    paid: !!t.paid,
  };
};

// Campos novos compartilhados por insert/update (aceita camelCase ou snake_case).
const extraFields = (t) => ({
  account_id: t.accountId ?? t.account_id ?? null,
  card_id: t.cardId ?? t.card_id ?? null,
  payment_method: t.paymentMethod ?? t.payment_method ?? null,
  purchase_date: t.purchaseDate ?? t.purchase_date ?? null,
  invoice_month: t.invoiceMonth ?? t.invoice_month ?? null,
  tags: Array.isArray(t.tags) ? t.tags : [],
  notes: t.notes ?? t.notes ?? null,
  paid: t.paid ?? false,
});

export const financeService = {
  async getTransactions(userId) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('finance_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) throw error;
    return (data || []).map(normalizeTransaction);
  },

  // Single transaction insert (used for non-installment or standalone edits)
  async createTransaction(userId, transaction) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('finance_transactions')
      .insert({
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        date: transaction.date,
        is_installment: transaction.isInstallment || false,
        installment_count: transaction.installmentCount,
        installment_total: transaction.installmentTotal,
        installment_group_id: transaction.installmentGroupId || null,
        installment_index: transaction.installmentIndex || null,
        ...extraFields(transaction),
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('financeService.createTransaction error:', { data, error });
      throw error;
    }
    return normalizeTransaction(data);
  },

  // Batch insert for installment parcelas (single round-trip)
  async createTransactions(userId, transactionsArray) {
    const supabase = getSupabaseClient(true);
    const rows = transactionsArray.map(t => ({
      description: t.description,
      amount: t.amount,
      type: t.type,
      category: t.category,
      date: t.date,
      is_installment: t.isInstallment || false,
      installment_count: t.installmentCount,
      installment_total: t.installmentTotal,
      installment_group_id: t.installmentGroupId || null,
      installment_index: t.installmentIndex || null,
      ...extraFields(t),
      user_id: userId,
    }));

    const { data, error } = await supabase
      .from('finance_transactions')
      .insert(rows)
      .select();

    if (error) {
      console.error('financeService.createTransactions error:', { error });
      throw error;
    }
    return (data || []).map(normalizeTransaction);
  },

  async updateTransaction(transactionId, userId, updates) {
    const supabase = getSupabaseClient(true);
    const payload = {
      description: updates.description,
      amount: updates.amount,
      type: updates.type,
      category: updates.category,
      date: updates.date,
      is_installment: updates.isInstallment,
      installment_count: updates.installmentCount,
      installment_total: updates.installmentTotal,
      updated_at: new Date().toISOString(),
    };
    // Campos novos: só atualiza quando vierem (evita zerar em updates parciais)
    if (updates.accountId !== undefined || updates.account_id !== undefined) payload.account_id = updates.accountId ?? updates.account_id ?? null;
    if (updates.cardId !== undefined || updates.card_id !== undefined) payload.card_id = updates.cardId ?? updates.card_id ?? null;
    if (updates.paymentMethod !== undefined || updates.payment_method !== undefined) payload.payment_method = updates.paymentMethod ?? updates.payment_method ?? null;
    if (updates.purchaseDate !== undefined || updates.purchase_date !== undefined) payload.purchase_date = updates.purchaseDate ?? updates.purchase_date ?? null;
    if (updates.invoiceMonth !== undefined || updates.invoice_month !== undefined) payload.invoice_month = updates.invoiceMonth ?? updates.invoice_month ?? null;
    if (updates.tags !== undefined) payload.tags = Array.isArray(updates.tags) ? updates.tags : [];
    if (updates.notes !== undefined) payload.notes = updates.notes ?? null;
    if (updates.paid !== undefined) payload.paid = !!updates.paid;
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    const { data, error } = await supabase
      .from('finance_transactions')
      .update(payload)
      .eq('id', transactionId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return normalizeTransaction(data);
  },

  async deleteTransaction(transactionId, userId) {
    const supabase = getSupabaseClient(true);
    const { error } = await supabase
      .from('finance_transactions')
      .delete()
      .eq('id', transactionId)
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  // Delete all parcelas that share the same installment_group_id
  async deleteTransactionsByGroupId(groupId, userId) {
    const supabase = getSupabaseClient(true);
    const { error } = await supabase
      .from('finance_transactions')
      .delete()
      .eq('installment_group_id', groupId)
      .eq('user_id', userId);

    if (error) throw error;
  },
};
