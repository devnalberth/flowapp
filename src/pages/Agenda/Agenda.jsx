import { useEffect, useMemo, useState } from 'react'
import { ArrowUpRight, CalendarDays, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { useApp } from '../../context/AppContext'
import { usePageActions } from '../../context/ShellContext'
import { localDateKey } from '../../utils/habitStats'
import Button from '../../components/ui/Button'
import HeroCard from '../../components/ui/HeroCard'
import CardHeader from '../../components/ui/CardHeader'
import EmptyState from '../../components/ui/EmptyState'
import { Segmented } from '../../components/ui/Tabs'
import { useMotionPresets } from '../../components/ui/motion'
import { useToast } from '../../components/ui/ToastProvider'
import CreateEventModal from '../../components/CreateEventModal/CreateEventModal'
import ConfirmModal from '../../components/ui/ConfirmModal'
import { agendaItems, eventStart, monthDays, maskAgendaText } from './agendaPresentation'
import AgendaTimeline from './AgendaTimeline'
import EventDetailDrawer from './EventDetailDrawer'
import AgendaMiniCalendar from './AgendaMiniCalendar'
import { normalizeTaskStatus } from '../../utils/taskStatus'
import './Agenda.css'

const WEEKDAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
const FILTERS = [
  { kind: 'event', label: 'Eventos' },
  { kind: 'task', label: 'Tarefas' },
  { kind: 'bill', label: 'Contas' },
]
const money = (amount, hidden) =>
  hidden
    ? 'R$ ••••'
    : new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 2,
      }).format(amount)
const capital = (text) => text.charAt(0).toUpperCase() + text.slice(1)
const eventTypes = { meeting: 'Reunião', workout: 'Treino', event: 'Evento', default: 'Evento' }

