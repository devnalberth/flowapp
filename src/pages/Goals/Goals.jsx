import { usePageActions } from "../../context/ShellContext.jsx";
import { useEffect, useRef, useState, useMemo } from "react";
import { useApp } from "../../context/AppContext";

import CreateGoalModal from "../../components/CreateGoalModal/CreateGoalModal.jsx";
import DreamMapModal from "../../components/DreamMapModal/DreamMapModal.jsx";
import { computeProjectStats } from "../../utils/projectMetrics";
import { getGoalSchedule, TRIMESTER_LABELS } from "../../utils/goalSchedule";

import "./Goals.css";
import GoalsPanel from "./GoalsPanel";
import GoalAreaView from "./GoalAreaView";
import GoalDetailView from "./GoalDetailView";
import DreamLightbox from "./DreamLightbox";
import ConfirmModal from "../../components/ui/ConfirmModal";
import { useToast } from "../../components/ui/ToastProvider";
import { Trash2 } from "lucide-react";

const TRIMESTERS = TRIMESTER_LABELS;

// Áreas de vida (alinhadas às categorias de Projetos: Profissional, Pessoal, Financeiro, Estudos)
const DEFAULT_LIFE_AREAS = [
  {
    id: "profissional",
    label: "Profissional",
    icon: "💼",
    description:
      "Desenvolva uma operação de produto com squads autônomos, governança leve e decisões orientadas por GTD.",
  },
  {
    id: "pessoal",
    label: "Pessoal",
    icon: "🌱",
    description:
      "Crie rituais pessoais que sustentem energia criativa e espaço para experiências significativas.",
  },
  {
    id: "financeiro",
    label: "Financeiro",
    icon: "💰",
    description:
      "Organize capital, fluxos e investimentos com transparência e previsibilidade.",
  },
  {
    id: "estudos",
    label: "Estudos",
    icon: "📚",
    description:
      "Estruture trilhas de aprendizado contínuo que sustentem sua evolução técnica e criativa.",
  },
];

// Agrega métricas de um conjunto de metas (para os dashboards)
const aggregateGoals = (metas = []) => {
  const total = metas.length;
  const done = metas.filter((m) => (m.progressPercent || 0) >= 100).length;
  const inProgress = metas.filter(
    (m) => (m.progressPercent || 0) > 0 && (m.progressPercent || 0) < 100,
  ).length;
  const notStarted = total - done - inProgress;
  const avgProgress = total
    ? Math.round(
        metas.reduce((a, m) => a + (m.progressPercent || 0), 0) / total,
      )
    : 0;
  const totalTasks = metas.reduce((a, m) => a + (m.totalTasks || 0), 0);
  const doneTasks = metas.reduce((a, m) => a + (m.doneTasks || 0), 0);
  const projects = metas.reduce((a, m) => a + (m.projects || []).length, 0);
  const byQuarter = [0, 0, 0, 0];
  metas.forEach((m) => {
    const q = m.schedule?.currentQuarter;
    if (q >= 1 && q <= 4) byQuarter[q - 1] += 1;
  });
  return {
    total,
    done,
    inProgress,
    notStarted,
    avgProgress,
    totalTasks,
    doneTasks,
    projects,
    byQuarter,
  };
};

// Visão geral consolidada (topo da página de Metas)

// Dashboard compacto de uma área (acima do kanban)

function AreaDetail({
  area,
  onBack,
  onEdit,
  onNavigate,
  onViewDream,
  onCreate,
  mask,
}) {
  const [activeMetaId, setActiveMetaId] = useState(area.metas[0]?.id ?? null);
  const [view, setView] = useState("board");

  useEffect(() => {
    setActiveMetaId(area.metas[0]?.id ?? null);
    setView("board");
  }, [area]);

  const activeMeta =
    area.metas.find((meta) => meta.id === activeMetaId) ?? area.metas[0];

  const openMetaDetail = (metaId) => {
    setActiveMetaId(metaId);
    setView("detail");
  };

  const handleBack = () => {
    if (view === "detail") {
      setView("board");
      return;
    }
    onBack?.();
  };

  const quarterColumns = TRIMESTERS.map((quarterLabel, index) => ({
    id: `quarter-${index + 1}`,
    label: quarterLabel,
    metas: area.metas.filter((meta) => meta.trimester === quarterLabel),
  }));

  return view === "detail" && activeMeta ? (
    <GoalDetailView
      meta={activeMeta}
      onBack={handleBack}
      onEdit={() => onEdit?.(activeMeta)}
      onNavigate={onNavigate}
      onViewDream={onViewDream}
      onCreate={onCreate}
      mask={mask}
    />
  ) : (
    <GoalAreaView
      area={area}
      stats={aggregateGoals(area.metas)}
      columns={quarterColumns}
      onBack={handleBack}
      onOpenMeta={openMetaDetail}
      onNavigate={onNavigate}
      mask={mask}
    />
  );
}

