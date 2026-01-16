import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase environment variables are missing')
}

const memoryStorage = () => {
  let store = {}
  return {
    getItem: (key) => store[key] ?? null,
    setItem: (key, value) => {
      store[key] = value
    },
    removeItem: (key) => {
      delete store[key]
    },
  }
}

const resolveStorage = (type) => {
  if (typeof window === 'undefined') {
    return memoryStorage()
  }
  return type === 'session' ? window.sessionStorage : window.localStorage
}

const persistentStorage = resolveStorage('local')
const sessionStorage = resolveStorage('session')

const createAuthClient = (storage, storageKey) =>
  createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
      storage,
      storageKey,
    },
  })

export const supabasePersistent = createAuthClient(persistentStorage, 'flowapp-auth')
export const supabaseSession = createAuthClient(sessionStorage, 'flowapp-auth-session')

export const getSupabaseClient = (remember = true) => (remember ? supabasePersistent : supabaseSession)

export const supabase = supabasePersistent
