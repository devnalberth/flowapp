import { getSupabaseClient } from '../lib/supabaseClient';

export const habitService = {
  async getHabits(userId) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createHabit(userId, habit) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('habits')
      .insert({
        name: habit.name,
        category: habit.category,
        goal: habit.goal,
        frequency: habit.frequency || 'daily',
        current_streak: habit.currentStreak || 0,
        best_streak: habit.bestStreak || 0,
        completed_dates: habit.completedDates || '[]',
        user_id: userId,
      })
      .select()
      .single();
    
    if (error) {
      console.error('habitService.createHabit supabase response:', { data, error });
      throw error;
    }
    console.debug('habitService.createHabit inserted:', data);
    return data;
  },

  async updateHabit(habitId, userId, updates) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('habits')
      .update({
        name: updates.name,
        category: updates.category,
        goal: updates.goal,
        frequency: updates.frequency,
        current_streak: updates.currentStreak,
        best_streak: updates.bestStreak,
        completed_dates: updates.completedDates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', habitId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteHabit(habitId, userId) {
    const supabase = getSupabaseClient(true);
    const { error } = await supabase
      .from('habits')
      .delete()
      .eq('id', habitId)
      .eq('user_id', userId);
    
    if (error) throw error;
  },
};
