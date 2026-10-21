import { Eye, EyeOff, Menu, Plus } from 'lucide-react'
import { useApp } from '../../context/AppContext.jsx'
import { useShell } from '../../context/ShellContext.jsx'
import ActionMenu from '../ui/ActionMenu.jsx'
import Button from '../ui/Button.jsx'
import './Topbar.css'

export default function Topbar({ title, onMenu, now = new Date() }) {
  const { prefs, updatePrefs } = useApp()
  const { actions } = useShell()
  const hidden = Boolean(prefs.hideFinanceValues)
  const EyeIcon = hidden ? EyeOff : Eye
  const date = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(now)
  const trigger = (
    <Button
      variant="accent"
      icon={Plus}
      disabled={actions?.disabled}
      onClick={actions?.options?.length ? undefined : actions?.onClick}
    >
      {actions?.label || 'Novo'}
    </Button>
  )
  return (
    <header className="fa-topbar">
      <button
        type="button"
        className="fa-topbar__mobile-menu"
        aria-label="Abrir navegação"
        onClick={onMenu}
      >
        <Menu size={20} strokeWidth={1.75} />
      </button>
      <div className="fa-topbar__context">
        <span>{date.charAt(0).toUpperCase() + date.slice(1)}</span>
        <strong>{actions?.title || title}</strong>
      </div>
      <button
        type="button"
        className="fa-topbar__eye"
        onClick={() => updatePrefs({ hideFinanceValues: !hidden })}
        aria-pressed={hidden}
        aria-label={hidden ? 'Mostrar valores financeiros' : 'Ocultar valores financeiros'}
        title={hidden ? 'Mostrar valores financeiros' : 'Ocultar valores financeiros'}
      >
        <EyeIcon size={18} strokeWidth={1.75} aria-hidden="true" />
      </button>
      {actions &&
        (actions.options?.length ? (
          <ActionMenu trigger={trigger} items={actions.options} label="Criar novo item" />
        ) : (
          trigger
        ))}
    </header>
  )
}
