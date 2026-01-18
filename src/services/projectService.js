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
    
    const projectData = {
      title: project.title,
      description: project.description || null,
      status: project.status || 'todo',
      color: project.color || 'ff9500',
      progress: parseInt(project.progress) || 0,
      start_date: project.startDate || null,
      end_date: project.endDate || null,
      goal_id: project.goalId || null,
      user_id: userId,
    };
    
    console.log('Creating project with data:', projectData);
    
    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase error:', error);
      throw error;
    }
    
    return data;
  },

  async updateProject(projectId, userId, updates) {
    const supabase = getSupabaseClient(true);
    
    const updateData = {
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.color !== undefined && { color: updates.color }),
      ...(updates.progress !== undefined && { progress: parseInt(updates.progress) }),
      ...(updates.startDate !== undefined && { start_date: updates.startDate }),
      ...(updates.endDate !== undefined && { end_date: updates.endDate }),
      ...(updates.goalId !== undefined && { goal_id: updates.goalId }),
    };
    
    console.log('Updating project:', projectId, updateData);
    
    const { data, error } = await supabase
      .from('projects')
      .update(updateData)
      .eq('id', projectId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) {
      console.error('Supabase update error:', error);
      throw error;
    }
    
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
