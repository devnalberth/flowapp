import { getSupabaseClient } from '../lib/supabaseClient';

const normalizeSubtasks = (input) => {
  if (!Array.isArray(input)) return []
  return input
    .map((item, index) => {
      if (typeof item === 'string') {
        return { id: `subtask-${index}`, title: item }
      }

      if (!item || typeof item !== 'object') return null

      return {
        id: item.id || `subtask-${index}`,
        title: item.title || item.label || '',
        done: !!item.done,
      }
    })
    .filter(Boolean)
}

const normalizeTask = (task) => {
  const rawSubtasks = Array.isArray(task.subtasks)
    ? task.subtasks
    : Array.isArray(task.clarify_items)
      ? task.clarify_items
      : []
  const normalizedSubtasks = normalizeSubtasks(rawSubtasks)

  return {
    ...task,
  // CORREÇÃO 1: Garante que tags seja sempre um array, evitando o erro .includes() no frontend
    tags: task.tags || [],
    startDate: task.start_date,
    dueDate: task.due_date,
    projectId: task.project_id,
    clarifyItems: normalizedSubtasks,
    subtasks: normalizedSubtasks,
    // CORREÇÃO: Garante que time_spent seja sempre um número para o ProductivityCard
    time_spent: Number(task.time_spent) || 0,
  }
};

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
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        start_date: task.startDate || null,
        due_date: task.dueDate || null,
        project_id: task.projectId || null,
        clarify_items: task.subtasks || task.clarifyItems || [],
        // CORREÇÃO 2: Envia o array de tags para o banco (evita erro 400 se o campo existir no form)
        tags: task.tags || [],
        user_id: userId,
      })
      .select()
      .single();

    if (error) {
      console.error('taskService.createTask supabase response:', { data, error });
      throw error;
    }
    console.debug('taskService.createTask inserted:', data);
    return normalizeTask(data);
  },

  async updateTask(taskId, userId, updates) {
    const supabase = getSupabaseClient(true);

    // Prepara objeto de atualização apenas com campos definidos
    const payload = {
      title: updates.title,
      description: updates.description,
      status: updates.status,
      priority: updates.priority,
      start_date: updates.startDate ?? updates.start_date,
      due_date: updates.dueDate ?? updates.due_date,
      project_id: updates.projectId ?? updates.project_id,
      clarify_items: updates.subtasks || updates.clarifyItems,
      // CORREÇÃO: Campos críticos que estavam faltando
      completed: updates.completed,
      time_spent: updates.time_spent,
      // CORREÇÃO 3: Permite atualizar tags
      tags: updates.tags,
      updated_at: new Date().toISOString(),
    };

    // Remove chaves undefined para não apagar dados acidentalmente
    Object.keys(payload).forEach(key => payload[key] === undefined && delete payload[key]);

    const { data, error } = await supabase
      .from('tasks')
      .update(payload)
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