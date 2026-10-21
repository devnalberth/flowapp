import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  Pencil,
  Archive,
  ArchiveRestore,
  Trash2,
  User,
  Flag,
  Target,
  CircleCheck,
  Clock,
  Play,
  Briefcase,
  Send,
  Bell,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { computeProjectStats } from "../../utils/projectMetrics";
import { projectColorToken } from "../../utils/projectAppearance";
import { categoryRevenue } from "../../components/FinanceGoalCard/FinanceGoalCard";
import HeroCard from "../../components/ui/HeroCard";
import KpiCard from "../../components/ui/KpiCard";
import ProgressBar from "../../components/ui/ProgressBar";
import StatusBadge from "../../components/ui/StatusBadge";
import CardHeader from "../../components/ui/CardHeader";
import EmptyState from "../../components/ui/EmptyState";
import Tabs from "../../components/ui/Tabs";
import { useMotionPresets } from "../../components/ui/motion";
import "./ProjectOverview.css";

const shortDate = (value) =>
  value
    ? new Date(`${String(value).slice(0, 10)}T00:00:00`)
        .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
        .replace(" de ", " ")
        .replace(".", "")
    : "—";
const money = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(value || 0);
const tidyDate = (value) =>
  value?.replaceAll(" de ", " ").replace(".", "") || "—";
const tabs = ["Visão geral", "Kanban", "Lista", "Calendário"].map(
  (label, i) => ({
    value: ["overview", "kanban", "list", "calendar"][i],
    label,
  }),
);

function InfoRow({ icon: Icon, label, value, accent = false, danger = false }) {
  return (
    <div className="project-info-row">
      <Icon size={16} strokeWidth={1.75} />
      <span>{label}</span>
      <strong className={accent ? "is-accent" : danger ? "is-danger" : ""}>
        {value}
      </strong>
    </div>
  );
}

