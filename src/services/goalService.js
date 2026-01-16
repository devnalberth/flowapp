import { getSupabaseClient } from '../lib/supabaseClient';

export const goalService = {
  async getGoals(userId) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createGoal(userId, goal) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('goals')
      .insert({
        title: goal.title,
        area: goal.area,
        target: goal.target,
        current: goal.current || 0,
        progress: goal.progress || 0,
        user_id: userId,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateGoal(goalId, userId, updates) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('goals')
      .update({
        title: updates.title,
        area: updates.area,
        target: updates.target,
        current: updates.current,
        progress: updates.progress,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteGoal(goalId, userId) {
    const supabase = getSupabaseClient(true);
    const { error } = await supabase
      .from('goals')
      .delete()
      .eq('id', goalId)
      .eq('user_id', userId);
    
    if (error) throw error;
  },
};
