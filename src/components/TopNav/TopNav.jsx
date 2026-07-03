import './TopNav.css'

import { useEffect, useRef, useState } from 'react'
import { supabasePersistent, supabaseSession } from '../../lib/supabaseClient.js'
import { useApp } from '../../context/AppContext.jsx'

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

// Avatar com as iniciais do usuário (não há upload de foto no app)
function InitialsAvatar({ user, size = 'md' }) {
  const source = (user?.name || user?.email || '?').trim()
  const parts = source.split(/\s+/)
  const initials = parts.length > 1
    ? `${parts[0][0]}${parts[parts.length - 1][0]}`
    : source.slice(0, 2)

  return (
    <span className={`topNav__initials topNav__initials--${size}`} aria-hidden="true">
      {initials.toUpperCase()}
    </span>
  )
}

// Modal de perfil: nome (auth user_metadata + tabela `users`) e troca de senha.
// O evento flowapp:user-updated faz o novo nome refletir na hora em todo o app.
function ProfileModal({ user, onClose }) {
  const [name, setName] = useState(user?.name || '')
  const [showPassword, setShowPassword] = useState(false)
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const wantsPasswordChange = showPassword && (password || passwordConfirm)

  const validate = () => {
    if (!name.trim()) return 'Informe um nome.'
    if (wantsPasswordChange) {
      if (password.length < 6) return 'A nova senha precisa de pelo menos 6 caracteres.'
      if (password !== passwordConfirm) return 'As senhas não coincidem.'
    }
    return ''
  }

  const handleSave = async (event) => {
    event.preventDefault()
    if (saving) return
    const validation = validate()
    if (validation) { setError(validation); return }

    setSaving(true)
    setError('')
    setSuccess('')
    const trimmed = name.trim()

    try {
      const client = await getAuthedClient()
      const payload = { data: { name: trimmed } }
      if (wantsPasswordChange) payload.password = password

      const { error: authError } = await client.auth.updateUser(payload)
      if (authError) throw authError

      if (user?.id) {
        try {
          await client.from('users').update({ name: trimmed }).eq('id', user.id)
        } catch { /* metadata já salvo; tabela converge no próximo login */ }
      }

      window.dispatchEvent(new CustomEvent('flowapp:user-updated', { detail: { name: trimmed } }))

      if (wantsPasswordChange) {
        setSuccess('Perfil e senha atualizados.')
        setPassword('')
        setPasswordConfirm('')
        setShowPassword(false)
        setSaving(false)
      } else {
        onClose()
      }
    } catch (err) {
      setError(err?.message || 'Não foi possível salvar. Tente novamente.')
      setSaving(false)
    }
  }

  return (
    <div className="topNavProfile" onClick={onClose} role="presentation">
      <form className="topNavProfile__panel" onClick={(e) => e.stopPropagation()} onSubmit={handleSave}>
        <div className="topNavProfile__head">
          <InitialsAvatar user={{ ...user, name }} size="lg" />
          <div>
            <h3>Seu perfil</h3>
            <p className="topNavProfile__hint">Esse nome aparece no Dashboard e no FlowChat.</p>
          </div>
        </div>

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

        {showPassword ? (
          <>
            <label className="topNavProfile__field">
              <span>Nova senha</span>
              <input
                type="password"
                value={password}
                placeholder="Mínimo de 6 caracteres"
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
              />
            </label>
            <label className="topNavProfile__field">
              <span>Confirmar nova senha</span>
              <input
                type="password"
                value={passwordConfirm}
                placeholder="Repita a nova senha"
                onChange={(e) => setPasswordConfirm(e.target.value)}
                autoComplete="new-password"
              />
            </label>
          </>
        ) : (
          <button
            type="button"
            className="topNavProfile__link"
            onClick={() => { setShowPassword(true); setSuccess('') }}
          >
            Alterar senha
          </button>
        )}

        {error && <p className="topNavProfile__error">{error}</p>}
        {success && <p className="topNavProfile__success">{success}</p>}

        <div className="topNavProfile__actions">
          <button type="button" className="topNavProfile__btn" onClick={onClose}>Fechar</button>
          <button type="submit" className="topNavProfile__btn topNavProfile__btn--primary" disabled={!name.trim() || saving}>
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  )
}

// Preferências do app — salvas neste dispositivo (localStorage via AppContext)
function PreferencesModal({ onClose }) {
  const { prefs, updatePrefs } = useApp()

  return (
    <div className="topNavProfile" onClick={onClose} role="presentation">
      <div className="topNavProfile__panel" onClick={(e) => e.stopPropagation()}>
        <h3>Preferências</h3>
        <p className="topNavProfile__hint">Salvas neste dispositivo.</p>

        <label className="topNavProfile__toggle">
          <input
            type="checkbox"
            checked={Boolean(prefs.hideFinanceValues)}
            onChange={(e) => updatePrefs({ hideFinanceValues: e.target.checked })}
          />
          <span>
            <strong>Ocultar valores financeiros</strong>
            <em>Mascara saldos e lançamentos na aba Financeiro (R$ ••••)</em>
          </span>
        </label>

        <div className="topNavProfile__actions">
          <button type="button" className="topNavProfile__btn topNavProfile__btn--primary" onClick={onClose}>
            Concluído
          </button>
        </div>
      </div>
    </div>
  )
}

export default function TopNav({ user, active = 'Dashboard', onNavigate, onLogout }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showPrefs, setShowPrefs] = useState(false)
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
              <InitialsAvatar user={user} />
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
              <button
                type="button"
                className="topNav__menuItem"
                role="menuitem"
                onClick={() => menuAction(() => setShowPrefs(true))}
              >
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
      {showPrefs && <PreferencesModal onClose={() => setShowPrefs(false)} />}
    </div>
  )
}
