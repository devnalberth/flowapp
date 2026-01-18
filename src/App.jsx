import { useEffect, useState } from 'react'
import { AppProvider } from './context/AppContext.jsx'

import Dashboard from './pages/Dashboard/Dashboard.jsx'
import Projects from './pages/Projects/Projects.jsx'
import Tasks from './pages/Tasks/Tasks.jsx'
import Goals from './pages/Goals/Goals.jsx'
import Studies from './pages/Studies/Studies.jsx'
import Habits from './pages/Habits/Habits.jsx'
import Finance from './pages/Finance/Finance.jsx'
import AIAssistant from './pages/AIAssistant/AIAssistant.jsx'
import Login from './pages/Login/Login.jsx'
import ResetPassword from './pages/ResetPassword/ResetPassword.jsx'
import { getSupabaseClient } from './lib/supabaseClient.js'
import { userService } from './services/userService.js'

const SUPPORTED_PAGES = ['Dashboard', 'Tarefas', 'Projetos', 'Metas', 'Estudos', 'Hábitos', 'Financeiro', 'AI Assistant']
const AUTH_STORAGE_KEY = 'flowapp-auth-storage'

const getPathname = () => (typeof window === 'undefined' ? '/' : window.location.pathname)

const USER = {
  name: 'Matheus Nalberth',
  email: 'Nalberthdev@gmail.com',
  avatarUrl: 'https://placehold.co/42x42',
}

