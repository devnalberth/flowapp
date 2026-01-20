import { getSupabaseClient } from '../lib/supabaseClient';

// Função auxiliar para traduzir do Banco (name) para o App (label)
const normalizeHabit = (habit) => ({
  ...habit,
  // TRADUÇÃO: Banco (name) -> Frontend (label)
  label: habit.name, 
  currentStreak: habit.current_streak,
  bestStreak: habit.best_streak,
  completions: habit.completed_dates || {},
});

export const habitService = {
  async getHabits(userId) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('habits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(normalizeHabit);
  },

  async createHabit(userId, habit) {
    const supabase = getSupabaseClient(true);
    
    // TRADUÇÃO: Frontend (label ou name) -> Banco (name)
    // O modal envia 'label', então usamos habit.label || habit.name
    const payload = {
      name: habit.label || habit.name, 
      category: habit.category,
      goal: habit.goal || null,
      frequency: habit.frequency || 'daily',
      current_streak: habit.currentStreak || 0,
      best_streak: habit.bestStreak || 0,
      completed_dates: habit.completions || {},
      user_id: userId,
    };

    const { data, error } = await supabase
      .from('habits')
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      console.error('habitService.createHabit supabase response:', { data, error });
      throw error;
    }
    
    return normalizeHabit(data);
  },

  async updateHabit(habitId, userId, updates) {
    const supabase = getSupabaseClient(true);
    
    // TRADUÇÃO: Verifica se veio label ou name para atualizar
    const payload = {};
    if (updates.label !== undefined) payload.name = updates.label;
    if (updates.name !== undefined) payload.name = updates.name;
    
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.goal !== undefined) payload.goal = updates.goal;
    if (updates.frequency !== undefined) payload.frequency = updates.frequency;
    if (updates.currentStreak !== undefined) payload.current_streak = updates.currentStreak;
    if (updates.bestStreak !== undefined) payload.best_streak = updates.bestStreak;
    if (updates.completions !== undefined) payload.completed_dates = updates.completions;
    
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('habits')
      .update(payload)
      .eq('id', habitId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return normalizeHabit(data);
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