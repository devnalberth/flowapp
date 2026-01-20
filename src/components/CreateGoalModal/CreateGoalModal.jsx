import { useEffect, useMemo, useRef, useState } from 'react'

import './CreateGoalModal.css'

const DESCRIPTION_LIMIT = 280

const GOAL_TYPES = [
  { value: 'trimestral', label: 'Trimestral (3 meses)' },
  { value: 'semestral', label: 'Semestral (6 meses)' },
  { value: 'anual', label: 'Anual (12 meses)' },
  { value: 'custom', label: 'Personalizado' },
]

const TRIMESTERS = [
  { value: 1, label: '1º Trimestre', months: [1, 2, 3] },
  { value: 2, label: '2º Trimestre', months: [4, 5, 6] },
  { value: 3, label: '3º Trimestre', months: [7, 8, 9] },
  { value: 4, label: '4º Trimestre', months: [10, 11, 12] },
]

const SEMESTERS = [
  { value: 1, label: '1º Semestre', months: [1, 2, 3, 4, 5, 6] },
  { value: 2, label: '2º Semestre', months: [7, 8, 9, 10, 11, 12] },
]

// Função para calcular o trimestre baseado nas datas
const calculateTrimester = (startDate, endDate) => {
  if (!startDate) return null
  
  const start = new Date(startDate)
  const startMonth = start.getMonth() + 1 // 1-12
  
  // Se tem data de fim, verifica se cobre múltiplos trimestres
  if (endDate) {
    const end = new Date(endDate)
    const endMonth = end.getMonth() + 1
    const startQuarter = Math.ceil(startMonth / 3)
    const endQuarter = Math.ceil(endMonth / 3)
    
    // Se cobre múltiplos trimestres, retorna todos
    const quarters = []
    for (let q = startQuarter; q <= endQuarter; q++) {
      quarters.push(TRIMESTERS[q - 1])
    }
    return quarters
  }
  
  // Retorna apenas o trimestre de início
  const quarter = Math.ceil(startMonth / 3)
  return [TRIMESTERS[quarter - 1]]
}

