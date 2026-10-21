import { useMemo, useState } from "react";
import {
  ArrowLeft,
  LayoutGrid,
  List as ListIcon,
  CalendarDays,
  Gauge,
  Pencil,
  Trash2,
  Plus,
  CheckCircle2,
  ListChecks,
  Clock,
  Target,
  Building2,
  Mail,
  Phone,
  ChevronLeft,
  ChevronRight,
  Flag,
  Archive,
  ArchiveRestore,
} from "lucide-react";
import {
  computeProjectStats,
  tasksOfProject,
  PROJECT_STATUS_META,
} from "../../utils/projectMetrics";
import { normalizeTaskStatus } from "../../utils/taskStatus";
import ProjectOverview from "./ProjectOverview";
import PriorityTag from "../../components/ui/PriorityTag";
import { motion } from "framer-motion";
import { useMotionPresets } from "../../components/ui/motion";
import "./ProjectKanban.css";
import "./ProjectWorkspace.css";

const TASK_COLUMNS = [
  { status: "todo", label: "A Fazer" },
  { status: "in_progress", label: "Em Andamento" },
  { status: "done", label: "Concluída" },
];

const PRIORITY_TONE = {
  Urgente: "#ef4444",
  Alta: "#f59e0b",
  Normal: "#3b82f6",
  Baixa: "#10b981",
};

const dateKey = (value) => {
  if (!value) return null;
  const s = String(value);
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString().slice(0, 10);
};

