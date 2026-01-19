import { createClient } from '@supabase/supabase-js'

const supabaseMeta = /** @type {any} */ (import.meta)
// Use optional chaining because `import.meta.env` may be undefined
const supabaseUrl = import.meta?.env?.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta?.env?.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase environment variables are missing. Ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined in your .env and available at build time (prefixed with VITE_).'
  )
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
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage,
      storageKey,
    },
  })

export const supabasePersistent = createAuthClient(persistentStorage, 'flowapp-auth')
export const supabaseSession = createAuthClient(sessionStorage, 'flowapp-auth-session')

export const getSupabaseClient = (remember = true) => (remember ? supabasePersistent : supabaseSession)

export const supabase = supabasePersistent

// TEMP DEBUG: helper to log which client is returned (safe top-level export)
export const _getSupabaseClientDebug = (remember = true) => {
  const c = getSupabaseClient(remember)
  try {
    console.debug('getSupabaseClient called with remember=', remember, 'returning=', c === supabasePersistent ? 'persistent' : 'session')
  } catch (e) {
    // ignore
  }
  return c
}
