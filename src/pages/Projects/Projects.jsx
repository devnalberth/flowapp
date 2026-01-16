import { useState } from 'react'
import { useApp } from '../../context/AppContext'

import TopNav from '../../components/TopNav/TopNav.jsx'
import CreateProjectModal from '../../components/CreateProjectModal/CreateProjectModal.jsx'
import CreateTaskModal from '../../components/CreateTaskModal/CreateTaskModal.jsx'

import './Projects.css'

const PROJECT_LIBRARY = [
  {
    title: 'FlowOS Expansion',
    description: 'Squads focados na jornada completa do cliente digital.',
    cover: 'https://placehold.co/233x166/0d0d12/e8e8e8?text=FlowOS',
    progress: 0.64,
    tags: ['Profissional', 'Meta'],
  },
  {
    title: 'Atlas Insights',
    description: 'Dashboard único para priorizar iniciativas estratégicas.',
    cover: 'https://placehold.co/233x166/ff9500/111111?text=Atlas',
    progress: 0.32,
    tags: ['Profissional'],
  },
]

const BOARD_COLUMNS = [
  { id: 'todo', title: 'Todo list', helper: 'Iniciativas recém-priorizadas', tone: 'todo' },
  { id: 'doing', title: 'Em andamento', helper: 'Times focados na entrega', tone: 'doing' },
  { id: 'closing', title: 'Em Finalização', helper: 'Aguardando validações', tone: 'closing' },
  { id: 'done', title: 'Concluído', helper: 'Resultados prontos para revisar', tone: 'done' },
].map((column) => ({
  ...column,
  items: PROJECT_LIBRARY.map((project, index) => ({
    id: `${column.id}-${index + 1}`,
    ...project,
  })),
}))

const PROJECT_OPTIONS = [...new Set(PROJECT_LIBRARY.map((project) => project.title))]
const TASK_STATUS_OPTIONS = ['A fazer', 'Em andamento', 'Em revisão', 'Concluído']
const TASK_PRIORITY_OPTIONS = ['Alta', 'Média', 'Baixa']
const TASK_AREA_OPTIONS = ['Produto', 'Growth', 'Financeiro', 'Pessoal']
const TASK_GOAL_OPTIONS = ['OKR #1 - Crescimento', 'OKR #2 - Eficiência operacional', 'OKR #3 - Experiência do cliente']

export default function Projects({ onNavigate, onLogout, user }) {
  const { projects, loading } = useApp()
  const [isModalOpen, setModalOpen] = useState(false)
  const [isTaskModalOpen, setTaskModalOpen] = useState(false)
  const [taskProject, setTaskProject] = useState('')

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

  const handleSubmitProject = (payload) => {
    console.table(payload)
    closeModal()
  }

  const handleSubmitTask = (payload) => {
    console.table(payload)
    closeTaskModal()
  }

  return (
    <div className="projects">
      <TopNav user={currentUser} active="Projetos" onNavigate={handleNavigate} onLogout={onLogout} />

      <section className="projectsBoard">
        {BOARD_COLUMNS.map((column) => (
          <article key={column.id} className="projectsColumn">
            <header className="projectsColumn__header">
              <div className="projectsColumn__title">
                <span className={`projectsColumn__icon projectsColumn__icon--${column.tone}`} aria-hidden="true" />
                <div className="projectsColumn__name">{column.title}</div>
              </div>
            </header>

            {column.items.map((project) => {
              const progressPercent = Math.min(Math.max(Math.round(project.progress * 100), 0), 100)

              return (
                <div key={project.id} className="projectsCard">
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
            })}
          </article>
        ))}
      </section>
      <CreateProjectModal open={isModalOpen} onClose={closeModal} onSubmit={handleSubmitProject} />
      <CreateTaskModal
        open={isTaskModalOpen}
        onClose={closeTaskModal}
        onSubmit={handleSubmitTask}
        projectsOptions={PROJECT_OPTIONS}
        goalOptions={TASK_GOAL_OPTIONS}
        areaOptions={TASK_AREA_OPTIONS}
        statusOptions={TASK_STATUS_OPTIONS}
        priorityOptions={TASK_PRIORITY_OPTIONS}
        initialProject={taskProject}
      />
    </div>
  )
}
