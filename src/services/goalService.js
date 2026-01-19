import { getSupabaseClient } from '../lib/supabaseClient';

const normalizeGoal = (goal) => ({
  ...goal,
  startDate: goal.start_date,
  endDate: goal.end_date,
});

export const goalService = {
  async getGoals(userId) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(normalizeGoal);
  },

  async createGoal(userId, goal) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('goals')
      .insert({
        title: goal.title,
        area: goal.area,
        type: goal.type || 'custom',
        target: goal.target,
        current: goal.current || 0,
        progress: goal.progress || 0,
        start_date: goal.startDate || null,
        end_date: goal.endDate || null,
        trimesters: goal.trimesters || null,
        trimester_values: goal.trimesterValues || null,
        user_id: userId,
      })
      .select()
      .single();
    
    if (error) {
      console.error('goalService.createGoal supabase response:', { data, error });
      throw error;
    }
    console.debug('goalService.createGoal inserted:', data);
    return normalizeGoal(data);
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
        start_date: updates.startDate,
        end_date: updates.endDate,
        updated_at: new Date().toISOString(),
      })
      .eq('id', goalId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return normalizeGoal(data);
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
