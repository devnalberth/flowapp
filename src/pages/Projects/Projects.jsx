import { usePageActions } from "../../context/ShellContext.jsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "../../context/AppContext";
import { Plus, FolderPlus, Archive } from "lucide-react";
import { motion } from "framer-motion";
import ProjectsSkeleton from "./ProjectsSkeleton";
import ProjectsEmpty from "./ProjectsEmpty";
import ProjectDeleteModal from "./ProjectDeleteModal";
import { useToast } from "../../components/ui/ToastProvider";
import EmptyState from "../../components/ui/EmptyState";
import FilterPill from "../../components/ui/FilterPill";
import { useMotionPresets } from "../../components/ui/motion";

import CreateProjectModal from "../../components/CreateProjectModal/CreateProjectModal.jsx";
import CreateTaskModal from "../../components/CreateTaskModal/CreateTaskModal.jsx";
import ProjectCard from "../../components/ProjectCard/ProjectCard.jsx";
import ProjectWorkspace from "./ProjectWorkspace.jsx";
import ProjectsDashboard from "./ProjectsDashboard.jsx";
import {
  computeProjectStats,
  isArchivedProject,
} from "../../utils/projectMetrics";

import "./Projects.css";

// Categorias de projeto (campo `area`) usadas no filtro da galeria
const AREAS = ["Profissional", "Pessoal", "Financeiro", "Estudos"];

// Compatibilidade com valores antigos de status
const isSameStatus = (current, derived) => {
  if (derived === "todo")
    return !current || current === "todo" || current === "active";
  return current === derived;
};

