import { getSupabaseClient } from '../lib/supabaseClient';

export const financeTagService = {
  async getTags(userId) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('finance_tags')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  async createTag(userId, tag) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('finance_tags')
      .insert({ user_id: userId, name: tag.name, color: tag.color || '#6b7280' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async updateTag(id, userId, updates) {
    const supabase = getSupabaseClient(true);
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.color !== undefined) payload.color = updates.color;
    const { data, error } = await supabase
      .from('finance_tags')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async deleteTag(id, userId) {
    const supabase = getSupabaseClient(true);
    const { error } = await supabase.from('finance_tags').delete().eq('id', id).eq('user_id', userId);
    if (error) throw error;
  },
};
