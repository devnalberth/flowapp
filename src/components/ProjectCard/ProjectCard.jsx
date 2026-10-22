import { useMemo } from "react";
import {
  ListChecks,
  CalendarDays,
  User,
  Flag,
  Ellipsis,
  Pencil,
  Archive,
  ArchiveRestore,
  RotateCcw,
  Trash2,
  CircleCheck,
  Circle,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  computeProjectStats,
  isArchivedProject,
  PROJECT_STATUS_META,
} from "../../utils/projectMetrics";
import { projectColorToken } from "../../utils/projectAppearance";
import Button from "../ui/Button";
import ProgressRing from "../ui/ProgressRing";
import StatusBadge from "../ui/StatusBadge";
import ActionMenu from "../ui/ActionMenu";
import { useMotionPresets } from "../ui/motion";
import "./ProjectCard.css";

const formatDate = (value) => {
  if (!value) return null;
  const d = new Date(`${String(value).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

const daysLeft = (end) => {
  if (!end) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(`${String(end).slice(0, 10)}T00:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  return Math.round((d - today) / 86400000);
};

export default function ProjectCard({
  project,
  tasks = [],
  client,
  goal,
  onOpen,
  index = 0,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  mask = (value) => value,
}) {
  const stats = useMemo(
    () => computeProjectStats(project, tasks),
    [project, tasks],
  );
  const archived = isArchivedProject(project),
    color = archived
      ? "var(--fa-text-muted)"
      : projectColorToken(project.color);
  const statusMeta = archived
    ? PROJECT_STATUS_META.archived
    : PROJECT_STATUS_META[stats.autoStatus] || PROJECT_STATUS_META.todo;
  const start = formatDate(project.startDate || project.start_date)
      ?.replace(" de ", " ")
      .replace(".", ""),
    end = formatDate(project.endDate || project.end_date)
      ?.replace(" de ", " ")
      .replace(".", "");
  const remaining = daysLeft(project.endDate || project.end_date),
    presets = useMotionPresets();
  const tone = archived
    ? "neutral"
    : { doing: "info", closing: "accent", done: "success" }[statusMeta.tone] ||
      "neutral";
  const items = [
    ...(!archived
      ? [
          {
            label: "Editar projeto",
            icon: Pencil,
            onClick: () => onEdit?.(project),
          },
        ]
      : []),
    {
      label: archived ? "Restaurar" : "Arquivar",
      icon: archived ? ArchiveRestore : Archive,
      onClick: () => (archived ? onRestore?.(project) : onArchive?.(project)),
    },
    { separator: true },
    {
      label: "Excluir projeto",
      icon: Trash2,
      danger: true,
      onClick: () => onDelete?.(project),
    },
  ];
  return (
    <motion.article
      className={`project-tile ${archived ? "is-archived" : ""}`}
      style={{ "--project-color": color }}
      data-status={archived ? "archived" : stats.autoStatus}
      variants={presets.card}
    >
      <header>
        <i />
        <span>{project.area || "Outros"}</span>
        <StatusBadge
          tone={tone}
          icon={
            stats.autoStatus === "completed" && !archived
              ? CircleCheck
              : undefined
          }
        >
          {statusMeta.label}
        </StatusBadge>
        <ActionMenu
          className="project-actions-menu"
          label={`Ações do projeto ${mask(project.title)}`}
          trigger={
            <button
              type="button"
              className="project-tile-menu"
              aria-label={`Ações do projeto ${mask(project.title)}`}
            >
              <Ellipsis size={14} strokeWidth={1.75} />
            </button>
          }
          items={items}
        />
      </header>
      <button
        type="button"
        className="project-tile-main"
        onClick={() => onOpen?.(project)}
        aria-label={`Abrir projeto ${mask(project.title)}`}
      >
        <h3>{mask(project.title)}</h3>
        <span className="project-tile-links">
          {client && (
            <span>
              <User size={11} strokeWidth={1.75} />
              {mask(client.name)}
            </span>
          )}
          {goal && (
            <span className="is-goal">
              <Flag size={11} strokeWidth={1.75} />
              {mask(goal.title)}
            </span>
          )}
        </span>
        <span className="project-tile-body">
          <ProgressRing
            value={stats.progress}
            size="md"
            color={color}
            label={`Progresso de ${mask(project.title)}`}
          />
          <span>
            <span>
              <ListChecks size={13} strokeWidth={1.75} />
              {stats.totalTasks} tarefas
            </span>
            <span>
              <CircleCheck size={13} strokeWidth={1.75} />
              {stats.doneTasks} concluídas
            </span>
            <span>
              <Circle size={13} strokeWidth={1.75} />
              {stats.pendingTasks} pendentes
            </span>
          </span>
        </span>
        {!archived && (start || end) && (
          <span className="project-tile-dates">
            <CalendarDays size={13} strokeWidth={1.75} />
            <span>
              {start || "—"} {end ? `→ ${end}` : ""}
            </span>
            {typeof remaining === "number" &&
              !archived &&
              stats.autoStatus !== "completed" && (
                <small
                  className={`project-deadline-pill ${remaining < 0 ? "is-late" : remaining <= 10 ? "is-soon" : ""}`}
                >
                  {remaining < 0
                    ? `${Math.abs(remaining)}d atraso`
                    : remaining === 0
                      ? "hoje"
                      : `${remaining} dias`}
                </small>
              )}
            {stats.autoStatus === "completed" && !archived && (
              <small className="project-tile-complete">concluído</small>
            )}
          </span>
        )}
      </button>
      {archived && (
        <footer className="project-tile-dates">
          <CalendarDays size={13} strokeWidth={1.75} />
          <span>
            {start || "—"} {end ? `→ ${end}` : ""}
          </span>
          <Button
            variant="secondary"
            size="sm"
            icon={RotateCcw}
            onClick={() => onRestore?.(project)}
          >
            Restaurar
          </Button>
        </footer>
      )}
    </motion.article>
  );
}
