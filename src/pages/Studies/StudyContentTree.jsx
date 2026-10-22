import { motion } from "framer-motion";
import {
  ChevronDown,
  Pencil,
  Trash2,
  Play,
  CirclePlay,
  Plus,
  Boxes,
  BookOpen,
  CalendarDays,
  CalendarClock,
  Link2,
  Star,
  NotebookPen,
} from "lucide-react";
import ProgressRing from "../../components/ui/ProgressRing";
import ProgressBar from "../../components/ui/ProgressBar";
import StatusBadge from "../../components/ui/StatusBadge";
import TaskCheck from "../../components/ui/TaskCheck";
import {
  countProgressUnits,
  moduleProgress,
  isEmptyLeaf,
  isNodeComplete,
} from "../../utils/studyMetrics";
import { compareMixedNodes } from "../../services/studyService";
import { useMotionPresets } from "../../components/ui/motion";

const short = (value) => {
  if (!value) return "";
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  if (!y) return "";
  return `${String(d).padStart(2, "0")} ${["jan", "fev", "mar", "abr", "mai", "jun", "jul", "ago", "set", "out", "nov", "dez"][m - 1]}`;
};
const unitLabel = ({ lessons = 0, blocks = 0 }) => {
  if (blocks === 0) return "aulas";
  if (lessons === 0) return blocks === 1 ? "item" : "itens";
  return "itens";
};
export default function StudyContentTree({
  study,
  expandedModules,
  expandedSubmodules,
  expandedMaterias,
  setExpandedModules,
  setExpandedSubmodules,
  setExpandedMaterias,
  onLesson,
  onToggleLesson,
  onDeleteLesson,
  onEdit,
  onDeleteBlock,
  onToggleBlock,
  onStudy,
  onAdd,
}) {
  const presets = useMotionPresets();
  const add = (kind, node) =>
    onAdd(
      kind === "module"
        ? {
            mode: "create",
            allowedKinds: ["submodule", "lesson"],
            parentId: node.id,
            parentLabel: node.title,
          }
        : {
            mode: "create",
            allowedKinds: ["lesson"],
            parentId: node.id,
            parentLabel: node.title,
          },
    );
  const blockCheck = (node) =>
    isEmptyLeaf(node) ? (
      <TaskCheck
        checked={Boolean(node.isCompleted)}
        label={`${node.isCompleted ? "Reabrir" : "Concluir"} ${node.title}`}
        onChange={() => onToggleBlock(node.id, !Boolean(node.isCompleted))}
      />
    ) : null;
  const actions = (node, kind) => (
    <div className="study-node-actions">
      <button
        type="button"
        className="study-node-study"
        onClick={() => onStudy(node)}
        aria-label={`Estudar ${node.title}`}
      >
        <Play size={12} />
        Estudar
      </button>
      <button
        type="button"
        className="study-node-icon"
        aria-label={`Editar ${node.title}`}
        onClick={() => onEdit(node, kind)}
      >
        <Pencil size={15} />
      </button>
      <button
        type="button"
        className="study-node-icon is-danger"
        aria-label={`Excluir ${node.title}`}
        onClick={() =>
          onDeleteBlock(
            node.id,
            node.title,
            kind === "subject"
              ? "matéria"
              : kind === "submodule"
                ? "sub-módulo"
                : "módulo",
          )
        }
      >
        <Trash2 size={15} />
      </button>
    </div>
  );
  const chips = (node) =>
    node.scheduledDate && (
      <span className="study-node-chips">
        <span className="is-date">
          <CalendarDays size={11} />
          {short(node.scheduledDate)}
          {node.scheduledTime ? ` · ${node.scheduledTime}` : ""}
        </span>
        <span>
          <CalendarClock size={11} />
          nas Tarefas
        </span>
        {["Alta", "Urgente"].includes(node.priority) && (
          <span>{node.priority}</span>
        )}
      </span>
    );
  const lessonRow = (lesson) => {
    const resCount = Array.isArray(lesson.resources)
      ? lesson.resources.length
      : 0;
    return (
      <div
        key={lesson.id}
        data-study-lesson={lesson.id}
        className={`study-lesson ${lesson.isCompleted ? "is-done" : ""}`}
      >
        <TaskCheck
          checked={lesson.isCompleted}
          label={`${lesson.isCompleted ? "Reabrir" : "Concluir"} ${lesson.title}`}
          onChange={() => onToggleLesson(lesson.id, lesson.isCompleted)}
        />
        <button
          type="button"
          className="study-lesson-main"
          onClick={() => onLesson(lesson)}
        >
          <CirclePlay size={14} />
          <span className="study-lesson-title">{lesson.title}</span>
          <span className="study-node-chips">
            {lesson.scheduledDate && (
              <>
                <span className="is-date">
                  <CalendarDays size={11} />
                  {short(lesson.scheduledDate)}
                  {lesson.scheduledTime ? ` · ${lesson.scheduledTime}` : ""}
                </span>
                <span>
                  <CalendarClock size={11} />
                  nas Tarefas
                </span>
                {["Alta", "Urgente"].includes(lesson.priority) && (
                  <span>{lesson.priority}</span>
                )}
              </>
            )}
            {(lesson.notes || lesson.description) && (
              <span>
                <NotebookPen size={11} />
                Anotações
              </span>
            )}
            {resCount > 0 && (
              <span>
                <Link2 size={11} />
                {resCount}
              </span>
            )}
            {lesson.rating > 0 && (
              <span className="is-rating">
                <Star size={12} />
                {lesson.rating}
              </span>
            )}
          </span>
        </button>
        <div className="study-lesson-actions">
          <button
            type="button"
            className="study-node-icon"
            aria-label={`Editar ${lesson.title}`}
            onClick={() => onLesson(lesson)}
          >
            <Pencil size={15} />
          </button>
          <button
            type="button"
            className="study-node-icon is-danger"
            aria-label={`Excluir ${lesson.title}`}
            onClick={() => onDeleteLesson(lesson.id, lesson.title)}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    );
  };
  const renderMixedNode = (node) =>
    !Array.isArray(node.submodules)
      ? lessonRow(node)
      : node.kind === "submodule"
        ? renderSubmodule(node)
        : renderSubject(node);
  const renderSubject = (node) => {
    const progress = moduleProgress(node),
      counts = countProgressUnits([node]),
      open = expandedMaterias[node.id];
    return (
      <article
        className={`study-subnode study-subject ${isNodeComplete(node) ? "is-done" : ""}`}
        key={node.id}
        data-study-node={node.id}
      >
        <header>
          {blockCheck(node)}
          <button
            type="button"
            className="study-subnode-toggle"
            aria-expanded={Boolean(open)}
            onClick={() =>
              setExpandedMaterias((p) => ({ ...p, [node.id]: !p[node.id] }))
            }
          >
            <span className="study-node-tag is-subject">
              <BookOpen size={11} />
              Matéria
            </span>
            <strong>{node.title}</strong>
            <span>
              {counts.completed}/{counts.total} · {progress}%
              {isEmptyLeaf(node) ? " · sem aulas: marque quando concluir" : ""}
            </span>
            {chips(node)}
          </button>
          {actions(node, "subject")}
          <button
            type="button"
            className="study-node-chevron"
            aria-label={`${open ? "Recolher" : "Expandir"} ${node.title}`}
            aria-expanded={Boolean(open)}
            onClick={() =>
              setExpandedMaterias((p) => ({ ...p, [node.id]: !p[node.id] }))
            }
          >
            <ChevronDown size={16} className={open ? "is-open" : ""} />
          </button>
        </header>
        {open && (
          <div className="study-subnode-body">
            <ProgressBar value={progress} />
            {node.description && (
              <p className="study-node-description">{node.description}</p>
            )}
            {node.lessons.length > 0 ? (
              node.lessons.map(lessonRow)
            ) : (
              <p className="study-node-empty">Nenhuma aula nesta matéria.</p>
            )}
            <button
              type="button"
              className="study-node-add"
              onClick={() => add("subject", node)}
            >
              <Plus size={14} />
              Adicionar aulas
            </button>
          </div>
        )}
      </article>
    );
  };
  const renderSubmodule = (node) => {
    const progress = moduleProgress(node),
      counts = countProgressUnits([node]),
      open = expandedSubmodules[node.id];
    const directLessons = Array.isArray(node.lessons) ? node.lessons : [],
      materias = (node.submodules || []).filter((c) => c.kind !== "submodule"),
      mixed = [...directLessons, ...materias].sort(compareMixedNodes);
    return (
      <article
        className={`study-subnode ${isNodeComplete(node) ? "is-done" : ""}`}
        key={node.id}
        data-study-node={node.id}
      >
        <header>
          {blockCheck(node)}
          <button
            type="button"
            className="study-subnode-toggle"
            aria-expanded={Boolean(open)}
            onClick={() =>
              setExpandedSubmodules((p) => ({ ...p, [node.id]: !p[node.id] }))
            }
          >
            <span className="study-node-tag">
              <Boxes size={11} />
              Sub-módulo
            </span>
            <strong>{node.title}</strong>
            <span>
              {counts.completed}/{counts.total} · {progress}%
            </span>
            {chips(node)}
          </button>
          {actions(node, "submodule")}
          <button
            type="button"
            className="study-node-chevron"
            aria-label={`${open ? "Recolher" : "Expandir"} ${node.title}`}
            aria-expanded={Boolean(open)}
            onClick={() =>
              setExpandedSubmodules((p) => ({ ...p, [node.id]: !p[node.id] }))
            }
          >
            <ChevronDown size={16} className={open ? "is-open" : ""} />
          </button>
        </header>
        {open && (
          <div className="study-subnode-body">
            <ProgressBar value={progress} />
            {node.description && (
              <p className="study-node-description">{node.description}</p>
            )}
            {mixed.map(renderMixedNode)}
            <button
              type="button"
              className="study-node-add"
              onClick={() => add("submodule", node)}
            >
              <Plus size={14} />
              Adicionar aulas
            </button>
          </div>
        )}
      </article>
    );
  };
  return (
    <motion.div className="study-content-tree" variants={presets.grid}>
      {study.modules.map((mod, index) => {
        const open = expandedModules[mod.id],
          progress = moduleProgress(mod),
          counts = countProgressUnits([mod]),
          directLessons = Array.isArray(mod.lessons) ? mod.lessons : [],
          children = mod.submodules || [],
          mixed = [...directLessons, ...children].sort(compareMixedNodes);
        return (
          <motion.section
            key={mod.id}
            data-study-node={mod.id}
            className={`study-module ${open ? "is-expanded" : ""}`}
            variants={presets.row}
          >
            <header>
              <button
                type="button"
                className="study-module-toggle"
                aria-expanded={Boolean(open)}
                onClick={() =>
                  setExpandedModules((p) => ({ ...p, [mod.id]: !p[mod.id] }))
                }
              >
                <span className="study-module-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <ProgressRing
                  size="sm"
                  value={progress}
                  label={`Progresso de ${mod.title}`}
                />
                <span className="study-module-text">
                  <span>MÓDULO</span>
                  <strong>{mod.title}</strong>
                  <span className="study-module-stat">
                    {counts.total > 0
                      ? `${counts.completed}/${counts.total} ${unitLabel(counts)} · `
                      : ""}
                    {progress}%
                    {isNodeComplete(mod) && (
                      <StatusBadge tone="success">Concluído</StatusBadge>
                    )}
                  </span>
                  {chips(mod)}
                </span>
              </button>
              <div className="study-module-actions">
                {blockCheck(mod)}
                {actions(mod, "module")}
              </div>
              <button
                type="button"
                className="study-node-chevron"
                aria-label={`${open ? "Recolher" : "Expandir"} ${mod.title}`}
                aria-expanded={Boolean(open)}
                onClick={() =>
                  setExpandedModules((p) => ({ ...p, [mod.id]: !p[mod.id] }))
                }
              >
                <ChevronDown size={18} className={open ? "is-open" : ""} />
              </button>
            </header>
            {open && (
              <div className="study-module-body">
                {mod.description && (
                  <p className="study-node-description">{mod.description}</p>
                )}
                <div className="study-node-mixed">
                  {mixed.map(renderMixedNode)}
                </div>
                <button
                  type="button"
                  className="study-node-add study-node-add-module"
                  onClick={() => add("module", mod)}
                >
                  <Plus size={14} />
                  Adicionar conteúdo
                </button>
              </div>
            )}
          </motion.section>
        );
      })}
    </motion.div>
  );
}
