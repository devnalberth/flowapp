import { useMemo } from "react";
import {
  ArrowUpRight,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Circle,
  Pencil,
  Plus,
  Trophy,
} from "lucide-react";
import { motion } from "framer-motion";
import { useApp } from "../../context/AppContext";
import HeroCard from "../../components/ui/HeroCard";
import HeroCelebration from "../../components/ui/HeroCelebration";
import KpiCard from "../../components/ui/KpiCard";
import ProgressRing from "../../components/ui/ProgressRing";
import CardHeader from "../../components/ui/CardHeader";
import Button from "../../components/ui/Button";
import Banner from "../../components/ui/Banner";
import EmptyState from "../../components/ui/EmptyState";
import PriorityTag from "../../components/ui/PriorityTag";
import { useMotionPresets } from "../../components/ui/motion";
import { categoryRevenue } from "../../components/FinanceGoalCard/FinanceGoalCard";
import { normalizeTaskStatus } from "../../utils/taskStatus";
import { GOAL_AREA_META } from "./GoalsPanel";
import "./GoalDetailView.css";

const currency = (value) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
const shortDate = (value) =>
  value
    ? new Date(value)
        .toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })
        .replace(" de ", " ")
        .replace(".", "")
    : "";
const typeLabels = {
  trimestral: "Trimestral",
  semestral: "Semestral",
  anual: "Anual",
  custom: "Personalizada",
};