export default function Goals({ onNavigate, onLogout, user }) {
  // CORREÇÃO: Pegando deleteGoal do contexto
  const {
    prefs = {},
    goals,
    projects,
    tasks,
    dreamMaps,
    financeCategories,
    addGoal,
    addDreamMap,
    updateDreamMap,
    deleteDreamMap,
    updateGoal,
    deleteGoal,
    updateProject,
    loading,
  } = useApp();
  const [selectedAreaId, setSelectedAreaId] = useState(null);
  const [isDreamModalOpen, setIsDreamModalOpen] = useState(false);
  const [editingDream, setEditingDream] = useState(null);
  const [dreamPending, setDreamPending] = useState(false);
  const [dreamError, setDreamError] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editGoal, setEditGoal] = useState(null);
  const [confirmGoalDelete, setConfirmGoalDelete] = useState(false);
  const [deletingGoal, setDeletingGoal] = useState(false);
  const notify = useToast();
  const [goalDefaultArea, setGoalDefaultArea] = useState(null);
  const [emptyAreaPulseId, setEmptyAreaPulseId] = useState(null);
  const emptyPulseTimerRef = useRef(null);

  const LIFE_AREAS = useMemo(() => {
    return DEFAULT_LIFE_AREAS.map((area) => {
      const areaGoals = goals
        .filter(
          (goal) =>
            goal.area?.toLowerCase() === area.id ||
            goal.area?.toLowerCase() === area.label.toLowerCase(),
        )
        .map((goal) => {
          const schedule = getGoalSchedule(goal);

          // Projetos vinculados + progresso DERIVADO (média do andamento dos projetos)
          const goalProjects = (projects || []).filter(
            (p) => p.goalId === goal.id || p.goal_id === goal.id,
          );
          const enrichedProjects = goalProjects.map((p) => ({
            ...p,
            _stats: computeProjectStats(p, tasks),
          }));
          const totalTasks = enrichedProjects.reduce(
            (a, p) => a + p._stats.totalTasks,
            0,
          );
          const doneTasks = enrichedProjects.reduce(
            (a, p) => a + p._stats.doneTasks,
            0,
          );
          const progressPercent = enrichedProjects.length
            ? Math.round(
                enrichedProjects.reduce((a, p) => a + p._stats.progress, 0) /
                  enrichedProjects.length,
              )
            : Math.round((goal.progress || 0) * 100); // fallback ao valor salvo (0/100)

          return {
            ...goal,
            schedule,
            trimester: schedule.currentLabel, // posiciona no trimestre REAL de hoje (auto-avanço)
            areaLabel: area.label,
            progressPercent,
            totalTasks,
            doneTasks,
            status:
              progressPercent >= 100
                ? "Concluída"
                : progressPercent > 0
                  ? "Em progresso"
                  : "Não iniciada",
            objective: goal.target || "",
            projects: enrichedProjects,
          };
        });

      const progressPercent =
        areaGoals.length > 0
          ? Math.round(
              areaGoals.reduce((sum, g) => sum + (g.progressPercent || 0), 0) /
                areaGoals.length,
            )
          : 0;

      return {
        ...area,
        status: areaGoals.length > 0 ? "Ativo" : "Sem metas",
        northStar: areaGoals[0]?.title || "Nenhuma meta definida",
        progressPercent,
        review: "Review trimestral",
        metas: areaGoals,
      };
    });
  }, [goals, projects, tasks]);

  const selectedArea =
    LIFE_AREAS.find((area) => area.id === selectedAreaId) ?? null;

  useEffect(() => {
    return () => {
      if (emptyPulseTimerRef.current) {
        window.clearTimeout(emptyPulseTimerRef.current);
        emptyPulseTimerRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (loading) return;
    if (!selectedAreaId) return;

    const currentArea = LIFE_AREAS.find((area) => area.id === selectedAreaId);
    if (
      !currentArea ||
      !Array.isArray(currentArea.metas) ||
      currentArea.metas.length === 0
    ) {
      setSelectedAreaId(null);
    }
  }, [loading, selectedAreaId, LIFE_AREAS]);

  const pulseEmptyArea = (areaId) => {
    setEmptyAreaPulseId(areaId);
    if (emptyPulseTimerRef.current) {
      window.clearTimeout(emptyPulseTimerRef.current);
    }
    emptyPulseTimerRef.current = window.setTimeout(() => {
      setEmptyAreaPulseId(null);
      emptyPulseTimerRef.current = null;
    }, 320);
  };

  const handleCardSelect = (area) => {
    if (!area) return;
    if (loading) return;

    const metasCount = Array.isArray(area.metas) ? area.metas.length : 0;
    if (metasCount === 0) {
      pulseEmptyArea(area.id);
      return;
    }

    setSelectedAreaId(area.id);
  };

  const openNewDream = () => {
    setEditingDream(null);
    setDreamError("");
    setIsDreamModalOpen(true);
  };
  const openEditDream = (dream) => {
    setEditingDream(dream);
    setDreamError("");
    setIsDreamModalOpen(true);
  };
  const closeDreamModal = () => {
    setIsDreamModalOpen(false);
    setEditingDream(null);
  };

  const handleDreamSubmit = async (form, imageFile) => {
    if (dreamPending) return;
    setDreamPending(true);
    setDreamError("");
    try {
      if (editingDream) {
        await updateDreamMap(
          editingDream.id,
          { title: form.title, goalId: form.goalId || null },
          imageFile,
        );
      } else {
        await addDreamMap(form, imageFile);
      }
      closeDreamModal();
    } catch (error) {
      console.error("Erro ao salvar imagem:", error);
      setDreamError("Não conseguimos salvar a imagem. Tente novamente.");
    } finally {
      setDreamPending(false);
    }
  };

  const handleDeleteDream = async () => {
    if (!editingDream || dreamPending) return;
    setDreamPending(true);
    setDreamError("");
    try {
      await deleteDreamMap(editingDream.id);
      closeDreamModal();
    } catch (error) {
      console.error(error);
      setDreamError("Não conseguimos excluir a imagem. Tente novamente.");
    } finally {
      setDreamPending(false);
    }
  };

  const handleGoalSubmit = async (payload) => {
    try {
      const { projectId, ...goalData } = payload;
      let finalGoalId = editGoal ? editGoal.id : null;

      if (editGoal) {
        // Se estiver editando, removemos vínculos anteriores se o projeto mudou
        if (editGoal.projects && editGoal.projects.length > 0) {
          const oldProjectIds = editGoal.projects.map((p) => p.id);
          // Se escolheu um projeto diferente (ou nenhum), remove dos antigos
          if (!projectId || !oldProjectIds.includes(projectId)) {
            for (const p of editGoal.projects) {
              await updateProject(p.id, { goalId: null });
            }
          }
        }
        await updateGoal(editGoal.id, goalData);
      } else {
        const newGoal = await addGoal(goalData);
        if (newGoal) finalGoalId = newGoal.id;
      }

      // Se selecionou um projeto, vincula ele à meta
      if (finalGoalId && projectId) {
        await updateProject(projectId, { goalId: finalGoalId });
      }

      setIsGoalModalOpen(false);
      setEditGoal(null);
    } catch (error) {
      console.error(error);
      notify?.({
        title: "Não conseguimos salvar a meta.",
        tone: "danger",
        detail: "Tente novamente.",
      });
    }
  };

  const handleDeleteGoal = async () => {
    if (!editGoal || deletingGoal) return;
    setDeletingGoal(true);
    try {
      await deleteGoal(editGoal.id);
      setConfirmGoalDelete(false);
      setIsGoalModalOpen(false);
      setEditGoal(null);
      notify?.({ title: "Meta excluída" });
    } catch (error) {
      notify?.({
        title: "Não conseguimos excluir a meta.",
        tone: "danger",
        detail: "Tente novamente.",
      });
    } finally {
      setDeletingGoal(false);
    }
  };

  usePageActions({
    label: "Nova meta",
    onClick: () => {
      setGoalDefaultArea(null);
      setEditGoal(null);
      setIsGoalModalOpen(true);
    },
  });

  return (
    <div className="goalsPage">
      {confirmGoalDelete && editGoal && (
        <ConfirmModal
          className="goal-delete-modal"
          width={440}
          title="Excluir meta?"
          icon={Trash2}
          confirmIcon={Trash2}
          danger
          confirmLabel="Excluir meta"
          pending={deletingGoal}
          onCancel={() => setConfirmGoalDelete(false)}
          onConfirm={handleDeleteGoal}
          message="Os projetos ligados continuam existindo, só perdem o vínculo com a meta. Não dá para desfazer."
        >
          <div className="goal-delete-name">
            {prefs.hideFinanceValues
              ? editGoal.title.replace(
                  /R\$\s*[\d.,]+(?:\s*(?:mil|milhões?|mi))?/gi,
                  "R$ ••••",
                )
              : editGoal.title}
          </div>
        </ConfirmModal>
      )}

      {selectedArea ? (
        <AreaDetail
          area={selectedArea}
          onCreate={() => {
            setEditGoal(null);
            setIsGoalModalOpen(true);
          }}
          onViewDream={(dream) => setLightbox(dream)}
          mask={(value) =>
            prefs.hideFinanceValues
              ? String(value || "").replace(
                  /R\$\s*[\d.,]+(?:\s*(?:mil|milhões?|mi))?/gi,
                  "R$ ••••",
                )
              : value
          }
          onNavigate={onNavigate}
          onBack={() => setSelectedAreaId(null)}
          onEdit={(meta) => {
            setEditGoal(meta);
            setIsGoalModalOpen(true);
          }}
        />
      ) : (
        <GoalsPanel
          areas={LIFE_AREAS}
          stats={aggregateGoals(LIFE_AREAS.flatMap((area) => area.metas))}
          goals={goals}
          dreams={dreamMaps}
          onArea={handleCardSelect}
          onCreateGoal={(area) => {
            setGoalDefaultArea(area?.label || null);
            setEditGoal(null);
            setIsGoalModalOpen(true);
          }}
          onCreateDream={openNewDream}
          onEditDream={openEditDream}
          onViewDream={(dream) => setLightbox(dream)}
          onNavigate={onNavigate}
          mask={(value) =>
            prefs.hideFinanceValues
              ? String(value || "").replace(
                  /R\$\s*[\d.,]+(?:\s*(?:mil|milhões?|mi))?/gi,
                  "R$ ••••",
                )
              : value
          }
        />
      )}

      {isGoalModalOpen && (
        <CreateGoalModal
          open={isGoalModalOpen}
          onClose={() => {
            setIsGoalModalOpen(false);
            setEditGoal(null);
          }}
          onSubmit={handleGoalSubmit}
          onDelete={editGoal ? () => setConfirmGoalDelete(true) : undefined} // Passa a função de deletar apenas se for edição
          areaOptions={DEFAULT_LIFE_AREAS.map((area) => area.label)}
          projectOptions={projects}
          financeCategories={financeCategories}
          defaultArea={selectedArea?.label || goalDefaultArea}
          initialData={editGoal}
        />
      )}

      {isDreamModalOpen && (
        <DreamMapModal
          open={true}
          onClose={closeDreamModal}
          onSubmit={handleDreamSubmit}
          onDelete={editingDream ? handleDeleteDream : undefined}
          goals={goals}
          initialData={editingDream}
          pending={dreamPending}
          error={dreamError}
        />
      )}

      {lightbox && (
        <DreamLightbox
          dream={lightbox}
          goal={LIFE_AREAS.flatMap((area) => area.metas).find(
            (meta) => meta.id === (lightbox.goalId || lightbox.goal_id),
          )}
          onClose={() => setLightbox(null)}
          mask={(value) =>
            prefs.hideFinanceValues
              ? String(value || "").replace(
                  /R\$\s*[\d.,]+(?:\s*(?:mil|milhões?|mi))?/gi,
                  "R$ ••••",
                )
              : value
          }
        />
      )}
    </div>
  );
}
