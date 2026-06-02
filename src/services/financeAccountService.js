import { getSupabaseClient } from '../lib/supabaseClient';

const normalize = (a) => (a ? {
  ...a,
  initialBalance: Number(a.initial_balance) || 0,
  includeInTotal: a.include_in_total !== false,
} : a);

export const financeAccountService = {
  async getAccounts(userId) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('finance_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(normalize);
  },
  async createAccount(userId, a) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('finance_accounts')
      .insert({
        user_id: userId,
        name: a.name,
        type: a.type || 'corrente',
        icon: a.icon || null,
        color: a.color || '#0d0d12',
        initial_balance: a.initialBalance ?? 0,
        include_in_total: a.includeInTotal !== false,
      })
      .select().single();
    if (error) throw error;
    return normalize(data);
  },
  async updateAccount(id, userId, updates) {
    const supabase = getSupabaseClient(true);
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.icon !== undefined) payload.icon = updates.icon;
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.initialBalance !== undefined) payload.initial_balance = updates.initialBalance;
    if (updates.includeInTotal !== undefined) payload.include_in_total = updates.includeInTotal;
    if (updates.archived !== undefined) payload.archived = updates.archived;
    const { data, error } = await supabase
      .from('finance_accounts').update(payload).eq('id', id).eq('user_id', userId).select().single();
    if (error) throw error;
    return normalize(data);
  },
  async deleteAccount(id, userId) {
    const supabase = getSupabaseClient(true);
    const { error } = await supabase.from('finance_accounts').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },
};
