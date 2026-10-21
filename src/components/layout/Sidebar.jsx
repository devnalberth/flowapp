import {
  Flame,
  FolderKanban,
  GraduationCap,
  House,
  ListChecks,
  Sparkles,
  Target,
  Wallet,
} from 'lucide-react'
import SidebarItem from './SidebarItem.jsx'
import AccountMenu from './AccountMenu.jsx'
import './Sidebar.css'

// Agenda joins this navigation when its screen is implemented in the next module.
const groups = [
  { items: [{ page: 'Dashboard', label: 'Início', icon: House }] },
  { label: 'FAZER', items: [{ page: 'Tarefas', label: 'Tarefas', icon: ListChecks }] },
  {
    label: 'PLANEJAR',
    items: [
      { page: 'Metas', label: 'Metas', icon: Target },
      { page: 'Projetos', label: 'Projetos', icon: FolderKanban },
      { page: 'Estudos', label: 'Estudos', icon: GraduationCap },
    ],
  },
  { label: 'ROTINA', items: [{ page: 'Hábitos', label: 'Hábitos', icon: Flame }] },
  { label: 'DINHEIRO', items: [{ page: 'Financeiro', label: 'Financeiro', icon: Wallet }] },
  { divider: true, items: [{ page: 'FlowChat', label: 'FlowChat', icon: Sparkles }] },
]

export default function Sidebar({ user, page, onNavigate, onLogout, taskCount = 0 }) {
  return (
    <aside className="fa-sidebar" aria-label="Barra lateral">
      <a href="#conteudo-principal" className="fa-sidebar__brand" aria-label="Flowapp">
        <img src="/assets/brand/flowapp-symbol.svg" width="32" height="32" alt="" />
        <span>Flowapp</span>
      </a>
      <nav aria-label="Navegação principal" className="fa-sidebar__nav">
        {groups.map((group, index) => (
          <div
            key={group.label || index}
            className={`fa-sidebar__group ${group.divider ? 'fa-sidebar__group--divider' : ''}`}
          >
            {group.label && <span className="fa-sidebar__group-label">{group.label}</span>}
            {group.items.map((item) => (
              <SidebarItem
                key={item.page}
                {...item}
                active={page === item.page}
                count={item.page === 'Tarefas' ? taskCount : 0}
                onClick={() => onNavigate(item.page)}
              />
            ))}
          </div>
        ))}
      </nav>
      <div className="fa-sidebar__account">
        <AccountMenu user={user} onLogout={onLogout} />
      </div>
    </aside>
  )
}
