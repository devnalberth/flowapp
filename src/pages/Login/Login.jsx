import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient.js'
import './Login.css'

const FEATURES = [
  {
    title: 'Centralize sua rotina',
    description: 'Metas, estudos, finanças e tarefas em um só lugar, sempre sincronizados.',
  },
  {
    title: 'Insights com IA',
    description: 'Sugestões diárias para destravar o foco e manter a cadência dos projetos.',
  },
  {
    title: 'Automação de hábitos',
    description: 'Lembretes inteligentes e trilhas semanais para manter consistência.',
  },
]

export default function Login({ onLogin, infoMessage = '' }) {
  const [form, setForm] = useState({ email: '', password: '', remember: true })
  const [error, setError] = useState('')
  const [resetMessage, setResetMessage] = useState('')
  const [authNotice, setAuthNotice] = useState(infoMessage || '')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  useEffect(() => {
    setAuthNotice(infoMessage || '')
  }, [infoMessage])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setResetMessage('')
    setAuthNotice('')

    if (!form.email || !form.password) {
      setError('Informe e-mail e senha para continuar.')
      return
    }

    if (typeof onLogin !== 'function') {
      setError('Fluxo de login indisponível no momento.')
      return
    }

    setIsSubmitting(true)
    try {
      await onLogin?.({ email: form.email, password: form.password, remember: form.remember })
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : 'Não foi possível entrar agora.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handlePasswordReset = async () => {
    setError('')
    setResetMessage('')
    setAuthNotice('')

    if (!form.email) {
      setError('Informe seu e-mail para receber o link de recuperação.')
      return
    }

    setIsResetting(true)
    try {
      const redirectTo = typeof window !== 'undefined' ? `${window.location.origin}/recuperar-senha` : undefined
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(form.email, { redirectTo })
      if (resetError) {
        throw resetError
      }
      setResetMessage('Enviamos um link de redefinição para o seu e-mail. Confira sua caixa de entrada.')
    } catch (resetErr) {
      const message = resetErr instanceof Error ? resetErr.message : 'Não foi possível enviar o link agora.'
      setError(message)
    } finally {
      setIsResetting(false)
    }
  }

  return (
    <div className="login">
      <div className="login__card">
        <section className="login__hero">
          <div className="login__badge">FlowApp • Workspace pessoal</div>
          <h1>Bem-vindo(a) de volta</h1>
          <p>
            Conecte-se para continuar acompanhando seus projetos, hábitos e decisões financeiras em uma linha do tempo
            única.
          </p>
          <ul>
            {FEATURES.map((feature) => (
              <li key={feature.title}>
                <strong>{feature.title}</strong>
                <span>{feature.description}</span>
              </li>
            ))}
          </ul>
        </section>

        <form className="login__form" onSubmit={handleSubmit}>
          <header>
            <h2>Entrar na sua conta</h2>
            <p>Use o mesmo e-mail cadastrado nas experiências do FlowApp.</p>
          </header>

          {error && <p className="login__error">{error}</p>}
          {authNotice && <p className="login__info">{authNotice}</p>}
          {resetMessage && <p className="login__info">{resetMessage}</p>}

          <label className="login__control">
            <span>E-mail</span>
            <input
              name="email"
              type="email"
              placeholder="nome@empresa.com"
              value={form.email}
              onChange={handleChange}
              autoComplete="email"
            />
          </label>

          <label className="login__control">
            <span>Senha</span>
            <input
              name="password"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              autoComplete="current-password"
            />
          </label>

          <div className="login__actions">
            <label className="login__remember">
              <input
                type="checkbox"
                name="remember"
                checked={form.remember}
                onChange={handleChange}
              />
              <span>Manter conectado</span>
            </label>
            <button
              className="login__link"
              type="button"
              onClick={handlePasswordReset}
              disabled={isResetting}
            >
              {isResetting ? 'Enviando link...' : 'Esqueci minha senha'}
            </button>
          </div>

          <button className="login__submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </button>

          <footer>
            <p>
              Ao continuar você concorda com os Termos de Uso e a Política de Privacidade do FlowApp. Todo o tráfego é
              criptografado.
            </p>
          </footer>
        </form>
      </div>
    </div>
  )
}
