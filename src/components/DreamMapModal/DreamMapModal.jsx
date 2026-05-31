import { useEffect, useRef, useState } from 'react'
import { Trash2 } from 'lucide-react'

import './DreamMapModal.css'

export default function DreamMapModal({ open, onClose, onSubmit, onDelete, goals = [], initialData = null }) {
  const isEditing = !!initialData
  const [form, setForm] = useState({ title: '', goalId: '' })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)
  const titleRef = useRef(null)

  useEffect(() => {
    if (open) {
      if (initialData) {
        setForm({
          title: initialData.title || '',
          goalId: initialData.goalId || initialData.goal_id || '',
        })
        setImageFile(null)
        setImagePreview(initialData.imageUrl || initialData.image_url || null)
        requestAnimationFrame(() => titleRef.current?.focus())
      } else {
        setForm({ title: '', goalId: '' })
        setImageFile(null)
        setImagePreview(null)
        // Só abre o seletor automaticamente ao CRIAR (não ao editar)
        requestAnimationFrame(() => fileInputRef.current?.click())
      }
      document.body.style.overflow = 'hidden'
    }
    return () => { document.body.style.overflow = '' }
  }, [open, initialData])

  useEffect(() => {
    if (!open) return undefined
    const handleKey = (event) => { if (event.key === 'Escape') onClose?.() }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    setImageFile(file)
    const reader = new FileReader()
    reader.onload = () => {
      setImagePreview(reader.result)
      requestAnimationFrame(() => titleRef.current?.focus())
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    // Precisa de título e de uma imagem (nova ou já existente na edição)
    if (!form.title || !imagePreview) return
    onSubmit?.(form, imageFile) // imageFile é null quando a imagem não foi trocada
  }

  return (
    <div className="dreamMapModal" role="dialog" aria-modal="true">
      <div className="dreamMapModal__backdrop" onClick={onClose} />
      <section className="dreamMapModal__panel">
        <header className="dreamMapModal__header">
          <div>
            <p className="dreamMapModal__eyebrow">Mapa dos sonhos</p>
            <h3>{isEditing ? 'Editar imagem' : 'Adicione uma imagem inspiradora'}</h3>
          </div>
          <button type="button" className="dreamMapModal__close" onClick={onClose} aria-label="Fechar modal">✕</button>
        </header>

        <form className="dreamMapModal__form" onSubmit={handleSubmit}>
          <div className="dreamMapModal__field">
            <span>Imagem{isEditing ? '' : '*'}</span>
            <input
              ref={fileInputRef}
              id="dreamImage"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: 'none' }}
            />
            {imagePreview ? (
              <div className="dreamMapModal__imagePreview">
                <img src={imagePreview} alt="Preview" />
                <button
                  type="button"
                  className="dreamMapModal__changeImage"
                  onClick={() => fileInputRef.current?.click()}
                >
                  Trocar imagem
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="dreamMapModal__uploadButton"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="dreamMapModal__uploadIcon">📸</span>
                <span>Clique para escolher uma imagem</span>
              </button>
            )}
          </div>

          <label className="dreamMapModal__field">
            <span>Título*</span>
            <input
              ref={titleRef}
              type="text"
              placeholder="Ex: Minha casa própria"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </label>

          <label className="dreamMapModal__field">
            <span>Meta relacionada (opcional)</span>
            <select value={form.goalId} onChange={(e) => setForm({ ...form, goalId: e.target.value })}>
              <option value="">Nenhuma meta</option>
              {goals.map((goal) => (
                <option key={goal.id} value={goal.id}>{goal.title}</option>
              ))}
            </select>
          </label>

          <footer className="dreamMapModal__footer" style={{ justifyContent: isEditing ? 'space-between' : 'flex-end' }}>
            {isEditing && onDelete && (
              <button type="button" onClick={onDelete} className="dreamMapModal__delete">
                <Trash2 size={16} /> Excluir
              </button>
            )}
            <div className="dreamMapModal__footerActions">
              <button type="button" onClick={onClose} className="btn btn--ghost">Cancelar</button>
              <button type="submit" className="btn btn--primary">{isEditing ? 'Salvar' : 'Adicionar ao mapa'}</button>
            </div>
          </footer>
        </form>
      </section>
    </div>
  )
}
