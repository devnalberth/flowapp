import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Play,
  Pause,
  RotateCcw,
  Settings,
  BarChart3,
  ChevronDown,
  MoreHorizontal,
  Pencil,
  Archive,
  Trash2,
  Flag,
  Calendar,
  Timer,
  BookOpen,
  Check,
  ListTodo,
  RefreshCw,
  CheckCircle2,
  Sun,
} from 'lucide-react'
import HeroCard from '../../components/ui/HeroCard.jsx'
import Button from '../../components/ui/Button.jsx'
import ActionMenu from '../../components/ui/ActionMenu.jsx'
import Modal from '../../components/ui/Modal.jsx'
import TaskCheck from '../../components/ui/TaskCheck.jsx'
import AreaChip from '../../components/ui/AreaChip.jsx'
import PriorityTag from '../../components/ui/PriorityTag.jsx'
import StatusBadge from '../../components/ui/StatusBadge.jsx'
import ProgressBar from '../../components/ui/ProgressBar.jsx'
import { Input } from '../../components/ui/Field.jsx'
import { useMotionPresets } from '../../components/ui/motion'
import '../../components/ui/Drawer.css'
import { POMODORO_TECHNIQUES } from '../../hooks/useFocusTimer'
import { parseDateForForm } from '../../components/CreateTaskModal/CreateTaskModal'
import { normalizeTaskStatus } from '../../utils/taskStatus'
import { categorizeTask } from '../../utils/taskCategory'
import { computeProjectStats } from '../../utils/projectMetrics'
import { formatMinutes } from '../../utils/habitStats'

export function TaskFocusCard({
  config,
  activeTechnique,
  onTechnique,
  category,
  onCategory,
  task,
  block,
  tasks,
  onTask,
  onClear,
  time,
  running,
  mode,
  sessions,
  onToggle,
  onReset,
  onDashboard,
  onConfigure,
  mask,
}) {
  return (
    <HeroCard className="tasks-focus">
      <div className="tasks-focus__top">
        <div className="tasks-techniques" role="group" aria-label="Técnica de foco">
          {Object.values(POMODORO_TECHNIQUES).map((tech) => (
            <button
              key={tech.id}
              type="button"
              aria-pressed={activeTechnique === tech.id}
              onClick={() => onTechnique(tech.id)}
            >
              {tech.label}
            </button>
          ))}
        </div>
        <button
          className="tasks-dark-icon"
          onClick={onDashboard}
          aria-label="Painel de produtividade"
        >
          <BarChart3 size={16} />
        </button>
        <button
          className="tasks-dark-icon"
          onClick={onConfigure}
          aria-label="Configurar personalizado"
        >
          <Settings size={16} />
        </button>
      </div>
      <div className="tasks-focus__category">
        <span>Conta em</span>
        {[
          ['work', 'Produtividade'],
          ['study', 'Estudos'],
        ].map(([id, label]) => (
          <button
            key={id}
            type="button"
            aria-pressed={category === id}
            disabled={Boolean(task || block)}
            onClick={() => onCategory(id)}
          >
            {label}
          </button>
        ))}
      </div>
      <div className="tasks-focus__target">
        <span>Focando em</span>
        <ActionMenu
          label="Vincular tarefa ao foco"
          trigger={
            <button type="button">
              {mask(task?.title || block?.title || 'Ciclo livre')}
              <ChevronDown size={14} />
            </button>
          }
          items={[
            { label: 'Ciclo livre', onClick: onClear },
            ...tasks.map((t) => ({ label: mask(t.title), onClick: () => onTask(t.id) })),
          ]}
        />
      </div>
      <div className="tasks-focus__clock">
        <strong>{time}</strong>
        <div>
          <span>
            {mode === 'focus' ? 'Foco' : mode === 'break' ? 'Pausa' : 'Pausa longa'} · sessão{' '}
            {sessions + 1} de {config.sessions}
          </span>
          <div className="tasks-session-dots" aria-hidden="true">
            {Array.from({ length: Math.max(0, Math.min(config.sessions, 12)) }, (_, i) => (
              <i
                key={i}
                className={i < sessions ? 'is-done' : i === sessions ? 'is-current' : ''}
              />
            ))}
          </div>
          <small>
            {mode === 'focus'
              ? `pausa curta de ${config.break} min depois`
              : 'Retome quando estiver pronto.'}
          </small>
        </div>
      </div>
      <div className="tasks-focus__actions">
        <Button variant="accent" icon={running ? Pause : Play} onClick={onToggle}>
          {running ? 'Pausar' : 'Iniciar'}
        </Button>
        <button
          className="tasks-dark-icon tasks-dark-icon--large"
          onClick={onReset}
          aria-label="Reiniciar timer"
        >
          <RotateCcw size={18} />
        </button>
        <span>
          {config.label}: {config.focus} min de foco, {config.break} de pausa, {config.sessions}{' '}
          sessões
        </span>
      </div>
    </HeroCard>
  )
}

