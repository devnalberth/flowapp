import './TopNav.css'

import { useEffect, useRef, useState } from 'react'
import { supabasePersistent, supabaseSession } from '../../lib/supabaseClient.js'

// Cliente que detém a sessão atual (o app usa dois storages de auth)
async function getAuthedClient() {
  try {
    const { data } = await supabasePersistent.auth.getSession()
    if (data?.session) return supabasePersistent
  } catch { /* tenta o próximo */ }
  return supabaseSession
}

const NAV = [
  'Dashboard',
  'Tarefas',
  'Projetos',
  'Metas',
  'Estudos',
  'Hábitos',
  'Financeiro',
  'FlowChat',
]

// Modal de perfil: salva o nome no auth (user_metadata) e na tabela `users`,
// e avisa o App via evento para refletir na hora em todas as páginas.
function ProfileModal({ user, onClose }) {
  const [name, setName] = useState(user?.name || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const handleSave = async (event) => {
    event.preventDefault()
    const trimmed = name.trim()
    if (!trimmed || saving) return
    setSaving(true)
    setError('')
    try {
      const client = await getAuthedClient()
      const { error: authError } = await client.auth.updateUser({ data: { name: trimmed } })
      if (authError) throw authError
      if (user?.id) {
        try {
          await client.from('users').update({ name: trimmed }).eq('id', user.id)
        } catch { /* metadata já salvo; tabela converge no próximo login */ }
      }
      window.dispatchEvent(new CustomEvent('flowapp:user-updated', { detail: { name: trimmed } }))
      onClose()
    } catch (err) {
      setError(err?.message || 'Não foi possível salvar. Tente novamente.')
      setSaving(false)
    }
  }

  return (
    <div className="topNavProfile" onClick={onClose} role="presentation">
      <form className="topNavProfile__panel ui-card" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
        <h3>Seu perfil</h3>
        <p className="topNavProfile__hint">Esse nome aparece no Dashboard e no FlowChat.</p>
        <label className="topNavProfile__field">
          <span>Nome</span>
          <input
            type="text"
            value={name}
            placeholder="Como você quer ser chamado?"
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            autoFocus
          />
        </label>
        <label className="topNavProfile__field">
          <span>E-mail</span>
          <input type="text" value={user?.email || ''} disabled />
        </label>
        {error && <p className="topNavProfile__error">{error}</p>}
        <div className="topNavProfile__actions">
          <button type="button" className="topNavProfile__btn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="topNavProfile__btn topNavProfile__btn--primary" disabled={!name.trim() || saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default function TopNav({ user, active = 'Dashboard', onNavigate, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
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
              <button
                type="button"
                className="topNav__menuItem"
                role="menuitem"
                onClick={() => menuAction(() => setShowProfile(true))}
              >
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

      {showProfile && <ProfileModal user={user} onClose={() => setShowProfile(false)} />}
    </div>
  )
}
