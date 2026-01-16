import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabaseClient.js'
import './ResetPassword.css'

export default function ResetPassword({ onComplete }) {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSessionValid, setIsSessionValid] = useState(false)

  useEffect(() => {
    let mounted = true
    const verifySession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!mounted) return
      if (!session) {
        setError('Link inválido ou expirado. Solicite uma nova redefinição.')
      } else {
        setIsSessionValid(true)
      }
    }

    verifySession()
    return () => {
      mounted = false
    }
  }, [])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setStatus('')

    if (!password || !confirmPassword) {
      setError('Preencha os dois campos para continuar.')
      return
    }

    if (password.length < 8) {
      setError('Use ao menos 8 caracteres na nova senha.')
      return
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.')
      return
    }

    setIsSubmitting(true)
    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        throw updateError
      }
      setStatus('Senha redefinida com sucesso!')
      setPassword('')
      setConfirmPassword('')
      if (onComplete) {
        await onComplete('Senha redefinida com sucesso! Faça login com a nova senha.')
      }
    } catch (updateErr) {
      const message = updateErr instanceof Error ? updateErr.message : 'Não foi possível atualizar sua senha.'
      setError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="reset">
      <div className="reset__card">
        <header>
          <p className="reset__badge">FlowApp • Segurança</p>
          <h1>Escolha uma nova senha</h1>
          <p>Após atualizar, você será redirecionado para a tela de login.</p>
        </header>

        <form className="reset__form" onSubmit={handleSubmit}>
          {error && <p className="reset__error">{error}</p>}
          {status && <p className="reset__info">{status}</p>}

          <label className="reset__control">
            <span>Nova senha</span>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={!isSessionValid || isSubmitting}
            />
          </label>

          <label className="reset__control">
            <span>Confirme a nova senha</span>
            <input
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              disabled={!isSessionValid || isSubmitting}
            />
          </label>

          <button type="submit" className="reset__submit" disabled={!isSessionValid || isSubmitting}>
            {isSubmitting ? 'Atualizando...' : 'Atualizar senha'}
          </button>
        </form>
      </div>
    </div>
  )
}