export default function ProjectOverview({
  project,
  stats,
  client,
  goal,
  statusMeta,
  archived,
  start,
  end,
  remaining,
  startKey,
  endKey,
  onBack,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  onTab,
  onNavigate,
  mask = (value) => value,
}) {
  const presets = useMotionPresets();
  const { projects = [], tasks = [], finances = [], prefs = {} } = useApp();
  const now = new Date(),
    today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const dueToday = stats.projectTasks.filter(
    (t) =>
      !t.completed &&
      String(t.due_date || t.dueDate || "").slice(0, 10) === todayKey,
  );
  const latest = stats.projectTasks
    .filter((t) => t.completed)
    .map((t) => new Date(t.completed_at || t.completedAt || ""))
    .filter((d) => !Number.isNaN(d.getTime()))
    .sort((a, b) => b - a)[0];
  const time = useMemo(() => {
    if (!startKey || !endKey) return null;
    const startDate = new Date(`${startKey}T00:00:00`),
      endDate = new Date(`${endKey}T00:00:00`);
    const duration = Math.round((endDate - startDate) / 86400000);
    if (duration <= 0) return null;
    const elapsed = Math.max(0, Math.floor((today - startDate) / 86400000));
    return {
      duration,
      elapsed,
      percent: Math.min(100, Math.round((elapsed / duration) * 100)),
    };
  }, [startKey, endKey, todayKey]);
  const linkedGoal = useMemo(() => {
    if (!goal) return null;
    if (goal.financeCategory && Number(goal.financeTarget) > 0) {
      const month = todayKey.slice(0, 7);
      const transactions = finances.filter((t) => {
        const d = new Date(t.date);
        return (
          !Number.isNaN(d.getTime()) &&
          d.toISOString().slice(0, 10).startsWith(month)
        );
      });
      const revenue = categoryRevenue(transactions, goal.financeCategory);
      return {
        progress: Math.min(
          100,
          Math.round((revenue / Number(goal.financeTarget)) * 100),
        ),
        financial: true,
        revenue,
      };
    }
    const linked = projects.filter((p) => (p.goalId || p.goal_id) === goal.id);
    const progress = linked.length
      ? Math.round(
          linked.reduce(
            (sum, p) => sum + computeProjectStats(p, tasks).progress,
            0,
          ) / linked.length,
        )
      : Math.round((Number(goal.progress) || 0) * 100);
    return { progress, financial: false };
  }, [goal, projects, tasks, finances, todayKey]);
  const tone = archived
    ? "neutral"
    : { doing: "info", closing: "accent", done: "success" }[statusMeta.tone] ||
      "neutral";
  return (
    <motion.section
      className="project-overview"
      initial="hidden"
      animate="show"
      variants={presets.grid}
      style={{ "--project-color": projectColorToken(project.color) }}
    >
      <motion.header className="project-overview-header" variants={presets.row}>
        <button
          type="button"
          className="project-overview-back"
          onClick={onBack}
        >
          <ChevronLeft size={14} strokeWidth={1.75} />
          Projetos
        </button>
        <div className="project-overview-title">
          <i />
          <h1>{mask(project.title)}</h1>
        </div>
        <div className="project-overview-links">
          <StatusBadge tone={tone}>{statusMeta.label}</StatusBadge>
          <span>{project.area || "Sem área"}</span>
          {client && (
            <span>
              <User size={12} strokeWidth={1.75} />
              {mask(client.name)}
            </span>
          )}
          {goal && (
            <span className="is-goal">
              <Flag size={12} strokeWidth={1.75} />
              {mask(goal.title)}
            </span>
          )}
        </div>
        <div className="project-overview-actions">
          {!archived && (
            <button
              type="button"
              onClick={() => onEdit?.(project)}
              aria-label="Editar projeto"
            >
              <Pencil size={16} strokeWidth={1.75} />
            </button>
          )}
          <button
            type="button"
            onClick={() =>
              archived ? onRestore?.(project) : onArchive?.(project)
            }
            aria-label={archived ? "Restaurar projeto" : "Arquivar projeto"}
          >
            {archived ? (
              <ArchiveRestore size={16} strokeWidth={1.75} />
            ) : (
              <Archive size={16} strokeWidth={1.75} />
            )}
          </button>
          <button
            type="button"
            className="is-danger"
            onClick={() => onDelete?.(project)}
            aria-label="Excluir projeto"
          >
            <Trash2 size={16} strokeWidth={1.75} />
          </button>
        </div>
      </motion.header>
      <motion.div className="project-overview-summary" variants={presets.card}>
        <HeroCard className="project-overview-hero">
          <span className="project-eyebrow">ANDAMENTO</span>
          <div className="project-overview-number">
            <strong>{stats.progress}%</strong>
            <span>
              {stats.doneTasks} de {stats.totalTasks} tarefas · faltam{" "}
              {stats.pendingTasks}
            </span>
          </div>
          <ProgressBar value={stats.progress} label="Tarefas feitas" />
          <ProgressBar
            value={time?.percent || 0}
            label={`Tempo do projeto · ${shortDate(startKey)} → ${shortDate(endKey)}`}
            detail={
              time
                ? `${time.percent}% · dia ${time.elapsed} de ${time.duration}`
                : "Período não definido"
            }
            color="var(--fa-text-on-dark)"
          />
          {time && (
            <p className="project-overview-pace">
              <CircleCheck size={15} strokeWidth={1.75} />
              {stats.progress >= time.percent
                ? "No ritmo: o trabalho anda junto com o calendário."
                : "Revise as próximas tarefas para ajustar o ritmo."}
            </p>
          )}
        </HeroCard>
        <KpiCard
          label="Tarefas pendentes"
          value={stats.pendingTasks}
          variation={`${dueToday.length} hoje`}
          context={
            <span className="project-overview-kpi-context">
              {dueToday[0]
                ? mask(dueToday[0].title)
                : "tarefas abertas do projeto"}
            </span>
          }
          onAction={() => onTab("list")}
        />
        <KpiCard
          label="Concluídas"
          value={stats.doneTasks}
          variation={`de ${stats.totalTasks}`}
          context={
            latest
              ? `última ${shortDate(latest.toISOString())}`
              : "tarefas do projeto"
          }
          onAction={() => onTab("list")}
        />
        <KpiCard
          label={
            remaining != null && remaining < 0
              ? "Prazo ultrapassado"
              : "Dias restantes"
          }
          value={remaining == null ? "—" : Math.abs(remaining)}
          variation={shortDate(endKey)}
          context={
            remaining == null
              ? "defina um prazo na edição"
              : remaining < 0
                ? "dias após o prazo"
                : "prazo do projeto"
          }
          onAction={() => onTab("calendar")}
        />
        <KpiCard
          label="Conta para a meta"
          value={linkedGoal ? `${linkedGoal.progress}%` : "—"}
          variation={
            linkedGoal?.financial
              ? prefs.hideFinanceValues
                ? "R$ ••••"
                : money(linkedGoal.revenue)
              : goal
                ? "vinculada"
                : "sem vínculo"
          }
          context={
            <span className="project-overview-kpi-context">
              {goal ? mask(goal.title) : "edite para vincular uma meta"}
            </span>
          }
          onAction={goal ? () => onNavigate?.("Metas") : undefined}
        />
      </motion.div>
      <motion.div className="project-overview-tabs" variants={presets.card}>
        <Tabs
          options={tabs}
          value="overview"
          onChange={onTab}
          label="Visões do projeto"
        />
      </motion.div>
      <div className="project-overview-panels">
        <motion.article
          className="project-overview-card"
          variants={presets.card}
        >
          <CardHeader title="Detalhes" subtitle="Datas, área e vínculo" />
          <InfoRow icon={Play} label="Início" value={tidyDate(start)} />
          <InfoRow icon={Flag} label="Prazo de término" value={tidyDate(end)} />
          <InfoRow
            icon={Clock}
            label="Dias restantes"
            value={
              remaining == null
                ? "—"
                : remaining < 0
                  ? `${Math.abs(remaining)} dias de atraso`
                  : `${remaining} dias`
            }
            danger={remaining != null && remaining < 0}
          />
          <InfoRow icon={Briefcase} label="Área" value={project.area || "—"} />
          <InfoRow
            icon={Target}
            label="Meta vinculada"
            value={goal ? mask(goal.title) : "Sem meta"}
            accent={!!goal}
          />
        </motion.article>
        <motion.article
          className="project-overview-card"
          variants={presets.card}
        >
          <CardHeader
            title="Cliente"
            subtitle={
              client
                ? mask(client.company || client.name)
                : "Sem cliente vinculado"
            }
          />
          {client ? (
            <>
              <InfoRow icon={User} label="Nome" value={mask(client.name)} />
              {client.company && (
                <InfoRow
                  icon={Briefcase}
                  label="Empresa"
                  value={mask(client.company)}
                />
              )}{" "}
              {client.email && (
                <InfoRow icon={Send} label="E-mail" value={client.email} />
              )}{" "}
              {client.phone && (
                <InfoRow icon={Bell} label="Telefone" value={client.phone} />
              )}{" "}
              {client.notes && (
                <div className="project-client-notes">
                  <span>Notas</span>
                  <p>{mask(client.notes)}</p>
                </div>
              )}
            </>
          ) : (
            <EmptyState
              icon={User}
              title="Projeto sem cliente"
              description="Os dados do cliente vinculado aparecem aqui."
            />
          )}
        </motion.article>
      </div>
      {project.description && (
        <motion.article
          className="project-overview-card project-overview-description"
          variants={presets.card}
        >
          <CardHeader title="Descrição" subtitle="O que vai ser entregue" />
          <p>{mask(project.description)}</p>
        </motion.article>
      )}
    </motion.section>
  );
}
