import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'

import TopNav from '../../components/TopNav/TopNav.jsx'
import CreateProjectModal from '../../components/CreateProjectModal/CreateProjectModal.jsx'
import CreateTaskModal from '../../components/CreateTaskModal/CreateTaskModal.jsx'
import ProjectDetailsModal from '../../components/ProjectDetailsModal/ProjectDetailsModal.jsx'
import FloatingCreateButton from '../../components/FloatingCreateButton/FloatingCreateButton.jsx'

import './Projects.css'

const COLUMN_DEFINITIONS = [
  { id: 'todo', title: 'Todo list', helper: 'Iniciativas recém-priorizadas', tone: 'todo', status: 'todo' },
  { id: 'doing', title: 'Em andamento', helper: 'Times focados na entrega', tone: 'doing', status: 'in_progress' },
  { id: 'closing', title: 'Em Finalização', helper: 'Aguardando validações', tone: 'closing', status: 'review' },
  { id: 'done', title: 'Concluído', helper: 'Resultados prontos para revisar', tone: 'done', status: 'completed' },
]

const deriveProjectStatus = ({ totalTasks, progress }) => {
  // Regras solicitadas:
  // 100% => Concluído
  // 80%..99% => Em Finalização
  // 1%..79% => Em Andamento
  // 0% => Todo
  if (!totalTasks || progress <= 0) return 'todo'
  if (progress >= 100) return 'completed'
  if (progress >= 80) return 'review'
  return 'in_progress'
}

const isSameStatus = (current, derived) => {
  // Compatibilidade com valores antigos
  if (derived === 'todo') return !current || current === 'todo' || current === 'active'
  return current === derived
}