export default function Agenda({ onNavigate }) {
  const {
    tasks = [],
    events = [],
    finances = [],
    financeCards = [],
    prefs = {},
    projects = [],
    loading = false,
    updateTask,
    addEvent,
    updateEvent,
    deleteEvent,
  } = useApp()
  const [now, setNow] = useState(() => new Date())
  const [view, setView] = useState('month')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [selected, setSelected] = useState(() => localDateKey(new Date()))
  const [filters, setFilters] = useState({ event: true, task: true, bill: true })
  const [detailId, setDetailId] = useState(null)
  const [editor, setEditor] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [busyTask, setBusyTask] = useState(null)
  const [busy, setBusy] = useState(false)
  const notify = useToast()
  const presets = useMotionPresets()
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])
  const items = useMemo(
    () => agendaItems(tasks, events, finances, financeCards, now),
    [tasks, events, finances, financeCards, now]
  )
  const mask = (value) => maskAgendaText(value, prefs.hideFinanceValues)
  const visible = items
    .filter((item) => filters[item.kind])
    .map((item) => ({ ...item, title: mask(item.title) }))
  const weekStart = new Date(currentDate)
  weekStart.setDate(weekStart.getDate() - weekStart.getDay())
  const weekDays = Array.from(
    { length: 7 },
    (_, i) => new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + i)
  )
  const days = monthDays(currentDate)
  const byDay = new Map()
  for (const item of visible) {
    if (!byDay.has(item.day)) byDay.set(item.day, [])
    byDay.get(item.day).push(item)
  }
  const selectedItems = byDay.get(selected) || []
  const today = localDateKey(now)
  const nextEvent = events
    .map((event) => ({ event, start: eventStart(event) }))
    .filter((item) => item.start && item.start >= now)
    .sort((a, b) => a.start - b.start)[0]
  const minutes = nextEvent ? Math.ceil((nextEvent.start - now) / 60000) : 0
  const nextLabel =
    minutes >= 1440
      ? `EM ${Math.floor(minutes / 1440)} DIAS`
      : minutes >= 60
        ? `EM ${Math.floor(minutes / 60)}H${minutes % 60 ? String(minutes % 60).padStart(2, '0') : ''}`
        : minutes
          ? `EM ${minutes} MIN`
          : 'AGORA'
  const summaryOf = (entries) =>
    [
      { kind: 'task', one: 'tarefa', many: 'tarefas' },
      { kind: 'event', one: 'evento', many: 'eventos' },
      { kind: 'bill', one: 'conta', many: 'contas' },
    ]
      .map(({ kind, one, many }) => {
        const n = entries.filter((item) => item.kind === kind).length
        return `${n} ${n === 1 ? one : many}`
      })
      .join(' · ')
  const toggleTask = async (task) => {
    if (busyTask) return
    setBusyTask(task.id)
    const completed = !task.completed
    const status = normalizeTaskStatus(task)
    try {
      await updateTask(task.id, {
        completed,
        status: completed ? 'done' : status === 'done' ? 'todo' : status,
        completed_at: completed ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      notify?.({ title: completed ? 'Tarefa concluída' : 'Tarefa reaberta' })
    } catch {
      notify?.({
        title: 'Não foi possível atualizar a tarefa',
        detail: 'Tente novamente.',
        tone: 'danger',
      })
    } finally {
      setBusyTask(null)
    }
  }
  const selectDay = (key) => {
    setSelected(key)
    setCurrentDate(new Date(`${key}T12:00:00`))
  }
  const changeView = (next) => {
    if (next === 'day' && view === 'month') setCurrentDate(new Date(`${selected}T12:00:00`))
    else if (next === 'day') setSelected(localDateKey(currentDate))
    setView(next)
  }
  const openNew = () => setEditor({ event: null })
  usePageActions({ label: 'Novo evento', onClick: openNew, disabled: loading })
  const openItem = (item) => {
    if (item.kind === 'event') setDetailId(item.source.id)
    else
      onNavigate?.(
        item.kind === 'task' ? 'Tarefas' : 'Financeiro',
        item.kind === 'task'
          ? { initialFilter: item.done ? 'done' : item.day === today ? 'today' : null }
          : {}
      )
  }
  const navigateMonth = (direction) =>
    setCurrentDate((date) =>
      view === 'month'
        ? new Date(date.getFullYear(), date.getMonth() + direction, 1)
        : new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate() + direction * (view === 'week' ? 7 : 1)
          )
    )
  const periodLabel =
    view === 'day'
      ? capital(
          currentDate
            .toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })
            .replace('-feira', '')
        )
      : view === 'month'
        ? capital(
            currentDate
              .toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
              .replace(' de ', ' ')
          )
        : `${weekDays[0].getDate()} – ${weekDays[6].toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}`
  const filterControls = (
    <div className="agenda-filters">
      <span>Mostrar</span>
      {FILTERS.map(({ kind, label }) => (
        <button
          key={kind}
          type="button"
          className={`agenda-filter agenda-${kind}`}
          aria-pressed={filters[kind]}
          onClick={() => setFilters((state) => ({ ...state, [kind]: !state[kind] }))}
        >
          <i>{filters[kind] && <Check size={10} strokeWidth={2} />}</i>
          {label}
        </button>
      ))}
    </div>
  )
  const goToday = () => {
    setCurrentDate(new Date())
    setSelected(localDateKey(new Date()))
  }
  const submitEvent = async (data) => {
    try {
      if (editor.event) await updateEvent(editor.event.id, data)
      else await addEvent(data)
      setEditor(null)
      notify?.({ title: editor.event ? 'Evento atualizado' : 'Evento criado' })
    } catch {
      notify?.({
        title: 'Não foi possível salvar o evento',
        detail: 'Tente novamente.',
        tone: 'danger',
      })
    }
  }
  const removeEvent = async () => {
    setBusy(true)
    try {
      await deleteEvent(detailId || editor.event.id)
      setConfirmDelete(false)
      setDetailId(null)
      setEditor(null)
      notify?.({ title: 'Evento excluído' })
    } catch {
      notify?.({
        title: 'Não foi possível excluir o evento',
        detail: 'Tente novamente.',
        tone: 'danger',
      })
    } finally {
      setBusy(false)
    }
  }
  const nextHero = (
    <motion.div variants={presets.card}>
      <HeroCard className="agenda-next">
        <span className="agenda-next-badge">{nextEvent ? nextLabel : 'SUA AGENDA'}</span>
        <h2>{nextEvent ? mask(nextEvent.event.title) : 'Espaço para o que importa'}</h2>
        <p>
          {nextEvent
            ? [
                nextEvent.event.isAllDay
                  ? 'Dia todo'
                  : `${(nextEvent.event.time || '').slice(0, 5)}${nextEvent.event.endTime ? '–' + nextEvent.event.endTime.slice(0, 5) : ''}`,
                mask(nextEvent.event.location),
                nextEvent.event.reminderMinutes != null
                  ? `lembrete ${nextEvent.event.reminderMinutes} min antes`
                  : '',
              ]
                .filter(Boolean)
                .join(' · ')
            : 'Seus próximos compromissos aparecem aqui.'}
        </p>
        <Button
          className="agenda-next-action"
          size="sm"
          onClick={nextEvent ? () => setDetailId(nextEvent.event.id) : openNew}
        >
          {nextEvent ? 'Ver detalhes' : 'Novo evento'}
          <ArrowUpRight size={14} strokeWidth={1.75} />
        </Button>
      </HeroCard>
    </motion.div>
  )
  const daySummary = (dayKey, entries) => (
    <motion.section
      className={`agenda-day ${view === 'day' ? 'agenda-day--tomorrow' : ''}`}
      variants={presets.card}
      aria-label="Resumo do dia selecionado"
    >
      <CardHeader
        title={capital(
          `${dayKey === today ? 'Hoje, ' : dayKey === localDateKey(new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)) ? 'Amanhã, ' : ''}${new Date(`${dayKey}T12:00:00`).toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric' }).replace('-feira', '').replace(',', '')}`
        )}
        subtitle={summaryOf(entries)}
      />
      {entries.some((item) => item.kind === 'bill') && (
        <button
          type="button"
          className="agenda-all-day agenda-bill"
          onClick={() => onNavigate?.('Financeiro')}
        >
          <span>Dia todo</span>
          <strong>
            {entries
              .filter((item) => item.kind === 'bill')
              .map((item) => `${item.title} · ${money(item.amount, prefs.hideFinanceValues)}`)
              .join(' · ')}
          </strong>
        </button>
      )}
      {entries
        .filter((item) => !item.time && item.kind !== 'bill')
        .map((item) => (
          <button
            type="button"
            key={item.key}
            className={`agenda-all-day agenda-${item.kind}`}
            onClick={() => openItem(item)}
          >
            <span>Dia todo</span>
            <strong>
              {item.title}
              {item.kind === 'bill' && ` · ${money(item.amount, prefs.hideFinanceValues)}`}
            </strong>
          </button>
        ))}
      {entries
        .filter((item) => item.time)
        .map((item) => (
          <button
            type="button"
            key={item.key}
            className={`agenda-day-item agenda-${item.kind} ${item.done ? 'is-done' : ''}`}
            onClick={() => openItem(item)}
          >
            <time>{item.time}</time>
            <i />
            <span>
              <strong>{item.title}</strong>
              <small>
                {item.kind === 'event'
                  ? [eventTypes[item.source.type] || 'Evento', mask(item.source.location)]
                      .filter(Boolean)
                      .join(' · ')
                  : 'Tarefa'}
              </small>
            </span>
          </button>
        ))}
      {!entries.length && (
        <EmptyState
          icon={CalendarDays}
          title="Dia sem compromissos"
          description="Escolha outro dia ou adicione um evento à sua agenda."
          action="Novo evento"
          onAction={openNew}
        />
      )}
    </motion.section>
  )
  const detailEvent = events.find((event) => event.id === detailId)
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1)
  if (loading)
    return (
      <div className="agenda-page agenda-loading" aria-busy="true">
        <span className="fa-sr-only" role="status">
          Carregando agenda…
        </span>
        <div className="agenda-loading-header" aria-hidden="true">
          <h1>Agenda</h1>
          <p>Compromissos, tarefas com data e contas no mesmo calendário.</p>
        </div>
        <div className="agenda-grid" aria-hidden="true">
          <div className="agenda-loading-calendar" />
          <div className="agenda-aside">
            <div className="agenda-loading-hero" />
            <div className="agenda-loading-day" />
          </div>
        </div>
      </div>
    )
  return (
    <div className="agenda-page">
      <motion.header
        className="agenda-header"
        initial="hidden"
        animate="show"
        variants={presets.row}
      >
        <div>
          <h1>Agenda</h1>
          <p>Compromissos, tarefas com data e contas no mesmo calendário.</p>
        </div>
        <div className="agenda-controls">
          <button
            type="button"
            className="agenda-nav"
            aria-label={
              view === 'month'
                ? 'Mês anterior'
                : view === 'week'
                  ? 'Semana anterior'
                  : 'Dia anterior'
            }
            onClick={() => navigateMonth(-1)}
          >
            <ChevronLeft size={16} strokeWidth={1.75} />
          </button>
          <strong aria-live="polite">{periodLabel}</strong>
          <button
            type="button"
            className="agenda-nav"
            aria-label={
              view === 'month' ? 'Próximo mês' : view === 'week' ? 'Próxima semana' : 'Próximo dia'
            }
            onClick={() => navigateMonth(1)}
          >
            <ChevronRight size={16} strokeWidth={1.75} />
          </button>
          <Button variant="secondary" size="sm" onClick={goToday}>
            Hoje
          </Button>
          <Segmented
            label="Visão da agenda"
            value={view}
            onChange={changeView}
            options={[
              { value: 'month', label: 'Mês' },
              { value: 'week', label: 'Semana' },
              { value: 'day', label: 'Dia' },
            ]}
          />
        </div>
      </motion.header>
      {view === 'month' ? (
        <motion.div className="agenda-grid" initial="hidden" animate="show" variants={presets.grid}>
          <motion.section
            className="agenda-month"
            aria-label="Calendário do mês"
            variants={presets.card}
          >
            {filterControls}
            <div className="agenda-weekdays" aria-hidden="true">
              {WEEKDAYS.map((day) => (
                <span key={day}>{day}</span>
              ))}
            </div>
            <div
              className="agenda-month-grid"
              role="group"
              aria-label={currentDate.toLocaleDateString('pt-BR', {
                month: 'long',
                year: 'numeric',
              })}
            >
              {days.map((date) => {
                const key = localDateKey(date)
                const dayItems = byDay.get(key) || []
                // Completed tasks stay in the daily agenda, leaving month cells readable.
                const preview = dayItems.filter((item) => !item.done)
                return (
                  <div
                    key={key}
                    className={`agenda-cell ${date.getMonth() !== currentDate.getMonth() ? 'is-outside' : ''} ${key === selected ? 'is-selected' : ''}`}
                  >
                    <button
                      type="button"
                      className={`agenda-cell-day ${key === today ? 'is-today' : ''}`}
                      aria-label={date.toLocaleDateString('pt-BR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                      aria-pressed={key === selected}
                      aria-current={key === today ? 'date' : undefined}
                      onClick={() => setSelected(key)}
                    >
                      {date.getDate()}
                    </button>
                    <div className="agenda-cell-items">
                      {preview.slice(0, 2).map((item) => (
                        <button
                          type="button"
                          key={item.key}
                          className={`agenda-chip agenda-${item.kind}`}
                          title={`${item.time ? item.time + ' ' : ''}${item.title}${item.kind === 'bill' ? ' · ' + money(item.amount, prefs.hideFinanceValues) : ''}`}
                          onClick={() => {
                            setSelected(key)
                            openItem(item)
                          }}
                        >
                          {item.time && `${item.time} `}
                          {item.title}
                          {item.kind === 'bill' &&
                            ` · ${money(item.amount, prefs.hideFinanceValues)}`}
                        </button>
                      ))}
                    </div>
                    {preview.length > 2 && (
                      <button
                        type="button"
                        className="agenda-cell-more"
                        onClick={() => setSelected(key)}
                      >
                        +{preview.length - 2} mais
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </motion.section>
          <div className="agenda-aside">
            {nextHero}
            {daySummary(selected, selectedItems)}
          </div>
        </motion.div>
      ) : view === 'week' ? (
        <motion.section
          className="agenda-week"
          initial="hidden"
          animate="show"
          variants={presets.card}
        >
          {filterControls}
          <AgendaTimeline
            hideValues={prefs.hideFinanceValues}
            days={weekDays}
            items={visible}
            now={now}
            onSelectDay={(key) => {
              selectDay(key)
              setView('day')
            }}
            onOpen={openItem}
            formatMoney={(amount) => money(amount, prefs.hideFinanceValues)}
          />
        </motion.section>
      ) : (
        <motion.div
          className="agenda-grid agenda-grid--day"
          initial="hidden"
          animate="show"
          variants={presets.grid}
        >
          <motion.section className="agenda-day-timeline" variants={presets.card}>
            {filterControls}
            <AgendaTimeline
              days={[currentDate]}
              items={visible}
              now={now}
              onOpen={openItem}
              formatMoney={(amount) => money(amount, prefs.hideFinanceValues)}
              onNewEvent={openNew}
              dayView
              projects={projects}
              hideValues={prefs.hideFinanceValues}
              onToggleTask={toggleTask}
              busyTask={busyTask}
            />
          </motion.section>
          <div className="agenda-aside">
            {nextHero}
            <motion.div variants={presets.card}>
              <AgendaMiniCalendar
                date={currentDate}
                selected={localDateKey(currentDate)}
                today={today}
                items={visible}
                onSelect={selectDay}
              />
            </motion.div>
            {daySummary(localDateKey(tomorrow), byDay.get(localDateKey(tomorrow)) || [])}
          </div>
        </motion.div>
      )}
      {detailEvent && !editor && (
        <EventDetailDrawer
          event={detailEvent}
          now={now}
          hideValues={prefs.hideFinanceValues}
          onClose={() => setDetailId(null)}
          onEdit={() => setEditor({ event: detailEvent })}
          onDelete={() => setConfirmDelete(true)}
        />
      )}
      <CreateEventModal
        open={!!editor}
        onClose={() => setEditor(null)}
        initialData={editor?.event || null}
        onSubmit={submitEvent}
        onDelete={() => setConfirmDelete(true)}
      />
      {confirmDelete && (
        <ConfirmModal
          title="Excluir evento?"
          message="O evento será removido da sua agenda. Essa ação não pode ser desfeita."
          confirmLabel="Excluir evento"
          danger
          pending={busy}
          onConfirm={removeEvent}
          onCancel={() => setConfirmDelete(false)}
        />
      )}
    </div>
  )
}
