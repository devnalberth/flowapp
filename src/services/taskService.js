import { getSupabaseClient } from '../lib/supabaseClient';

export const taskService = {
  async getTasks(userId) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createTask(userId, task) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('tasks')
      .insert({
        title: task.title,
        description: task.description,
        status: task.status || 'pending',
        priority: task.priority || 'medium',
        due_date: task.dueDate,
        project_id: task.projectId,
        user_id: userId,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateTask(taskId, userId, updates) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('tasks')
      .update({
        title: updates.title,
        description: updates.description,
        status: updates.status,
        priority: updates.priority,
        due_date: updates.dueDate,
        project_id: updates.projectId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteTask(taskId, userId) {
    const supabase = getSupabaseClient(true);
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)
      .eq('user_id', userId);
    
    if (error) throw error;
  },
};
