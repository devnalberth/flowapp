import { getSupabaseClient } from '../lib/supabaseClient';

// Cliente é opcional num projeto, mas quando existe é reutilizável entre projetos.
const normalizeClient = (client) => {
  if (!client) return client;
  return { ...client };
};

export const clientService = {
  async getClients(userId) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []).map(normalizeClient);
  },

  async createClient(userId, client) {
    const supabase = getSupabaseClient(true);

    const payload = {
      name: client.name,
      company: client.company || null,
      email: client.email || null,
      phone: client.phone || null,
      notes: client.notes || null,
      color: client.color || null,
      user_id: userId,
    };

    const { data, error } = await supabase
      .from('clients')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return normalizeClient(data);
  },

  async updateClient(clientId, userId, updates) {
    const supabase = getSupabaseClient(true);

    const payload = {
      ...(updates.name !== undefined && { name: updates.name }),
      ...(updates.company !== undefined && { company: updates.company || null }),
      ...(updates.email !== undefined && { email: updates.email || null }),
      ...(updates.phone !== undefined && { phone: updates.phone || null }),
      ...(updates.notes !== undefined && { notes: updates.notes || null }),
      ...(updates.color !== undefined && { color: updates.color || null }),
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('clients')
      .update(payload)
      .eq('id', clientId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return normalizeClient(data);
  },

  async deleteClient(clientId, userId) {
    const supabase = getSupabaseClient(true);
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId)
      .eq('user_id', userId);

    if (error) throw error;
  },
};