export default function Projects({ onNavigate, onLogout, user }) {
  // CORREÇÃO 1: Pegando tasks, goals e deleteProject do contexto
  const { projects, goals, tasks, loading, addProject, updateProject, deleteProject, addTask } = useApp()

  const [isModalOpen, setModalOpen] = useState(false)
  const [isTaskModalOpen, setTaskModalOpen] = useState(false)
  const [taskProject, setTaskProject] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false)
  const [editProject, setEditProject] = useState(null)

  // Drag state
  const [draggingProjectId, setDraggingProjectId] = useState(null)
  const [dragOverColumnId, setDragOverColumnId] = useState(null)

  // Evita múltiplos autosync concorrentes
  const autoSyncInFlightRef = useRef(false)

  const projectOptions = useMemo(() => projects.map((p) => ({ id: p.id, label: p.title })), [projects])

  const projectsComputed = useMemo(() => {
    return projects.map(project => {
      const projectTasks = tasks.filter(t => t.projectId === project.id || t.project === project.title)
      const totalTasks = projectTasks.length
      const completedTasks = projectTasks.filter(t => t.completed).length
      const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
      const autoStatus = deriveProjectStatus({ totalTasks, progress })
      return { ...project, progress, autoStatus }
    })
  }, [projects, tasks])

  // Auto-atualiza o status persistido do projeto conforme progresso
  useEffect(() => {
    if (loading) return
    if (autoSyncInFlightRef.current) return

    const mismatches = projectsComputed
      .map(p => ({ id: p.id, current: p.status, derived: p.autoStatus }))
      .filter(({ current, derived }) => !isSameStatus(current, derived))

    if (mismatches.length === 0) return

    autoSyncInFlightRef.current = true
    Promise.allSettled(mismatches.map(({ id, derived }) => updateProject(id, { status: derived })))
      .finally(() => { autoSyncInFlightRef.current = false })
  }, [projectsComputed, loading, updateProject])

  // Organizar projetos por colunas
  const boardColumns = useMemo(() => {
    return COLUMN_DEFINITIONS.map((column) => ({
      ...column,
      items: projectsComputed.filter((project) => project.autoStatus === column.status)
    }))
  }, [projectsComputed])

  const handleNavigate = (label) => onNavigate && onNavigate(label)

  // Handlers
  const handleSubmitProject = async (payload) => {
    try {
      if (editProject) {
        await updateProject(editProject.id, payload)
      } else {
        await addProject(payload)
      }
      setModalOpen(false)
      setEditProject(null)
    } catch (e) { alert(editProject ? 'Erro ao editar projeto' : 'Erro ao criar projeto') }
  }

  const handleSubmitTask = async (payload) => {
    try {
      await addTask({
        ...payload,
        status: payload.status || 'todo',
        // Se temos um projeto selecionado na modal, usamos o ID dele
        projectId: payload.projectId || (taskProject ? projects.find(p => p.title === taskProject)?.id : null)
      })
      setTaskModalOpen(false)
      setTaskProject('')
    } catch (e) { alert('Erro ao criar tarefa') }
  }

  const handleDragStart = (event, projectId) => {
    setDraggingProjectId(projectId)
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', projectId)
  }

  const handleDragEnd = () => {
    setDraggingProjectId(null)
    setDragOverColumnId(null)
  }

  const handleDropOnColumn = async (event, column) => {
    event.preventDefault()
    const projectId = event.dataTransfer.getData('text/plain')
    if (!projectId) return

    // Persistimos o drop. O autosync (progresso) pode reajustar depois.
    await updateProject(projectId, { status: column.status })
    setDragOverColumnId(null)
    setDraggingProjectId(null)
  }

  const handleDeleteProject = async () => {
    if (!selectedProject) return
    if (window.confirm('Tem certeza que deseja excluir este projeto?')) {
      try {
        await deleteProject(selectedProject.id)
        setDetailsModalOpen(false)
        setSelectedProject(null)
      } catch (e) {
        alert('Erro ao excluir projeto')
      }
    }
  }

  const handleCardClick = (project) => {
    setSelectedProject(project)
    setDetailsModalOpen(true)
  }

  const handleEditProject = (project) => {
    setEditProject(project)
    setModalOpen(true)
    setDetailsModalOpen(false)
  }

  // --- Render ---
  if (loading) return <div className="projects"><div style={{ padding: '2rem' }}>Carregando...</div></div>

  return (
    <div className="projects">
      <TopNav user={user} active="Projetos" onNavigate={handleNavigate} onLogout={onLogout} />
      <FloatingCreateButton label="Novo projeto" onClick={() => setModalOpen(true)} />

      <section className="projectsBoard">
        {boardColumns.map((column) => (
          <article
            key={column.id}
            className={`projectsColumn ${dragOverColumnId === column.id ? 'projectsColumn--dragOver' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setDragOverColumnId(column.id) }}
            onDragEnter={() => setDragOverColumnId(column.id)}
            onDragLeave={() => setDragOverColumnId((curr) => (curr === column.id ? null : curr))}
            onDrop={(e) => handleDropOnColumn(e, column)}
          >
            <header className="projectsColumn__header">
              <span className={`projectsColumn__icon projectsColumn__icon--${column.tone}`} />
              <div className="projectsColumn__name">{column.title}</div>
            </header>

            {column.items.length === 0 ? (
              <div className="projectsColumn__empty">Nenhum projeto</div>
            ) : (
              column.items.map((project) => (
                <div
                  key={project.id}
                  className={`projectsCard ${draggingProjectId === project.id ? 'projectsCard--dragging' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, project.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => { if (!draggingProjectId) handleCardClick(project) }}
                >
                  <div className="projectsCard__text">
                    <div className="projectsCard__title">{project.title}</div>
                    <p className="projectsCard__description">{project.description}</p>
                  </div>
                  {/* Barra de progresso baseada nas tarefas */}
                  <div className="projectsCard__progress">
                    <div className="projectsCard__bar">
                      <span className="projectsCard__barFill" style={{ width: `${project.progress || 0}%` }} />
                    </div>
                  </div>
                  <div className="projectsCard__footer">
                    <button className="projectsCard__add" draggable={false} onClick={(e) => {
                      e.stopPropagation()
                      setTaskProject(project.title)
                      setTaskModalOpen(true)
                    }} />
                  </div>
                </div>
              ))
            )}
          </article>
        ))}
      </section>

      {/* MODAIS */}
      {isModalOpen && (
        <CreateProjectModal open={true} onClose={() => { setModalOpen(false); setEditProject(null) }} onSubmit={handleSubmitProject} goalOptions={goals} initialData={editProject} />
      )}

      {isTaskModalOpen && (
        <CreateTaskModal
          open={true}
          onClose={() => setTaskModalOpen(false)}
          onSubmit={handleSubmitTask}
          projectsOptions={projectOptions}
          initialProject={taskProject}
        />
      )}

      {/* CORREÇÃO 2: Passando tasks, goals e onDelete para o modal de detalhes */}
      {isDetailsModalOpen && selectedProject && (
        <ProjectDetailsModal
          project={selectedProject}
          open={true}
          onClose={() => setDetailsModalOpen(false)}
          tasks={tasks} // Passando tarefas globais
          goals={goals} // Passando metas globais
          onDelete={handleDeleteProject} // Passando função de deletar
          onEdit={handleEditProject}
        />
      )}
    </div>
  )
}