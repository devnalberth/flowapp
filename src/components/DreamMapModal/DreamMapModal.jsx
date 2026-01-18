import { useEffect, useRef, useState } from 'react'

import './DreamMapModal.css'

export default function DreamMapModal({ open, onClose, onSubmit, goals = [] }) {
  const [form, setForm] = useState({
    title: '',
    goalId: '',
  })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const fileInputRef = useRef(null)
  const titleRef = useRef(null)

  useEffect(() => {
    if (open) {
      setForm({ title: '', goalId: '' })
      setImageFile(null)
      setImagePreview(null)
      requestAnimationFrame(() => fileInputRef.current?.click())
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

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

  if (!open) {
    return null
  }

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
    if (!imageFile || !form.title) return

    onSubmit?.(form, imageFile)
  }

  return (
    <div className="dreamMapModal" role="dialog" aria-modal="true">
      <div className="dreamMapModal__backdrop" onClick={onClose} />
      <section className="dreamMapModal__panel">
        <header className="dreamMapModal__header">
          <div>
            <p className="dreamMapModal__eyebrow">Mapa dos sonhos</p>
            <h3>Adicione uma imagem inspiradora</h3>
          </div>
          <button type="button" className="dreamMapModal__close" onClick={onClose} aria-label="Fechar modal">
            ✕
          </button>
        </header>

        <form className="dreamMapModal__form" onSubmit={handleSubmit}>
          <div className="dreamMapModal__field">
            <span>Imagem*</span>
            <input
              ref={fileInputRef}
              id="dreamImage"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              required
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
                <option key={goal.id} value={goal.id}>
                  {goal.title}
                </option>
              ))}
            </select>
          </label>

          <footer className="dreamMapModal__footer">
            <button type="button" onClick={onClose} className="btn btn--ghost">
              Cancelar
            </button>
            <button type="submit" className="btn btn--primary">
              Adicionar ao mapa
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
