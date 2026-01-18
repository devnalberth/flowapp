import { useEffect, useRef } from 'react'
import './ProjectDetailsModal.css'

export default function ProjectDetailsModal({ project, open, onClose }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    if (!open) return undefined

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose?.()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  if (!open || !project) return null

  const progressPercent = Math.min(Math.max(Math.round((project.progress || 0) * (project.progress > 1 ? 1 : 100)), 0), 100)

  return (
    <div className="projectDetailsModal" role="dialog" aria-modal="true">
      <div className="projectDetailsModal__backdrop" onClick={onClose} />

      <section className="projectDetailsModal__panel" ref={dialogRef}>
        <header className="projectDetailsModal__header">
          <div className="projectDetailsModal__headerTop">
            <h2 className="projectDetailsModal__title">{project.title}</h2>
            <button 
              type="button" 
              className="projectDetailsModal__closeBtn" 
              onClick={onClose}
              aria-label="Fechar modal"
            >
              ✕
            </button>
          </div>
          {project.description && (
            <p className="projectDetailsModal__description">{project.description}</p>
          )}
        </header>

        <div className="projectDetailsModal__content">
          {/* Cover Image */}
          {project.cover && (
            <div className="projectDetailsModal__cover">
              <img src={project.cover} alt={project.title} />
            </div>
          )}

          {/* Progress */}
          <div className="projectDetailsModal__section">
            <h3 className="projectDetailsModal__sectionTitle">Progresso do Projeto</h3>
            <div className="projectDetailsModal__progress">
              <div className="projectDetailsModal__progressInfo">
                <span>Completo</span>
                <span className="projectDetailsModal__progressPercent">{progressPercent}%</span>
              </div>
              <div className="projectDetailsModal__progressBar">
                <div 
                  className="projectDetailsModal__progressFill" 
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* Status */}
          <div className="projectDetailsModal__section">
            <h3 className="projectDetailsModal__sectionTitle">Status</h3>
            <div className="projectDetailsModal__statusBadge">
              {project.status === 'todo' && '📋 A Fazer'}
              {project.status === 'in_progress' && '⚡ Em Andamento'}
              {project.status === 'review' && '🔍 Em Revisão'}
              {project.status === 'completed' && '✅ Concluído'}
            </div>
          </div>

          {/* Tags */}
          {project.tags && project.tags.length > 0 && (
            <div className="projectDetailsModal__section">
              <h3 className="projectDetailsModal__sectionTitle">Tags</h3>
              <div className="projectDetailsModal__tags">
                {project.tags.map((tag) => (
                  <span key={tag} className="projectDetailsModal__tag">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Tarefas - Placeholder */}
          <div className="projectDetailsModal__section">
            <h3 className="projectDetailsModal__sectionTitle">Tarefas</h3>
            <div className="projectDetailsModal__placeholder">
              <p>Nenhuma tarefa vinculada ainda</p>
              <button type="button" className="projectDetailsModal__addBtn">
                + Adicionar Tarefa
              </button>
            </div>
          </div>

          {/* Metas - Placeholder */}
          <div className="projectDetailsModal__section">
            <h3 className="projectDetailsModal__sectionTitle">Metas Vinculadas</h3>
            <div className="projectDetailsModal__placeholder">
              <p>Nenhuma meta vinculada ainda</p>
              <button type="button" className="projectDetailsModal__addBtn">
                + Vincular Meta
              </button>
            </div>
          </div>
        </div>

        <footer className="projectDetailsModal__footer">
          <button 
            type="button" 
            className="projectDetailsModal__btn projectDetailsModal__btn--secondary"
            onClick={onClose}
          >
            Fechar
          </button>
          <button 
            type="button" 
            className="projectDetailsModal__btn projectDetailsModal__btn--primary"
          >
            Editar Projeto
          </button>
        </footer>
      </section>
    </div>
  )
}
