import { motion } from "framer-motion";
import {
  ChevronLeft,
  ArrowUpRight,
  Trash2,
  Star,
  Layers,
  Boxes,
  CalendarClock,
  Play,
  Plus,
} from "lucide-react";
import HeroCard from "../../components/ui/HeroCard";
import KpiCard from "../../components/ui/KpiCard";
import ProgressRing from "../../components/ui/ProgressRing";
import StatusBadge from "../../components/ui/StatusBadge";
import Button from "../../components/ui/Button";
import { useMotionPresets } from "../../components/ui/motion";
import {
  STUDY_TYPE_META,
  STUDY_STATUS_META,
  studyOverview,
  isNodeComplete,
} from "../../utils/studyMetrics";
import { safeExternalUrl } from "../../utils/safeUrl";
import "./StudyDetail.css";

const COLORS = {
  COURSE: "brasa",
  UNIVERSITY: "violeta",
  BOOK: "verde",
  MENTORSHIP: "ciano",
};
const schedule = (item) =>
  `${new Date(`${String(item.scheduledDate).slice(0, 10)}T00:00:00`).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" }).replace(".", "")}${item.scheduledTime ? ` · ${item.scheduledTime.slice(0, 5)}` : ""}`;
export default function StudyDetail({
  study,
  onBack,
  onDelete,
  onNewModule,
  onStudy,
  onNavigate,
  children,
}) {
  const presets = useMotionPresets(),
    ov = studyOverview(study),
    type = STUDY_TYPE_META[study.type] || STUDY_TYPE_META.COURSE;
  const next = ov.nextLesson,
    completeModules = (study.modules || []).filter(isNodeComplete).length;
  const jump = () =>
    document
      .getElementById("study-content")
      ?.scrollIntoView({
        behavior: presets.reduce ? "auto" : "smooth",
        block: "start",
      });
  const label = ov.blockUnits
    ? "itens"
    : study.type === "BOOK"
      ? "capítulos"
      : study.type === "MENTORSHIP"
        ? "encontros"
        : "aulas";
  return (
    <motion.section
      className="stDetail study-detail-v3"
      initial="hidden"
      animate="show"
      variants={presets.grid}
      style={{
        "--study-detail-color": `var(--fa-p-${COLORS[study.type] || "brasa"}-500)`,
      }}
    >
      <motion.header className="study-detail-header" variants={presets.row}>
        <button
          type="button"
          className="stDetail__back study-detail-back"
          onClick={onBack}
        >
          <ChevronLeft size={14} />
          Estudos
        </button>
        <div className="study-detail-title">
          <i />
          <h1>{study.title}</h1>
        </div>
        <div className="study-detail-chips">
          <StatusBadge
            tone={
              ov.status === "COMPLETED"
                ? "success"
                : ov.status === "IN_PROGRESS"
                  ? "info"
                  : ov.status === "PAUSED"
                    ? "warning"
                    : "neutral"
            }
          >
            {STUDY_STATUS_META[ov.status].label}
          </StatusBadge>
          <span>{type.label}</span>
          {study.category && <span>{study.category}</span>}
          {safeExternalUrl(study.url) && (
            <a
              href={safeExternalUrl(study.url)}
              target="_blank"
              rel="noreferrer"
            >
              <ArrowUpRight size={12} />
              Acessar plataforma
            </a>
          )}
        </div>
        {study.description && (
          <p className="study-detail-description">{study.description}</p>
        )}
        <button
          type="button"
          className="study-detail-delete"
          onClick={onDelete}
          aria-label="Excluir estudo"
        >
          <Trash2 size={16} />
        </button>
      </motion.header>
      <motion.div className="study-detail-summary" variants={presets.card}>
        <HeroCard className="study-detail-hero">
          <div className="study-detail-hero-top">
            <div>
              <span className="study-detail-eyebrow">
                PROGRESSO{" "}
                {study.type === "BOOK"
                  ? "DO LIVRO"
                  : study.type === "MENTORSHIP"
                    ? "DA MENTORIA"
                    : study.type === "UNIVERSITY"
                      ? "DO ESTUDO"
                      : "DO CURSO"}
              </span>
              <div className="study-detail-number">
                <strong>{ov.completedLessons}</strong>
                <span>
                  de {ov.totalLessons} {label}
                </span>
              </div>
              <div className="study-detail-hero-chips">
                {ov.avgRating > 0 && (
                  <span>
                    <Star size={12} />
                    {String(ov.avgRating).replace(".", ",")} de média
                  </span>
                )}
                <span>
                  <Layers size={12} />
                  {ov.modulesCount} módulos
                </span>
                {(ov.submodulesCount > 0 || ov.materiasCount > 0) && (
                  <span>
                    <Boxes size={12} />
                    {ov.submodulesCount} sub-módulo
                    {ov.submodulesCount === 1 ? "" : "s"} · {ov.materiasCount}{" "}
                    matéria{ov.materiasCount === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </div>
            <ProgressRing
              value={ov.progress}
              size="lg"
              label="Progresso do estudo"
            />
          </div>
          {next ? (
            <div className="study-detail-next">
              <span>
                <CalendarClock size={18} />
              </span>
              <div>
                <strong>Próximo: {next.title}</strong>
                <span>
                  {next.materiaTitle || next.moduleTitle || next.parentTitle
                    ? `${next.materiaTitle || next.moduleTitle || next.parentTitle} · `
                    : ""}
                  {schedule(next)} · nas Tarefas
                </span>
              </div>
              <Button
                variant="accent"
                size="sm"
                icon={Play}
                onClick={() => onStudy(next)}
              >
                Estudar
              </Button>
            </div>
          ) : (
            <p className="study-detail-no-next">Nenhum conteúdo agendado.</p>
          )}
        </HeroCard>
        <KpiCard
          label="Módulos"
          value={ov.modulesCount}
          variation={`${completeModules} completos`}
          context={`faltam ${ov.modulesCount - completeModules}`}
          onAction={jump}
        />
        <KpiCard
          label={ov.blockUnits ? "Itens concluídos" : "Aulas concluídas"}
          value={`${ov.completedLessons}/${ov.totalLessons}`}
          variation={`${ov.progress}%`}
          context="do estudo"
        />
        <KpiCard
          label="Agendados"
          value={ov.scheduledCount}
          variation={next ? schedule(next) : "sem próximo"}
          context={next?.title || "defina uma data no conteúdo"}
          onAction={() => onNavigate?.("Tarefas")}
        />
        <KpiCard
          label="Matérias"
          value={ov.materiasCount}
          variation={`+${ov.submodulesCount} sub-módulo${ov.submodulesCount === 1 ? "" : "s"}`}
          context="na estrutura do estudo"
        />
      </motion.div>
      <motion.header
        className="study-detail-content-head"
        variants={presets.row}
        id="study-content"
      >
        <div>
          <h2>Conteúdo</h2>
          <p>Clique numa aula para abrir os detalhes e as anotações dela.</p>
        </div>
        <Button variant="secondary" size="sm" icon={Plus} onClick={onNewModule}>
          Novo módulo
        </Button>
      </motion.header>
      {children}
    </motion.section>
  );
}
