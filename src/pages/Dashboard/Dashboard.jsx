import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import TopNav from '../../components/TopNav/TopNav.jsx'
import StatCard from '../../components/StatCard/StatCard.jsx'
import NextMeetingCard from '../../components/NextMeetingCard/NextMeetingCard.jsx'
import ChatbotCard from '../../components/ChatbotCard/ChatbotCard.jsx'
import ProjectOverviewCard from '../../components/ProjectOverviewCard/ProjectOverviewCard.jsx'
import ProductivityCard from '../../components/ProductivityCard/ProductivityCard.jsx'
import CalendarCard from '../../components/CalendarCard/CalendarCard.jsx'
import GoalsHabitsCard from '../../components/GoalsHabitsCard/GoalsHabitsCard.jsx'
import CreateTaskModal from '../../components/CreateTaskModal/CreateTaskModal.jsx'
import CreateEventModal from '../../components/CreateEventModal/CreateEventModal.jsx'
import FloatingCreateButton from '../../components/FloatingCreateButton/FloatingCreateButton.jsx'
import { Calendar, CheckCircle2 } from 'lucide-react'

import './Dashboard.css'

export default function Dashboard({ onNavigate, onLogout, user }) {
  // Garantimos valores padrão vazios caso o contexto falhe momentaneamente
  const {
    tasks = [], projects = [], goals = [], habits = [], finances = [], events = [], loading,
    addTask, addEvent, updateEvent, deleteEvent
  } = useApp()

  const [isTaskModalOpen, setTaskModalOpen] = useState(false)
  const [isEventModalOpen, setEventModalOpen] = useState(false)

  // Estado para edição de evento
  const [editingEvent, setEditingEvent] = useState(null)

  // 1. CAMADA DE SEGURANÇA (FIREWALL DE DADOS)
  // Normaliza os hábitos para garantir que arrays existam, evitando erros visuais
  const safeHabits = useMemo(() => {
    if (!Array.isArray(habits)) return []

    return habits.map(h => {
      // O serviço novo usa 'completions', o antigo usava 'completed_dates'
      // Vamos garantir que AMBOS existam e sejam arrays
      const datesArray = Array.isArray(h.completions)
        ? h.completions
        : (Array.isArray(h.completed_dates) ? h.completed_dates : [])

      return {
        ...h,
        completions: datesArray,     // Novo padrão
        completed_dates: datesArray, // Compatibilidade com código legado
        current_streak: h.currentStreak || h.current_streak || 0, // Garante streak numérico
      }
    })
  }, [habits])

  const kpis = useMemo(() => {
    const now = new Date()

    const dayKeyOf = (date) => {
      const off = date.getTimezoneOffset()
      return new Date(date.getTime() - off * 60000).toISOString().split('T')[0]
    }

    // Campos de CALENDÁRIO (due_date): a data literal da string é a intenção
    const toDayKey = (value) => {
      if (!value) return null
      const s = String(value)
      if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10)
      const d = new Date(s)
      return Number.isNaN(d.getTime()) ? null : dayKeyOf(d)
    }

    // Campos de TIMESTAMP (completed_at/updated_at): sempre o dia LOCAL do instante
    const tsKey = (value) => {
      if (!value) return null
      const d = new Date(value)
      return Number.isNaN(d.getTime()) ? null : dayKeyOf(d)
    }

    const todayKey = dayKeyOf(now)

    // Últimos 7 dias (para os mini-gráficos dos KPIs)
    const last7 = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(now.getDate() - i)
      last7.push({
        key: dayKeyOf(d),
        label: d.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric' }),
      })
    }

    // Início da semana (domingo)
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay())
    weekStart.setHours(0, 0, 0, 0)
    const weekStartKey = dayKeyOf(weekStart)

    const safeTasks = (Array.isArray(tasks) ? tasks : []).filter(t => t.status !== 'archived')
    const isDone = (t) => t.completed || t.status === 'done'
    // Data de conclusão real quando existe; updated_at só como fallback legado
    const doneKey = (t) => tsKey(t.completed_at || t.updated_at || t.created_at)

    // 1. TAREFAS DE HOJE (agendadas para hoje, feitas ou não)
    const tasksTodayAll = safeTasks.filter(t => toDayKey(t.due_date) === todayKey)
    const totalToday = tasksTodayAll.length

    // 2. PENDENTES HOJE
    const pendingToday = tasksTodayAll.filter(t => !isDone(t)).length

    // 3. FINALIZADAS NA SEMANA (desde domingo)
    const doneWeek = safeTasks.filter(t => {
      if (!isDone(t)) return false
      const k = doneKey(t)
      return k && k >= weekStartKey
    }).length

    // Mini-gráficos: últimos 7 dias
    const trendToday = last7.map(({ key, label }) => ({
      label,
      value: safeTasks.filter(t => toDayKey(t.due_date) === key).length,
    }))
    const trendPending = last7.map(({ key, label }) => ({
      label,
      value: safeTasks.filter(t => toDayKey(t.due_date) === key && !isDone(t)).length,
    }))
    const trendDone = last7.map(({ key, label }) => ({
      label,
      value: safeTasks.filter(t => isDone(t) && doneKey(t) === key).length,
    }))

    // Streak dos hábitos
    const streakDays = safeHabits.reduce((max, habit) => {
      return Math.max(max, habit.current_streak || 0)
    }, 0)

    return {
      totalToday,
      pendingToday,
      doneWeek,
      streakDays,
      trendToday,
      trendPending,
      trendDone,
    }
  }, [tasks, safeHabits])

  const handleEditEvent = (event) => {
    setEditingEvent(event)
    setEventModalOpen(true)
  }

  const handleEventSubmit = async (data) => {
    if (editingEvent) {
      await updateEvent(editingEvent.id, data)
    } else {
      await addEvent(data)
    }
    setEventModalOpen(false)
    setEditingEvent(null)
  }

  const handleDeleteEvent = async () => {
    if (editingEvent && confirm('Tem certeza que deseja excluir este evento?')) {
      await deleteEvent(editingEvent.id)
      setEventModalOpen(false)
      setEditingEvent(null)
    }
  }

  return (
    <div className="dash">
      <TopNav user={user} active="Dashboard" onNavigate={onNavigate} onLogout={onLogout} />

      <div className="dashWrapper">
        <header className="dash__welcome">
          <div className="txt-h1">Bem-vindo de volta{user?.name ? `, ${user.name.split(' ')[0]}` : ''} 👋</div>
          <div className="txt-lead">
            {loading ? (
              'Sincronizando seus dados...'
            ) : kpis.pendingToday > 0 ? (
              `Você tem ${kpis.pendingToday} tarefa${kpis.pendingToday > 1 ? 's' : ''} pendente${kpis.pendingToday > 1 ? 's' : ''} para hoje!`
            ) : (
              `Tudo em dia! Aproveite para adiantar algo ou descansar.`
            )}
          </div>
        </header>

        {loading ? (
          <div style={{ padding: '4rem', textAlign: 'center', color: '#666', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: 24, height: 24, borderRadius: '50%', border: '3px solid #ccc', borderTopColor: '#000', animation: 'spin 1s infinite linear' }}></div>
            <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <>
            <section className="dash__kpis">
              <StatCard
                title="Tarefas de Hoje"
                value={kpis.totalToday}
                variant="total"
                trend={kpis.trendToday}
                onClick={() => onNavigate('Tarefas', { initialFilter: 'today' })}
              />
              <StatCard
                title="Pendentes Hoje"
                value={kpis.pendingToday}
                variant="pending"
                trend={kpis.trendPending}
                onClick={() => onNavigate('Tarefas', { initialFilter: 'today' })}
              />
              <StatCard
                title="Finalizadas na Semana"
                value={kpis.doneWeek}
                variant="done"
                trend={kpis.trendDone}
                onClick={() => onNavigate('Tarefas', { initialFilter: 'done' })}
              />
              <NextMeetingCard events={events || []} onEditEvent={handleEditEvent} />
            </section>

            <main className="dash__grid">
              <ProjectOverviewCard className="bento bento--project" projects={projects || []} tasks={tasks || []} />
              <ProductivityCard className="bento bento--productivity" tasks={tasks || []} />
              <ChatbotCard
                className="bento bento--chat"
                user={user}
                onOpenFlowChat={() => onNavigate('FlowChat')}
              />
              {/* Passamos safeHabits aqui para evitar o erro .includes dentro do card */}
              <GoalsHabitsCard className="bento bento--goals" goals={goals || []} habits={safeHabits} />
              <CalendarCard
                className="bento bento--calendar"
                tasks={tasks || []}
                habits={safeHabits}
                finances={finances || []}
                events={events || []}
                onEditEvent={handleEditEvent}
              />
            </main>
          </>
        )}
      </div>

      <FloatingCreateButton
        label="Criar novo"
        options={[
          { label: 'Nova Tarefa', icon: CheckCircle2, onClick: () => setTaskModalOpen(true), color: '#3b82f6' },
          { label: 'Novo Evento', icon: Calendar, onClick: () => { setEditingEvent(null); setEventModalOpen(true); }, color: '#f59e0b' }
        ]}
      />

      {isTaskModalOpen && (
        <CreateTaskModal
          open={true}
          onClose={() => setTaskModalOpen(false)}
          onSubmit={async (data) => {
            await addTask(data)
            setTaskModalOpen(false)
          }}
          projectsOptions={projects.map(p => ({ id: p.id, label: p.title }))}
        />
      )}

      {isEventModalOpen && (
        <CreateEventModal
          open={true}
          onClose={() => { setEventModalOpen(false); setEditingEvent(null); }}
          onSubmit={handleEventSubmit}
          onDelete={handleDeleteEvent}
          initialData={editingEvent}
        />
      )}
    </div>
  )
}