import { useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import './CreateHabitModal.css'

const FREQUENCIES = [
  { value: 'daily', label: 'Todos os dias' },
  { value: 'weekly', label: 'Semanalmente' }, // Usaremos esse para customizar dias
  // { value: 'custom', label: 'Personalizado' } // Pode usar esse label se preferir
]

const WEEK_DAYS = [
  { label: 'Dom', value: 0 },
  { label: 'Seg', value: 1 },
  { label: 'Ter', value: 2 },
  { label: 'Qua', value: 3 },
  { label: 'Qui', value: 4 },
  { label: 'Sex', value: 5 },
  { label: 'Sáb', value: 6 },
]

export default function CreateHabitModal({ open, onClose, onSubmit, onDelete, initialData }) {
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState('daily')
  const [customDays, setCustomDays] = useState([]) // Array de números [0, 2, 4]

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || initialData.label || '')
      // Se tiver customDays preenchido, assumimos que é 'custom' ou 'weekly'
      let loadedDays = []
      if (Array.isArray(initialData.customDays)) loadedDays = initialData.customDays
      else if (typeof initialData.customDays === 'string') {
        try { loadedDays = JSON.parse(initialData.customDays) } catch (e) {}
      }

      if (loadedDays.length > 0) {
        setFrequency('custom')
        setCustomDays(loadedDays)
      } else {
        setFrequency(initialData.frequency || 'daily')
        setCustomDays([])
      }
    } else {
      setName('')
      setFrequency('daily')
      setCustomDays([])
    }
  }, [initialData, open])

  if (!open) return null

  const toggleDay = (dayValue) => {
    setCustomDays(prev => {
      if (prev.includes(dayValue)) return prev.filter(d => d !== dayValue)
      return [...prev, dayValue].sort()
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Se selecionou dias específicos, forçamos frequência 'custom'
    const finalFrequency = customDays.length > 0 ? 'custom' : 'daily'
    
    onSubmit({
      name,
      frequency: finalFrequency,
      // Salva como array; o serviço cuida se precisar virar string
      customDays: customDays
    })
  }

  return (
    <div className="habitModalOverlay">
      <div className="habitModal">
        <header>
          <h3>{initialData ? 'Editar Hábito' : 'Novo Hábito'}</h3>
          <button className="closeBtn" onClick={onClose}>×</button>
        </header>
        
        <form onSubmit={handleSubmit}>
          <div className="formGroup">
            <label>Nome do ritual</label>
            <input 
              type="text" 
              placeholder="Ex: Ler 10 páginas" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              required 
            />
          </div>

          <div className="formGroup">
            <label>Frequência</label>
            <div className="freqOptions">
              <button 
                type="button" 
                className={`freqBtn ${customDays.length === 0 ? 'active' : ''}`}
                onClick={() => { setFrequency('daily'); setCustomDays([]) }}
              >
                Todos os dias
              </button>
              <button 
                type="button" 
                className={`freqBtn ${customDays.length > 0 ? 'active' : ''}`}
                onClick={() => setFrequency('custom')}
              >
                Dias específicos
              </button>
            </div>
          </div>

          {/* Seletor de dias aparece se for Custom ou se já tiver dias selecionados */}
          {(frequency === 'custom' || customDays.length > 0) && (
            <div className="formGroup">
              <label>Selecione os dias</label>
              <div className="weekSelector">
                {WEEK_DAYS.map(day => (
                  <button
                    key={day.value}
                    type="button"
                    className={`dayBtn ${customDays.includes(day.value) ? 'active' : ''}`}
                    onClick={() => toggleDay(day.value)}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <footer>
            {initialData && onDelete && (
              <button type="button" className="btnDelete" onClick={onDelete}>
                <Trash2 size={18} /> Excluir
              </button>
            )}
            <div className="actions">
              <button type="button" className="btnCancel" onClick={onClose}>Cancelar</button>
              <button type="submit" className="btnSave">Salvar</button>
            </div>
          </footer>
        </form>
      </div>
    </div>
  )
}