import { useMemo } from "react";
import { Clock } from "lucide-react";
import { motion } from "framer-motion";
import {
  computeProjectStats,
  PROJECT_STATUS_META,
} from "../../utils/projectMetrics";
import { projectColorToken } from "../../utils/projectAppearance";
import HeroCard from "../../components/ui/HeroCard";
import KpiCard from "../../components/ui/KpiCard";
import CardHeader from "../../components/ui/CardHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { useMotionPresets } from "../../components/ui/motion";
import "./ProjectsDashboard.css";

const STATUS_BAR = [
  { id: "todo", color: "var(--fa-text-muted)" },
  { id: "in_progress", color: "var(--fa-status-info-solid)" },
  { id: "review", color: "var(--fa-bg-accent)" },
  { id: "completed", color: "var(--fa-status-success-solid)" },
];

const dayMs = 86400000;

const daysLeft = (end) => {
  if (!end) return null;
  const d = new Date(`${String(end).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((d - today) / dayMs);
};

const fmtDeadline = (end) =>
  new Date(`${String(end).slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
  });

// Dashboard da galeria de projetos: KPIs, distribuição por status e prazos.
// Recebe apenas projetos ATIVOS (arquivados ficam fora das métricas).
export default function ProjectsDashboard({
  projects = [],
  tasks = [],
  onOpenProject,
  onNavigate,
  mask = (value) => value,
}) {
  const dash = useMemo(() => {
    const withStats = projects.map((p) => ({
      project: p,
      stats: computeProjectStats(p, tasks),
    }));

    const byStatus = { todo: 0, in_progress: 0, review: 0, completed: 0 };
    let pendingTasks = 0;
    let progressSum = 0;

    withStats.forEach(({ stats }) => {
      byStatus[stats.autoStatus] = (byStatus[stats.autoStatus] || 0) + 1;
      pendingTasks += stats.pendingTasks;
      progressSum += stats.progress;
    });

    const late = withStats.filter(({ project, stats }) => {
      const left = daysLeft(project.endDate || project.end_date);
      return left != null && left < 0 && stats.autoStatus !== "completed";
    }).length;

    const deadlines = withStats
      .map(({ project, stats }) => ({
        project,
        stats,
        left: daysLeft(project.endDate || project.end_date),
      }))
      .filter(
        ({ left, stats }) => left != null && stats.autoStatus !== "completed",
      )
      .sort((a, b) => a.left - b.left)
      .slice(0, 4);

    return {
      total: projects.length,
      inProgress: byStatus.in_progress + byStatus.review,
      completed: byStatus.completed,
      avgProgress: projects.length
        ? Math.round(progressSum / projects.length)
        : 0,
      pendingTasks,
      late,
      byStatus,
      deadlines,
    };
  }, [projects, tasks]);

  const presets = useMotionPresets();
  if (!projects.length) return null;
  const next = dash.deadlines[0];
  const completed = projects.filter(
    (p) => computeProjectStats(p, tasks).autoStatus === "completed",
  );
  const closing = projects.find(
    (p) => computeProjectStats(p, tasks).autoStatus === "review",
  );
  const today = new Date().toLocaleDateString("en-CA");
  const dueToday = projects
    .flatMap((p) => computeProjectStats(p, tasks).projectTasks)
    .filter(
      (t) =>
        !t.completed &&
        String(t.dueDate || t.due_date || "").slice(0, 10) === today,
    );
  return (
    <section className="project-summary" aria-label="Resumo dos projetos">
      <motion.div className="project-summary-grid" variants={presets.card}>
        <HeroCard className="project-summary-hero">
          <span className="project-eyebrow">
            PROJETOS ATIVOS · {dash.total}
          </span>
          <div className="project-summary-number">
            <strong>{dash.avgProgress}%</strong>
            <span>
              de progresso médio · {dash.pendingTasks} tarefas pendentes
            </span>
          </div>
          <div className="project-status-distribution">
            <div role="img" aria-label="Distribuição dos projetos por status">
              {STATUS_BAR.filter(({ id }) => dash.byStatus[id] > 0).map(
                ({ id, color }) => (
                  <motion.span
                    key={id}
                    style={{ flexGrow: dash.byStatus[id], background: color }}
                    title={`${PROJECT_STATUS_META[id].label}: ${dash.byStatus[id]}`}
                    initial={presets.reduce ? false : { scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  />
                ),
              )}
            </div>
            <ul>
              {STATUS_BAR.map(({ id, color }) => (
                <li key={id}>
                  <i style={{ background: color }} />
                  {PROJECT_STATUS_META[id].label}
                  <strong>{dash.byStatus[id]}</strong>
                </li>
              ))}
            </ul>
          </div>
          {next ? (
            <div className="project-next-deadline">
              <span>
                <Clock size={18} strokeWidth={1.75} />
              </span>
              <div>
                <strong>Próximo prazo: {mask(next.project.title)}</strong>
                <small>
                  {fmtDeadline(next.project.endDate || next.project.end_date)
                    .replace(" de ", " ")
                    .replace(".", "")}{" "}
                  ·{" "}
                  {next.left < 0
                    ? `${Math.abs(next.left)} dias de atraso`
                    : `${next.left} dias`}{" "}
                  · {next.stats.progress}% feito, {next.stats.pendingTasks}{" "}
                  tarefas abertas
                </small>
              </div>
              <Button
                variant="accent"
                size="sm"
                onClick={() => onOpenProject?.(next.project.id)}
              >
                Abrir
              </Button>
            </div>
          ) : (
            <p className="project-no-deadline">
              Nenhum projeto pendente com prazo definido.
            </p>
          )}
        </HeroCard>
        <KpiCard
          label="Em andamento"
          value={dash.inProgress}
          variation={`${dash.byStatus.review} finalizando`}
          context={
            <span className="project-kpi-context">
              {closing ? mask(closing.title) : "projetos em progresso"}
            </span>
          }
        />
        <KpiCard
          label="Concluídos"
          value={dash.completed}
          variation={`${dash.completed} projetos`}
          context={
            <span className="project-kpi-context">
              {completed.map((p) => mask(p.title)).join(" e ") ||
                "nenhum concluído"}
            </span>
          }
        />
        <KpiCard
          label="Tarefas pendentes"
          value={dash.pendingTasks}
          variation={`${dueToday.length} para hoje`}
          context={
            <span className="project-kpi-context">
              {dueToday[0] ? mask(dueToday[0].title) : "nos projetos ativos"}
            </span>
          }
          onAction={() => onNavigate?.("Tarefas")}
        />
        <KpiCard
          label="Atrasados"
          value={dash.late}
          variation={dash.late ? "revisar prazos" : "em dia"}
          context={dash.late ? "projetos pendentes" : "nenhum prazo estourado"}
        />
      </motion.div>
      <motion.article className="project-deadlines" variants={presets.card}>
        <CardHeader
          title="Próximos prazos"
          subtitle="Projetos não concluídos, do mais perto ao mais longe"
        />
        {!dash.deadlines.length ? (
          <EmptyState
            title="Nenhum prazo pendente"
            description="Os projetos com prazo definido aparecem aqui."
          />
        ) : (
          <div>
            {dash.deadlines.map(({ project, left }) => (
              <motion.button
                type="button"
                key={project.id}
                onClick={() => onOpenProject?.(project.id)}
                variants={presets.row}
                style={{ "--project-color": projectColorToken(project.color) }}
              >
                <i />
                <span>
                  <strong>{mask(project.title)}</strong>
                  <small>
                    {fmtDeadline(project.endDate || project.end_date)
                      .replace(" de ", " ")
                      .replace(".", "")}
                  </small>
                </span>
                <small
                  className={`project-deadline-pill ${left < 0 ? "is-late" : left <= 10 ? "is-soon" : ""}`}
                >
                  {left < 0
                    ? `${Math.abs(left)}d atraso`
                    : left === 0
                      ? "hoje"
                      : `${left} dias`}
                </small>
              </motion.button>
            ))}
          </div>
        )}
      </motion.article>
    </section>
  );
}
