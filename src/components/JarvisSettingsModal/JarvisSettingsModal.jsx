import { useState } from 'react'
import { X, Eye, EyeOff, Plug, Check, AlertTriangle, Bot } from 'lucide-react'
import { PROVIDERS, providerMeta, setJarvisConfig } from '../../services/jarvisConfig.js'
import { sendChat } from '../../services/jarvisProviders.js'
import './JarvisSettingsModal.css'

// Configuração do provedor de IA do Jarvis. A chave fica só no localStorage
// deste dispositivo — nunca é enviada ao banco do FlowApp.
export default function JarvisSettingsModal({ config, onSaved, onClose }) {
  const [form, setForm] = useState({
    provider: config.provider || 'anthropic',
    apiKey: config.apiKey || '',
    model: config.model || '',
    baseUrl: config.baseUrl || '',
  })
  const [showKey, setShowKey] = useState(false)
  const [test, setTest] = useState(null) // null | 'testing' | { ok, message }

  const meta = providerMeta(form.provider)

  const handleTest = async () => {
    if (!form.apiKey) return
    setTest('testing')
    try {
      const response = await sendChat({
        system: 'Você é um teste de conexão. Responda apenas "OK".',
        messages: [{ role: 'user', content: 'ping' }],
        tools: [],
        config: form,
      })
      const text = response.content.filter((b) => b.type === 'text').map((b) => b.text).join('')
      setTest({ ok: true, message: `Conectado! Resposta: "${text.trim().slice(0, 40)}"` })
    } catch (error) {
      setTest({ ok: false, message: error?.message || 'Falha na conexão.' })
    }
  }

  const handleSave = () => {
    const saved = setJarvisConfig(form)
    onSaved?.(saved)
    onClose()
  }

  return (
    <div className="jarvisSettings" onClick={onClose}>
      <div className="jarvisSettings__panel" onClick={(e) => e.stopPropagation()}>
        <header className="jarvisSettings__header">
          <div className="jarvisSettings__avatar"><Bot size={20} /></div>
          <div>
            <p className="jarvisSettings__eyebrow">Provedor de IA</p>
            <h3>Configurar Jarvis</h3>
          </div>
          <button className="jarvisSettings__close" onClick={onClose} aria-label="Fechar">
            <X size={18} />
          </button>
        </header>

        <div className="jarvisSettings__body">
          <label className="jarvisSettings__field">
            <span>Provedor</span>
            <select
              value={form.provider}
              onChange={(e) => setForm((f) => ({ ...f, provider: e.target.value, model: '', baseUrl: '' }))}
            >
              {PROVIDERS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
            </select>
          </label>

          <label className="jarvisSettings__field">
            <span>Chave de API</span>
            <div className="jarvisSettings__keyRow">
              <input
                type={showKey ? 'text' : 'password'}
                placeholder={meta.keyHint}
                value={form.apiKey}
                onChange={(e) => setForm((f) => ({ ...f, apiKey: e.target.value.trim() }))}
                autoComplete="off"
              />
              <button type="button" onClick={() => setShowKey((s) => !s)} aria-label={showKey ? 'Ocultar chave' : 'Mostrar chave'}>
                {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <em>
              Obtenha em <a href={meta.keyUrl} target="_blank" rel="noreferrer">{meta.keyUrl.replace('https://', '')}</a>.
              A chave fica salva apenas neste dispositivo.
            </em>
          </label>

          <label className="jarvisSettings__field">
            <span>Modelo <i>(opcional)</i></span>
            <input
              type="text"
              placeholder={`Padrão: ${meta.defaultModel}`}
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value.trim() }))}
            />
          </label>

          {form.provider === 'openai' && (
            <label className="jarvisSettings__field">
              <span>Base URL <i>(opcional — Groq, OpenRouter, Ollama...)</i></span>
              <input
                type="text"
                placeholder={meta.defaultBaseUrl}
                value={form.baseUrl}
                onChange={(e) => setForm((f) => ({ ...f, baseUrl: e.target.value.trim() }))}
              />
            </label>
          )}

          {test && test !== 'testing' && (
            <p className={`jarvisSettings__test ${test.ok ? 'is-ok' : 'is-error'}`}>
              {test.ok ? <Check size={14} /> : <AlertTriangle size={14} />} {test.message}
            </p>
          )}
        </div>

        <footer className="jarvisSettings__footer">
          <button
            type="button"
            className="jarvisSettings__btn jarvisSettings__btn--ghost"
            onClick={handleTest}
            disabled={!form.apiKey || test === 'testing'}
          >
            <Plug size={15} /> {test === 'testing' ? 'Testando...' : 'Testar conexão'}
          </button>
          <button
            type="button"
            className="jarvisSettings__btn jarvisSettings__btn--primary"
            onClick={handleSave}
            disabled={!form.apiKey}
          >
            Salvar
          </button>
        </footer>
      </div>
    </div>
  )
}
