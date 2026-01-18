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
const TASK_AREA_OPTIONS = ['Produto', 'Growth', 'Financeiro', 'Pessoal']
const TASK_GOAL_OPTIONS = ['OKR #1 - Crescimento', 'OKR #2 - Eficiência operacional', 'OKR #3 - Experiência do cliente']

export default function Projects({ onNavigate, onLogout, user }) {
  const { projects, goals, loading, addProject, updateProject } = useApp()
  const [isModalOpen, setModalOpen] = useState(false)
  const [isTaskModalOpen, setTaskModalOpen] = useState(false)
  const [taskProject, setTaskProject] = useState('')
  const [draggedProject, setDraggedProject] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)
  const [selectedProject, setSelectedProject] = useState(null)
  const [isDetailsModalOpen, setDetailsModalOpen] = useState(false)
  const [isDragging, setIsDragging] = useState(false)
  const [clickStartPos, setClickStartPos] = useState({ x: 0, y: 0 })

  // Organizar projetos por colunas com base no status
  const boardColumns = useMemo(() => {
    return COLUMN_DEFINITIONS.map((column) => ({
      ...column,
      items: projects
        .filter((project) => {
          const status = project.status || 'todo'
          return status === column.status || (column.status === 'todo' && status === 'active')
        })
        .map((project) => ({
          id: project.id,
          title: project.title,
          description: project.description || '',
          cover: project.cover_image || `https://placehold.co/233x166/${project.color || 'ff9500'}/111111?text=${encodeURIComponent(project.title)}`,
          progress: project.progress || 0,
          tags: project.tags ? JSON.parse(project.tags) : [],
        })),
    }))
  }, [projects])

  // Opções de projetos para o modal de tarefas
  const projectOptions = useMemo(() => {
    return projects.map((p) => p.title)
  }, [projects])

  const currentUser =
    user ?? {
      name: 'Matheus Nalberth',
      email: 'Nalberthdev@gmail.com',
      avatarUrl: 'https://placehold.co/42x42',
    }

  const handleNavigate = (label) => {
    if (typeof onNavigate === 'function') {
      onNavigate(label)
    }
  }

  const openModal = () => setModalOpen(true)
  const closeModal = () => setModalOpen(false)
  const openTaskModal = (projectName = '') => {
    setTaskProject(projectName)
    setTaskModalOpen(true)
  }
  const closeTaskModal = () => {
    setTaskModalOpen(false)
    setTaskProject('')
  }

  const closeDetailsModal = () => {
    setDetailsModalOpen(false)
    setSelectedProject(null)
  }

  const handleSubmitProject = async (payload) => {
    try {
      console.log('Submitting project:', payload)
      await addProject(payload)
      closeModal()
    } catch (error) {
      console.error('Erro ao criar projeto:', error)
      const errorMessage = error?.message || 'Erro desconhecido ao criar projeto'
      alert(`Erro ao criar projeto: ${errorMessage}`)
    }
  }

  const handleSubmitTask = (payload) => {
    console.table(payload)
    closeTaskModal()
  }

  // Funções de Drag and Drop
  const handleMouseDown = (e, project) => {
    // Salvar posição inicial do click
    setClickStartPos({ x: e.clientX, y: e.clientY })
    setIsDragging(false)
  }

  const handleDragStart = (e, project) => {
    setIsDragging(true)
    setDraggedProject(project)
    e.dataTransfer.effectAllowed = 'move'
    
    setTimeout(() => {
      e.currentTarget.classList.add('projectsCard--dragging')
    }, 0)
  }

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('projectsCard--dragging')
    
    // Pequeno delay para permitir o drop antes de resetar
    setTimeout(() => {
      setDraggedProject(null)
      setDragOverColumn(null)
      setIsDragging(false)
    }, 50)
  }

  const handleCardClick = (e, project) => {
    // Não abrir se clicou no botão de adicionar tarefa
    if (e.target.closest('.projectsCard__add')) return
    
    // Verificar se houve movimento (drag) - se moveu mais de 5px, é drag
    const moveDistance = Math.sqrt(
      Math.pow(e.clientX - clickStartPos.x, 2) + 
      Math.pow(e.clientY - clickStartPos.y, 2)
    )
    
    // Se moveu muito ou está arrastando, não abrir modal
    if (isDragging || moveDistance > 5) return
    
    setSelectedProject(project)
    setDetailsModalOpen(true)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragEnter = (e, columnStatus) => {
    e.preventDefault()
    setDragOverColumn(columnStatus)
  }

  const handleDragLeave = (e) => {
    // Verifica se realmente saiu da coluna (não apenas de um filho)
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverColumn(null)
    }
  }

  const handleDrop = async (e, targetStatus) => {
    e.preventDefault()
    setDragOverColumn(null)

    if (!draggedProject || draggedProject.status === targetStatus) {
      return
    }

    try {
      // Atualizar o status do projeto no banco
      await updateProject(draggedProject.id, { status: targetStatus })
    } catch (error) {
      console.error('Erro ao atualizar status do projeto:', error)
      alert('Erro ao mover projeto. Tente novamente.')
    }

    setDraggedProject(null)
  }

  if (loading) {
    return (
      <div className="projects">
        <TopNav user={currentUser} active="Projetos" onNavigate={handleNavigate} onLogout={onLogout} />
        <div style={{ padding: '2rem', textAlign: 'center' }}>Carregando projetos...</div>
      </div>
    )
  }

  return (
    <div className="projects">
      <TopNav user={currentUser} active="Projetos" onNavigate={handleNavigate} onLogout={onLogout} />

      <FloatingCreateButton label="Criar novo projeto" caption="Novo projeto" onClick={openModal} />

      <section className="projectsBoard">
        {boardColumns.map((column) => (
          <article 
            key={column.id} 
            className={`projectsColumn ${dragOverColumn === column.status ? 'projectsColumn--dragOver' : ''}`}
            onDragOver={handleDragOver}
            onDragEnter={(e) => handleDragEnter(e, column.status)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, column.status)}
          >
            <header className="projectsColumn__header">
              <div className="projectsColumn__title">
                <span className={`projectsColumn__icon projectsColumn__icon--${column.tone}`} aria-hidden="true" />
                <div className="projectsColumn__name">{column.title}</div>
              </div>
            </header>

            {column.items.length === 0 ? (
              <div className="projectsColumn__empty">
                <p>Nenhum projeto nesta coluna</p>
                {column.id === 'todo' && (
                  <button type="button" className="projectsColumn__addButton" onClick={openModal}>
                    + Criar primeiro projeto
                  </button>
                )}
              </div>
            ) : (
              column.items.map((project) => {
                const progressPercent = Math.min(Math.max(Math.round(project.progress * 100), 0), 100)

              return (
                <div 
                  key={project.id} 
                  className="projectsCard"
                  draggable={true}
                  onMouseDown={(e) => handleMouseDown(e, { ...project, status: column.status })}
                  onDragStart={(e) => handleDragStart(e, { ...project, status: column.status })}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => handleCardClick(e, { ...project, status: column.status })}
                >
                  <div className="projectsCard__text">
                    <div className="projectsCard__title">{project.title}</div>
                    <p className="projectsCard__description">{project.description}</p>
                  </div>

                  <div className="projectsCard__media">
                    <img src={project.cover} alt="Prévia do projeto" />
                  </div>

                  <div className="projectsCard__progress">
                    <div className="projectsCard__progressHead">
                      <span>Progress</span>
                      <span>{progressPercent}%</span>
                    </div>
                    <div
                      className="projectsCard__bar"
                      role="progressbar"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progressPercent}
                    >
                      <span className="projectsCard__barFill" style={{ width: `${progressPercent}%` }} />
                    </div>
                  </div>

                  <div className="projectsCard__footer">
                    <div className="projectsCard__tags">
                      {project.tags.map((tag) => (
                        <span key={tag} className={`projectsTag projectsTag--${tag.toLowerCase()}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      className="projectsCard__add"
                      aria-label="Adicionar nova tarefa ao projeto"
                      onClick={() => openTaskModal(project.title)}
                    />
                  </div>
                </div>
              )
            })
            )}
          </article>
        ))}
      </section>
      {isModalOpen && (
        <CreateProjectModal
          open={isModalOpen}
          onClose={closeModal}
          onSubmit={handleSubmitProject}
          goalOptions={goals}
        />
      )}
      {isTaskModalOpen && (
        <CreateTaskModal
          open={isTaskModalOpen}
          onClose={closeTaskModal}
          onSubmit={handleSubmitTask}
          projectsOptions={projectOptions}
          goalOptions={TASK_GOAL_OPTIONS}
          areaOptions={TASK_AREA_OPTIONS}
          statusOptions={TASK_STATUS_OPTIONS}
          priorityOptions={TASK_PRIORITY_OPTIONS}
          initialProject={taskProject}
        />
      )}
      {isDetailsModalOpen && (
        <ProjectDetailsModal
          project={selectedProject}
          open={isDetailsModalOpen}
          onClose={closeDetailsModal}
        />
      )}
    </div>
  )
}
