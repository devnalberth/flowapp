import { LogOut, Settings, SlidersHorizontal, Sparkles } from 'lucide-react'
import { useShell } from '../../context/ShellContext.jsx'
import ActionMenu from '../ui/ActionMenu.jsx'
import Avatar from '../ui/Avatar.jsx'
import './AccountMenu.css'

export default function AccountMenu({ user, onLogout }) {
  const { setAccountTab } = useShell()
  return (
    <ActionMenu
      side="top"
      label="Menu da conta"
      trigger={
        <button
          type="button"
          className="fa-account-trigger"
          aria-label={`Conta e ajustes${user?.name ? ` de ${user.name}` : ''}`}
        >
          <Avatar user={user} size="md" />
          <span className="fa-account-trigger__name">
            <strong>{user?.name || 'Minha conta'}</strong>
            <span>Conta e ajustes</span>
          </span>
          <Settings size={18} strokeWidth={1.75} aria-hidden="true" />
        </button>
      }
      items={[
        {
          label: 'Configurações da conta',
          icon: Settings,
          onClick: () => setAccountTab('profile'),
        },
        {
          label: 'Preferências',
          icon: SlidersHorizontal,
          onClick: () => setAccountTab('preferences'),
        },
        { label: 'Provedor do FlowChat', icon: Sparkles, onClick: () => setAccountTab('flowchat') },
        { separator: true },
        { label: 'Sair', icon: LogOut, danger: true, onClick: onLogout },
      ]}
    />
  )
}
