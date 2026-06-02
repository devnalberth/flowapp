import { getSupabaseClient } from '../lib/supabaseClient';

// Limite de gasto (alerta, nunca impeditivo): por categoria (ref = slug) ou cartão (ref = id).
const normalize = (l) => (l ? {
  ...l,
  amount: Number(l.amount) || 0,
} : l);

export const financeLimitService = {
  async getLimits(userId) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('finance_limits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(normalize);
  },

  async createLimit(userId, l) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('finance_limits')
      .insert({
        user_id: userId,
        scope: l.scope || 'category',
        ref: l.ref,
        amount: l.amount ?? 0,
        period: l.period || 'month',
      })
      .select()
      .single();
    if (error) throw error;
    return normalize(data);
  },

  async updateLimit(id, userId, updates) {
    const supabase = getSupabaseClient(true);
    const payload = {};
    if (updates.scope !== undefined) payload.scope = updates.scope;
    if (updates.ref !== undefined) payload.ref = updates.ref;
    if (updates.amount !== undefined) payload.amount = updates.amount;
    if (updates.period !== undefined) payload.period = updates.period;
    const { data, error } = await supabase
      .from('finance_limits')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return normalize(data);
  },

  async deleteLimit(id, userId) {
    const supabase = getSupabaseClient(true);
    const { error } = await supabase.from('finance_limits').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },
};
