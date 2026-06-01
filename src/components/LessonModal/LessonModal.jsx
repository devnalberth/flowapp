import { useState, useEffect } from 'react'
import { X, Star, Calendar, Link2, Plus, Trash2, Check, CalendarClock } from 'lucide-react'
import './LessonModal.css'

const emptyResource = () => ({ id: `res-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, label: '', url: '' })

export default function LessonModal({ lesson, onClose, onSave, onToggleComplete }) {
  const [formData, setFormData] = useState({
    title: '',
    scheduledDate: '',
    description: '',
    notes: '',
    rating: 0,
    resources: [],
  })
  const [isCompleted, setIsCompleted] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title || '',
        scheduledDate: lesson.scheduledDate ? String(lesson.scheduledDate).slice(0, 10) : '',
        description: lesson.description || '',
        notes: lesson.notes || '',
        rating: lesson.rating || 0,
        resources: Array.isArray(lesson.resources) ? lesson.resources.map((r) => ({ ...r })) : [],
      })
      setIsCompleted(!!lesson.isCompleted)
    }
  }, [lesson])

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (!lesson) return null

  const handleChange = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }))

  const handleResourceChange = (id, field, value) =>
    setFormData((prev) => ({
      ...prev,
      resources: prev.resources.map((r) => (r.id === id ? { ...r, [field]: value } : r)),
    }))

  const addResource = () => setFormData((prev) => ({ ...prev, resources: [...prev.resources, emptyResource()] }))
  const removeResource = (id) =>
    setFormData((prev) => ({ ...prev, resources: prev.resources.filter((r) => r.id !== id) }))

  const handleToggleComplete = () => {
    const next = !isCompleted
    setIsCompleted(next)
    onToggleComplete?.(lesson.id, next)
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    try {
      const cleanResources = formData.resources
        .map((r) => ({ ...r, label: r.label.trim(), url: r.url.trim() }))
        .filter((r) => r.url || r.label)
      await onSave(lesson.id, {
        title: formData.title,
        scheduledDate: formData.scheduledDate || null,
        description: formData.description,
        notes: formData.notes,
        rating: formData.rating,
        resources: cleanResources,
      })
      onClose()
    } catch (error) {
      console.error('Error saving lesson:', error)
      alert('Erro ao salvar aula')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="lessonModal-overlay" onClick={onClose}>
      <div className="lessonModal" onClick={(e) => e.stopPropagation()}>
        <header className="lessonModal__header">
          <div className="lessonModal__heading">
            <span className="lessonModal__eyebrow">Aula</span>
            <input
              className="lessonModal__titleInput"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Nome da aula"
            />
          </div>
          <button className="lessonModal__close" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </header>

        {/* Conclusão + nota */}
        <div className="lessonModal__statusRow">
          <button
            type="button"
            className={`lessonModal__doneBtn ${isCompleted ? 'is-done' : ''}`}
            onClick={handleToggleComplete}
          >
            <span className="lessonModal__doneCheck">{isCompleted ? <Check size={14} /> : null}</span>
            {isCompleted ? 'Concluída' : 'Marcar como concluída'}
          </button>

          <div className="lessonModal__rating">
            {Array.from({ length: 5 }).map((_, i) => (
              <button
                key={i}
                type="button"
                className={`lessonModal__star ${i < formData.rating ? 'is-active' : ''}`}
                onClick={() => handleChange('rating', i + 1 === formData.rating ? 0 : i + 1)}
                aria-label={`${i + 1} estrelas`}
              >
                <Star size={20} fill={i < formData.rating ? '#ff7a00' : 'none'} />
              </button>
            ))}
          </div>
        </div>

        <div className="lessonModal__body">
          {/* Agendamento */}
          <div className="lessonModal__field">
            <label><Calendar size={14} /> Agendar aula</label>
            <input
              type="date"
              value={formData.scheduledDate}
              onChange={(e) => handleChange('scheduledDate', e.target.value)}
            />
            <p className="lessonModal__hint">
              <CalendarClock size={13} />
              Aulas com data aparecem automaticamente na aba <strong>Tarefas</strong>.
            </p>
          </div>

          {/* Resumo */}
          <div className="lessonModal__field">
            <label>Resumo da aula</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="O que você aprendeu? Pontos-chave para revisar..."
              rows={3}
            />
          </div>

          {/* Observações */}
          <div className="lessonModal__field">
            <label>Observações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Dúvidas, lembretes, próximos passos..."
              rows={2}
            />
          </div>

          {/* Recursos / Links */}
          <div className="lessonModal__field">
            <label><Link2 size={14} /> Links e recursos</label>
            <div className="lessonModal__resources">
              {formData.resources.length === 0 && (
                <p className="lessonModal__resourcesEmpty">Nenhum link ainda. Adicione vídeos, materiais ou artigos.</p>
              )}
              {formData.resources.map((r) => (
                <div className="lessonModal__resource" key={r.id}>
                  <input
                    className="lessonModal__resourceLabel"
                    value={r.label}
                    onChange={(e) => handleResourceChange(r.id, 'label', e.target.value)}
                    placeholder="Título (ex: Vídeo aula)"
                  />
                  <input
                    className="lessonModal__resourceUrl"
                    value={r.url}
                    onChange={(e) => handleResourceChange(r.id, 'url', e.target.value)}
                    placeholder="https://..."
                  />
                  <button type="button" className="lessonModal__resourceDel" onClick={() => removeResource(r.id)} aria-label="Remover">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              <button type="button" className="lessonModal__addResource" onClick={addResource}>
                <Plus size={14} /> Adicionar link
              </button>
            </div>
          </div>
        </div>

        <footer className="lessonModal__footer">
          <button type="button" className="lessonModal__cancel" onClick={onClose}>Cancelar</button>
          <button type="button" className="lessonModal__save" onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? 'Salvando...' : 'Salvar aula'}
          </button>
        </footer>
      </div>
    </div>
  )
}
