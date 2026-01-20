import { useEffect, useState, useLayoutEffect } from 'react'
import { AppProvider, useApp } from './context/AppContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

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

const INITIAL_USER = {
  name: '',
  email: '',
  avatarUrl: 'https://placehold.co/42x42',
}

// Função auxiliar para evitar travamento infinito no login
const loginWithTimeout = (promise, ms = 10000) => {
  let timeoutId;
  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error('O servidor demorou para responder. Verifique sua conexão e tente novamente.'));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timeoutId));
};

function App() {
  const { userId } = useApp()
  const [page, setPage] = useState('Dashboard')
  const [currentUser, setCurrentUser] = useState(INITIAL_USER)
  const [authInfoMessage, setAuthInfoMessage] = useState('')
  const [currentPath, setCurrentPath] = useState(getPathname())

  // Se tiver userId, está autenticado. Simples assim.
  const isAuthenticated = !!userId

  // Carrega dados visuais do usuário quando o ID muda
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
          console.error('Erro user data:', error)
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

  const handleNavigate = (next) => {
    if (SUPPORTED_PAGES.includes(next)) {
      setPage(next)
    }
  }

  const handleLogin = async ({ email, password, remember }) => {
    if (!email || !password) throw new Error('Preencha e-mail e senha')

    const preferSession = remember === false
    const targetPref = preferSession ? 'session' : 'local'
    
    // Usamos o cliente correto baseada na preferência "Lembrar de mim"
    const client = getSupabaseClient(!preferSession)

    try {
      // CORREÇÃO: Usamos o wrapper com timeout para não travar o botão "Entrando..."
      const { data, error } = await loginWithTimeout(
        client.auth.signInWithPassword({ email, password })
      )

      if (error) throw new Error(error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos.' : error.message)

      if (data.user) {
        setAuthInfoMessage('')
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(AUTH_STORAGE_KEY, targetPref)
        }
        // NÃO usamos reload(). O AppWrapper vai detectar o login via listener e atualizar o estado.
        // Isso torna a transição instantânea.
      }
    } catch (err) {
      throw err // Repassa o erro para o componente de Login mostrar o alerta vermelho
    }
  }

  const handleLogout = async () => {
    const client = getSupabaseClient(true)
    await client.auth.signOut()
    setPage('Dashboard')
    setAuthInfoMessage('Você saiu com sucesso.')
    // Atualiza a URL sem recarregar
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/')
      setCurrentPath('/')
    }
  }

  const handleResetComplete = async (message) => {
    const client = getSupabaseClient(true)
    await client.auth.signOut()
    setAuthInfoMessage(message ?? 'Senha atualizada.')
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', '/')
      setCurrentPath('/')
    }
  }

  if (currentPath === '/recuperar-senha') {
    return <ResetPassword onComplete={handleResetComplete} />
  }

  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} infoMessage={authInfoMessage} />
  }

  const pageProps = { user: currentUser, onNavigate: handleNavigate, onLogout: handleLogout }

  return (
    <ErrorBoundary>
      {page === 'Projetos' && <Projects {...pageProps} />}
      {page === 'Tarefas' && <Tasks {...pageProps} />}
      {page === 'Metas' && <Goals {...pageProps} />}
      {page === 'Estudos' && <Studies {...pageProps} />}
      {page === 'Hábitos' && <Habits {...pageProps} />}
      {page === 'Financeiro' && <Finance {...pageProps} />}
      {page === 'AI Assistant' && <AIAssistant {...pageProps} />}
      {page === 'Dashboard' && <Dashboard {...pageProps} />}
    </ErrorBoundary>
  )
}

export default function AppWrapper() {
  const [currentUserId, setCurrentUserId] = useState(null)
  
  // ESTRATÉGIA DE CARREGAMENTO INSTANTÂNEO:
  // Verificamos o localStorage antes de qualquer renderização.
  // Se NÃO houver token salvo, definimos isReady=true imediatamente.
  // Isso faz a tela de login aparecer instantaneamente (0ms de tela preta).
  const [isReady, setIsReady] = useState(() => {
    if (typeof window === 'undefined') return false
    
    // Procura por tokens do Supabase ou nossa chave de preferência
    const hasData = Object.keys(localStorage).some(k => k.startsWith('sb-') || k === AUTH_STORAGE_KEY)
    
    // Se não tem dados, está pronto para mostrar o Login. Se tem, espera verificar a sessão.
    return !hasData 
  })

  // Timeout de segurança: Se tiver token mas a internet estiver ruim, libera após 5s
  useEffect(() => {
    if (isReady) return
    const timer = setTimeout(() => {
      console.warn('AppWrapper: Timeout de verificação - liberando acesso')
      setIsReady(true)
    }, 5000)
    return () => clearTimeout(timer)
  }, [isReady])

  useEffect(() => {
    const clients = [supabasePersistent, supabaseSession]
    let mounted = true

    // Função unificada para carregar e garantir usuário
    const checkSession = async (client) => {
      try {
        const { data: { session } } = await client.auth.getSession()
        if (session?.user) {
          // Tenta garantir o usuário no banco (createIfMissing)
          // Se falhar (offline), assume que está logado localmente para não bloquear
          try {
             await userService.ensureUser(session.user, { createIfMissing: true })
          } catch (e) {
             console.warn('Modo offline: não foi possível sincronizar usuário', e)
          }
          
          if (mounted) {
            setCurrentUserId(session.user.id)
            setIsReady(true) // Login confirmado -> Libera tela
            return true
          }
        }
        return false
      } catch (err) {
        console.error('Erro ao verificar sessão:', err)
        return false
      }
    }

    const initAuth = async () => {
      // Tenta recuperar sessão de qualquer cliente (Local ou Sessão)
      let found = false
      for (const client of clients) {
        if (await checkSession(client)) {
          found = true
          break
        }
      }
      
      // Se terminou de checar tudo e não achou, libera a tela (vai cair no Login)
      if (mounted && !found) {
        setIsReady(true)
      }
    }

    initAuth()

    // Listener para mudanças de estado (Login/Logout) em tempo real
    const listeners = clients.map((client) =>
      client.auth.onAuthStateChange(async (event, session) => {
        if (!mounted) return
        
        if (session?.user) {
           setCurrentUserId(session.user.id)
           setIsReady(true) // Garante que a tela libera ao logar
        } else if (event === 'SIGNED_OUT') {
           setCurrentUserId(null)
           setIsReady(true) // Garante que a tela libera ao deslogar
        }
      })
    )

    return () => {
      mounted = false
      listeners.forEach((l) => l.data.subscription.unsubscribe())
    }
  }, [])
  
  if (!isReady) {
    // Loader minimalista com fundo branco (evita sensação de "tela preta quebrada")
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh', 
        backgroundColor: '#ffffff', 
        color: '#333' 
      }}>
        <div style={{
          width: '24px',
          height: '24px',
          border: '3px solid #f3f3f3',
          borderTop: '3px solid #3b82f6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}/>
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <AppProvider userId={currentUserId}>
      <App />
    </AppProvider>
  )
}