export default function GoalDetailView({
  meta,
  onBack,
  onEdit,
  onNavigate,
  onViewDream,
  onCreate,
  mask = (value) => value,
}) {
  const {
    finances = [],
    financeCategories = [],
    dreamMaps = [],
    prefs = {},
  } = useApp();
  const presets = useMotionPresets(),
    now = new Date();
  const money = (value) =>
    prefs.hideFinanceValues ? "R$ ••••" : currency(value);
  const areaId =
    Object.keys(GOAL_AREA_META).find(
      (id) => id === String(meta.area || "").toLowerCase(),
    ) || "profissional";
  const color = GOAL_AREA_META[areaId].color,
    schedule = meta.schedule,
    projects = meta.projects || [];
  const financial = !!meta.financeCategory && Number(meta.financeTarget) > 0;
  const category = financeCategories.find(
    (cat) =>
      cat.slug === meta.financeCategory || cat.id === meta.financeCategory,
  );
  const revenue = useMemo(
    () =>
      Array.from({ length: 4 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - 3 + index, 1);
        const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
        const transactions = finances.filter((t) => {
          const date = new Date(t.date);
          return (
            !Number.isNaN(date.getTime()) &&
            date.toISOString().slice(0, 10).startsWith(key)
          );
        });
        return {
          key,
          date,
          label: date
            .toLocaleDateString("pt-BR", { month: "short" })
            .replace(".", ""),
          value: categoryRevenue(transactions, meta.financeCategory),
        };
      }),
    [finances, meta.financeCategory, now.getFullYear(), now.getMonth()],
  );
  const currentRevenue = revenue[3].value,
    target = Number(meta.financeTarget) || 0;
  const percent = financial
    ? Math.min(100, Math.round((currentRevenue / target) * 100))
    : meta.progressPercent || 0;
  const complete = !financial && percent >= 100;
  const openTasks = projects
    .flatMap((project) =>
      (project._stats?.projectTasks || [])
        .filter(
          (task) => !task.completed && normalizeTaskStatus(task) !== "done",
        )
        .map((task) => ({ ...task, projectTitle: project.title })),
    )
    .filter(
      (task, index, list) => list.findIndex((t) => t.id === task.id) === index,
    );
  const sortedTasks = [...openTasks].sort((a, b) => {
    const ad = a.due_date || a.dueDate,
      bd = b.due_date || b.dueDate;
    return (
      (ad ? new Date(ad).getTime() : Infinity) -
      (bd ? new Date(bd).getTime() : Infinity)
    );
  });
  const dreams = dreamMaps.filter(
    (dream) => (dream.goalId || dream.goal_id) === meta.id,
  );
  const averageProjects = projects.length
    ? Math.round(
        projects.reduce((sum, p) => sum + (p._stats?.progress || 0), 0) /
          projects.length,
      )
    : 0;
  const maxRevenue = Math.max(
      target * 1.2,
      1,
      ...revenue.map((month) => month.value),
    ),
    previous = revenue.slice(0, 3),
    averageRevenue = previous.reduce((sum, month) => sum + month.value, 0) / 3;
  const reached = previous
    .filter((month) => month.value >= target && target > 0)
    .at(-1);
  const monthLabel = now.toLocaleDateString("pt-BR", { month: "long" }),
    status =
      percent >= 100
        ? "Concluída"
        : percent > 0
          ? "Em progresso"
          : "Não iniciada";
  const heroSummary = (
    <div className="goal-detail-hero-summary">
      <div>
        <div className="goal-detail-tags">
          <span className={percent >= 100 ? "is-done" : ""}>{status}</span>
          <span style={{ background: color }}>{meta.areaLabel}</span>
          <span>
            {typeLabels[meta.type] || "Meta"} · {schedule?.year}
          </span>
        </div>
        <div className="goals-hero-number">
          <strong>
            {financial
              ? money(currentRevenue)
              : complete
                ? "Meta batida"
                : `${percent}%`}
          </strong>
          <span>
            {financial
              ? `de ${money(target)} em ${monthLabel}`
              : complete
                ? ""
                : "de progresso nos projetos"}
          </span>
        </div>
        <p>
          {financial
            ? currentRevenue >= target
              ? "Alvo do mês alcançado."
              : `Faltam ${money(target - currentRevenue)} até ${new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()} de ${monthLabel}.`
            : `${meta.doneTasks || 0} de ${meta.totalTasks || 0} tarefas concluídas.${complete ? " Bora para a próxima." : ""}`}
        </p>
      </div>
      <ProgressRing
        size="lg"
        value={percent}
        color={
          complete
            ? "var(--fa-status-success-solid)"
            : financial
              ? undefined
              : color
        }
        label="Progresso da meta"
      />
    </div>
  );
  const Hero = complete ? HeroCelebration : HeroCard;
  return (
    <motion.section
      className={`goal-detail-view ${financial ? "is-financial" : ""} ${complete ? "is-complete" : ""}`}
      initial="hidden"
      animate="show"
      variants={presets.grid}
      style={{ "--goal-area-color": color }}
    >
      <motion.header
        className="goal-area-header goal-detail-header"
        variants={presets.row}
      >
        <button type="button" onClick={onBack}>
          <ChevronLeft size={14} strokeWidth={1.75} />
          {meta.areaLabel}
        </button>
        <h1>{mask(meta.title)}</h1>
        <p>
          {financial
            ? `Meta financeira ${typeLabels[meta.type]?.toLowerCase() || ""} · acompanhada pelas receitas de “${category?.name || meta.financeCategory}” no mês`
            : `${typeLabels[meta.type] || "Meta"} · ${complete ? "concluída pelos projetos vinculados" : "progresso dos projetos vinculados"}`}
        </p>
        <Button variant="secondary" icon={Pencil} onClick={onEdit}>
          Editar meta
        </Button>
      </motion.header>
      <motion.div className="goals-overview-grid" variants={presets.card}>
        <Hero
          className="goals-panel-hero goal-detail-hero"
          {...(complete ? { summary: heroSummary } : {})}
        >
          <div className="goal-detail-hero-content">
            {!complete && heroSummary}
            <div className="goal-detail-trajectory">
              <div>
                <span>TRAJETÓRIA {schedule?.year}</span>
                <small>
                  <CalendarDays size={12} strokeWidth={1.75} />
                  {shortDate(schedule?.range?.start)} →{" "}
                  {shortDate(schedule?.range?.end)}
                  {typeof schedule?.daysLeft === "number"
                    ? ` · ${complete ? "concluída" : schedule.daysLeft >= 0 ? `${schedule.daysLeft} dias restantes` : "prazo encerrado"}`
                    : ""}
                </small>
              </div>
              <div className="goal-detail-quarters">
                {[1, 2, 3, 4].map((q) => (
                  <div
                    className={`${q === Math.floor(now.getMonth() / 3) + 1 ? "is-now" : ""} ${q === schedule?.currentQuarter ? (complete ? "is-finished" : "is-current") : ""} ${q >= schedule?.startQuarter && q <= schedule?.endQuarter ? "in-range" : ""}`}
                    key={q}
                  >
                    <span />
                    <small>
                      {q}º tri
                      {complete && q === schedule?.currentQuarter
                        ? " · concluída"
                        : q === Math.floor(now.getMonth() / 3) + 1
                          ? " · agora"
                          : ""}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Hero>
        <KpiCard
          label="Projetos ligados"
          value={projects.length}
          variation={`${averageProjects}%`}
          context="média de andamento"
          onAction={() => onNavigate?.("Projetos")}
        />
        <KpiCard
          label="Tarefas dos projetos"
          value={`${meta.doneTasks || 0} de ${meta.totalTasks || 0}`}
          variation={complete ? "todas" : `${openTasks.length} abertas`}
          context={complete ? "concluídas" : "nos projetos vinculados"}
          onAction={() => onNavigate?.("Tarefas")}
        />
        <KpiCard
          label="No mapa dos sonhos"
          value={dreams.length}
          variation={dreams.length === 1 ? "imagem" : "imagens"}
          context={
            <span
              className="goal-kpi-context-text"
              title={dreams[0] ? mask(dreams[0].title) : undefined}
            >
              {dreams[0] ? mask(dreams[0].title) : "Sem imagem ligada"}
            </span>
          }
          onAction={dreams[0] ? () => onViewDream(dreams[0]) : undefined}
        />
        <KpiCard
          label="Progresso dos projetos"
          value={`${averageProjects}%`}
          variation={`${projects.length} ${projects.length === 1 ? "projeto" : "projetos"}`}
          context="andamento das tarefas"
        />
      </motion.div>
      <div className="goal-detail-middle">
        {financial && (
          <motion.article
            className="goal-detail-card goal-revenue-card"
            variants={presets.card}
          >
            <CardHeader
              title="Receita da categoria"
              subtitle={`${category?.name || meta.financeCategory} · alvo de ${money(target)} por mês`}
            />
            <div className="goal-revenue-chart">
              <div
                className="goal-revenue-target"
                style={{ bottom: `${40 + (170 * target) / maxRevenue}px` }}
              >
                <span>alvo {money(target)}</span>
              </div>
              {revenue.map((month, index) => (
                <div
                  className={`goal-revenue-month ${index === 3 ? "is-current" : ""} ${month.value >= target ? "is-reached" : ""}`}
                  key={month.key}
                >
                  <div>
                    <strong
                      style={{ bottom: `${(month.value / maxRevenue) * 100}%` }}
                    >
                      {money(month.value)}
                    </strong>
                    <motion.span
                      initial={presets.reduce ? false : { scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      style={{ height: `${(month.value / maxRevenue) * 100}%` }}
                    />
                  </div>
                  <small>
                    {month.label}
                    {index === 3 ? " · até hoje" : ""}
                  </small>
                </div>
              ))}
            </div>
            <div className={`goal-revenue-note ${reached ? "is-success" : ""}`}>
              <Trophy size={16} strokeWidth={1.75} />
              <span>
                {reached
                  ? `${reached.date.toLocaleDateString("pt-BR", { month: "long" })} bateu o alvo: ${money(reached.value)}. `
                  : ""}
                Média dos 3 meses anteriores: {money(averageRevenue)}.
              </span>
            </div>
          </motion.article>
        )}
        <div className="goal-detail-side">
          <motion.article
            className="goal-detail-card goal-objective-card"
            variants={presets.card}
          >
            <CardHeader title="Objetivo" subtitle="Por que esta meta importa" />
            <p>{mask(meta.objective || "Sem descrição definida.")}</p>
          </motion.article>
          <motion.article
            className="goal-detail-card goal-linked-dreams"
            variants={presets.card}
          >
            <CardHeader
              title="No mapa dos sonhos"
              subtitle={`${dreams.length} ${dreams.length === 1 ? "imagem ligada" : "imagens ligadas"}`}
            />
            {dreams.length ? (
              <div>
                {dreams.map((dream) => (
                  <button
                    type="button"
                    key={dream.id}
                    onClick={() => onViewDream(dream)}
                  >
                    <img
                      src={dream.imageUrl || dream.image_url}
                      alt={mask(dream.title)}
                    />
                    <span>{mask(dream.title)}</span>
                  </button>
                ))}
              </div>
            ) : (
              <EmptyState
                title="Sem imagem ligada"
                description="As imagens associadas a esta meta aparecem aqui."
              />
            )}
          </motion.article>
        </div>
      </div>
      {complete && (
        <motion.article
          className="goal-detail-card goal-next-step"
          variants={presets.card}
        >
          <CardHeader title="E agora?" subtitle="Meta batida vira degrau" />
          <p>Uma nova meta de {meta.areaLabel} mantém a área andando.</p>
          <Button variant="accent" icon={Plus} onClick={onCreate}>
            Criar meta de {meta.areaLabel}
          </Button>
        </motion.article>
      )}
      <div className="goal-detail-bottom">
        <motion.article
          className="goal-detail-card goal-linked-projects"
          variants={presets.card}
        >
          <CardHeader
            title="Projetos vinculados"
            subtitle={`${projects.length} projetos · clique para abrir em Projetos`}
          />
          {!projects.length && (
            <EmptyState
              title="Nenhum projeto vinculado"
              description="Edite a meta para vincular um projeto."
            />
          )}
          {projects.map((project) => {
            const stats = project._stats || {
              progress: 0,
              totalTasks: 0,
              doneTasks: 0,
            };
            return (
              <button
                type="button"
                className="goal-linked-project"
                key={project.id}
                onClick={() => onNavigate?.("Projetos")}
              >
                <i />
                <div>
                  <div>
                    <strong>{mask(project.title)}</strong>
                    <small>
                      {stats.doneTasks}/{stats.totalTasks} tarefas
                    </small>
                  </div>
                  <span>
                    <i style={{ width: `${stats.progress}%` }} />
                  </span>
                </div>
                <strong>{stats.progress}%</strong>
                <span className="goal-open-icon">
                  <ArrowUpRight size={14} strokeWidth={1.75} />
                </span>
              </button>
            );
          })}
          {financial && (
            <Banner tone="info">
              Nesta meta financeira, a receita da categoria é exibida no herói.
              Os projetos mostram o trabalho ligado à meta.
            </Banner>
          )}
          <button type="button" className="goal-inline-link" onClick={onEdit}>
            <Plus size={14} strokeWidth={1.75} />
            Editar vínculo de projeto
          </button>
        </motion.article>
        <motion.article
          className="goal-detail-card goal-upcoming-tasks"
          variants={presets.card}
        >
          <CardHeader
            title="Próximas tarefas"
            subtitle={`Abertas nos projetos desta meta · ${openTasks.length}`}
          />
          {!sortedTasks.length && (
            <EmptyState
              title="Nenhuma tarefa aberta"
              description="As tarefas dos projetos vinculados aparecem aqui."
            />
          )}
          {sortedTasks.slice(0, 4).map((task) => (
            <button
              type="button"
              className="goal-upcoming-task"
              key={task.id}
              onClick={() => onNavigate?.("Tarefas")}
              aria-label={`Abrir em Tarefas: ${mask(task.title)}`}
            >
              <Circle size={22} strokeWidth={1.5} />
              <span>
                <strong>{mask(task.title)}</strong>
                <small>
                  {mask(task.projectTitle)}
                  {task.due_date || task.dueDate
                    ? ` · ${shortDate(task.due_date || task.dueDate)}`
                    : ""}
                </small>
              </span>
              <PriorityTag priority={task.priority || "Normal"} />
            </button>
          ))}
          {openTasks.length > 0 && (
            <button
              type="button"
              className="goal-inline-link is-accent"
              onClick={() => onNavigate?.("Tarefas")}
            >
              Ver as {openTasks.length} em Tarefas
              <ChevronRight size={14} strokeWidth={1.75} />
            </button>
          )}
        </motion.article>
      </div>
    </motion.section>
  );
}
