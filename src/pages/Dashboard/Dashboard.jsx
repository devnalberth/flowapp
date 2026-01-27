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
    // Definindo "Hoje" (meia-noite local)
    const now = new Date()
    const today = new Date(now)
    today.setHours(0, 0, 0, 0)

    // Definindo "Início da Semana" (Domingo à 00:00)
    const dayOfWeek = now.getDay()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - dayOfWeek)
    weekStart.setHours(0, 0, 0, 0)

    const safeTasks = Array.isArray(tasks) ? tasks : []

    // 1. TAREFAS DE HOJE (TOTAL AGENDADO PARA HOJE)
    // Filtra tarefas com data = hoje (inclui feitas e não feitas)
    const tasksTodayAll = safeTasks.filter(task => {
      if (task.status === 'archived' || !task.due_date) return false

      let dueDate = new Date(task.due_date)
      dueDate.setHours(0, 0, 0, 0)

      // Correção de fuso horário
      const timezoneOffset = dueDate.getTimezoneOffset() * 60000
      if (task.due_date.includes('T00:00:00') && timezoneOffset > 0) {
        dueDate = new Date(dueDate.getTime() + timezoneOffset)
        dueDate.setHours(0, 0, 0, 0)
      }

      return dueDate.getTime() === today.getTime()
    })

    // KPI 1: Total Hoje
    const totalToday = tasksTodayAll.length

    // KPI 2: Pendentes Hoje (Subset de tasksTodayAll)
    const pendingToday = tasksTodayAll.filter(t => !t.completed && t.status !== 'done').length

    // KPI 3: Finalizadas na Semana (Qualquer tarefa feita >= Domingo)
    const doneWeek = safeTasks.filter(task => {
      // Deve estar completa
      if (!task.completed && task.status !== 'done') return false
      // Deve ter data de conclusão recente
      const dateRef = task.updated_at ? new Date(task.updated_at) : new Date(task.created_at)
      return dateRef >= weekStart
    }).length

    // Streak dos hábitos
    const streakDays = safeHabits.reduce((max, habit) => {
      return Math.max(max, habit.current_streak || 0)
    }, 0)

    return {
      totalToday,
      pendingToday,
      doneWeek,
      streakDays,
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
          <div className="txt-h1">Bem-vindo de volta, {user?.name?.split(' ')[0] || 'Nalberth'} 👋</div>
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
                onClick={() => onNavigate('Tarefas', { initialFilter: 'today' })}
              />
              <StatCard
                title="Tarefas Pendentes"
                value={kpis.pendingToday}
                variant="pending"
                onClick={() => onNavigate('Tarefas', { initialFilter: 'today' })}
              />
              <StatCard
                title="Tarefas Finalizadas"
                value={kpis.doneWeek}
                variant="done"
                onClick={() => onNavigate('Tarefas', { initialFilter: 'done' })}
              />
              <NextMeetingCard events={events || []} onEditEvent={handleEditEvent} />
            </section>

            <main className="dash__grid">
              <ProjectOverviewCard className="bento bento--project" projects={projects || []} tasks={tasks || []} />
              <ProductivityCard className="bento bento--productivity" tasks={tasks || []} />
              <ChatbotCard className="bento bento--chat" />
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