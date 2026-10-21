import { useState } from 'react'
import { Settings } from 'lucide-react'
import { supabasePersistent, supabaseSession } from '../../lib/supabaseClient.js'
import { useApp } from '../../context/AppContext.jsx'
import { useShell } from '../../context/ShellContext.jsx'
import { getJarvisConfig } from '../../services/jarvisConfig.js'
import JarvisSettingsModal from '../JarvisSettingsModal/JarvisSettingsModal.jsx'
import Modal from '../ui/Modal.jsx'
import { Segmented } from '../ui/Tabs.jsx'
import Toggle from '../ui/Toggle.jsx'
import './AccountSettingsModal.css'

async function getAuthedClient() {
  try {
    const { data } = await supabasePersistent.auth.getSession()
    if (data?.session) return supabasePersistent
  } catch {
    /* tenta o próximo */
  }
  return supabaseSession
}

function ProfilePanel({ user, initialTab, onClose }) {
  const [activeTab, setActiveTab] = useState(initialTab)
  const [name, setName] = useState(user?.name || '')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const changeTab = (tab) => {
    setActiveTab(tab)
    setError('')
    setSuccess('')
  }

  const handleProfileSave = async (event) => {
    event.preventDefault()
    if (savingProfile) return

    const trimmed = name.trim()
    if (!trimmed) {
      setError('Informe um nome.')
      return
    }

    setSavingProfile(true)
    setError('')
    setSuccess('')

    try {
      const client = await getAuthedClient()
      const { error: authError } = await client.auth.updateUser({ data: { name: trimmed } })
      if (authError) throw authError

      if (user?.id) {
        const { error: profileError } = await client
          .from('users')
          .update({ name: trimmed })
          .eq('id', user.id)
        if (profileError)
          console.warn('Nome salvo no Auth, mas não foi atualizado na tabela users:', profileError)
      }

      window.dispatchEvent(new CustomEvent('flowapp:user-updated', { detail: { name: trimmed } }))
      setSuccess('Perfil atualizado com sucesso.')
    } catch (err) {
      setError(err?.message || 'Não foi possível atualizar o perfil. Tente novamente.')
    } finally {
      setSavingProfile(false)
    }
  }

  const handlePasswordSave = async (event) => {
    event.preventDefault()
    if (savingPassword) return

    if (!password || !passwordConfirm) {
      setError('Preencha e confirme a nova senha.')
      return
    }
    if (password.length < 8) {
      setError('A nova senha precisa de pelo menos 8 caracteres.')
      return
    }
    if (password !== passwordConfirm) {
      setError('As senhas não coincidem.')
      return
    }

    setSavingPassword(true)
    setError('')
    setSuccess('')

    try {
      const client = await getAuthedClient()
      const { data, error: updateError } = await client.auth.updateUser({ password })
      if (updateError) throw updateError
      if (!data?.user) throw new Error('O Supabase não confirmou a atualização da senha.')

      setPassword('')
      setPasswordConfirm('')
      setSuccess('Senha alterada com sucesso. A nova senha já está ativa no Supabase.')
    } catch (err) {
      setError(err?.message || 'Não foi possível alterar a senha. Tente novamente.')
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <div className="fa-account__form">
      {activeTab === 'profile' ? (
        <form className="fa-account__content" onSubmit={handleProfileSave}>
          <label className="fa-account__field">
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
          <label className="fa-account__field">
            <span>E-mail</span>
            <input type="email" value={user?.email || ''} disabled />
          </label>

          {error && (
            <p className="fa-account__error" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="fa-account__success" role="status">
              {success}
            </p>
          )}

          <div className="fa-account__actions">
            <button type="button" className="fa-account__btn" onClick={onClose}>
              Fechar
            </button>
            <button
              type="submit"
              className="fa-account__btn fa-account__btn--primary"
              disabled={!name.trim() || savingProfile}
            >
              {savingProfile ? 'Salvando...' : 'Salvar perfil'}
            </button>
          </div>
        </form>
      ) : (
        <form className="fa-account__content" onSubmit={handlePasswordSave}>
          <div className="fa-account__securityIntro">
            <strong>Alterar senha</strong>
            <span>A nova senha será salva diretamente na sua conta do Supabase.</span>
          </div>

          <label className="fa-account__field">
            <span>Nova senha</span>
            <input
              type="password"
              value={password}
              placeholder="Mínimo de 8 caracteres"
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              autoFocus
            />
          </label>
          <label className="fa-account__field">
            <span>Confirmar nova senha</span>
            <input
              type="password"
              value={passwordConfirm}
              placeholder="Repita a nova senha"
              onChange={(e) => setPasswordConfirm(e.target.value)}
              autoComplete="new-password"
            />
          </label>

          {error && (
            <p className="fa-account__error" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="fa-account__success" role="status">
              {success}
            </p>
          )}

          <div className="fa-account__actions">
            <button type="button" className="fa-account__btn" onClick={onClose}>
              Fechar
            </button>
            <button
              type="submit"
              className="fa-account__btn fa-account__btn--primary"
              disabled={savingPassword || !password || !passwordConfirm}
            >
              {savingPassword ? 'Alterando...' : 'Alterar senha'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

function PreferencesPanel() {
  const { prefs, updatePrefs } = useApp()
  return (
    <div className="fa-account__preferences">
      <div>
        <strong>Ocultar valores financeiros</strong>
        <p>Mascara os valores em R$ neste dispositivo.</p>
      </div>
      <Toggle
        label="Ocultar valores financeiros"
        checked={Boolean(prefs.hideFinanceValues)}
        onChange={(hideFinanceValues) => updatePrefs({ hideFinanceValues })}
      />
    </div>
  )
}

const tabs = [
  { value: 'profile', label: 'Perfil' },
  { value: 'security', label: 'Segurança' },
  { value: 'preferences', label: 'Preferências' },
  { value: 'flowchat', label: 'FlowChat' },
]

export default function AccountSettingsModal({ user, initialTab = 'profile', onClose }) {
  const [tab, setTab] = useState(initialTab)
  const [config, setConfig] = useState(() => getJarvisConfig())
  const { refreshProvider } = useShell()
  return (
    <Modal
      title="Conta e ajustes"
      subtitle={user?.email}
      icon={Settings}
      width={760}
      className="fa-account"
      onClose={onClose}
    >
      <Segmented options={tabs} value={tab} onChange={setTab} label="Configurações da conta" />
      {['profile', 'security'].includes(tab) && (
        <ProfilePanel key={tab} user={user} initialTab={tab} onClose={onClose} />
      )}
      {tab === 'preferences' && <PreferencesPanel />}
      {tab === 'flowchat' && (
        <JarvisSettingsModal
          embedded
          config={config}
          onSaved={(saved) => {
            setConfig(saved)
            refreshProvider()
          }}
          onClose={onClose}
        />
      )}
    </Modal>
  )
}
