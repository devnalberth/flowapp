import { supabase } from '../lib/supabaseClient'

export type UserData = {
  id: string
  email?: string
  name?: string
  [key: string]: any
}

export async function ensureUser(authUser: any, options: { createIfMissing?: boolean } = { createIfMissing: true }) {
  if (!authUser || !authUser.id) return null

  const { createIfMissing = true } = options

  try {
    const { data: existingUser, error: fetchError } = await supabase
      .from('users')
      .select('*')
      .eq('id', authUser.id)
      .single()

    if (existingUser) return existingUser

    if (fetchError && (fetchError as any).code !== 'PGRST116') {
      throw fetchError
    }

    if (!createIfMissing) {
      return null
    }

    const payload: UserData = {
      id: authUser.id,
      email: authUser.email ?? null,
      name: authUser.user_metadata?.name || authUser.email?.split('@')?.[0] || null,
    }

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert(payload)
      .select()
      .single()

    if (insertError) throw insertError
    return newUser
  } catch (err) {
    try {
      console.error('ensureUser error:', (err as any)?.message ?? err, err)
    } catch (logErr) {
      console.error('ensureUser error (fallback log):', logErr)
    }
    throw err
  }
}

export async function getUser(userId: string) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function updateUser(userId: string, updates: Partial<UserData>) {
  const { data, error } = await supabase
    .from('users')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

export const userService = {
  ensureUser,
  getUser,
  updateUser,
}

export default userService