function taskContext(task, projects, goals, lessonCtxMap = {}, blockCtxMap = {}) {
  const project = projects.find(
    (p) => p.id === (task.projectId || task.project_id) || p.title === task.project
  )
  const goal = goals.find((g) => g.id === (project?.goalId || project?.goal_id))
  const lesson = lessonCtxMap[task.studyLessonId || task.study_lesson_id]
  const block = blockCtxMap[task.studyModuleId || task.study_module_id]
  const areaValue =
    categorizeTask(task) === 'study' ? 'Estudos' : task.area || project?.area || task.context
  const area = ['Profissional', 'Estudos', 'Pessoal', 'Financeiro', 'Saúde', 'Relacionamento'].find(
    (a) => a.toLowerCase() === areaValue?.toLowerCase() || (a === 'Saúde' && areaValue === 'saude')
  )
  return {
    project,
    goal,
    area,
    title: lesson?.lessonTitle || block?.blockTitle || task.title,
    context:
      lesson?.studyTitle || block?.studyTitle || project?.title || task.project || 'Sem projeto',
  }
}

export function CompactTaskRow({
  task,
  projects,
  goals,
  lessonCtxMap,
  blockCtxMap,
  focused,
  time,
  mask,
  onComplete,
  onFocus,
  onDetails,
  onEdit,
  onArchive,
  onRestore,
  onDelete,
  onMove,
}) {
  const presets = useMotionPresets()
  const ctx = taskContext(task, projects, goals, lessonCtxMap, blockCtxMap)
  const status = normalizeTaskStatus(task),
    done = status === 'done',
    archived = status === 'archived'
  const taskDate = parseDateForForm(task.due_date || task.dueDate)
  const clock = task.time || task.due_time || taskDate.dueTime || '—'
  const now = new Date()
  const todayKey = new Date(now.getTime() - now.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10)
  const late = taskDate.dueDate && taskDate.dueDate < todayKey && !done && !archived
  const items = [
    { label: 'Ver detalhes', icon: ListTodo, onClick: () => onDetails(task) },
    { label: 'Editar', icon: Pencil, onClick: () => onEdit(task) },
    ...(archived
      ? [{ label: 'Restaurar', icon: RotateCcw, onClick: () => onRestore(task.id) }]
      : [{ label: 'Arquivar', icon: Archive, onClick: () => onArchive(task.id) }]),
    { separator: true },
    { label: 'Excluir tarefa', icon: Trash2, danger: true, onClick: () => onDelete(task) },
  ]
  return (
    <motion.div
      className={`tasks-row ${done ? 'is-done' : ''} ${archived ? 'is-archived' : ''} ${focused ? 'is-focused' : ''}`}
      initial={presets.reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      <TaskCheck
        checked={done}
        disabled={archived}
        label={`${done ? 'Reabrir' : 'Concluir'} ${mask(ctx.title)}`}
        onChange={() => onComplete(task.id)}
      />
      <button className="tasks-row__title" onClick={() => onDetails(task)}>
        <strong>{mask(ctx.title)}</strong>
        <span>
          {mask(ctx.context)}
          {ctx.goal && (
            <>
              {' '}
              · <Flag size={12} />
              <em>{mask(ctx.goal.title)}</em>
            </>
          )}
        </span>
      </button>
      <div className="tasks-row__area">
        {ctx.area ? <AreaChip area={ctx.area} /> : <span>—</span>}
      </div>
      <div className="tasks-row__priority">{!done && <PriorityTag priority={task.priority} />}</div>
      <span className="tasks-row__time">{clock}</span>
      <div className="tasks-row__actions">
        {archived ? (
          <Button variant="secondary" size="sm" icon={RotateCcw} onClick={() => onRestore(task.id)}>
            Restaurar
          </Button>
        ) : (
          !done &&
          (focused ? (
            <span className="tasks-row__focused">● Em foco · {time}</span>
          ) : late ? (
            <Button variant="secondary" size="sm" icon={Sun} onClick={() => onMove(task)}>
              Hoje
            </Button>
          ) : (
            <Button variant="secondary" size="sm" icon={Play} onClick={() => onFocus(task.id)}>
              Focar
            </Button>
          ))
        )}
        <ActionMenu
          label={`Ações de ${mask(ctx.title)}`}
          trigger={
            <button type="button" className="tasks-more" aria-label={`Ações de ${mask(ctx.title)}`}>
              <MoreHorizontal size={16} />
            </button>
          }
          items={items}
        />
      </div>
    </motion.div>
  )
}

export function TaskDetailDrawer({
  tasks,
  task,
  projects,
  goals,
  mask,
  onClose,
  onEdit,
  onComplete,
  onArchive,
  onRestore,
  onDelete,
}) {
  if (!task) return null
  const ctx = taskContext(task, projects, goals),
    status = normalizeTaskStatus(task)
  const subtasks = Array.isArray(task.subtasks)
    ? task.subtasks
    : Array.isArray(task.clarifyItems)
      ? task.clarifyItems
      : []
  const done = subtasks.filter((s) => s.done).length
  const taskDate = parseDateForForm(task.due_date || task.dueDate)
  const linked = ctx.goal
    ? projects
        .filter((p) => p.goalId === ctx.goal.id || p.goal_id === ctx.goal.id)
        .map((p) => computeProjectStats(p, tasks))
    : []
  const goalProgress = linked.length
    ? Math.round(linked.reduce((sum, p) => sum + p.progress, 0) / linked.length)
    : Math.round((ctx.goal?.progress || 0) * 100)
  const statusLabel = {
    todo: 'A fazer',
    in_progress: 'Em andamento',
    done: 'Concluída',
    archived: 'Arquivada',
  }[status]
  const items = [
    {
      label: status === 'archived' ? 'Restaurar' : 'Arquivar',
      icon: Archive,
      onClick: () => (status === 'archived' ? onRestore(task.id) : onArchive(task.id)),
    },
    { separator: true },
    { label: 'Excluir tarefa', icon: Trash2, danger: true, onClick: () => onDelete(task) },
  ]
  return (
    <Modal
      drawer
      width={540}
      title="Tarefa"
      className="task-detail"
      headerActions={
        <ActionMenu
          label="Mais ações da tarefa"
          trigger={
            <button className="tasks-more" aria-label="Mais ações da tarefa">
              <MoreHorizontal size={16} />
            </button>
          }
          items={items}
        />
      }
      onClose={onClose}
      footer={
        <>
          <Button variant="secondary" icon={Pencil} onClick={() => onEdit(task)}>
            Editar
          </Button>
          <Button
            icon={Check}
            onClick={() => (status === 'archived' ? onRestore(task.id) : onComplete(task.id))}
          >
            {status === 'archived'
              ? 'Restaurar'
              : status === 'done'
                ? 'Reabrir tarefa'
                : 'Concluir tarefa'}
          </Button>
        </>
      }
    >
      <div className="task-detail__heading">
        <TaskCheck
          checked={status === 'done'}
          disabled={status === 'archived'}
          label={`Concluir ${mask(ctx.title)}`}
          onChange={() => onComplete(task.id)}
        />
        <h3>{mask(ctx.title)}</h3>
      </div>
      <div className="task-detail__badges">
        <PriorityTag priority={task.priority} />
        {ctx.area && <AreaChip area={ctx.area} />}
        <StatusBadge
          tone={status === 'done' ? 'success' : status === 'in_progress' ? 'info' : 'neutral'}
        >
          {statusLabel}
        </StatusBadge>
      </div>
      {ctx.project && (
        <div className="task-detail__hierarchy">
          <p>ISSO CONTA PARA</p>
          <div>
            <span>
              {mask(ctx.project.title)}
              <small>Projeto · {computeProjectStats(ctx.project, tasks).progress}%</small>
            </span>
            {ctx.goal && (
              <>
                <span>›</span>
                <span>
                  {mask(ctx.goal.title)}
                  <small>Meta · {goalProgress}%</small>
                </span>
              </>
            )}
          </div>
        </div>
      )}
      <dl className="task-detail__facts">
        {[
          [
            Calendar,
            'Data',
            taskDate.dueDate
              ? `${new Date(`${taskDate.dueDate}T12:00:00`).toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}${taskDate.dueTime ? ` · ${taskDate.dueTime}` : ''}`
              : 'Sem data',
          ],
          [RefreshCw, 'Status', statusLabel],
          [Timer, 'Tempo de foco', formatMinutes(task.time_spent)],
          [BookOpen, 'Categoria', categorizeTask(task) === 'study' ? 'Estudos' : 'Produtividade'],
        ].map(([Icon, label, value]) => (
          <div key={label}>
            <dt>
              <Icon size={16} />
              {label}
            </dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
      <section className="task-detail__description">
        <h4>Descrição</h4>
        <p>{mask(task.description || 'Sem descrição.')}</p>
      </section>
      {subtasks.length > 0 && (
        <section className="task-detail__subtasks">
          <h4>
            Subtarefas{' '}
            <span>
              {done} de {subtasks.length}
            </span>
          </h4>
          <ProgressBar value={done} max={subtasks.length} />
          {subtasks.map((s, i) => (
            <div key={s.id || i}>
              <TaskCheck checked={s.done} disabled label={s.title || s.label || 'Subtarefa'} />
              <span className={s.done ? 'is-done' : ''}>
                {mask(s.title || s.label || 'Subtarefa')}
              </span>
            </div>
          ))}
        </section>
      )}
    </Modal>
  )
}

export function PomodoroConfigModal({ show, config, onClose, onSave }) {
  const [local, setLocal] = useState(config)
  useEffect(() => {
    if (config) setLocal(config)
  }, [config])
  if (!show) return null
  const total =
    local.focus * local.sessions + local.break * Math.max(0, local.sessions - 1) + local.longBreak
  return (
    <Modal
      title="Configurar Personalizado"
      subtitle="Seu próprio ritmo de foco e pausa."
      icon={Settings}
      width={480}
      onClose={onClose}
      hint="Enter salva · Esc cancela"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="custom-focus-form">
            Salvar
          </Button>
        </>
      }
    >
      <form
        id="custom-focus-form"
        onSubmit={(e) => {
          e.preventDefault()
          onSave(local)
        }}
        className="tasks-config"
      >
        <div className="tasks-config__fields">
          {[
            ['focus', 'Foco (minutos)'],
            ['break', 'Pausa curta (min)'],
            ['longBreak', 'Pausa longa (min)'],
            ['sessions', 'Sessões até a pausa longa'],
          ].map(([key, label]) => (
            <Input
              key={key}
              label={label}
              type="number"
              value={local[key]}
              onChange={(e) => setLocal({ ...local, [key]: Number(e.target.value) })}
            />
          ))}
        </div>
        <div className="tasks-config__preview">
          <strong>PRÉVIA DO CICLO</strong>
          <div>
            {Array.from({ length: Math.max(0, Math.min(12, local.sessions)) }, (_, i) => (
              <span key={i} style={{ flex: Math.max(1, local.focus) }}>
                <i />
                <b
                  style={{
                    flex: Math.max(1, i === local.sessions - 1 ? local.longBreak : local.break),
                  }}
                />
              </span>
            ))}
          </div>
          <p>
            {local.sessions} sessões de {local.focus} min · {formatMinutes(total)} por ciclo com
            pausas
          </p>
        </div>
      </form>
    </Modal>
  )
}
