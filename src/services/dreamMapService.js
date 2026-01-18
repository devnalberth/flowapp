import { getSupabaseClient } from '../lib/supabaseClient';

export const dreamMapService = {
  async getDreamMaps(userId) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('dream_maps')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async createDreamMap(userId, dreamMap) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('dream_maps')
      .insert({
        title: dreamMap.title,
        goal_id: dreamMap.goalId,
        image_url: dreamMap.imageUrl,
        user_id: userId,
      })
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async updateDreamMap(dreamMapId, userId, updates) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('dream_maps')
      .update({
        title: updates.title,
        goal_id: updates.goalId,
        image_url: updates.imageUrl,
        updated_at: new Date().toISOString(),
      })
      .eq('id', dreamMapId)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async deleteDreamMap(dreamMapId, userId) {
    const supabase = getSupabaseClient(true);
    const { error } = await supabase
      .from('dream_maps')
      .delete()
      .eq('id', dreamMapId)
      .eq('user_id', userId);
    
    if (error) throw error;
  },

  async uploadImage(file, userId) {
    const supabase = getSupabaseClient(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('dream-maps')
      .upload(fileName, file);
    
    if (error) throw error;
    
    const { data: { publicUrl } } = supabase.storage
      .from('dream-maps')
      .getPublicUrl(fileName);
    
    return publicUrl;
  },
};
