import { supabase, supabasePersistent, supabaseSession, getSupabaseClient } from '../lib/supabaseClient'

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
    // pick client that has session (prefer persistent then session)
    let client = supabasePersistent
    try {
      const { data: p } = await supabasePersistent.auth.getSession()
      if (!p || !p.session) {
        const { data: s } = await supabaseSession.auth.getSession()
        if (s && s.session) client = supabaseSession
      }
    } catch (e) {
      client = getSupabaseClient(true)
    }

    const { data: existingUser, error: fetchError } = await client
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

    const { data: newUser, error: insertError } = await client
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
  let client = supabasePersistent
  try {
    const { data: p } = await supabasePersistent.auth.getSession()
    if (!p || !p.session) {
      const { data: s } = await supabaseSession.auth.getSession()
      if (s && s.session) client = supabaseSession
    }
  } catch (e) {
    client = getSupabaseClient(true)
  }

  const { data, error } = await client
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