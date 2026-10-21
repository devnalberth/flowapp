import { useMemo, useState } from "react";
import {
  CalendarDays,
  Plus,
  CheckCircle2,
  Circle,
  Clock,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  computeProjectStats,
  tasksOfProject,
  PROJECT_STATUS_META,
} from "../../utils/projectMetrics";
import { normalizeTaskStatus } from "../../utils/taskStatus";
import ProjectOverview from "./ProjectOverview";
import PriorityTag from "../../components/ui/PriorityTag";
import TaskCheck from "../../components/ui/TaskCheck";
import StatusBadge from "../../components/ui/StatusBadge";
import EmptyState from "../../components/ui/EmptyState";
import "./ProjectList.css";
import { motion } from "framer-motion";
import { useMotionPresets } from "../../components/ui/motion";
import "./ProjectKanban.css";
import "./ProjectCalendar.css";

const TASK_COLUMNS = [
  { status: "todo", label: "A Fazer" },
  { status: "in_progress", label: "Em Andamento" },
  { status: "done", label: "Concluída" },
];

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
      {tab === "list" && (
        <ListView tasks={projectTasks} updateTask={updateTask} mask={mask} />
      )}
      {tab === "calendar" && <CalendarView tasks={projectTasks} mask={mask} />}
    </OverviewView>
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
function ListView({ tasks, updateTask, mask = (value) => value }) {
  const presets = useMotionPresets();
  const ordered = useMemo(() => {
    const rank = { todo: 0, in_progress: 1, done: 2, archived: 3 };
    return [...tasks].sort(
      (a, b) =>
        (rank[normalizeTaskStatus(a)] ?? 0) -
        (rank[normalizeTaskStatus(b)] ?? 0),
    );
  }, [tasks]);

  const now = new Date();
  const todayKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (ordered.length === 0)
    return (
      <div className="project-list-card">
        <EmptyState
          title="Nenhuma tarefa neste projeto"
          description="Crie uma tarefa pelo botão Nova tarefa para começar."
        />
      </div>
    );
  return (
    <motion.div className="project-list-card" variants={presets.card}>
      <table className="project-task-list">
        <caption className="fa-sr-only">Tarefas do projeto</caption>
        <colgroup>
          <col className="project-list-check-col" />
          <col />
          <col className="project-list-status-col" />
          <col className="project-list-priority-col" />
          <col className="project-list-date-col" />
        </colgroup>
        <thead>
          <tr>
            <th scope="col">
              <span className="fa-sr-only">Conclusão</span>
            </th>
            <th scope="col">Tarefa</th>
            <th scope="col">Status</th>
            <th scope="col">Prioridade</th>
            <th scope="col">Prazo</th>
          </tr>
        </thead>
        <tbody>
          {ordered.map((task) => {
            const s = normalizeTaskStatus(task);
            const isDone = s === "done";
            const dueToday = !isDone && dateKey(task.due_date) === todayKey;
            return (
              <motion.tr
                key={task.id}
                variants={presets.row}
                className={`${isDone ? "is-done" : ""} ${dueToday ? "is-today" : ""}`}
              >
                <td>
                  <TaskCheck
                    checked={isDone}
                    label={`${isDone ? "Reabrir" : "Concluir"} ${mask(task.title)}`}
                    onChange={() =>
                      updateTask?.(task.id, {
                        completed: !isDone,
                        status: !isDone ? "done" : "todo",
                        completed_at: !isDone ? new Date().toISOString() : null,
                      })
                    }
                  />
                </td>
                <th scope="row" className="project-list-title">
                  {mask(task.title)}
                </th>
                <td data-label="Status">
                  <StatusBadge
                    tone={
                      isDone
                        ? "success"
                        : s === "in_progress"
                          ? "info"
                          : "neutral"
                    }
                  >
                    {s === "todo"
                      ? "A fazer"
                      : s === "in_progress"
                        ? "Em andamento"
                        : TASK_COLUMNS.find((c) => c.status === s)?.label ||
                          "Tarefa"}
                  </StatusBadge>
                </td>
                <td data-label="Prioridade">
                  {!isDone && task.priority ? (
                    <PriorityTag priority={task.priority} />
                  ) : (
                    <span className="project-list-missing">—</span>
                  )}
                </td>
                <td data-label="Prazo" className="project-list-date">
                  {dueToday
                    ? "Hoje"
                    : fmtShort(task.due_date)
                        ?.replace(" de ", " ")
                        .replace(".", "") || "—"}
                </td>
              </motion.tr>
            );
          })}
        </tbody>
      </table>
    </motion.div>
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

function CalendarView({ tasks, mask = (value) => value }) {
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

  const presets = useMotionPresets();
  const selectedDate = selected
    ? new Date(cursor.getFullYear(), cursor.getMonth(), selected)
    : null;
  const selectedLabel = selectedDate
    ?.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })
    .replace("-feira", "");
  return (
    <motion.div className="project-calendar" variants={presets.grid}>
      <motion.section
        className="project-calendar-card"
        variants={presets.card}
        aria-label="Prazos das tarefas do projeto"
      >
        <header className="project-calendar-head">
          <button
            type="button"
            onClick={() => shift(-1)}
            aria-label="Mês anterior"
          >
            <ChevronLeft size={16} />
          </button>
          <h2 aria-live="polite">{monthLabel}</h2>
          <button
            type="button"
            onClick={() => shift(1)}
            aria-label="Próximo mês"
          >
            <ChevronRight size={16} />
          </button>
          <p>Prazos das tarefas do projeto</p>
        </header>
        <div className="project-calendar-week" aria-hidden="true">
          {WEEKDAYS.map((d, i) => (
            <span key={i}>{d}</span>
          ))}
        </div>
        <div className="project-calendar-grid">
          {cells.map((d, i) => {
            const has = d && byDay[d];
            const statuses = has
              ? [...new Set(byDay[d].map(normalizeTaskStatus))]
              : [];
            return (
              <button
                type="button"
                key={i}
                disabled={!d}
                className={`project-calendar-day ${!d ? "is-empty" : ""} ${isToday(d) ? "is-today" : ""} ${d && selected === d ? "is-selected" : ""}`}
                aria-label={
                  d
                    ? `${d} de ${monthLabel}, ${has ? byDay[d].length : 0} tarefa${has?.length === 1 ? "" : "s"}${isToday(d) ? ", hoje" : ""}`
                    : undefined
                }
                aria-pressed={d ? selected === d : undefined}
                aria-current={isToday(d) ? "date" : undefined}
                onClick={() => setSelected(d)}
              >
                <span>{d}</span>
                {has && (
                  <span className="project-calendar-dots">
                    {statuses.map((status) => (
                      <i key={status} data-status={status} />
                    ))}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </motion.section>
      <motion.aside
        className="project-calendar-card project-calendar-side"
        variants={presets.card}
        aria-live="polite"
      >
        <h2>
          {selectedLabel
            ? selectedLabel.charAt(0).toUpperCase() + selectedLabel.slice(1)
            : "Selecione um dia"}
        </h2>
        <p className="project-calendar-caption">
          {selected
            ? `${selectedTasks.length} tarefa${selectedTasks.length === 1 ? "" : "s"} com prazo`
            : "Clique num dia para ver as tarefas."}
        </p>
        {selected &&
          (selectedTasks.length ? (
            <ul className="project-calendar-tasks">
              {selectedTasks.map((t) => {
                const status = normalizeTaskStatus(t),
                  done = status === "done";
                return (
                  <li key={t.id} className={done ? "is-done" : ""}>
                    <span
                      className="project-calendar-task-check"
                      aria-label={done ? "Concluída" : "Não concluída"}
                    >
                      {done ? (
                        <CheckCircle2 size={22} />
                      ) : (
                        <Circle size={22} strokeWidth={1.5} />
                      )}
                    </span>
                    <div>
                      <strong>{mask(t.title)}</strong>
                      <span>
                        {status === "todo"
                          ? "A fazer"
                          : status === "in_progress"
                            ? "Em andamento"
                            : "Concluída"}
                      </span>
                    </div>
                    {t.priority && !done && (
                      <PriorityTag priority={t.priority} />
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <EmptyState
              title="Sem tarefas neste dia"
              description="Selecione outro dia para consultar os prazos."
              icon={CalendarDays}
            />
          ))}
        <div className="project-calendar-legend">
          <span>
            <i data-status="done" />
            Concluída
          </span>
          <span>
            <i data-status="in_progress" />
            Em andamento
          </span>
          <span>
            <i data-status="todo" />A fazer
          </span>
          <span>
            <i className="is-today" />
            Hoje (contorno)
          </span>
        </div>
      </motion.aside>
    </motion.div>
  );
}
