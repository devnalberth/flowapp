import { useState } from 'react'
import { X, Book, GraduationCap, BookOpen } from 'lucide-react'
import './CreateStudyModal.css'

const STUDY_TYPES = [
  { id: 'COURSE', label: 'Curso Online', icon: BookOpen },
  { id: 'UNIVERSITY', label: 'Faculdade', icon: GraduationCap },
  { id: 'BOOK', label: 'Livro', icon: Book },
]

export default function CreateStudyModal({ onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'COURSE',
    coverUrl: '',
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    onSubmit({
      title: formData.title.trim(),
      type: formData.type,
      coverUrl: formData.coverUrl || null,
      status: 'NOT_STARTED',
    })

    setFormData({ title: '', type: 'COURSE', coverUrl: '' })
    onClose()
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <div className="study-modal-overlay" onClick={onClose}>
      <div className="study-modal" onClick={(e) => e.stopPropagation()}>
        <header className="study-modal__header">
          <h2>Novo Estudo</h2>
          <button className="study-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <form className="study-modal__form" onSubmit={handleSubmit}>
          <div className="study-modal__field">
            <label>Tipo de Estudo</label>
            <div className="study-modal__types">
              {STUDY_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.id}
                    type="button"
                    className={`study-modal__type ${formData.type === type.id ? 'active' : ''}`}
                    onClick={() => handleChange('type', type.id)}
                  >
                    <Icon size={20} />
                    <span>{type.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          <div className="study-modal__field">
            <label htmlFor="study-title">
              {formData.type === 'COURSE' && 'Nome do Curso'}
              {formData.type === 'UNIVERSITY' && 'Nome da Faculdade'}
              {formData.type === 'BOOK' && 'Título do Livro'}
            </label>
            <input
              id="study-title"
              type="text"
              placeholder="Digite o nome..."
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              autoFocus
            />
          </div>

          <div className="study-modal__field">
            <label htmlFor="study-cover">URL da Capa (opcional)</label>
            <input
              id="study-cover"
              type="url"
              placeholder="https://..."
              value={formData.coverUrl}
              onChange={(e) => handleChange('coverUrl', e.target.value)}
            />
          </div>

          {formData.coverUrl && (
            <div className="study-modal__preview">
              <img src={formData.coverUrl} alt="Preview" onError={(e) => e.target.style.display = 'none'} />
            </div>
          )}

          <div className="study-modal__actions">
            <button type="button" className="study-modal__cancel" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="study-modal__submit" disabled={!formData.title.trim()}>
              Criar Estudo
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
