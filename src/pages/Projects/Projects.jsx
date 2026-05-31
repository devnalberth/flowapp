import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { Plus, FolderPlus } from 'lucide-react'

import TopNav from '../../components/TopNav/TopNav.jsx'
import CreateProjectModal from '../../components/CreateProjectModal/CreateProjectModal.jsx'
import CreateTaskModal from '../../components/CreateTaskModal/CreateTaskModal.jsx'
import FloatingCreateButton from '../../components/FloatingCreateButton/FloatingCreateButton.jsx'
import ProjectCard from '../../components/ProjectCard/ProjectCard.jsx'
import ProjectWorkspace from './ProjectWorkspace.jsx'
import { computeProjectStats } from '../../utils/projectMetrics'

import './Projects.css'

// Categorias de projeto (campo `area`) usadas no filtro da galeria
const AREAS = ['Profissional', 'Pessoal', 'Financeiro', 'Estudos']

// Compatibilidade com valores antigos de status
const isSameStatus = (current, derived) => {
  if (derived === 'todo') return !current || current === 'todo' || current === 'active'
  return current === derived
}

export default function Projects({ onNavigate, onLogout, user }) {
  const {
    projects, clients, goals, tasks, loading,
    addProject, updateProject, deleteProject,
    addTask, updateTask, addClient,
  } = useApp()

  const [activeProjectId, setActiveProjectId] = useState(null)
  const [isModalOpen, setModalOpen] = useState(false)
  const [editProject, setEditProject] = useState(null)
  const [isTaskModalOpen, setTaskModalOpen] = useState(false)
  const [taskPreset, setTaskPreset] = useState(null) // { projectId, status }
  const [activeCat, setActiveCat] = useState('all') // filtro de categoria da galeria

  const autoSyncInFlightRef = useRef(false)

  const projectOptions = useMemo(() => projects.map((p) => ({ id: p.id, label: p.title })), [projects])
  const clientById = useMemo(() => Object.fromEntries(clients.map((c) => [c.id, c])), [clients])
  const goalById = useMemo(() => Object.fromEntries(goals.map((g) => [g.id, g])), [goals])

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || null,
    [projects, activeProjectId],
  )

  // Contagem por categoria + lista de chips do filtro
  const catCounts = useMemo(() => {
    const counts = { all: projects.length, Outros: 0 }
    AREAS.forEach((a) => { counts[a] = 0 })
    projects.forEach((p) => {
      if (AREAS.includes(p.area)) counts[p.area] += 1
      else counts.Outros += 1
    })
    return counts
  }, [projects])

  const categories = useMemo(() => {
    const base = [{ id: 'all', label: 'Todos' }, ...AREAS.map((a) => ({ id: a, label: a }))]
    if (catCounts.Outros > 0) base.push({ id: 'Outros', label: 'Outros' })
    return base
  }, [catCounts])

  const visibleProjects = useMemo(() => {
    if (activeCat === 'all') return projects
    if (activeCat === 'Outros') return projects.filter((p) => !AREAS.includes(p.area))
    return projects.filter((p) => p.area === activeCat)
  }, [projects, activeCat])

  // Auto-atualiza o status persistido do projeto conforme o progresso das tarefas
  useEffect(() => {
    if (loading || autoSyncInFlightRef.current) return
    const mismatches = projects
      .map((p) => ({ id: p.id, current: p.status, derived: computeProjectStats(p, tasks).autoStatus }))
      .filter(({ current, derived }) => !isSameStatus(current, derived))

    if (mismatches.length === 0) return
    autoSyncInFlightRef.current = true
    Promise.allSettled(mismatches.map(({ id, derived }) => updateProject(id, { status: derived })))
      .finally(() => { autoSyncInFlightRef.current = false })
  }, [projects, tasks, loading, updateProject])

  const clientFor = (p) => (p ? clientById[p.clientId || p.client_id] || null : null)
  const goalFor = (p) => (p ? goalById[p.goalId || p.goal_id] || null : null)

  const handleSubmitProject = async (payload) => {
    try {
      if (editProject) await updateProject(editProject.id, payload)
      else await addProject(payload)
      setModalOpen(false)
      setEditProject(null)
    } catch (e) {
      alert(editProject ? 'Erro ao editar projeto' : 'Erro ao criar projeto')
    }
  }

  const handleCreateClient = async (data) => {
    try {
      return await addClient(data)
    } catch (e) {
      console.error('Erro ao criar cliente:', e)
      alert(`Erro ao criar cliente: ${e?.message || e}`)
      return null
    }
  }

  const handleNewTask = (status) => {
    setTaskPreset({ projectId: activeProjectId, status: status || 'todo' })
    setTaskModalOpen(true)
  }

  const handleSubmitTask = async (payload) => {
    try {
      await addTask({
        ...payload,
        status: payload.status || 'todo',
        projectId: payload.projectId || taskPreset?.projectId || null,
      })
      setTaskModalOpen(false)
      setTaskPreset(null)
    } catch (e) {
      alert('Erro ao criar tarefa')
    }
  }

  const handleEditProject = (project) => {
    setEditProject(project)
    setModalOpen(true)
  }

  const handleDeleteProject = async (project) => {
    const target = project || activeProject
    if (!target) return
    if (window.confirm('Tem certeza que deseja excluir este projeto?')) {
      try {
        await deleteProject(target.id)
        if (activeProjectId === target.id) setActiveProjectId(null)
      } catch (e) {
        alert('Erro ao excluir projeto')
      }
    }
  }

  const openNewProject = () => { setEditProject(null); setModalOpen(true) }

  if (loading) {
    return (
      <div className="projects">
        <TopNav user={user} active="Projetos" onNavigate={onNavigate} onLogout={onLogout} />
        <div style={{ padding: '2rem', color: '#666' }}>Carregando...</div>
      </div>
    )
  }

  return (
    <div className="projects">
      <TopNav user={user} active="Projetos" onNavigate={onNavigate} onLogout={onLogout} />

      <div className="projectsWrapper">
        {activeProject ? (
          <ProjectWorkspace
            project={activeProject}
            tasks={tasks}
            client={clientFor(activeProject)}
            goal={goalFor(activeProject)}
            onBack={() => setActiveProjectId(null)}
            onEdit={handleEditProject}
            onDelete={handleDeleteProject}
            updateTask={updateTask}
            onNewTask={handleNewTask}
          />
        ) : (
          <>
            <header className="projGallery__head">
              <div className="projGallery__headLeft">
                <p className="projGallery__eyebrow">Workspace</p>
                <h1 className="projGallery__title">Projetos</h1>
              </div>
              <div className="projGallery__headRight">
                {projects.length > 0 && (
                  <nav className="projGallery__cats" aria-label="Filtrar por categoria">
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        className={`projCat ${activeCat === cat.id ? 'is-active' : ''}`}
                        onClick={() => setActiveCat(cat.id)}
                      >
                        {cat.label}
                        <span className="projCat__count">{catCounts[cat.id] ?? 0}</span>
                      </button>
                    ))}
                  </nav>
                )}
                <button className="projGallery__new" onClick={openNewProject}>
                  <Plus size={16} /> Novo projeto
                </button>
              </div>
            </header>

            {projects.length === 0 ? (
              <div className="projGallery__empty">
                <FolderPlus size={32} />
                <h3>Nenhum projeto ainda</h3>
                <p>Crie seu primeiro projeto para organizar tarefas, prazos e clientes.</p>
                <button className="projGallery__new" onClick={openNewProject}>
                  <Plus size={16} /> Criar projeto
                </button>
              </div>
            ) : visibleProjects.length === 0 ? (
              <div className="projGallery__filterEmpty">
                Nenhum projeto em <strong>{activeCat}</strong>.
              </div>
            ) : (
              <div className="projGallery">
                {visibleProjects.map((p, idx) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    tasks={tasks}
                    client={clientFor(p)}
                    goal={goalFor(p)}
                    index={idx}
                    onOpen={() => setActiveProjectId(p.id)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {!activeProject && <FloatingCreateButton label="Novo projeto" onClick={openNewProject} />}

      {isModalOpen && (
        <CreateProjectModal
          open
          onClose={() => { setModalOpen(false); setEditProject(null) }}
          onSubmit={handleSubmitProject}
          goalOptions={goals}
          clientOptions={clients}
          onCreateClient={handleCreateClient}
          initialData={editProject}
        />
      )}

      {isTaskModalOpen && (
        <CreateTaskModal
          open
          onClose={() => { setTaskModalOpen(false); setTaskPreset(null) }}
          onSubmit={handleSubmitTask}
          projectsOptions={projectOptions}
          initialData={taskPreset}
        />
      )}
    </div>
  )
}
