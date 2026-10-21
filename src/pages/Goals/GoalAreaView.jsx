import { CalendarDays, Check, ChevronLeft, FolderKanban } from "lucide-react";
import { motion } from "framer-motion";
import HeroCard from "../../components/ui/HeroCard";
import KpiCard from "../../components/ui/KpiCard";
import ProgressRing from "../../components/ui/ProgressRing";
import CardHeader from "../../components/ui/CardHeader";
import StatusBadge from "../../components/ui/StatusBadge";
import { useMotionPresets } from "../../components/ui/motion";
import { quarterOfMonth } from "../../utils/goalSchedule";
import { GOAL_AREA_META } from "./GoalsPanel";
import "./GoalAreaView.css";

export default function GoalAreaView({
  area,
  stats,
  columns,
  onBack,
  onOpenMeta,
  onNavigate,
  mask = (value) => value,
}) {
  const presets = useMotionPresets(),
    { Icon, color, background } = GOAL_AREA_META[area.id],
    current = quarterOfMonth(new Date().getMonth());
  const completed = area.metas.filter((meta) => meta.progressPercent >= 100),
    firstDone = completed[0];
  const projects = area.metas.flatMap((meta) => meta.projects || []);
  const activeProjects = projects.filter(
    (project) => project._stats?.autoStatus !== "completed",
  );
  return (
    <motion.section
      className="goal-area-view"
      initial="hidden"
      animate="show"
      variants={presets.grid}
      style={{ "--goal-area-color": color, "--goal-area-bg": background }}
    >
      <motion.header className="goal-area-header" variants={presets.row}>
        <button type="button" onClick={onBack}>
          <ChevronLeft size={14} strokeWidth={1.75} />
          Todas as áreas
        </button>
        <h1>{area.label}</h1>
        <p>
          {area.id === "profissional"
            ? "Trabalho, clientes e a sua marca. Clique numa meta para ver o detalhe."
            : area.description}
        </p>
      </motion.header>
      <motion.div className="goals-overview-grid" variants={presets.card}>
        <HeroCard className="goals-panel-hero goal-area-hero">
          <div className="goal-area-hero-main">
            <div className="goal-area-hero-summary">
              <span className="goal-area-hero-label">
                <i>
                  <Icon size={16} strokeWidth={1.75} />
                </i>
                <span className="goal-eyebrow">
                  ÁREA · {area.label.toUpperCase()}
                </span>
              </span>
              <div className="goals-hero-number">
                <strong>{area.progressPercent}%</strong>
                <span>média das {area.metas.length} metas</span>
              </div>
              <div className="goal-area-hero-north">
                <span className="goal-eyebrow">META NORTE</span>
                <strong>{mask(area.northStar)}</strong>
              </div>
            </div>
            <ProgressRing
              size="lg"
              value={area.progressPercent}
              color={color}
              label={`Progresso da área ${area.label}`}
            />
          </div>
        </HeroCard>
        <KpiCard
          label="Metas da área"
          value={stats.total}
          variation={`${stats.done} ${stats.done === 1 ? "concluída" : "concluídas"}`}
          context={`${stats.inProgress} em progresso`}
        />
        <KpiCard
          label="Concluídas"
          value={stats.done}
          variation={
            firstDone
              ? `${firstDone.schedule.currentQuarter}º tri`
              : "Sem conclusões"
          }
          context={
            <span
              className="goal-kpi-context-text"
              title={firstDone ? mask(firstDone.title) : undefined}
            >
              {firstDone ? mask(firstDone.title) : "Siga no seu ritmo"}
            </span>
          }
          onAction={firstDone ? () => onOpenMeta(firstDone.id) : undefined}
        />
        <KpiCard
          label="Projetos ligados"
          value={stats.projects}
          variation={`${activeProjects.length} ${activeProjects.length === 1 ? "ativo" : "ativos"}`}
          context={
            <span
              className="goal-kpi-context-text"
              title={mask(activeProjects[0]?.title || "")}
            >
              {mask(activeProjects[0]?.title || "Sem projetos ativos")}
            </span>
          }
          onAction={() => onNavigate?.("Projetos")}
        />
        <KpiCard
          label="Tarefas das metas"
          value={`${stats.doneTasks} de ${stats.totalTasks}`}
          variation={`${stats.totalTasks ? Math.round((stats.doneTasks / stats.totalTasks) * 100) : 0}%`}
          context="concluídas"
          onAction={() => onNavigate?.("Tarefas")}
        />
      </motion.div>
      <motion.section className="goal-quarter-board" variants={presets.card}>
        <CardHeader
          title="Metas por trimestre"
          subtitle={`Cada meta fica no trimestre em que está agora · ${new Date().getFullYear()}`}
        />
        <div className="goal-quarter-columns">
          {columns.map((column, index) => (
            <section
              key={column.id}
              className={`goal-quarter-column ${index + 1 === current ? "is-current" : ""}`}
            >
              <header>
                <div>
                  <h3>{index + 1}º trimestre</h3>
                  <p>
                    {
                      ["jan – mar", "abr – jun", "jul – set", "out – dez"][
                        index
                      ]
                    }
                    {index + 1 === current ? " · agora" : ""}
                  </p>
                </div>
                <span>{column.metas.length}</span>
              </header>
              {!column.metas.length && (
                <div className="goal-quarter-empty">
                  Sem metas neste trimestre
                </div>
              )}
              {column.metas.map((meta) => {
                const done = meta.progressPercent >= 100,
                  project = meta.projects[0],
                  deadline = meta.schedule?.range?.end;
                return (
                  <motion.button
                    type="button"
                    className="goal-board-card"
                    key={meta.id}
                    onClick={() => onOpenMeta(meta.id)}
                    variants={presets.row}
                  >
                    <StatusBadge
                      tone={
                        done
                          ? "success"
                          : meta.progressPercent > 0
                            ? "accent"
                            : "neutral"
                      }
                      icon={done ? Check : undefined}
                    >
                      {meta.status}
                    </StatusBadge>
                    <strong>{mask(meta.title)}</strong>
                    <span className="goal-board-progress">
                      <span>
                        <i
                          style={{
                            width: `${meta.progressPercent}%`,
                            background: done
                              ? "var(--fa-progress-done)"
                              : color,
                          }}
                        />
                      </span>
                      <strong>{meta.progressPercent}%</strong>
                    </span>
                    <span className="goal-board-card-footer">
                      <span>
                        <FolderKanban size={12} strokeWidth={1.75} />
                        {project
                          ? `${mask(project.title)}${meta.projects.length > 1 ? ` +${meta.projects.length - 1}` : ""} · ${meta.doneTasks}/${meta.totalTasks} tarefas`
                          : "Sem projeto vinculado"}
                      </span>
                      {deadline && (
                        <span>
                          <CalendarDays size={12} strokeWidth={1.75} />
                          {new Date(deadline)
                            .toLocaleDateString("pt-BR", {
                              day: "numeric",
                              month: "short",
                            })
                            .replace(" de ", " ")
                            .replace(".", "")}
                          {!done && typeof meta.schedule.daysLeft === "number"
                            ? meta.schedule.daysLeft >= 0
                              ? ` · ${meta.schedule.daysLeft} dias`
                              : " · prazo encerrado"
                            : ""}
                        </span>
                      )}
                    </span>
                  </motion.button>
                );
              })}
            </section>
          ))}
        </div>
      </motion.section>
    </motion.section>
  );
}
