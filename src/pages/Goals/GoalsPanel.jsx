import {
  ArrowUpRight,
  Briefcase,
  Heart,
  Wallet,
  GraduationCap,
  Plus,
  Eye,
  Pencil,
  Flag,
  Image,
} from "lucide-react";
import { motion } from "framer-motion";
import HeroCard from "../../components/ui/HeroCard";
import KpiCard from "../../components/ui/KpiCard";
import CardHeader from "../../components/ui/CardHeader";
import Button from "../../components/ui/Button";
import EmptyState from "../../components/ui/EmptyState";
import { useMotionPresets } from "../../components/ui/motion";
import { quarterDateRange, quarterOfMonth } from "../../utils/goalSchedule";
import "./GoalsPanel.css";

export const GOAL_AREA_META = {
  profissional: {
    Icon: Briefcase,
    color: "var(--fa-area-profissional)",
    background: "var(--fa-area-profissional-bg)",
  },
  pessoal: {
    Icon: Heart,
    color: "var(--fa-area-pessoal)",
    background: "var(--fa-area-pessoal-bg)",
  },
  financeiro: {
    Icon: Wallet,
    color: "var(--fa-area-financeiro)",
    background: "var(--fa-area-financeiro-bg)",
  },
  estudos: {
    Icon: GraduationCap,
    color: "var(--fa-area-estudos)",
    background: "var(--fa-area-estudos-bg)",
  },
};

export function GoalQuarterTimeline({ year = new Date().getFullYear() }) {
  const now = new Date(),
    current = quarterOfMonth(now.getMonth());
  const { start, end } = quarterDateRange(year, current);
  const elapsed = Math.min(
    100,
    Math.max(0, ((now - start) / (end - start)) * 100),
  );
  const remaining = Math.max(0, Math.ceil((end - now) / 86400000));
  return (
    <div className="goal-quarter-timeline">
      {[1, 2, 3, 4].map((q) => (
        <div key={q} className={q === current ? "is-current" : ""}>
          <div className="goal-quarter-time-track">
            <span
              style={{
                width: `${q < current ? 100 : q === current ? elapsed : 0}%`,
              }}
            />
          </div>
          <span>
            {q}º tri{" "}
            {q === current && <strong>agora · {remaining} dias</strong>}
          </span>
        </div>
      ))}
    </div>
  );
}

export function GoalDreamMap({
  dreams,
  goals,
  onCreate,
  onEdit,
  onView,
  mask = (value) => value,
}) {
  const presets = useMotionPresets();
  return (
    <motion.section className="goal-dream-map" variants={presets.card}>
      <CardHeader
        title="Mapa dos sonhos"
        subtitle="Visualize o que quer construir · cada imagem pode apontar para uma meta"
      >
        <Button variant="secondary" size="sm" icon={Plus} onClick={onCreate}>
          Adicionar imagem
        </Button>
      </CardHeader>
      {!dreams.length ? (
        <EmptyState
          icon={Image}
          title="Seu mapa está vazio"
          description="Adicione imagens do que você quer viver. Cada uma pode apontar para uma meta."
        />
      ) : (
        <div className="goal-dream-masonry">
          {dreams.map((dream, index) => {
            const goal = goals.find(
              (g) => g.id === (dream.goalId || dream.goal_id),
            );
            return (
              <motion.figure
                className="goal-dream-tile"
                key={dream.id}
                variants={presets.row}
                style={{
                  "--dream-ratio": `259 / ${[230, 150, 170, 210, 250, 130, 190, 190][index % 8]}`,
                }}
              >
                <img
                  src={dream.imageUrl || dream.image_url}
                  alt={mask(dream.title)}
                  loading="lazy"
                />
                <figcaption>
                  <strong>{mask(dream.title)}</strong>
                  <span>
                    {goal && <Flag size={12} strokeWidth={1.75} />}{" "}
                    {goal ? mask(goal.title) : "Sem meta"}
                  </span>
                </figcaption>
                <div className="goal-dream-actions">
                  <button
                    type="button"
                    aria-label={`Ver imagem ${mask(dream.title)}`}
                    onClick={() => onView(dream)}
                  >
                    <Eye size={14} strokeWidth={1.75} />
                  </button>
                  <button
                    type="button"
                    aria-label={`Editar imagem ${mask(dream.title)}`}
                    onClick={() => onEdit(dream)}
                  >
                    <Pencil size={14} strokeWidth={1.75} />
                  </button>
                </div>
              </motion.figure>
            );
          })}
        </div>
      )}
    </motion.section>
  );
}

