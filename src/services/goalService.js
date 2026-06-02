import { getSupabaseClient } from '../lib/supabaseClient';

const normalizeGoal = (goal) => ({
  ...goal,
  startDate: goal.start_date,
  endDate: goal.end_date,
  financeCategory: goal.finance_category ?? null,
  financeTarget: goal.finance_target != null ? Number(goal.finance_target) : null,
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
    const payload = {
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
      finance_category: goal.financeCategory || null,
      finance_target: goal.financeTarget != null && goal.financeTarget !== '' ? Number(goal.financeTarget) : null,
      user_id: userId,
    }

    try {
      console.debug('[goalService.createGoal] payload:', payload)
      const { data, error } = await supabase
        .from('goals')
        .insert(payload)
        .select()
        .single()

      console.debug('[goalService.createGoal] response data:', data, 'error:', error)

      if (error) {
        console.error('goalService.createGoal supabase response:', { data, error })
        throw error
      }

      console.debug('goalService.createGoal inserted:', data)
      return normalizeGoal(data)
    } catch (err) {
      console.error('[goalService.createGoal] Error creating goal:', err)
      throw err
    }
  },

  async updateGoal(goalId, userId, updates) {
    const supabase = getSupabaseClient(true);
    // Monta o payload só com os campos enviados — evita zerar dados (ex.: o sync
    // de progresso de projetos manda só { progress } e não deve apagar a meta financeira).
    const payload = { updated_at: new Date().toISOString() }
    if (updates.title !== undefined) payload.title = updates.title
    if (updates.area !== undefined) payload.area = updates.area
    if (updates.type !== undefined) payload.type = updates.type
    if (updates.target !== undefined) payload.target = updates.target
    if (updates.current !== undefined) payload.current = updates.current
    if (updates.progress !== undefined) payload.progress = updates.progress
    if (updates.startDate !== undefined) payload.start_date = updates.startDate || null
    if (updates.endDate !== undefined) payload.end_date = updates.endDate || null
    if (updates.trimesters !== undefined) payload.trimesters = updates.trimesters
    if (updates.trimesterValues !== undefined) payload.trimester_values = updates.trimesterValues
    if (updates.financeCategory !== undefined) payload.finance_category = updates.financeCategory || null
    if (updates.financeTarget !== undefined) payload.finance_target = updates.financeTarget != null && updates.financeTarget !== '' ? Number(updates.financeTarget) : null

    const { data, error } = await supabase
      .from('goals')
      .update(payload)
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
