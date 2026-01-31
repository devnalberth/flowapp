import { useEffect, useMemo, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'
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

// Função auxiliar para converter "1º Trimestre" -> 1
const parseTrimesterValue = (val) => {
  if (typeof val === 'number') return val
  if (typeof val === 'string') {
    if (val.includes('1º')) return 1
    if (val.includes('2º')) return 2
    if (val.includes('3º')) return 3
    if (val.includes('4º')) return 4
  }
  return 1 // Padrão
}

const calculateTrimester = (startDate, endDate) => {
  if (!startDate) return null
  const start = new Date(startDate)
  const startMonth = start.getMonth() + 1

  if (endDate) {
    const end = new Date(endDate)
    const endMonth = end.getMonth() + 1
    const startQuarter = Math.ceil(startMonth / 3)
    const endQuarter = Math.ceil(endMonth / 3)
    const quarters = []
    for (let q = startQuarter; q <= endQuarter; q++) {
      if (TRIMESTERS[q - 1]) quarters.push(TRIMESTERS[q - 1])
    }
    return quarters
  }

  const quarter = Math.ceil(startMonth / 3)
  return [TRIMESTERS[quarter - 1]]
}

export default function CreateGoalModal({ open, onClose, onSubmit, onDelete, areaOptions = [], projectOptions = [], initialData = null }) {
  const [form, setForm] = useState(() => ({
    title: '',
    area: areaOptions[0] ?? '',
    type: 'trimestral',
    trimester: 1,
    semester: 1,
    startDate: '',
    endDate: '',
    target: '',
    projectId: '',
  }))
  const titleRef = useRef(null)

  const charCount = useMemo(() => `${(form.target || '').length}/${DESCRIPTION_LIMIT}`, [form.target])

  const calculatedTrimesters = useMemo(() => {
    return calculateTrimester(form.startDate, form.endDate)
  }, [form.startDate, form.endDate])

  useEffect(() => {
    if (!open) return undefined
    const currentYear = new Date().getFullYear()

    if (initialData) {
      // CORREÇÃO CRÍTICA: Converter string do trimestre para número seguro
      const safeTrimester = parseTrimesterValue(initialData.trimester)

      setForm({
        title: initialData.title || initialData.name || '',
        area: initialData.area || areaOptions[0] || '',
        type: initialData.type || 'trimestral',
        trimester: safeTrimester,
        semester: initialData.semester || 1,
        startDate: initialData.startDate || initialData.start_date || `${currentYear}-01-01`,
        endDate: initialData.endDate || initialData.end_date || `${currentYear}-03-31`,
        target: initialData.target || '',
        projectId: initialData.projects?.[0]?.id || '',
      })
    } else {
      setForm({
        title: '',
        area: areaOptions[0] ?? '',
        type: 'trimestral',
        trimester: 1,
        semester: 1,
        startDate: `${currentYear}-01-01`,
        endDate: `${currentYear}-03-31`,
        target: '',
        projectId: '',
      })
    }

    // Pequeno timeout para focar e garantir que o estado atualizou
    setTimeout(() => titleRef.current?.focus(), 50)

    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [open, initialData])

  // Atualizar datas automaticamente (BLINDADO CONTRA CRASH)
  useEffect(() => {
    if (!form.startDate) return

    const currentYear = new Date().getFullYear()
    let newEndDate = ''

    // CORREÇÃO: Verificamos se o trimestre existe antes de acessar .months
    if (form.type === 'trimestral' && form.trimester) {
      const trimesterData = TRIMESTERS[form.trimester - 1]
      if (trimesterData) {
        const months = trimesterData.months
        newEndDate = `${currentYear}-${String(months[2]).padStart(2, '0')}-31`
      }
    } else if (form.type === 'semestral' && form.semester) {
      const semesterData = SEMESTERS[form.semester - 1]
      if (semesterData) {
        const months = semesterData.months
        const lastMonth = months[months.length - 1]
        const lastDay = lastMonth === 6 ? 30 : 31
        newEndDate = `${currentYear}-${String(lastMonth).padStart(2, '0')}-${lastDay}`
      }
    } else if (form.type === 'anual') {
      newEndDate = `${currentYear}-12-31`
    }

    if (newEndDate && newEndDate !== form.endDate) {
      setForm(prev => ({ ...prev, endDate: newEndDate }))
    }
  }, [form.type, form.trimester, form.semester])

  if (!open) return null

  const updateField = (field) => (event) => {
    const value = event.target.value
    setForm((prev) => {
      const newForm = { ...prev, [field]: value }

      if (field === 'type') {
        const currentYear = new Date().getFullYear()
        if (value === 'trimestral') {
          newForm.trimester = 1
          newForm.startDate = `${currentYear}-01-01`
        } else if (value === 'semestral') {
          newForm.semester = 1
          newForm.startDate = `${currentYear}-01-01`
        } else if (value === 'anual') {
          newForm.startDate = `${currentYear}-01-01`
          newForm.endDate = `${currentYear}-12-31`
        }
      }

      // Casting para número ao mudar selects
      if (field === 'trimester') newForm.trimester = parseInt(value)
      if (field === 'semester') newForm.semester = parseInt(value)

      return newForm
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const trimesters = calculatedTrimesters || []

    const payload = {
      ...form,
      trimesters: trimesters.length > 0 ? trimesters[0].label : '1º Trimestre', // Simplificação para salvar o principal
      trimesterValues: trimesters.map(t => t.value),
    }
    onSubmit?.(payload)
  }

  return (
    <div className="createGoalModal" role="dialog" aria-modal="true">
      <div className="createGoalModal__backdrop" onClick={onClose} />
      <section className="createGoalModal__panel">
        <header className="createGoalModal__header">
          <div>
            <p className="createGoalModal__eyebrow">Nova meta</p>
            <h3>{initialData ? 'Editar meta' : 'Mapear objetivo'}</h3>
          </div>
          <button type="button" className="createGoalModal__close" onClick={onClose}>✕</button>
        </header>

        <form className="createGoalModal__form" onSubmit={handleSubmit}>
          <label className="createGoalModal__field">
            <span>Título da meta*</span>
            <input
              ref={titleRef}
              type="text"
              placeholder="Ex: Escalar Flow OS"
              value={form.title}
              onChange={updateField('title')}
              required
            />
          </label>

          <div className="createGoalModal__row">
            <label className="createGoalModal__field">
              <span>Área</span>
              <select value={form.area} onChange={updateField('area')}>
                {areaOptions.map((area) => (
                  <option key={area} value={area}>{area}</option>
                ))}
              </select>
            </label>

            <label className="createGoalModal__field">
              <span>Tipo de meta</span>
              <select value={form.type} onChange={updateField('type')}>
                {GOAL_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="createGoalModal__row">
            {form.type === 'trimestral' && (
              <label className="createGoalModal__field">
                <span>Trimestre</span>
                <select value={form.trimester} onChange={updateField('trimester')}>
                  {TRIMESTERS.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>
            )}

            {form.type === 'semestral' && (
              <label className="createGoalModal__field">
                <span>Semestre</span>
                <select value={form.semester} onChange={updateField('semester')}>
                  {SEMESTERS.map((s) => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </label>
            )}

            <label className="createGoalModal__field">
              <span>Vincular a Projeto (Opcional)</span>
              <select value={form.projectId} onChange={updateField('projectId')}>
                <option value="">Sem vínculo</option>
                {projectOptions.map((proj) => (
                  <option key={proj.id} value={proj.id}>{proj.title}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="createGoalModal__row">
            <label className="createGoalModal__field">
              <span>Início</span>
              <input type="date" value={form.startDate} onChange={updateField('startDate')} disabled={form.type !== 'custom'} />
            </label>
            <label className="createGoalModal__field">
              <span>Prazo</span>
              <input type="date" value={form.endDate} min={form.startDate} onChange={updateField('endDate')} disabled={form.type !== 'custom'} />
            </label>
          </div>

          <label className="createGoalModal__field">
            <span>Resultado desejado</span>
            <div className="createGoalModal__textareaWrap">
              <textarea
                placeholder="Descreva o sucesso..."
                maxLength={DESCRIPTION_LIMIT}
                value={form.target}
                onChange={updateField('target')}
              />
              <small>{charCount}</small>
            </div>
          </label>

          <footer className="createGoalModal__footer" style={{ justifyContent: initialData ? 'space-between' : 'flex-end' }}>
            {initialData && onDelete && (
              <button type="button" onClick={onDelete} className="btn btn--danger" style={{ marginRight: 'auto', color: '#ef4444', background: '#fee2e2', padding: '0.75rem 1rem', borderRadius: '8px', border: 'none', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Trash2 size={16} /> Excluir
              </button>
            )}

            <div style={{ display: 'flex', gap: '12px' }}>
              <button type="button" onClick={onClose} className="btn btn--ghost">Cancelar</button>
              <button type="submit" className="btn btn--primary">{initialData ? 'Salvar' : 'Criar'}</button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  )
}