export default function GoalsPanel({
  areas,
  stats,
  dreams,
  goals,
  onArea,
  onCreateGoal,
  onCreateDream,
  onEditDream,
  onViewDream,
  onNavigate,
  mask = (value) => value,
}) {
  const presets = useMotionPresets(),
    year = new Date().getFullYear(),
    currentQuarter = quarterOfMonth(new Date().getMonth());
  const all = areas.flatMap((area) => area.metas),
    maxQ = Math.max(1, ...stats.byQuarter);
  const completedProjects = all
    .flatMap((meta) => meta.projects || [])
    .filter((project) => project._stats?.autoStatus === "completed").length;
  const empty = stats.total === 0;
  return (
    <motion.div
      className={`goals-panel-redesign ${empty ? "is-empty" : ""}`}
      initial="hidden"
      animate="show"
      variants={presets.grid}
    >
      <motion.header className="goals-page-header" variants={presets.row}>
        <h1>Metas</h1>
        <p>
          Tudo gira em torno do que você quer construir. Projetos e tarefas
          alimentam cada meta.
        </p>
      </motion.header>
      <motion.div className="goals-overview-grid" variants={presets.card}>
        <HeroCard className="goals-panel-hero">
          <div className="goals-panel-hero-content">
            {empty ? (
              <>
                <span className="goal-eyebrow">METAS · {year}</span>
                <div className="goals-hero-number">
                  <strong>Comece pela meta norte</strong>
                </div>
                <p>
                  Uma meta por área já dá direção. Depois, ligue projetos a ela
                  e o progresso aparece sozinho.
                </p>
                <Button
                  variant="accent"
                  icon={Plus}
                  onClick={() => onCreateGoal()}
                >
                  Criar primeira meta
                </Button>
              </>
            ) : (
              <>
                <span className="goal-eyebrow">PAINEL DE METAS · {year}</span>
                <div className="goals-hero-number">
                  <strong>{stats.avgProgress}%</strong>
                  <span>
                    de progresso geral · {stats.total} metas, {stats.done}{" "}
                    concluídas
                  </span>
                </div>
                <GoalQuarterTimeline year={year} />
              </>
            )}
          </div>
        </HeroCard>
        <KpiCard
          label="Metas"
          value={stats.total}
          variation={empty ? String(year) : `${stats.done} concluídas`}
          context={
            empty ? "nenhuma meta ainda" : `${stats.inProgress} em progresso`
          }
        />
        <KpiCard
          label="Concluídas"
          value={empty ? "—" : stats.done}
          variation={empty ? "0" : `${stats.done} de ${stats.total}`}
          context={empty ? "aparece ao concluir" : "metas concluídas"}
        />
        <KpiCard
          label="Projetos ligados"
          value={empty ? "—" : stats.projects}
          variation={
            empty ? "0" : `${stats.projects - completedProjects} ativos`
          }
          context={
            empty
              ? "ligue projetos às metas"
              : `${completedProjects} encerrados`
          }
          onAction={() => onNavigate?.("Projetos")}
        />
        <KpiCard
          label="Tarefas das metas"
          value={empty ? "—" : `${stats.doneTasks} de ${stats.totalTasks}`}
          variation={`${stats.totalTasks ? Math.round((stats.doneTasks / stats.totalTasks) * 100) : 0}%`}
          context={empty ? "sem tarefas ligadas" : "concluídas"}
          onAction={() => onNavigate?.("Tarefas")}
        />
      </motion.div>
      <motion.div className="goals-area-grid" variants={presets.card}>
        {areas.map((area) => {
          const { Icon, color, background } = GOAL_AREA_META[area.id],
            done = area.metas.filter(
              (meta) => meta.progressPercent >= 100,
            ).length;
          return (
            <button
              type="button"
              className={`goal-area-card ${area.metas.length ? "" : "is-empty"}`}
              key={area.id}
              onClick={() =>
                area.metas.length ? onArea(area) : onCreateGoal(area)
              }
              style={{
                "--goal-area-color": color,
                "--goal-area-bg": background,
              }}
            >
              <span className="goal-area-card-title">
                <i>
                  <Icon size={20} strokeWidth={1.75} />
                </i>
                <span>
                  <small>ÁREA</small>
                  <strong>{area.label}</strong>
                </span>
                <span className="goal-open-icon">
                  <ArrowUpRight size={14} strokeWidth={1.75} />
                </span>
              </span>
              <span className="goal-area-north">
                <small>META NORTE</small>
                <strong>
                  {area.metas.length ? mask(area.northStar) : "Ainda sem meta"}
                </strong>
              </span>
              {area.metas.length ? (
                <>
                  <span className="goal-area-progress">
                    <span
                      role="progressbar"
                      aria-label={`Progresso em ${area.label}`}
                      aria-valuenow={area.progressPercent}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <i style={{ width: `${area.progressPercent}%` }} />
                    </span>
                    <strong>{area.progressPercent}%</strong>
                  </span>
                  <span className="goal-area-context">
                    {area.metas.length}{" "}
                    {area.metas.length === 1 ? "meta" : "metas"}
                    {done
                      ? ` · ${done} ${done === 1 ? "concluída" : "concluídas"}`
                      : ""}
                  </span>
                </>
              ) : (
                <span className="goal-area-create">
                  <Plus size={14} strokeWidth={1.75} />
                  Criar meta de {area.label}
                </span>
              )}
            </button>
          );
        })}
      </motion.div>
      {!empty && (
        <div className="goals-panel-charts">
          <motion.article className="goal-chart-card" variants={presets.card}>
            <CardHeader
              title="Metas por trimestre"
              subtitle={`Onde cada meta está agora · ${year}`}
            />
            <div className="goals-quarter-chart">
              {stats.byQuarter.map((count, index) => {
                const done = all.filter(
                  (meta) =>
                    meta.schedule?.currentQuarter === index + 1 &&
                    meta.progressPercent >= 100,
                ).length;
                return (
                  <div
                    key={index}
                    className={currentQuarter === index + 1 ? "is-current" : ""}
                  >
                    <strong>{count}</strong>
                    <span className="goals-quarter-chart-track">
                      <motion.span
                        initial={presets.reduce ? false : { scaleY: 0 }}
                        animate={{ scaleY: 1 }}
                        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                        style={{ height: `${(count / maxQ) * 100}%` }}
                      />
                    </span>
                    <small>
                      {index + 1}º tri
                      {currentQuarter === index + 1 ? " · agora" : ""}
                    </small>
                    <span>
                      {count
                        ? done === count
                          ? `${done} ${done === 1 ? "concluída" : "concluídas"}`
                          : `${count - done} em andamento`
                        : "nenhuma"}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.article>
          <motion.article className="goal-chart-card" variants={presets.card}>
            <CardHeader
              title="Progresso por área"
              subtitle="Média das metas de cada área"
            />
            <div className="goals-area-chart">
              {areas.map((area) => (
                <div
                  key={area.id}
                  style={{ "--goal-area-color": GOAL_AREA_META[area.id].color }}
                >
                  <div>
                    <i />
                    <span>{area.label}</span>
                    <small>
                      {area.metas.length}{" "}
                      {area.metas.length === 1 ? "meta" : "metas"}
                    </small>
                    <strong>{area.progressPercent}%</strong>
                  </div>
                  <span className="goals-area-chart-track">
                    <motion.span
                      initial={presets.reduce ? false : { scaleX: 0 }}
                      animate={{ scaleX: 1 }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      style={{ width: `${area.progressPercent}%` }}
                    />
                  </span>
                </div>
              ))}
            </div>
          </motion.article>
        </div>
      )}
      <GoalDreamMap
        dreams={dreams}
        goals={goals}
        onCreate={onCreateDream}
        onEdit={onEditDream}
        onView={onViewDream}
        mask={mask}
      />
    </motion.div>
  );
}
