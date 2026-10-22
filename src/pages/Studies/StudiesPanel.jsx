import { motion } from "framer-motion";
import {
  BookOpen,
  GraduationCap,
  Book,
  Compass,
  Play,
  CalendarDays,
  CalendarClock,
  ListChecks,
} from "lucide-react";
import HeroCard from "../../components/ui/HeroCard";
import KpiCard from "../../components/ui/KpiCard";
import CardHeader from "../../components/ui/CardHeader";
import ProgressRing from "../../components/ui/ProgressRing";
import ProgressBar from "../../components/ui/ProgressBar";
import FilterPill from "../../components/ui/FilterPill";
import StatusBadge from "../../components/ui/StatusBadge";
import Button from "../../components/ui/Button";
import StudyEmptyState from "./StudyEmptyState";
import EmptyState from "../../components/ui/EmptyState";
import { useMotionPresets } from "../../components/ui/motion";
import {
  studyOverview,
  deriveStudyStatus,
  STUDY_STATUS_META,
} from "../../utils/studyMetrics";
import "./StudiesPanel.css";

const TYPES = {
  COURSE: {
    label: "Curso",
    plural: "Cursos",
    icon: BookOpen,
    color: "brasa",
    asset: "course",
  },
  UNIVERSITY: {
    label: "Faculdade",
    plural: "Faculdade",
    icon: GraduationCap,
    color: "violeta",
    asset: "university",
  },
  BOOK: {
    label: "Livro",
    plural: "Livros",
    icon: Book,
    color: "verde",
    asset: "book",
  },
  MENTORSHIP: {
    label: "Mentoria",
    plural: "Mentorias",
    icon: Compass,
    color: "ciano",
    asset: "mentorship",
  },
};
const typeMeta = (value) => TYPES[value] || TYPES.COURSE;
const date = (value) => new Date(`${String(value).slice(0, 10)}T00:00:00`);
const schedule = (item) =>
  `${date(item.scheduledDate).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}, ${date(item.scheduledDate).getDate()}${item.scheduledTime ? ` · ${item.scheduledTime.slice(0, 5)}` : ""}`;
const tone = (status) =>
  ({ COMPLETED: "success", IN_PROGRESS: "info", PAUSED: "warning" })[status] ||
  "neutral";
const unit = (study, ov) =>
  ov.blockUnits
    ? "itens"
    : study.type === "BOOK"
      ? "capítulos"
      : study.type === "MENTORSHIP"
        ? "encontros"
        : "aulas";

