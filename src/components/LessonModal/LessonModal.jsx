import { useState, useEffect } from 'react'
import { X, Star } from 'lucide-react'
import './LessonModal.css'

export default function LessonModal({ lesson, onClose, onSave }) {
  const [formData, setFormData] = useState({
    title: lesson?.title || '',
    description: lesson?.description || '',
    notes: lesson?.notes || '',
    rating: lesson?.rating || 0,
  })
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (lesson) {
      setFormData({
        title: lesson.title || '',
        description: lesson.description || '',
        notes: lesson.notes || '',
        rating: lesson.rating || 0,
      })
    }
  }, [lesson])

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async () => {
    setIsSaving(true)
    try {
      await onSave(lesson.id, formData)
      onClose()
    } catch (error) {
      console.error('Error saving lesson:', error)
      alert('Erro ao salvar aula')
    } finally {
      setIsSaving(false)
    }
  }

  const renderStars = () => {
    return Array.from({ length: 5 }).map((_, i) => (
      <button
        key={i}
        type="button"
        className={`lesson-modal__star ${i < formData.rating ? 'active' : ''}`}
        onClick={() => handleChange('rating', i + 1)}
      >
        <Star size={24} fill={i < formData.rating ? '#ff5a00' : 'none'} />
      </button>
    ))
  }

  if (!lesson) return null

  return (
    <div className="lesson-modal-overlay" onClick={onClose}>
      <div className="lesson-modal" onClick={(e) => e.stopPropagation()}>
        <header className="lesson-modal__header">
          <h2>Detalhes da Aula</h2>
          <button className="lesson-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <div className="lesson-modal__content">
          {/* Title */}
          <div className="lesson-modal__field">
            <label>Nome da Aula</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder="Nome da aula..."
            />
          </div>

          {/* Description */}
          <div className="lesson-modal__field">
            <label>Descrição</label>
            <textarea
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder="Descreva o conteúdo da aula..."
              rows={3}
            />
          </div>

          {/* Notes */}
          <div className="lesson-modal__field">
            <label>Anotações</label>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Suas anotações sobre a aula..."
              rows={5}
            />
          </div>

          {/* Rating */}
          <div className="lesson-modal__field">
            <label>Avaliação</label>
            <div className="lesson-modal__stars">
              {renderStars()}
              {formData.rating > 0 && (
                <button
                  type="button"
                  className="lesson-modal__clear-rating"
                  onClick={() => handleChange('rating', 0)}
                >
                  Limpar
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="lesson-modal__actions">
          <button type="button" className="lesson-modal__cancel" onClick={onClose}>
            Cancelar
          </button>
          <button
            type="button"
            className="lesson-modal__save"
            onClick={handleSubmit}
            disabled={isSaving}
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>
    </div>
  )
}
