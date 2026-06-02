import { getSupabaseClient } from '../lib/supabaseClient';

const normalize = (c) => (c ? {
  ...c,
  creditLimit: Number(c.credit_limit) || 0,
  closingDay: c.closing_day ?? 1,
  dueDay: c.due_day ?? 10,
} : c);

export const financeCardService = {
  async getCards(userId) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('finance_cards')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data || []).map(normalize);
  },
  async createCard(userId, c) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('finance_cards')
      .insert({
        user_id: userId,
        name: c.name,
        brand: c.brand || null,
        color: c.color || '#0d0d12',
        credit_limit: c.creditLimit ?? 0,
        closing_day: c.closingDay ?? 1,
        due_day: c.dueDay ?? 10,
      })
      .select().single();
    if (error) throw error;
    return normalize(data);
  },
  async updateCard(id, userId, updates) {
    const supabase = getSupabaseClient(true);
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.brand !== undefined) payload.brand = updates.brand;
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.creditLimit !== undefined) payload.credit_limit = updates.creditLimit;
    if (updates.closingDay !== undefined) payload.closing_day = updates.closingDay;
    if (updates.dueDay !== undefined) payload.due_day = updates.dueDay;
    if (updates.archived !== undefined) payload.archived = updates.archived;
    const { data, error } = await supabase
      .from('finance_cards').update(payload).eq('id', id).eq('user_id', userId).select().single();
    if (error) throw error;
    return normalize(data);
  },
  async deleteCard(id, userId) {
    const supabase = getSupabaseClient(true);
    const { error } = await supabase.from('finance_cards').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },
};
