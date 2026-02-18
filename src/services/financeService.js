import { getSupabaseClient } from '../lib/supabaseClient';

export const financeService = {
  async getTransactions(userId) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('finance_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data || [];
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
        user_id: userId,
      })
      .select()
      .single();
    
    if (error) {
      console.error('financeService.createTransaction error:', { data, error });
      throw error;
    }
    return data;
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
    return data || [];
  },

  async updateTransaction(transactionId, userId, updates) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('finance_transactions')
      .update({
        description: updates.description,
        amount: updates.amount,
        type: updates.type,
        category: updates.category,
        date: updates.date,
        is_installment: updates.isInstallment,
        installment_count: updates.installmentCount,
        installment_total: updates.installmentTotal,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
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
