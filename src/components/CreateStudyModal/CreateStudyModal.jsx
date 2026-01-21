import { useState, useRef } from 'react'
import { X, Book, GraduationCap, BookOpen, Upload, Image } from 'lucide-react'
import { studyService } from '../../services/studyService'
import './CreateStudyModal.css'

const STUDY_TYPES = [
  { id: 'COURSE', label: 'Curso Online', icon: BookOpen },
  { id: 'UNIVERSITY', label: 'Faculdade', icon: GraduationCap },
  { id: 'BOOK', label: 'Livro', icon: Book },
]

const CATEGORIES = [
  'Programação',
  'Audiovisual',
  'Design',
  'Marketing',
  'Finanças',
  'Idiomas',
  'Gestão',
  'Saúde',
  'Outros',
]

const STATUS_OPTIONS = [
  { id: 'NOT_STARTED', label: 'Não Iniciado' },
  { id: 'IN_PROGRESS', label: 'Em Andamento' },
  { id: 'PAUSED', label: 'Pausado' },
  { id: 'COMPLETED', label: 'Concluído' },
]

export default function CreateStudyModal({ onClose, onSubmit, userId }) {
  const [formData, setFormData] = useState({
    title: '',
    type: 'COURSE',
    category: '',
    status: 'NOT_STARTED',
    url: '',
    description: '',
  })
  const [coverFile, setCoverFile] = useState(null)
  const [coverPreview, setCoverPreview] = useState(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    setIsUploading(true)

    try {
      // Se tiver arquivo de capa, faz upload primeiro
      let coverUrl = null
      if (coverFile && userId) {
        coverUrl = await studyService.uploadCoverImage(coverFile, userId)
      }

      await onSubmit({
        title: formData.title.trim(),
        type: formData.type,
        category: formData.category || null,
        status: formData.status,
        url: formData.url || null,
        description: formData.description || null,
        coverUrl: coverUrl,
      })

      // Reset form
      setFormData({ title: '', type: 'COURSE', category: '', status: 'NOT_STARTED', url: '', description: '' })
      setCoverFile(null)
      setCoverPreview(null)
      onClose()
    } catch (error) {
      console.error('Erro ao criar estudo:', error)
      alert('Erro ao criar estudo. Tente novamente.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      setCoverFile(file)
      // Preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    if (file && file.type.startsWith('image/')) {
      setCoverFile(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setCoverPreview(reader.result)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const triggerFileInput = () => {
    fileInputRef.current?.click()
  }

  const removeCover = () => {
    setCoverFile(null)
    setCoverPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const getNameLabel = () => {
    switch (formData.type) {
      case 'COURSE': return 'Nome do Curso'
      case 'UNIVERSITY': return 'Nome da Faculdade/Curso'
      case 'BOOK': return 'Título do Livro'
      default: return 'Nome'
    }
  }

  return (
    <div className="study-modal-overlay" onClick={onClose}>
      <div className="study-modal study-modal--expanded" onClick={(e) => e.stopPropagation()}>
        <header className="study-modal__header">
          <h2>Novo Estudo</h2>
          <button className="study-modal__close" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <form className="study-modal__form" onSubmit={handleSubmit}>
          {/* Tipo de Estudo */}
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

          {/* Nome */}
          <div className="study-modal__field">
            <label htmlFor="study-title">{getNameLabel()}</label>
            <input
              id="study-title"
              type="text"
              placeholder="Digite o nome..."
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              autoFocus
            />
          </div>

          {/* Categoria e Status lado a lado */}
          <div className="study-modal__row">
            <div className="study-modal__field study-modal__field--half">
              <label htmlFor="study-category">Categoria</label>
              <select
                id="study-category"
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
              >
                <option value="">Selecione...</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="study-modal__field study-modal__field--half">
              <label htmlFor="study-status">Status</label>
              <select
                id="study-status"
                value={formData.status}
                onChange={(e) => handleChange('status', e.target.value)}
              >
                {STATUS_OPTIONS.map(opt => (
                  <option key={opt.id} value={opt.id}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* URL do Curso */}
          <div className="study-modal__field">
            <label htmlFor="study-url">URL do Curso (opcional)</label>
            <input
              id="study-url"
              type="url"
              placeholder="https://..."
              value={formData.url}
              onChange={(e) => handleChange('url', e.target.value)}
            />
          </div>

          {/* Upload de Capa */}
          <div className="study-modal__field">
            <label>Capa (opcional)</label>
            <div
              className={`study-modal__upload ${coverPreview ? 'has-preview' : ''}`}
              onClick={triggerFileInput}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              {coverPreview ? (
                <div className="study-modal__preview-wrapper">
                  <img src={coverPreview} alt="Preview" className="study-modal__preview-img" />
                  <button
                    type="button"
                    className="study-modal__remove-cover"
                    onClick={(e) => { e.stopPropagation(); removeCover(); }}
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <div className="study-modal__upload-placeholder">
                  <Upload size={24} />
                  <span>Clique ou arraste uma imagem</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="study-modal__field">
            <label htmlFor="study-description">Descrição / Anotações</label>
            <textarea
              id="study-description"
              placeholder="Login, senha, observações..."
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={3}
            />
          </div>

          {/* Ações */}
          <div className="study-modal__actions">
            <button type="button" className="study-modal__cancel" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className="study-modal__submit"
              disabled={!formData.title.trim() || isUploading}
            >
              {isUploading ? 'Salvando...' : 'Criar Estudo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
