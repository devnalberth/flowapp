import { useState, useMemo } from 'react'
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

const TASK_STATUS_OPTIONS = ['A fazer', 'Em andamento', 'Em revisão', 'Concluído']
const TASK_PRIORITY_OPTIONS = ['Alta', 'Média', 'Baixa']

export default function Projects({ onNavigate, onLogout, user }) {
  // CORREÇÃO 1: Pegando tasks, goals e deleteProject do contexto
  const { projects, goals, tasks, loading, addProject, updateProject, deleteProject, addTask } = useApp()

  const [isModalOpen, setModalOpen] = useState(false)
  const [isTaskModalOpen, setTaskModalOpen] = useState(false)
  const [taskProject, setTaskProject] = useState('')
  const [selectedProject, setSelectedProject] = useState(null)
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false)
  const [editProject, setEditProject] = useState(null)

  // Organizar projetos por colunas
  const boardColumns = useMemo(() => {
    return COLUMN_DEFINITIONS.map((column) => ({
      ...column,
      items: projects.map(project => {
        // Cálculo dinâmico de progresso
        const projectTasks = tasks.filter(t => t.projectId === project.id || t.project === project.title)
        const totalTasks = projectTasks.length
        const completedTasks = projectTasks.filter(t => t.completed).length
        const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

        return { ...project, progress }
      }).filter((project) => {
        const status = project.status || 'todo'
        return status === column.status || (column.status === 'todo' && status === 'active')
      })
    }))
  }, [projects, tasks])

  const projectOptions = useMemo(() => projects.map((p) => ({ id: p.id, label: p.title })), [projects])

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
        status: payload.status || 'A fazer',
        // Se temos um projeto selecionado na modal, usamos o ID dele
        projectId: payload.projectId || (taskProject ? projects.find(p => p.title === taskProject)?.id : null)
      })
      setTaskModalOpen(false)
      setTaskProject('')
    } catch (e) { alert('Erro ao criar tarefa') }
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
          <article key={column.id} className="projectsColumn">
            <header className="projectsColumn__header">
              <span className={`projectsColumn__icon projectsColumn__icon--${column.tone}`} />
              <div className="projectsColumn__name">{column.title}</div>
            </header>

            {column.items.length === 0 ? (
              <div className="projectsColumn__empty">Nenhum projeto</div>
            ) : (
              column.items.map((project) => (
                <div key={project.id} className="projectsCard" onClick={() => handleCardClick(project)}>
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
                    <button className="projectsCard__add" onClick={(e) => {
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
        <CreateTaskModal open={true} onClose={() => setTaskModalOpen(false)} onSubmit={handleSubmitTask}
          projectsOptions={projectOptions} statusOptions={TASK_STATUS_OPTIONS} priorityOptions={TASK_PRIORITY_OPTIONS}
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