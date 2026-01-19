import { getSupabaseClient } from '../lib/supabaseClient';

export const userService = {
  async ensureUser(authUser) {
    if (!authUser || !authUser.id) {
      console.log('No auth user provided');
      return null;
    }
    
    const supabase = getSupabaseClient(true);
    
    try {
      // Verificar se o usuário já existe
      const { data: existingUser, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();
      
      // Se já existe, retornar
      if (existingUser) {
        console.log('User already exists:', existingUser.id);
        return existingUser;
      }
      
      // Se o erro não for "não encontrado", lançar erro
      if (fetchError && fetchError.code !== 'PGRST116') {
        console.error('Error fetching user:', fetchError);
        throw fetchError;
      }
      
      // Se não existe, criar
      console.log('Creating new user:', authUser.id);
      const { data: newUser, error: insertError } = await supabase
        .from('users')
        .insert({
          id: authUser.id,
          email: authUser.email,
          name: authUser.user_metadata?.name || authUser.email?.split('@')[0],
        })
        .select()
        .single();
      
      if (insertError) {
        console.error('Error creating user:', insertError);
        throw insertError;
      }
      
      console.log('User created successfully:', newUser.id);
      return newUser;
    } catch (error) {
      console.error('ensureUser error:', error);
      // Não lançar erro, apenas retornar null para permitir que o app continue
      return null;
    }
  };
    const supabase = getSupabaseClient(true);
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
