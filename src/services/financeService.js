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
        user_id: userId,
      })
      .select()
      .single();
    
    if (error) {
      console.error('financeService.createTransaction supabase response:', { data, error });
      throw error;
    }
    console.debug('financeService.createTransaction inserted:', data);
    return data;
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
};