export default function CreateGoalModal({ open, onClose, onSubmit, areaOptions = [], initialData = null }) {
  const [form, setForm] = useState(() => ({
    title: '',
    area: areaOptions[0] ?? '',
    type: 'trimestral',
    trimester: null,
    semester: null,
    startDate: '',
    endDate: '',
    target: '',
  }))
  const titleRef = useRef(null)

  const charCount = useMemo(() => `${form.target.length}/${DESCRIPTION_LIMIT}`, [form.target.length])
  
  const calculatedTrimesters = useMemo(() => {
    return calculateTrimester(form.startDate, form.endDate)
  }, [form.startDate, form.endDate])

  useEffect(() => {
    if (!open) return undefined
    const currentYear = new Date().getFullYear()
    if (initialData) {
      setForm({
        title: initialData.title || initialData.name || '',
        area: initialData.area || areaOptions[0] || '',
        type: initialData.type || 'trimestral',
        trimester: initialData.trimester || null,
        semester: initialData.semester || null,
        startDate: initialData.startDate || initialData.start_date || `${currentYear}-01-01`,
        endDate: initialData.endDate || initialData.end_date || `${currentYear}-03-31`,
        target: initialData.target || '',
      })
    } else {
      setForm({
        title: '',
        area: areaOptions[0] ?? '',
        type: 'trimestral',
        trimester: null,
        semester: null,
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-03-31`,
        target: '',
      })
    }
    requestAnimationFrame(() => titleRef.current?.focus())
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = ''
    }
  }, [open, areaOptions, initialData])

  useEffect(() => {
    if (!open) return undefined
    const handleKey = (event) => {
      if (event.key === 'Escape') {
        onClose?.()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])
  
  // Atualizar datas automaticamente quando tipo de meta mudar
  useEffect(() => {
    if (!form.startDate) return
    
    const currentYear = new Date().getFullYear()
    const start = new Date(form.startDate)
    const startMonth = start.getMonth()
    const startDay = start.getDate()
    
    let newEndDate = ''
    
    if (form.type === 'trimestral' && form.trimester) {
      const trimesterMonths = TRIMESTERS[form.trimester - 1].months
      newEndDate = `${currentYear}-${String(trimesterMonths[2]).padStart(2, '0')}-31`
    } else if (form.type === 'semestral' && form.semester) {
      const semesterMonths = SEMESTERS[form.semester - 1].months
      const lastMonth = semesterMonths[semesterMonths.length - 1]
      newEndDate = `${currentYear}-${String(lastMonth).padStart(2, '0')}-31`
    } else if (form.type === 'anual') {
      newEndDate = `${currentYear}-12-31`
    }
    
    if (newEndDate && newEndDate !== form.endDate) {
      setForm(prev => ({ ...prev, endDate: newEndDate }))
    }
  }, [form.type, form.trimester, form.semester])

  if (!open) {
    return null
  }

  const updateField = (field) => (event) => {
    const value = event.target.value
    setForm((prev) => {
      const newForm = { ...prev, [field]: value }
      
      // Se mudou o tipo, resetar campos específicos
      if (field === 'type') {
        const currentYear = new Date().getFullYear()
        if (value === 'trimestral') {
          newForm.trimester = 1
          newForm.startDate = `${currentYear}-01-01`
          newForm.endDate = `${currentYear}-03-31`
        } else if (value === 'semestral') {
          newForm.semester = 1
          newForm.startDate = `${currentYear}-01-01`
          newForm.endDate = `${currentYear}-06-30`
        } else if (value === 'anual') {
          newForm.startDate = `${currentYear}-01-01`
          newForm.endDate = `${currentYear}-12-31`
        }
      }
      
      // Atualizar data de fim do trimestre
      if (field === 'trimester') {
        const currentYear = new Date().getFullYear()
        const trimesterValue = parseInt(value)
        const trimesterMonths = TRIMESTERS[trimesterValue - 1].months
        newForm.startDate = `${currentYear}-${String(trimesterMonths[0]).padStart(2, '0')}-01`
        newForm.endDate = `${currentYear}-${String(trimesterMonths[2]).padStart(2, '0')}-31`
      }
      
      // Atualizar data de fim do semestre
      if (field === 'semester') {
        const currentYear = new Date().getFullYear()
        const semesterValue = parseInt(value)
        const semesterMonths = SEMESTERS[semesterValue - 1].months
        newForm.startDate = `${currentYear}-${String(semesterMonths[0]).padStart(2, '0')}-01`
        const lastMonth = semesterMonths[semesterMonths.length - 1]
        const lastDay = lastMonth === 6 ? 30 : 31
        newForm.endDate = `${currentYear}-${String(lastMonth).padStart(2, '0')}-${lastDay}`
      }
      
      return newForm
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    
    // Calcular trimestres automaticamente
    const trimesters = calculatedTrimesters || []
    
    const payload = {
      ...form,
      trimesters: trimesters.map(t => t.label).join(', '),
      trimesterValues: trimesters.map(t => t.value),
    }

    console.debug('CreateGoalModal submit payload:', payload)

    onSubmit?.(payload)
  }

  return (
    <div className="createGoalModal" role="dialog" aria-modal="true">
      <div className="createGoalModal__backdrop" onClick={onClose} />
      <section className="createGoalModal__panel">
        <header className="createGoalModal__header">
          <div>
            <p className="createGoalModal__eyebrow">Nova meta</p>
            <h3>Mapear objetivo estratégico</h3>
          </div>
          <button type="button" className="createGoalModal__close" onClick={onClose} aria-label="Fechar modal">
            ✕
          </button>
        </header>

        <form className="createGoalModal__form" onSubmit={handleSubmit}>
          <label className="createGoalModal__field">
            <span>Título da meta*</span>
            <input
              ref={titleRef}
              type="text"
              placeholder="Ex: Escalar Flow OS para 1k clientes"
              value={form.title}
              onChange={updateField('title')}
              required
            />
          </label>

          <label className="createGoalModal__field">
            <span>Área</span>
            <select value={form.area} onChange={updateField('area')}>
              {areaOptions.map((area) => (
                <option key={area} value={area}>
                  {area}
                </option>
              ))}
            </select>
          </label>

          <label className="createGoalModal__field">
            <span>Tipo de meta</span>
            <select value={form.type} onChange={updateField('type')}>
              {GOAL_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          {form.type === 'trimestral' && (
            <label className="createGoalModal__field">
              <span>Trimestre</span>
              <select value={form.trimester || 1} onChange={updateField('trimester')}>
                {TRIMESTERS.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {form.type === 'semestral' && (
            <label className="createGoalModal__field">
              <span>Semestre</span>
              <select value={form.semester || 1} onChange={updateField('semester')}>
                {SEMESTERS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="createGoalModal__grid">
            <label className="createGoalModal__field">
              <span>Início</span>
              <input 
                type="date" 
                value={form.startDate} 
                onChange={updateField('startDate')}
                disabled={form.type !== 'custom'}
              />
            </label>
            <label className="createGoalModal__field">
              <span>Prazo</span>
              <input 
                type="date" 
                value={form.endDate} 
                min={form.startDate || undefined} 
                onChange={updateField('endDate')}
                disabled={form.type !== 'custom'}
              />
            </label>
          </div>

          {calculatedTrimesters && calculatedTrimesters.length > 0 && (
            <div className="createGoalModal__info">
              <p>
                <strong>Trimestre(s):</strong> {calculatedTrimesters.map(t => t.label).join(', ')}
              </p>
            </div>
          )}

          <label className="createGoalModal__field">
            <span>Resultado desejado</span>
            <div className="createGoalModal__textareaWrap">
              <textarea
                placeholder="Descreva o que precisa estar verdadeiro para considerar a meta concluída."
                maxLength={DESCRIPTION_LIMIT}
                value={form.target}
                onChange={updateField('target')}
              />
              <small>{charCount}</small>
            </div>
          </label>

          <footer className="createGoalModal__footer">
            <button type="button" onClick={onClose} className="btn btn--ghost">
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary">
              {initialData ? 'Salvar alterações' : 'Registrar meta'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
