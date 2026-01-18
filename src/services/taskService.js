import { getSupabaseClient } from '../lib/supabaseClient';

const normalizeTask = (task) => ({
  ...task,
  startDate: task.start_date,
  dueDate: task.due_date,
  projectId: task.project_id,
  clarifyItems: task.clarify_items || [],
});

export const taskService = {
  async getTasks(userId) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(normalizeTask);
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
        start_date: task.startDate || null,
        due_date: task.dueDate || null,
        project_id: task.projectId || null,
        clarify_items: task.clarifyItems || [],
        user_id: userId,
      })
      .select()
      .single();
    
    if (error) throw error;
    return normalizeTask(data);
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
        start_date: updates.startDate,
        due_date: updates.dueDate,
        project_id: updates.projectId,
        clarify_items: updates.clarifyItems,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return normalizeTask(data);
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