function App() {
  const resolveInitialAuth = () => {
    if (typeof window === 'undefined') {
      return { pref: 'local', client: getSupabaseClient(true) }
    }
    const stored = window.localStorage.getItem(AUTH_STORAGE_KEY) === 'session' ? 'session' : 'local'
    return { pref: stored, client: getSupabaseClient(stored !== 'session') }
  }

  const initialAuth = resolveInitialAuth()

  const [page, setPage] = useState('Dashboard')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [currentUser, setCurrentUser] = useState(USER)
  const [isAuthReady, setIsAuthReady] = useState(false)
  const [authPreference, setAuthPreference] = useState(initialAuth.pref)
  const [authClient, setAuthClient] = useState(initialAuth.client)
  const [authInfoMessage, setAuthInfoMessage] = useState('')
  const [currentPath, setCurrentPath] = useState(getPathname())

  const syncUser = (sessionUser) => {
    if (!sessionUser) return
    setCurrentUser((prev) => ({
      ...prev,
      id: sessionUser.id,
      email: sessionUser.email ?? prev.email,
      name: sessionUser.user_metadata?.name ?? prev.name,
    }))
  }

  useEffect(() => {
    let isMounted = true
    setIsAuthReady(false)

    const bootstrap = async () => {
      try {
        // Timeout de 3 segundos para getSession
        const sessionPromise = authClient.auth.getSession()
        const timeoutPromise = new Promise((resolve) => {
          setTimeout(() => resolve({ data: { session: null } }), 3000)
        })
        
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise])

        if (!isMounted) return

        if (session?.user) {
          syncUser(session.user)
          setIsAuthenticated(true)
        } else {
          setIsAuthenticated(false)
        }
      } catch (error) {
        console.error('Error loading session:', error)
        if (isMounted) {
          setIsAuthenticated(false)
        }
      } finally {
        if (isMounted) {
          setIsAuthReady(true)
        }
      }
    }

    bootstrap()

    const {
      data: authListener,
    } = authClient.auth.onAuthStateChange((_event, session) => {
      if (!isMounted) return
      if (session?.user) {
        syncUser(session.user)
        setIsAuthenticated(true)
      } else {
        setIsAuthenticated(false)
      }
    })

    return () => {
      isMounted = false
      authListener.subscription.unsubscribe()
    }
  }, [authClient])

  useEffect(() => {
    if (typeof window === 'undefined') return undefined
    const handlePop = () => setCurrentPath(getPathname())
    window.addEventListener('popstate', handlePop)
    return () => window.removeEventListener('popstate', handlePop)
  }, [])

  const replacePath = (nextPath) => {
    if (typeof window !== 'undefined' && getPathname() !== nextPath) {
      window.history.replaceState(null, '', nextPath)
    }
    setCurrentPath(nextPath)
  }

  const handleNavigate = (next) => {
    if (SUPPORTED_PAGES.includes(next)) {
      setPage(next)
    }
  }

  const handleLogin = async ({ email, password, remember }) => {
    if (!email || !password) {
      throw new Error('Preencha e-mail e senha')
    }

    const preferSession = remember === false
    const targetPref = preferSession ? 'session' : 'local'
    const client = getSupabaseClient(!preferSession)

    const { data, error } = await client.auth.signInWithPassword({ email, password })

    if (error) {
      throw new Error(error.message)
    }

    if (data.user) {
      syncUser(data.user)
      setIsAuthenticated(true)
      setAuthInfoMessage('')
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(AUTH_STORAGE_KEY, targetPref)
      }
      if (authPreference !== targetPref) {
        setAuthPreference(targetPref)
        setAuthClient(client)
      }
    }
  }

  const handleLogout = async () => {
    await authClient.auth.signOut()
    setIsAuthenticated(false)
    setPage('Dashboard')
    setAuthInfoMessage('Você saiu com sucesso. Faça login novamente abaixo.')
    replacePath('/')
  }

  const handleResetComplete = async (message) => {
    await authClient.auth.signOut()
    setAuthInfoMessage(message ?? 'Senha atualizada com sucesso. Faça login novamente.')
    replacePath('/')
    setIsAuthenticated(false)
  }

  if (!isAuthReady) {
    return (
      <div className="app__splash">
        <p>Carregando workspace...</p>
      </div>
    )
  }

  if (currentPath === '/recuperar-senha') {
    return <ResetPassword onComplete={handleResetComplete} />
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} infoMessage={authInfoMessage} />
  }

  const pageProps = { user: currentUser, onNavigate: handleNavigate, onLogout: handleLogout }

  if (page === 'Projetos') {
    return <Projects {...pageProps} />
  }

  if (page === 'Tarefas') {
    return <Tasks {...pageProps} />
  }

  if (page === 'Metas') {
    return <Goals {...pageProps} />
  }

  if (page === 'Estudos') {
    return <Studies {...pageProps} />
  }

  if (page === 'Hábitos') {
    return <Habits {...pageProps} />
  }

  if (page === 'Financeiro') {
    return <Finance {...pageProps} />
  }

  if (page === 'AI Assistant') {
    return <AIAssistant {...pageProps} />
  }

  return <Dashboard {...pageProps} />
}

// Wrap app with Context Provider
export default function AppWrapper() {
  const [currentUserId, setCurrentUserId] = useState(null)
  
  useEffect(() => {
    const client = getSupabaseClient(true)
    
    const loadUser = async () => {
      const { data: { session } } = await client.auth.getSession()
      if (session?.user) {
        try {
          // Garantir que o usuário existe na tabela users
          await userService.ensureUser(session.user)
          setCurrentUserId(session.user.id)
        } catch (error) {
          console.error('Error ensuring user:', error)
          setCurrentUserId(null)
        }
      } else {
        setCurrentUserId(null)
      }
    }
    
    loadUser()
    
    const { data: listener } = client.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        try {
          // Garantir que o usuário existe na tabela users
          await userService.ensureUser(session.user)
          setCurrentUserId(session.user.id)
        } catch (error) {
          console.error('Error ensuring user:', error)
          setCurrentUserId(null)
        }
      } else {
        setCurrentUserId(null)
      }
    })
    
    return () => {
      listener?.subscription?.unsubscribe()
    }
  }, [])
  
  return (
    <AppProvider userId={currentUserId}>
      <App />
    </AppProvider>
  )
}
