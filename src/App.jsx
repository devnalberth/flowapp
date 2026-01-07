import { useState } from 'react'

import Dashboard from './pages/Dashboard/Dashboard.jsx'
import Projects from './pages/Projects/Projects.jsx'
import Tasks from './pages/Tasks/Tasks.jsx'

const SUPPORTED_PAGES = ['Dashboard', 'Tarefas', 'Projetos']

const USER = {
  name: 'Matheus Nalberth',
  email: 'Nalberthdev@gmail.com',
  avatarUrl: 'https://placehold.co/42x42',
}

export default function App() {
  const [page, setPage] = useState('Dashboard')

  const handleNavigate = (next) => {
    if (SUPPORTED_PAGES.includes(next)) {
      setPage(next)
    }
  }

  const pageProps = { user: USER, onNavigate: handleNavigate }

  if (page === 'Projetos') {
    return <Projects {...pageProps} />
  }

  if (page === 'Tarefas') {
    return <Tasks {...pageProps} />
  }

  return <Dashboard {...pageProps} />
}
