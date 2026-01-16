import { getSupabaseClient } from '../lib/supabaseClient';

export const projectService = {
  async getProjects(userId) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createProject(userId, project) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('projects')
      .insert({
        title: project.title,
        description: project.description,
        status: project.status || 'active',
        color: project.color,
        progress: project.progress || 0,
        user_id: userId,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateProject(projectId, userId, updates) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('projects')
      .update({
        title: updates.title,
        description: updates.description,
        status: updates.status,
        color: updates.color,
        progress: updates.progress,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteProject(projectId, userId) {
    const supabase = getSupabaseClient(true);
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', projectId)
      .eq('user_id', userId);
    
    if (error) throw error;
  },
};
