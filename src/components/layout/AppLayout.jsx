import { useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../../context/AppContext.jsx'
import { ShellProvider, useShell } from '../../context/ShellContext.jsx'
import { normalizeTaskStatus } from '../../utils/taskStatus.js'
import { useMotionPresets } from '../ui/motion.js'
import ToastProvider from '../ui/ToastProvider.jsx'
import Drawer from '../ui/Drawer.jsx'
import AccountSettingsModal from '../AccountSettingsModal/AccountSettingsModal.jsx'
import Sidebar from './Sidebar.jsx'
import Topbar from './Topbar.jsx'
import './AppLayout.css'

function Layout({ children, user, page, onNavigate, onLogout }) {
  const { tasks = [] } = useApp()
  const { accountTab, setAccountTab } = useShell()
  const { reduce } = useMotionPresets()
  const [mobileOpen, setMobileOpen] = useState(false)
  const mainRef = useRef(null)
  const taskCount = useMemo(() => {
    const today = new Date()
    const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    return tasks.filter((task) => {
      const status = normalizeTaskStatus(task)
      const due = String(task.due_date || task.dueDate || '').slice(0, 10)
      return (
        status !== 'done' &&
        status !== 'archived' &&
        /^\d{4}-\d{2}-\d{2}$/.test(due) &&
        due <= todayKey
      )
    }).length
  }, [tasks])
  const navigate = (next, params) => {
    setMobileOpen(false)
    onNavigate(next, params)
    mainRef.current?.scrollTo({ top: 0 })
  }
  const sidebarProps = { user, page, onNavigate: navigate, onLogout, taskCount }
  return (
    <div className={`fa-app ${page === 'FlowChat' ? 'fa-app--chat' : ''}`}>
      <a className="fa-skip-link" href="#conteudo-principal">
        Pular para o conteúdo
      </a>
      <motion.div
        className="fa-app__sidebar"
        initial={reduce ? { opacity: 0 } : { opacity: 0, x: -24 }}
        animate={reduce ? { opacity: 1 } : { opacity: 1, x: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      >
        <Sidebar {...sidebarProps} />
      </motion.div>
      <div className="fa-app__workspace">
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -10 }}
          animate={reduce ? { opacity: 1 } : { opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        >
          <Topbar
            title={page === 'Dashboard' ? 'Início' : page}
            onMenu={() => setMobileOpen(true)}
          />
        </motion.div>
        <main ref={mainRef} className="fa-app__panel" id="conteudo-principal" tabIndex={-1}>
          {children}
        </main>
      </div>
      {mobileOpen && (
        <Drawer title="Navegação" onClose={() => setMobileOpen(false)} className="fa-mobile-nav">
          <Sidebar {...sidebarProps} />
        </Drawer>
      )}
      {accountTab && (
        <AccountSettingsModal
          key={accountTab}
          user={user}
          initialTab={accountTab}
          onClose={() => setAccountTab(null)}
        />
      )}
    </div>
  )
}
export default function AppLayout(props) {
  return (
    <ShellProvider>
      <ToastProvider>
        <Layout {...props} />
      </ToastProvider>
    </ShellProvider>
  )
}
