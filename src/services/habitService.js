import { getSupabaseClient } from '../lib/supabaseClient';

// Função auxiliar para traduzir do Banco (name) para o App (label)
const normalizeHabit = (habit) => {
  // CORREÇÃO CRÍTICA: Garante que 'completions' seja SEMPRE um array
  let completions = [];
  
  if (Array.isArray(habit.completed_dates)) {
    completions = habit.completed_dates;
  } else if (typeof habit.completed_dates === 'string') {
    // === NOVA PROTEÇÃO CONTRA TELA BRANCA ===
    // Se a string for vazia (""), o JSON.parse quebrava com "Unexpected end of JSON input".
    // Agora verificamos antes se tem conteúdo.
    if (!habit.completed_dates.trim()) {
      completions = [];
    } else {
      try {
        const parsed = JSON.parse(habit.completed_dates);
        if (Array.isArray(parsed)) completions = parsed;
      } catch (e) {
        console.warn('Erro ao decodificar hábito (ignorado):', e);
        completions = [];
      }
    }
  }
  
  return {
    ...habit,
    // Mantém compatibilidade: label para frontend, name do banco
    label: habit.name, 
    currentStreak: habit.current_streak,
    bestStreak: habit.best_streak,
    completions: completions,
  };
};

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
    
    const payload = {
      name: habit.label || habit.name, 
      category: habit.category,
      goal: habit.goal || null,
      frequency: habit.frequency || 'daily',
      current_streak: habit.currentStreak || 0,
      best_streak: habit.bestStreak || 0,
      // Salva sempre como Array vazio [] se não tiver dados
      completed_dates: Array.isArray(habit.completions) ? habit.completions : [],
      user_id: userId,
    };

    const { data, error } = await supabase
      .from('habits')
      .insert(payload)
      .select()
      .single();
    
    if (error) {
      console.error('habitService.createHabit erro:', error);
      throw error;
    }
    
    return normalizeHabit(data);
  },

  async updateHabit(habitId, userId, updates) {
    const supabase = getSupabaseClient(true);
    
    const payload = {};
    // Mapeamento inteligente de campos
    if (updates.label !== undefined) payload.name = updates.label;
    if (updates.name !== undefined) payload.name = updates.name;
    
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.goal !== undefined) payload.goal = updates.goal;
    if (updates.frequency !== undefined) payload.frequency = updates.frequency;
    if (updates.currentStreak !== undefined) payload.current_streak = updates.currentStreak;
    if (updates.bestStreak !== undefined) payload.best_streak = updates.bestStreak;
    
    // Garante que ao atualizar, enviamos array
    if (updates.completions !== undefined) {
      payload.completed_dates = Array.isArray(updates.completions) 
        ? updates.completions 
        : []; 
    }
    
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