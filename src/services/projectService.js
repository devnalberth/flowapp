import { getSupabaseClient } from '../lib/supabaseClient';

// Expõe campos camelCase usados na UI, mantendo os snake_case do banco.
const normalizeProject = (project) => {
  if (!project) return project;
  return {
    ...project,
    startDate: project.start_date,
    endDate: project.end_date,
    goalId: project.goal_id,
    clientId: project.client_id,
  };
};

export const projectService = {
  async getProjects(userId) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(normalizeProject);
  },

  async createProject(userId, project) {
    const supabase = getSupabaseClient(true);

    const projectData = {
      title: project.title,
      description: project.description || null,
      status: project.status || 'todo',
      area: project.area || null,
      color: project.color || 'ff9500',
      progress: parseInt(project.progress) || 0,
      start_date: project.startDate || project.start_date || null,
      end_date: project.endDate || project.end_date || null,
      user_id: userId,
      goal_id: project.goalId || null,
      client_id: project.clientId || null,
    };

    const { data, error } = await supabase
      .from('projects')
      .insert(projectData)
      .select()
      .single();

    if (error) {
      console.error('projectService.createProject supabase response:', { data, error });
      throw error;
    }
    return normalizeProject(data);
  },

  async updateProject(projectId, userId, updates) {
    const supabase = getSupabaseClient(true);

    const updateData = {
      ...(updates.title !== undefined && { title: updates.title }),
      ...(updates.description !== undefined && { description: updates.description }),
      ...(updates.status !== undefined && { status: updates.status }),
      ...(updates.area !== undefined && { area: updates.area || null }),
      ...(updates.color !== undefined && { color: updates.color }),
      ...(updates.progress !== undefined && { progress: parseInt(updates.progress) }),
      ...(updates.goalId !== undefined && { goal_id: updates.goalId || null }),
      ...((updates.startDate !== undefined || updates.start_date !== undefined) && { start_date: updates.startDate ?? updates.start_date ?? null }),
      ...((updates.endDate !== undefined || updates.end_date !== undefined) && { end_date: updates.endDate ?? updates.end_date ?? null }),
      ...((updates.clientId !== undefined || updates.client_id !== undefined) && { client_id: updates.clientId ?? updates.client_id ?? null }),
      updated_at: new Date().toISOString(),
    };

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

    return normalizeProject(data);
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