const fmtDate = (value) => {
  const k = dateKey(value);
  if (!k) return null;
  const d = new Date(`${k}T00:00:00`);
  return d.toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const fmtShort = (value) => {
  const k = dateKey(value);
  if (!k) return null;
  const d = new Date(`${k}T00:00:00`);
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" });
};

export default function ProjectWorkspace({
  project,
  tasks = [],
  client,
  goal,
  onBack,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  updateTask,
  onNewTask,
  onNavigate,
  mask = (value) => value,
}) {
  const [tab, setTab] = useState("kanban");
  const stats = useMemo(
    () => computeProjectStats(project, tasks),
    [project, tasks],
  );
  const color = `#${(project.color || "ff9500").replace("#", "")}`;
  const archived = project.status === "archived";
  const statusMeta = archived
    ? PROJECT_STATUS_META.archived
    : PROJECT_STATUS_META[stats.autoStatus] || PROJECT_STATUS_META.todo;

  // Tarefas do projeto (sem arquivadas) para board/lista/calendário
  const projectTasks = useMemo(
    () =>
      tasksOfProject(project, tasks).filter(
        (t) => normalizeTaskStatus(t) !== "archived",
      ),
    [project, tasks],
  );

  const TABS = [
    { id: "overview", label: "Visão Geral", icon: Gauge },
    { id: "kanban", label: "Kanban", icon: LayoutGrid },
    { id: "list", label: "Lista", icon: ListIcon },
    { id: "calendar", label: "Calendário", icon: CalendarDays },
  ];

  if (tab === "overview" || tab === "kanban")
    return (
      <OverviewView
        activeTab={tab}
        project={project}
        stats={stats}
        client={client}
        goal={goal}
        statusMeta={statusMeta}
        archived={archived}
        onBack={onBack}
        onEdit={onEdit}
        onArchive={onArchive}
        onRestore={onRestore}
        onDelete={onDelete}
        onTab={setTab}
        onNavigate={onNavigate}
        mask={mask}
      >
        {tab === "kanban" && (
          <KanbanView
            tasks={projectTasks}
            updateTask={updateTask}
            onNewTask={onNewTask}
            mask={mask}
          />
        )}
      </OverviewView>
    );

  return (
    <div className="pw" style={{ "--accent": color }}>
      <header className="pw__header">
        <button className="pw__back" onClick={onBack}>
          <ArrowLeft size={18} /> Projetos
        </button>

        <div className="pw__titleRow">
          <div className="pw__titleMain">
            <span className="pw__dot" />
            <div>
              <h1 className="pw__title">{project.title}</h1>
              <div className="pw__sub">
                <span className={`pw__status pw__status--${statusMeta.tone}`}>
                  {statusMeta.label}
                </span>
                {client && (
                  <span className="pw__subItem">
                    <Building2 size={13} /> {client.name}
                  </span>
                )}
                {goal && (
                  <span className="pw__subItem">
                    <Target size={13} /> {goal.title}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pw__headActions">
            {!archived && (
              <button
                className="pw__iconBtn"
                onClick={() => onEdit?.(project)}
                title="Editar projeto"
                aria-label="Editar projeto"
              >
                <Pencil size={16} />
              </button>
            )}
            {archived ? (
              <button
                className="pw__iconBtn"
                onClick={() => onRestore?.(project)}
                title="Restaurar projeto"
                aria-label="Restaurar projeto"
              >
                <ArchiveRestore size={16} />
              </button>
            ) : (
              <button
                className="pw__iconBtn"
                onClick={() => onArchive?.(project)}
                title="Arquivar projeto"
                aria-label="Arquivar projeto"
              >
                <Archive size={16} />
              </button>
            )}
            <button
              className="pw__iconBtn pw__iconBtn--danger"
              onClick={() => onDelete?.(project)}
              title="Excluir projeto"
              aria-label="Excluir projeto"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        <div className="pw__progressBar">
          <div
            className="pw__progressFill"
            style={{ width: `${stats.progress}%` }}
          />
          <span className="pw__progressLabel">{stats.progress}% concluído</span>
        </div>

        <nav className="pw__tabs">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                className={`pw__tab ${tab === t.id ? "is-active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                <Icon size={15} /> {t.label}
              </button>
            );
          })}
        </nav>
      </header>

      <div className="pw__content">
        {tab === "overview" && (
          <OverviewView
            project={project}
            stats={stats}
            client={client}
            goal={goal}
          />
        )}
        {tab === "kanban" && (
          <KanbanView
            tasks={projectTasks}
            updateTask={updateTask}
            onNewTask={onNewTask}
          />
        )}
        {tab === "list" && (
          <ListView tasks={projectTasks} updateTask={updateTask} />
        )}
        {tab === "calendar" && (
          <CalendarView tasks={projectTasks} accent={color} />
        )}
      </div>
    </div>
  );
}

/* ---------- Visão Geral ---------- */
function OverviewView({ project, stats, client, goal, ...presentation }) {
  const start = fmtDate(project.startDate || project.start_date);
  const end = fmtDate(project.endDate || project.end_date);
  let remaining = null;
  const endK = dateKey(project.endDate || project.end_date);
  if (endK) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    remaining = Math.round((new Date(`${endK}T00:00:00`) - today) / 86400000);
  }

  return (
    <ProjectOverview
      project={project}
      stats={stats}
      client={client}
      goal={goal}
      start={start}
      end={end}
      remaining={remaining}
      startKey={dateKey(project.startDate || project.start_date)}
      endKey={endK}
      {...presentation}
    />
  );
}

/* ---------- Kanban de tarefas ---------- */
function KanbanView({ tasks, updateTask, onNewTask, mask = (value) => value }) {
  const [draggingId, setDraggingId] = useState(null);
  const [overCol, setOverCol] = useState(null);
  const [showAllDone, setShowAllDone] = useState(false);
  const presets = useMotionPresets();
  const byColumn = useMemo(() => {
    const map = { todo: [], in_progress: [], done: [] };
    tasks.forEach((t) => {
      const s = normalizeTaskStatus(t);
      if (map[s]) map[s].push(t);
    });
    return map;
  }, [tasks]);

  const handleDrop = async (e, colStatus) => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain") || draggingId;
    setOverCol(null);
    setDraggingId(null);
    if (!id) return;
    const task = tasks.find((t) => t.id === id);
    if (!task || normalizeTaskStatus(task) === colStatus) return;
    const completed = colStatus === "done";
    await updateTask?.(id, {
      status: colStatus,
      completed,
      completed_at: completed ? new Date().toISOString() : null,
    });
  };

  return (
    <motion.div className="project-board" variants={presets.grid}>
      {TASK_COLUMNS.map((col) => {
        const items = byColumn[col.status];
        const visible =
          col.status === "done" && !showAllDone ? items.slice(0, 4) : items;
        return (
          <motion.section
            key={col.status}
            variants={presets.card}
            className={`project-board-column ${overCol === col.status ? "is-over" : ""}`}
            data-col={col.status}
            aria-label={col.label}
            onDragOver={(e) => {
              e.preventDefault();
              setOverCol(col.status);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget))
                setOverCol((c) => (c === col.status ? null : c));
            }}
            onDrop={(e) => handleDrop(e, col.status)}
          >
            <header className="project-board-column-head">
              <i />
              <h2>
                {col.status === "todo"
                  ? "A fazer"
                  : col.status === "in_progress"
                    ? "Em andamento"
                    : "Concluída"}
              </h2>
              <span>{items.length}</span>
            </header>
            {visible.map((task) => (
              <motion.article
                key={task.id}
                variants={presets.row}
                className={`project-board-task ${col.status === "done" ? "is-done" : ""} ${draggingId === task.id ? "is-dragging" : ""}`}
                draggable
                onDragStart={(e) => {
                  setDraggingId(task.id);
                  e.dataTransfer.setData("text/plain", task.id);
                  e.dataTransfer.effectAllowed = "move";
                }}
                onDragEnd={() => {
                  setDraggingId(null);
                  setOverCol(null);
                }}
              >
                <p>{mask(task.title)}</p>
                <div className="project-board-task-meta">
                  {col.status !== "done" && task.priority && (
                    <PriorityTag priority={task.priority} />
                  )}
                  {fmtShort(
                    col.status === "done"
                      ? task.completed_at || task.due_date
                      : task.due_date,
                  ) && (
                    <span
                      className={col.status === "done" ? "is-completed" : ""}
                    >
                      {col.status === "done" ? (
                        <CheckCircle2 size={12} />
                      ) : (
                        <Clock size={12} />
                      )}{" "}
                      {fmtShort(
                        col.status === "done"
                          ? task.completed_at || task.due_date
                          : task.due_date,
                      )
                        ?.replace(" de ", " ")
                        .replace(".", "")}
                    </span>
                  )}
                </div>
              </motion.article>
            ))}
            {col.status === "done" && items.length > 4 && (
              <button
                type="button"
                className="project-board-more"
                onClick={() => setShowAllDone((v) => !v)}
                aria-expanded={showAllDone}
              >
                {showAllDone
                  ? "Mostrar menos"
                  : `+ ${items.length - 4} concluídas`}
              </button>
            )}
            <button
              type="button"
              className="project-board-add"
              onClick={() => onNewTask?.(col.status)}
            >
              <Plus size={13} /> Nova tarefa
            </button>
          </motion.section>
        );
      })}
    </motion.div>
  );
}

/* ---------- Lista ---------- */
function ListView({ tasks, updateTask }) {
  const ordered = useMemo(() => {
    const rank = { todo: 0, in_progress: 1, done: 2, archived: 3 };
    return [...tasks].sort(
      (a, b) =>
        (rank[normalizeTaskStatus(a)] ?? 0) -
        (rank[normalizeTaskStatus(b)] ?? 0),
    );
  }, [tasks]);

  if (ordered.length === 0)
    return (
      <p className="pw__empty pw__empty--block">
        Nenhuma tarefa neste projeto ainda.
      </p>
    );

  return (
    <ul className="pw__list">
      {ordered.map((task) => {
        const s = normalizeTaskStatus(task);
        const isDone = s === "done";
        return (
          <li key={task.id} className={`pw__row ${isDone ? "is-done" : ""}`}>
            <button
              className={`pw__check ${isDone ? "is-checked" : ""}`}
              onClick={() =>
                updateTask?.(task.id, {
                  completed: !isDone,
                  status: !isDone ? "done" : "todo",
                  completed_at: !isDone ? new Date().toISOString() : null,
                })
              }
              aria-label={isDone ? "Reabrir" : "Concluir"}
            >
              <CheckCircle2 size={16} />
            </button>
            <div className="pw__rowBody">
              <span className="pw__rowTitle">{task.title}</span>
              <div className="pw__rowMeta">
                <span className={`pw__statusTag pw__statusTag--${s}`}>
                  {TASK_COLUMNS.find((c) => c.status === s)?.label || "Tarefa"}
                </span>
                {task.priority && (
                  <span
                    className="pw__prio"
                    style={{ "--p": PRIORITY_TONE[task.priority] || "#9ca3af" }}
                  >
                    <Flag size={11} /> {task.priority}
                  </span>
                )}
                {fmtShort(task.due_date) && (
                  <span className="pw__due">
                    <Clock size={11} /> {fmtShort(task.due_date)}
                  </span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ---------- Calendário ---------- */
const WEEKDAYS = ["D", "S", "T", "Q", "Q", "S", "S"];
const MONTHS = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

function CalendarView({ tasks, accent }) {
  const [cursor, setCursor] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selected, setSelected] = useState(null);

  const { cells, byDay, monthLabel } = useMemo(() => {
    const y = cursor.getFullYear(),
      m = cursor.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const firstDow = new Date(y, m, 1).getDay();
    const arr = [];
    for (let i = 0; i < firstDow; i++) arr.push(null);
    for (let d = 1; d <= daysInMonth; d++) arr.push(d);

    const map = {};
    tasks.forEach((t) => {
      const k = dateKey(t.due_date);
      if (!k) return;
      const [ty, tm, td] = k.split("-").map(Number);
      if (ty === y && tm === m + 1) {
        if (!map[td]) map[td] = [];
        map[td].push(t);
      }
    });
    return { cells: arr, byDay: map, monthLabel: `${MONTHS[m]} ${y}` };
  }, [cursor, tasks]);

  const today = new Date();
  const isToday = (d) =>
    d &&
    today.getDate() === d &&
    today.getMonth() === cursor.getMonth() &&
    today.getFullYear() === cursor.getFullYear();
  const selectedTasks = selected && byDay[selected] ? byDay[selected] : [];

  const shift = (delta) => {
    setSelected(null);
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1));
  };

  return (
    <div className="pw__calendar" style={{ "--accent": accent }}>
      <div className="pw__calMain">
        <header className="pw__calHead">
          <button className="pw__calNav" onClick={() => shift(-1)}>
            <ChevronLeft size={18} />
          </button>
          <strong>{monthLabel}</strong>
          <button className="pw__calNav" onClick={() => shift(1)}>
            <ChevronRight size={18} />
          </button>
        </header>
        <div className="pw__calWeek">
          {WEEKDAYS.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="pw__calGrid">
          {cells.map((d, i) => {
            const has = d && byDay[d];
            return (
              <button
                key={i}
                className={`pw__calDay ${!d ? "is-empty" : ""} ${isToday(d) ? "is-today" : ""} ${selected === d ? "is-selected" : ""}`}
                disabled={!d}
                onClick={() => setSelected(d)}
              >
                {d}
                {has && (
                  <span className="pw__calDot" data-count={byDay[d].length} />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <aside className="pw__calSide">
        <h4>{selected ? `Dia ${selected}` : "Selecione um dia"}</h4>
        {selected ? (
          selectedTasks.length ? (
            <ul className="pw__calTasks">
              {selectedTasks.map((t) => (
                <li
                  key={t.id}
                  className={normalizeTaskStatus(t) === "done" ? "is-done" : ""}
                >
                  <span
                    className="pw__calTaskDot"
                    style={{
                      background: PRIORITY_TONE[t.priority] || "#9ca3af",
                    }}
                  />
                  {t.title}
                </li>
              ))}
            </ul>
          ) : (
            <p className="pw__empty">Sem tarefas neste dia.</p>
          )
        ) : (
          <p className="pw__empty">Clique num dia para ver as tarefas.</p>
        )}
      </aside>
    </div>
  );
}