export default function StudiesPanel({
  studies,
  agg,
  filteredStudies,
  statusFilter,
  typeFilter,
  statusFilters,
  typeFilters,
  onStatusChange,
  onTypeChange,
  onOpen,
  onCreate,
  onNavigate,
  loading,
}) {
  const presets = useMotionPresets();
  const next = agg.upcoming[0];
  const nextStudy = next && studies.find((s) => s.id === next.studyId);
  const nextOverview = nextStudy && studyOverview(nextStudy);
  const completedStudy = agg.studyCards.find(
    ({ overview }) => overview.status === "COMPLETED",
  );
  const clear = () => {
    onStatusChange("ALL");
    onTypeChange("ALL");
  };
  const studyNow = () =>
    onNavigate?.("Tarefas", {
      initialFilter: "flow",
      studyTarget: {
        id: next.id,
        title: next.title,
        studyTitle: next.studyTitle || null,
      },
    });
  return (
    <motion.section
      className="studies-hub"
      initial="hidden"
      animate="show"
      variants={presets.grid}
    >
      <motion.header className="studies-hub-header" variants={presets.row}>
        <h1>Estudos</h1>
        <p>
          Cursos, faculdade, mentorias e livros. O progresso vem do conteúdo que
          você conclui.
        </p>
      </motion.header>
      {loading ? (
        <div className="studies-hub-loading" role="status">
          Carregando estudos…
        </div>
      ) : studies.length === 0 ? (
        <motion.div variants={presets.card}>
          <StudyEmptyState onCreate={onCreate} />
        </motion.div>
      ) : (
        <>
          <motion.div className="studies-hub-summary" variants={presets.card}>
            <HeroCard className="studies-hub-hero">
              <div className="studies-hub-hero-top">
                <div>
                  <span className="studies-hub-eyebrow">
                    <Play size={11} />{" "}
                    {next ? "PRÓXIMO ESTUDO" : "SUA JORNADA DE ESTUDOS"}
                  </span>
                  <h2>
                    {next
                      ? next.title
                      : `${agg.overallProgress}% da jornada concluída`}
                  </h2>
                  {next ? (
                    <p className="studies-hub-context">
                      <BookOpen size={12} />
                      {next.studyTitle}
                      {next.moduleTitle ? ` › ${next.moduleTitle}` : ""}
                      {next.materiaTitle ? ` › ${next.materiaTitle}` : ""}
                    </p>
                  ) : (
                    <p className="studies-hub-context">
                      {agg.completedLessons} de {agg.totalLessons} itens
                      concluídos
                    </p>
                  )}
                  {next && (
                    <div className="studies-hub-tags">
                      <span>
                        <CalendarDays size={12} />
                        {schedule(next)}
                      </span>
                      <span>
                        <CalendarClock size={12} />
                        nas Tarefas
                      </span>
                    </div>
                  )}
                </div>
                <ProgressRing
                  size="lg"
                  value={
                    nextOverview ? nextOverview.progress : agg.overallProgress
                  }
                  label={
                    nextStudy
                      ? `Progresso de ${nextStudy.title}`
                      : "Progresso dos estudos"
                  }
                />
              </div>
              <ProgressBar
                label="Jornada concluída"
                detail={`${agg.completedLessons} de ${agg.totalLessons} itens`}
                value={agg.overallProgress}
              />
              <div className="studies-hub-hero-actions">
                {next ? (
                  <>
                    <Button variant="accent" icon={Play} onClick={studyNow}>
                      Estudar agora
                    </Button>
                    <Button
                      variant="ghost"
                      icon={BookOpen}
                      onClick={() => onOpen(next.studyId)}
                    >
                      Ver estudo
                    </Button>
                    <span>Abre o timer em Tarefas</span>
                  </>
                ) : (
                  <Button variant="accent" icon={BookOpen} onClick={onCreate}>
                    Novo estudo
                  </Button>
                )}
              </div>
            </HeroCard>
            <KpiCard
              label="Estudos"
              value={agg.totalStudies}
              variation={`${agg.overallProgress}%`}
              context="da jornada concluída"
              onAction={clear}
            />
            <KpiCard
              label="Em andamento"
              value={agg.inProgress}
              variation={`${agg.paused} pausado${agg.paused === 1 ? "" : "s"}`}
              context="nos seus estudos"
              onAction={() => onStatusChange("IN_PROGRESS")}
            />
            <KpiCard
              label="Concluídos"
              value={agg.completed}
              variation={
                completedStudy
                  ? `${completedStudy.overview.completedLessons}/${completedStudy.overview.totalLessons}`
                  : "seu progresso"
              }
              context={completedStudy?.study.title || "estudos concluídos"}
              onAction={() => onStatusChange("COMPLETED")}
            />
            <KpiCard
              label="Agendados na semana"
              value={agg.lessonsThisWeek}
              variation="com data"
              context="aulas e blocos"
              onAction={() => onNavigate?.("Tarefas")}
            />
          </motion.div>
          <div className="studies-hub-panels">
            <motion.article
              className="studies-hub-panel"
              variants={presets.card}
            >
              <CardHeader
                title="Próximos estudos"
                subtitle="Com data, aparecem nas Tarefas com o pomodoro"
                onAction={() => onNavigate?.("Tarefas")}
              />
              {agg.upcoming.length ? (
                <ul className="studies-hub-upcoming">
                  {agg.upcoming.map((item, i) => (
                    <li key={`${item.itemKind}-${item.id}`}>
                      <button
                        type="button"
                        onClick={() => onOpen(item.studyId)}
                      >
                        <span
                          className={`studies-hub-date ${i === 0 ? "is-next" : ""}`}
                        >
                          <span>
                            {date(item.scheduledDate)
                              .toLocaleDateString("pt-BR", { weekday: "short" })
                              .replace(".", "")
                              .toUpperCase()}
                          </span>
                          <strong>{date(item.scheduledDate).getDate()}</strong>
                        </span>
                        <span className="studies-hub-upcoming-title">
                          <strong>{item.title}</strong>
                          <span>
                            {item.studyTitle}
                            {item.scheduledTime
                              ? ` · ${item.scheduledTime.slice(0, 5)}`
                              : ""}
                          </span>
                        </span>
                        <span className="studies-hub-upcoming-type">
                          {
                            typeMeta(
                              studies.find((s) => s.id === item.studyId)?.type,
                            ).label
                          }
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <EmptyState
                  title="Nada agendado"
                  description="Defina uma data num módulo, sub-módulo ou aula para vê-lo aqui e nas Tarefas."
                  icon={CalendarDays}
                />
              )}
            </motion.article>
            <motion.article
              className="studies-hub-panel studies-hub-types"
              variants={presets.card}
            >
              <CardHeader
                title="Jornada por tipo"
                subtitle={`${agg.completedLessons} de ${agg.totalLessons} concluídos${agg.avgRating > 0 ? ` · nota média ${String(agg.avgRating).replace(".", ",")}` : ""}`}
              />
              <p className="studies-hub-total">
                <strong>{agg.overallProgress}%</strong>
                <span>da jornada concluída</span>
              </p>
              <div className="studies-hub-type-list">
                {Object.entries(agg.byType).map(([key, t]) => {
                  const meta = typeMeta(key),
                    Icon = meta.icon,
                    p = t.total ? Math.round((t.completed / t.total) * 100) : 0;
                  return (
                    <div
                      className="studies-hub-type"
                      key={key}
                      style={{
                        "--study-tone": `var(--fa-p-${meta.color}-500)`,
                        "--study-soft": `var(--fa-p-${meta.color}-50)`,
                      }}
                    >
                      <span>
                        <Icon size={16} />
                      </span>
                      <div>
                        <p>
                          <strong>
                            {meta.plural} <small>{t.count}</small>
                          </strong>
                          <span>
                            {t.completed}/{t.total} · {p}%
                          </span>
                        </p>
                        <ProgressBar
                          value={p}
                          color={`var(--fa-p-${meta.color}-500)`}
                          label={undefined}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.article>
          </div>
          <motion.nav
            className="studies-hub-filters"
            variants={presets.card}
            aria-label="Filtros de estudos"
          >
            <div aria-label="Status" role="group">
              {statusFilters.map((f) => (
                <FilterPill
                  key={f.id}
                  applied={statusFilter === f.id}
                  disclosure={false}
                  count={
                    f.id === "ALL"
                      ? studies.length
                      : studies.filter((s) => deriveStudyStatus(s) === f.id)
                          .length
                  }
                  aria-pressed={statusFilter === f.id}
                  onClick={() => onStatusChange(f.id)}
                >
                  {f.label}
                </FilterPill>
              ))}
            </div>
            <div aria-label="Tipo" role="group">
              {typeFilters
                .filter((f) => f.id !== "ALL" || typeFilter !== "ALL")
                .map((f) => (
                  <FilterPill
                    key={f.id}
                    applied={typeFilter === f.id}
                    disclosure={false}
                    count={
                      f.id === "ALL"
                        ? studies.length
                        : agg.byType[f.id]?.count || 0
                    }
                    aria-pressed={typeFilter === f.id}
                    onClick={() => onTypeChange(f.id)}
                  >
                    {f.id === "ALL" ? "Todos os tipos" : f.label}
                  </FilterPill>
                ))}
            </div>
          </motion.nav>
          {filteredStudies.length ? (
            <motion.div className="studies-hub-grid" variants={presets.grid}>
              {filteredStudies.map((study) => {
                const ov = studyOverview(study),
                  meta = typeMeta(study.type),
                  Icon = meta.icon;
                return (
                  <motion.article
                    key={study.id}
                    variants={presets.card}
                    className="study-hub-card"
                    style={{
                      "--study-tone": `var(--fa-p-${meta.color}-500)`,
                      "--study-soft": `var(--fa-p-${meta.color}-50)`,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => onOpen(study.id)}
                      aria-label={`Abrir estudo ${study.title}`}
                    >
                      <span className="study-hub-cover">
                        {study.coverUrl ? (
                          <img
                            className="study-hub-user-cover"
                            src={study.coverUrl}
                            alt=""
                          />
                        ) : (
                          <img
                            className="study-hub-cover-symbol"
                            src={`/assets/redesign/studies/${meta.asset}.svg`}
                            alt=""
                            width="96"
                            height="96"
                          />
                        )}
                        <span className="study-hub-type-chip">
                          <Icon size={12} />
                          {meta.label}
                        </span>
                      </span>
                      <span className="study-hub-body">
                        <span className="study-hub-card-top">
                          <span>
                            <strong>{study.title}</strong>
                            {study.category && <small>{study.category}</small>}
                          </span>
                          <ProgressRing
                            value={ov.progress}
                            size="sm"
                            label={`Progresso de ${study.title}`}
                          />
                        </span>
                        <span className="study-hub-card-meta">
                          <span>
                            <ListChecks size={14} />
                            {ov.completedLessons}/{ov.totalLessons}{" "}
                            {unit(study, ov)}
                          </span>
                          {ov.nextLesson ? (
                            <span className="study-hub-next">
                              <CalendarDays size={12} />
                              {schedule(ov.nextLesson)}
                            </span>
                          ) : (
                            <StatusBadge tone={tone(ov.status)}>
                              {STUDY_STATUS_META[ov.status].label}
                            </StatusBadge>
                          )}
                        </span>
                        <ProgressBar value={ov.progress} />
                      </span>
                    </button>
                  </motion.article>
                );
              })}
            </motion.div>
          ) : (
            <EmptyState
              title="Nenhum estudo por aqui"
              description="Crie um curso, faculdade, mentoria ou livro para começar."
              action={studies.length ? "Limpar filtros" : undefined}
              onAction={clear}
            />
          )}
        </>
      )}
    </motion.section>
  );
}
