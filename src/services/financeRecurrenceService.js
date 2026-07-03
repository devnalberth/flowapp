import { getSupabaseClient } from '../lib/supabaseClient';

const normalize = (r) => (r ? {
  ...r,
  amount: Number(r.amount) || 0,
  dayOfMonth: r.day_of_month ?? 1,
  accountId: r.account_id ?? null,
  cardId: r.card_id ?? null,
  paymentMethod: r.payment_method ?? null,
  lastGenerated: r.last_generated ?? null,
  active: r.active !== false,
} : r);

export const financeRecurrenceService = {
  async getRecurrences(userId) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('finance_recurrences')
      .select('*')
      .eq('user_id', userId)
      .order('day_of_month', { ascending: true });
    if (error) throw error;
    return (data || []).map(normalize);
  },

  async createRecurrence(userId, r) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('finance_recurrences')
      .insert({
        user_id: userId,
        description: r.description,
        amount: r.amount,
        type: r.type || 'DESPESA',
        category: r.category || null,
        account_id: r.accountId ?? null,
        card_id: r.cardId ?? null,
        payment_method: r.paymentMethod ?? null,
        day_of_month: r.dayOfMonth ?? 1,
        active: r.active !== false,
        last_generated: r.lastGenerated ?? null,
      })
      .select().single();
    if (error) throw error;
    return normalize(data);
  },

  async updateRecurrence(id, userId, updates) {
    const supabase = getSupabaseClient(true);
    const payload = {};
    if (updates.description !== undefined) payload.description = updates.description;
    if (updates.amount !== undefined) payload.amount = updates.amount;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.accountId !== undefined) payload.account_id = updates.accountId ?? null;
    if (updates.cardId !== undefined) payload.card_id = updates.cardId ?? null;
    if (updates.paymentMethod !== undefined) payload.payment_method = updates.paymentMethod ?? null;
    if (updates.dayOfMonth !== undefined) payload.day_of_month = updates.dayOfMonth;
    if (updates.active !== undefined) payload.active = !!updates.active;
    if (updates.lastGenerated !== undefined) payload.last_generated = updates.lastGenerated;
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('finance_recurrences')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select().single();
    if (error) throw error;
    return normalize(data);
  },

  async deleteRecurrence(id, userId) {
    const supabase = getSupabaseClient(true);
    const { error } = await supabase
      .from('finance_recurrences')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw error;
  },

  // "Claim" atômico da geração do mês: só avança last_generated se ele ainda
  // estiver no valor anterior. Retorna false se outra execução (StrictMode/
  // duplo load) já gerou — impede lançamentos duplicados.
  async claimGeneration(id, userId, previousValue, newValue) {
    const supabase = getSupabaseClient(true);
    let query = supabase
      .from('finance_recurrences')
      .update({ last_generated: newValue, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('user_id', userId);
    query = previousValue === null || previousValue === undefined
      ? query.is('last_generated', null)
      : query.eq('last_generated', previousValue);
    const { data, error } = await query.select();
    if (error) { console.error('claimGeneration erro:', error); return false; }
    return Array.isArray(data) && data.length > 0;
  },
};
