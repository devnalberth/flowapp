import { getSupabaseClient, supabasePersistent, supabaseSession } from '../lib/supabaseClient';

export const userService = {
  async ensureUser(authUser, options = { createIfMissing: true }) {
    if (!authUser || !authUser.id) return null;

    const { createIfMissing } = options
    // Choose a client that currently has a session: prefer persistent, then session, then default
    let supabase = supabasePersistent
    try {
      const { data: p } = await supabasePersistent.auth.getSession()
      if (!p || !p.session) {
        const { data: s } = await supabaseSession.auth.getSession()
        if (s && s.session) supabase = supabaseSession
      }
    } catch (e) {
      // fallback to getSupabaseClient
      supabase = getSupabaseClient(true)
    }

    try {
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      if (existingUser) return existingUser;

      if (fetchError && fetchError.code !== 'PGRST116') throw fetchError;

      if (!createIfMissing) {
        // Do not recreate deleted users — signal caller to handle logout
        return null
      }

      const payload = {
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email?.split('@')[0],
      };

      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert(payload)
        .select()
        .single();

      if (insertError) throw insertError;
      return newUser;
    } catch (err) {
      try {
        console.error('ensureUser error:', err?.message ?? err, err);
      } catch (logErr) {
        console.error('ensureUser error (fallback log):', logErr)
      }
      throw err
    }
  },

  async getUser(userId) {
      // pick authenticated client if available
      let supabase = supabasePersistent
      try {
        const { data: p } = await supabasePersistent.auth.getSession()
        if (!p || !p.session) {
          const { data: s } = await supabaseSession.auth.getSession()
          if (s && s.session) supabase = supabaseSession
        }
      } catch (e) {
        supabase = getSupabaseClient(true)
      }
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateUser(userId, updates) {
    const supabase = getSupabaseClient(true);
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

export default userService;