export default function Projects({ onNavigate, onLogout, user }) {
  const {
    projects,
    clients,
    goals,
    tasks,
    loading,
    addProject,
    updateProject,
    deleteProject,
    addTask,
    updateTask,
    addClient,
    prefs = {},
  } = useApp();

  const [activeProjectId, setActiveProjectId] = useState(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editProject, setEditProject] = useState(null);
  const [isTaskModalOpen, setTaskModalOpen] = useState(false);
  const [taskPreset, setTaskPreset] = useState(null); // { projectId, status }
  const [activeCat, setActiveCat] = useState("all"); // filtro de categoria da galeria

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deletePending, setDeletePending] = useState(false);
  const [formError, setFormError] = useState(null);
  const [deleteError, setDeleteError] = useState(null);
  const notify = useToast();
  const presets = useMotionPresets();
  const mask = (value) =>
    prefs.hideFinanceValues
      ? String(value || "").replace(
          /R\$\s*[\d.,]+(?:\s*(?:mil|milhões?|mi))?/gi,
          "R$ ••••",
        )
      : value;
  const autoSyncInFlightRef = useRef(false);

  const projectOptions = useMemo(
    () => projects.map((p) => ({ id: p.id, label: p.title })),
    [projects],
  );
  const clientById = useMemo(
    () => Object.fromEntries(clients.map((c) => [c.id, c])),
    [clients],
  );
  const goalById = useMemo(
    () => Object.fromEntries(goals.map((g) => [g.id, g])),
    [goals],
  );

  const activeProject = useMemo(
    () => projects.find((p) => p.id === activeProjectId) || null,
    [projects, activeProjectId],
  );

  // Arquivados ficam fora da galeria, dos filtros e das métricas
  const activeProjects = useMemo(
    () => projects.filter((p) => !isArchivedProject(p)),
    [projects],
  );
  const archivedProjects = useMemo(
    () => projects.filter(isArchivedProject),
    [projects],
  );

  // Contagem por categoria + lista de chips do filtro (só projetos ativos)
  const catCounts = useMemo(() => {
    const counts = {
      all: activeProjects.length,
      Outros: 0,
      archived: archivedProjects.length,
    };
    AREAS.forEach((a) => {
      counts[a] = 0;
    });
    activeProjects.forEach((p) => {
      if (AREAS.includes(p.area)) counts[p.area] += 1;
      else counts.Outros += 1;
    });
    return counts;
  }, [activeProjects, archivedProjects]);

  const categories = useMemo(() => {
    const base = [
      { id: "all", label: "Todos" },
      ...AREAS.map((a) => ({ id: a, label: a })),
    ];
    if (catCounts.Outros > 0) base.push({ id: "Outros", label: "Outros" });
    if (archivedProjects.length > 0)
      base.push({ id: "archived", label: "Arquivados" });
    return base;
  }, [catCounts, archivedProjects.length]);

  const visibleProjects = useMemo(() => {
    if (activeCat === "archived") return archivedProjects;
    if (activeCat === "all") return activeProjects;
    if (activeCat === "Outros")
      return activeProjects.filter((p) => !AREAS.includes(p.area));
    return activeProjects.filter((p) => p.area === activeCat);
  }, [activeProjects, archivedProjects, activeCat]);

  // Se o último arquivado for restaurado/excluído, volta para "Todos"
  useEffect(() => {
    if (activeCat === "archived" && archivedProjects.length === 0)
      setActiveCat("all");
  }, [activeCat, archivedProjects.length]);

  // Auto-atualiza o status persistido do projeto conforme o progresso das tarefas.
  // Arquivados ficam fora: o status 'archived' é manual e não pode ser sobrescrito.
  useEffect(() => {
    if (loading || autoSyncInFlightRef.current) return;
    const mismatches = projects
      .filter((p) => !isArchivedProject(p))
      .map((p) => ({
        id: p.id,
        current: p.status,
        derived: computeProjectStats(p, tasks).autoStatus,
      }))
      .filter(({ current, derived }) => !isSameStatus(current, derived));

    if (mismatches.length === 0) return;
    autoSyncInFlightRef.current = true;
    Promise.allSettled(
      mismatches.map(({ id, derived }) =>
        updateProject(id, { status: derived }),
      ),
    ).finally(() => {
      autoSyncInFlightRef.current = false;
    });
  }, [projects, tasks, loading, updateProject]);

  const clientFor = (p) =>
    p ? clientById[p.clientId || p.client_id] || null : null;
  const goalFor = (p) => (p ? goalById[p.goalId || p.goal_id] || null : null);

  const handleSubmitProject = async (payload) => {
    try {
      if (editProject) await updateProject(editProject.id, payload);
      else await addProject(payload);
      setModalOpen(false);
      setEditProject(null);
    } catch (e) {
      setFormError(
        editProject
          ? "Erro ao editar projeto. Tente novamente."
          : "Erro ao criar projeto. Tente novamente.",
      );
    }
  };

  const handleCreateClient = async (data) => {
    try {
      return await addClient(data);
    } catch (e) {
      console.error("Erro ao criar cliente:", e);
      setFormError(`Erro ao criar cliente: ${e?.message || e}`);
      return null;
    }
  };

  const handleNewTask = (status) => {
    setTaskPreset({ projectId: activeProjectId, status: status || "todo" });
    setTaskModalOpen(true);
  };

  const handleSubmitTask = async (payload) => {
    try {
      await addTask({
        ...payload,
        status: payload.status || "todo",
        projectId: payload.projectId || taskPreset?.projectId || null,
      });
      setTaskModalOpen(false);
      setTaskPreset(null);
    } catch (e) {
      alert("Erro ao criar tarefa");
    }
  };

  const handleEditProject = (project) => {
    setFormError(null);
    setEditProject(project);
    setModalOpen(true);
  };

  const handleDeleteProject = (project) => {
    const target = project || activeProject;
    if (target) {
      setDeleteError(null);
      setDeleteTarget(target);
    }
  };
  const confirmDeleteProject = async () => {
    const target = deleteTarget;
    if (!target || deletePending) return;
    setDeletePending(true);
    try {
      await deleteProject(target.id);
      if (activeProjectId === target.id) setActiveProjectId(null);
      setDeleteTarget(null);
    } catch (e) {
      setDeleteError("Erro ao excluir projeto. Tente novamente.");
    } finally {
      setDeletePending(false);
    }
  };

  // Arquivar é reversível: some da galeria e das métricas, mas fica em "Arquivados"
  const handleArchiveProject = async (project) => {
    const target = project || activeProject;
    if (!target) return;
    try {
      await updateProject(target.id, { status: "archived" });
      if (activeProjectId === target.id) setActiveProjectId(null);
      notify?.({
        title: `“${mask(target.title)}” foi para Arquivados`,
        detail: "Sai do painel e dos filtros. Dá para restaurar quando quiser.",
        icon: Archive,
        className: "project-archive-toast",
        action: "Desfazer",
        onAction: () => handleRestoreProject(target),
      });
      return true;
    } catch (e) {
      notify?.({
        title: "Erro ao arquivar projeto",
        detail: "Tente novamente.",
        tone: "danger",
      });
      return false;
    }
  };

  // Ao restaurar, o status correto é re-derivado das tarefas pelo auto-sync
  const handleRestoreProject = async (project) => {
    if (!project) return;
    try {
      await updateProject(project.id, { status: "todo" });
    } catch (e) {
      notify?.({
        title: "Erro ao restaurar projeto",
        detail: "Tente novamente.",
        tone: "danger",
      });
    }
  };

  const openNewProject = () => {
    setFormError(null);
    setEditProject(null);
    setModalOpen(true);
  };

  usePageActions({
    label: activeProject ? "Nova tarefa" : "Novo projeto",
    title: activeProject ? mask(activeProject.title) : "Projetos",
    onClick: activeProject ? () => handleNewTask("todo") : openNewProject,
    disabled: loading,
  });

  if (loading) {
    return (
      <div className="projects">
        <ProjectsSkeleton />
      </div>
    );
  }

  return (
    <div className="projects">
      <div className="projectsWrapper">
        {activeProject ? (
          <ProjectWorkspace
            project={activeProject}
            tasks={tasks}
            client={clientFor(activeProject)}
            goal={goalFor(activeProject)}
            onBack={() => setActiveProjectId(null)}
            onEdit={handleEditProject}
            onArchive={handleArchiveProject}
            onRestore={handleRestoreProject}
            onDelete={handleDeleteProject}
            updateTask={updateTask}
            onNewTask={handleNewTask}
            onNavigate={onNavigate}
            mask={mask}
          />
        ) : (
          <motion.div
            className="project-gallery-redesign"
            initial="hidden"
            animate="show"
            variants={presets.grid}
          >
            <motion.header
              className="project-gallery-header"
              variants={presets.row}
            >
              <h1>Projetos</h1>
              <p>
                Onde o trabalho acontece. O status de cada projeto segue as
                tarefas sozinho.
              </p>
            </motion.header>
            {activeCat !== "archived" && (
              <ProjectsDashboard
                projects={activeProjects}
                tasks={tasks}
                onOpenProject={setActiveProjectId}
                onNavigate={onNavigate}
                mask={mask}
              />
            )}

            {projects.length > 0 && (
              <motion.nav
                className="project-gallery-filters"
                aria-label="Filtrar por categoria"
                variants={presets.card}
              >
                {categories.map((cat) => (
                  <FilterPill
                    key={cat.id}
                    applied={activeCat === cat.id}
                    disclosure={false}
                    count={catCounts[cat.id] ?? 0}
                    aria-pressed={activeCat === cat.id}
                    onClick={() => setActiveCat(cat.id)}
                  >
                    {cat.id === "archived" && (
                      <Archive size={13} strokeWidth={1.75} />
                    )}{" "}
                    {cat.label}
                  </FilterPill>
                ))}
              </motion.nav>
            )}
            {activeCat === "archived" && (
              <p className="projGallery__archivedHint">
                <Archive size={14} /> Projetos arquivados ficam fora do painel e
                dos filtros. Restaure para voltar a acompanhá-los.
              </p>
            )}

            {projects.length === 0 ||
            (activeProjects.length === 0 && activeCat !== "archived") ? (
              <ProjectsEmpty onCreate={openNewProject} />
            ) : visibleProjects.length === 0 ? (
              <EmptyState
                icon={FolderPlus}
                title={`Nenhum projeto em ${activeCat}`}
                description="Os projetos desta área aparecem aqui."
                action="Ver todos"
                onAction={() => setActiveCat("all")}
              />
            ) : (
              <motion.div
                className="project-gallery-grid"
                variants={presets.grid}
              >
                {visibleProjects.map((p, idx) => (
                  <ProjectCard
                    key={p.id}
                    project={p}
                    tasks={tasks}
                    client={clientFor(p)}
                    goal={goalFor(p)}
                    index={idx}
                    mask={mask}
                    onOpen={() => setActiveProjectId(p.id)}
                    onEdit={handleEditProject}
                    onArchive={handleArchiveProject}
                    onRestore={handleRestoreProject}
                    onDelete={handleDeleteProject}
                  />
                ))}
                {activeCat !== "archived" && (
                  <button
                    type="button"
                    className="project-gallery-new"
                    onClick={openNewProject}
                  >
                    <span>
                      <Plus size={20} strokeWidth={1.75} />
                    </span>
                    <strong>Novo projeto</strong>
                    <small>Ligue a uma meta para ele contar no progresso</small>
                  </button>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {deleteTarget && (
        <ProjectDeleteModal
          project={deleteTarget}
          goal={goalFor(deleteTarget)}
          mask={mask}
          pending={deletePending}
          error={deleteError}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDeleteProject}
          onArchive={
            isArchivedProject(deleteTarget)
              ? undefined
              : async () => {
                  setDeletePending(true);
                  try {
                    if (await handleArchiveProject(deleteTarget))
                      setDeleteTarget(null);
                    else
                      setDeleteError(
                        "Erro ao arquivar projeto. Tente novamente.",
                      );
                  } finally {
                    setDeletePending(false);
                  }
                }
          }
        />
      )}

      {isModalOpen && (
        <CreateProjectModal
          open
          onClose={() => {
            setModalOpen(false);
            setEditProject(null);
          }}
          onSubmit={handleSubmitProject}
          goalOptions={goals}
          clientOptions={clients}
          onCreateClient={handleCreateClient}
          initialData={editProject}
          error={formError}
        />
      )}

      {isTaskModalOpen && (
        <CreateTaskModal
          open
          onClose={() => {
            setTaskModalOpen(false);
            setTaskPreset(null);
          }}
          onSubmit={handleSubmitTask}
          projectsOptions={projectOptions}
          initialData={taskPreset}
        />
      )}
    </div>
  );
}
