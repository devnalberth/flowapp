import { useEffect, useState } from 'react'
import { AppProvider, useApp } from './context/AppContext.jsx'

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
import { getSupabaseClient, supabasePersistent, supabaseSession } from './lib/supabaseClient.js'
import { userService } from './services/userService'

const SUPPORTED_PAGES = ['Dashboard', 'Tarefas', 'Projetos', 'Metas', 'Estudos', 'Hábitos', 'Financeiro', 'AI Assistant']
const AUTH_STORAGE_KEY = 'flowapp-auth-storage'

const getPathname = () => (typeof window === 'undefined' ? '/' : window.location.pathname)

// Estado inicial vazio
const INITIAL_USER = {
  name: '',
  email: '',
  avatarUrl: 'https://placehold.co/42x42',
}

function App() {
  // AQUI ESTÁ A MÁGICA: Pegamos o userId do contexto.
  // Se o AppWrapper definiu o ID, estamos logados. Se for null, estamos deslogados.
  const { userId } = useApp()
  
  const [page, setPage] = useState('Dashboard')
  const [currentUser, setCurrentUser] = useState(INITIAL_USER)
  const [authInfoMessage, setAuthInfoMessage] = useState('')
  const [currentPath, setCurrentPath] = useState(getPathname())

  // Derivamos o estado de autenticação diretamente do userId
  const isAuthenticated = !!userId

  // Efeito para carregar os dados visuais do usuário (Nome, Avatar)
  // Só roda se tivermos um userId válido
  useEffect(() => {
    if (userId) {
      const fetchUserData = async () => {
        try {
          const client = getSupabaseClient(true)
          const { data: { user } } = await client.auth.getUser()
          if (user) {
            setCurrentUser(prev => ({
              ...prev,
              id: user.id,
              email: user.email ?? prev.email,
              name: user.user_metadata?.name ?? prev.name,
            }))
          }
        } catch (error) {
          console.error('Erro ao sincronizar dados do usuário:', error)
        }
      }
      fetchUserData()
    } else {
      setCurrentUser(INITIAL_USER)
    }
  }, [userId])

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
      setAuthInfoMessage('')
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(AUTH_STORAGE_KEY, targetPref)
      }
      // Não precisamos fazer mais nada. O AppWrapper vai detectar a sessão,
      // atualizar o userId no contexto, e o App vai re-renderizar automaticamente no Dashboard.
    }
  }

  const handleLogout = async () => {
    const client = getSupabaseClient(true)
    await client.auth.signOut()
    setPage('Dashboard')
    setAuthInfoMessage('Você saiu com sucesso. Faça login novamente abaixo.')
    replacePath('/')
  }

  const handleResetComplete = async (message) => {
    const client = getSupabaseClient(true)
    await client.auth.signOut()
    setAuthInfoMessage(message ?? 'Senha atualizada com sucesso. Faça login novamente.')
    replacePath('/')
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

// O AppWrapper continua blindado (Timeout 10s + Sem Logout Forçado)
export default function AppWrapper() {
  const [currentUserId, setCurrentUserId] = useState(null)
  const [isReady, setIsReady] = useState(false)

  // Timeout de 10 segundos
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isReady) {
        console.warn('AppWrapper: Auth check timeout - forcing ready state')
        setIsReady(true)
      }
    }, 10000)
    return () => clearTimeout(timer)
  }, [isReady])

  useEffect(() => {
    const clients = [supabasePersistent, supabaseSession]

    const loadFromClient = async (client) => {
      try {
        const { data: { session } } = await client.auth.getSession()
        
        if (session?.user) {
          const ensured = await userService.ensureUser(session.user, { createIfMissing: true })
          
          if (!ensured) {
            console.warn('Falha ao garantir usuário. Mantendo sessão local.')
            // Não força logout, apenas define ID como null temporariamente
            setCurrentUserId(null)
            return true 
          }
          
          setCurrentUserId(session.user.id)
          return true 
        }
        return false
      } catch (error) {
        console.error('Error ensuring user:', error)
        return false
      }
    }

    let mounted = true

    const initAuth = async () => {
      try {
        for (const client of clients) {
          if (!mounted) return
          const found = await loadFromClient(client)
          if (found) break
        }
      } catch (err) {
        console.error('Fatal error during auth check:', err)
      } finally {
        if (mounted) setIsReady(true)
      }
    }

    initAuth()

    const listeners = clients.map((client) =>
      client.auth.onAuthStateChange(async (_event, session) => {
        if (!mounted) return
        if (session?.user) {
          try {
            const ensured = await userService.ensureUser(session.user, { createIfMissing: true })
            setCurrentUserId(ensured ? session.user.id : null)
          } catch (error) {
            console.error('Error ensuring user on change:', error)
            setCurrentUserId(null)
          }
        } else {
          setCurrentUserId(null)
        }
      }),
    )

    return () => {
      mounted = false
      listeners.forEach((l) => l?.data?.subscription?.unsubscribe())
    }
  }, [])
  
  if (!isReady) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: '#09090b', 
        color: '#ffffff',
        fontFamily: 'sans-serif',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          border: '2px solid #333',
          borderTopColor: '#fff',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}/>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        <span>Carregando FlowApp...</span>
        <span style={{ fontSize: '0.8rem', color: '#666' }}>(Conectando ao banco de dados...)</span>
      </div>
    )
  }

  return (
    <AppProvider userId={currentUserId}>
      <App />
    </AppProvider>
  )
}