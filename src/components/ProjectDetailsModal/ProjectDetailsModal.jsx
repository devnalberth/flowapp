import { useMemo } from 'react'
import { X, Trash2, CheckCircle2, Target } from 'lucide-react'
import './ProjectDetailsModal.css'

export default function ProjectDetailsModal({ project, open, onClose, tasks = [], goals = [], onDelete, onEdit }) {
  if (!open || !project) return null

  // Filtra apenas tarefas deste projeto
  const projectTasks = useMemo(() => {
    return tasks.filter(t => t.project_id === project.id || t.projectId === project.id)
  }, [tasks, project.id])

  // Filtra apenas metas deste projeto
  const projectGoals = useMemo(() => {
    return goals.filter(g => g.project_id === project.id || g.projectId === project.id)
  }, [goals, project.id])

  const progress = project.progress || 0

  return (
    <div className="projectDetailsOverlay" onClick={onClose}>
      <div className="projectDetailsModal" onClick={e => e.stopPropagation()}>
        
        {/* HEADER */}
        <header className="projectDetailsHeader">
          <div className="projectDetailsTitle">
            <h2>{project.title}</h2>
            <button className="projectDetailsDelete" onClick={onDelete} title="Excluir Projeto">
              <Trash2 size={20} />
            </button>
          </div>
          <button className="projectDetailsClose" onClick={onClose}>
            <X size={24} />
          </button>
        </header>

        <div className="projectDetailsContent">
          {/* BARRA DE PROGRESSO */}
          <div className="projectDetailsProgress">
            <div className="projectDetailsProgressLabel">
              <span>Progresso</span>
              <span>{progress}%</span>
            </div>
            <div className="projectDetailsProgressBar">
              <div className="projectDetailsProgressBarFill" style={{ width: `${progress}%` }}></div>
            </div>
          </div>

          <div className="projectDetailsStatus">
            <span className="projectDetailsStatusBadge">
              ⚡ {project.status === 'in_progress' ? 'Em Andamento' : project.status === 'completed' ? 'Concluído' : 'A Fazer'}
            </span>
          </div>

          {/* LISTA DE TAREFAS VINCULADAS */}
          <section className="projectDetailsSection">
            <h3>Tarefas Vinculadas</h3>
            <div className="projectDetailsList">
              {projectTasks.length === 0 ? (
                <div className="projectDetailsEmpty">
                  Nenhuma tarefa vinculada ainda
                </div>
              ) : (
                projectTasks.map(task => (
                  <div key={task.id} className="projectDetailsItem">
                    <CheckCircle2 size={16} className={task.completed ? 'text-green' : 'text-gray'} />
                    <span>{task.title}</span>
                    <span className="projectDetailsTag">{task.status}</span>
                  </div>
                ))
              )}
            </div>
          </section>

          {/* LISTA DE METAS VINCULADAS */}
          <section className="projectDetailsSection">
            <h3>Metas Vinculadas</h3>
            <div className="projectDetailsList">
              {projectGoals.length === 0 ? (
                <div className="projectDetailsEmpty">
                  Nenhuma meta vinculada ainda
                </div>
              ) : (
                projectGoals.map(goal => (
                  <div key={goal.id} className="projectDetailsItem">
                    <Target size={16} />
                    <span>{goal.title || goal.name}</span>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        <footer className="projectDetailsFooter">
          <button className="btn btn-secondary" onClick={onClose}>Fechar</button>
          <button className="btn btn-primary" onClick={() => onEdit?.(project)}>Editar Projeto</button>
        </footer>
      </div>
    </div>
  )
}