import './TopNav.css'

import { useEffect, useRef, useState } from 'react'

const NAV = [
  'Dashboard',
  'Tarefas',
  'Projetos',
  'Metas',
  'Estudos',
  'Hábitos',
  'Financeiro',
  'AI Assistant',
]

export default function TopNav({ user, active = 'Dashboard', onNavigate, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!isMenuOpen) return undefined
    const handleClick = (event) => {
      if (!menuRef.current || menuRef.current.contains(event.target)) {
        return
      }
      setIsMenuOpen(false)
    }
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    document.addEventListener('keyup', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClick)
      document.removeEventListener('keyup', handleEscape)
    }
  }, [isMenuOpen])

  const menuAction = (action) => {
    setIsMenuOpen(false)
    action?.()
  }

  return (
    <div className="topNav">
      <div className="topNav__pill ui-card">
        <div className="topNav__brand">
          <div className="topNav__logo" />
          <div className="txt-brand topNav__brandText">FlowApp</div>
        </div>

        <nav className="topNav__nav">
          {NAV.map((label) => {
            const isActive = label === active

            return (
              <button
                key={label}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                className={
                  isActive
                    ? 'topNav__item topNav__item--active txt-pill'
                    : 'topNav__item txt-pill'
                }
                onClick={() => onNavigate?.(label)}
              >
                {label}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="topNav__right">
        <div className="topNav__userWrapper" ref={menuRef}>
          <button
            className="topNav__user ui-card"
            aria-label="Menu do usuário"
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            type="button"
          >
            <div className="topNav__userInner">
              <img className="topNav__avatar" src={user?.avatarUrl} alt="" />
              <div className="topNav__userMeta">
                <div className="topNav__userName">{user?.name}</div>
                <div className="topNav__userEmail">{user?.email}</div>
              </div>
            </div>
            <span className="topNav__chev" />
          </button>

          {isMenuOpen && (
            <div className="topNav__menu" role="menu">
              <button type="button" className="topNav__menuItem" role="menuitem">
                Ver perfil
              </button>
              <button type="button" className="topNav__menuItem" role="menuitem">
                Preferências
              </button>
              {onLogout && (
                <button type="button" className="topNav__menuItem topNav__menuItem--danger" onClick={() => menuAction(onLogout)}>
                  Sair
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
