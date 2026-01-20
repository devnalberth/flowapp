import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import TopNav from '../../components/TopNav/TopNav.jsx'
import StatCard from '../../components/StatCard/StatCard.jsx'
import NextMeetingCard from '../../components/NextMeetingCard/NextMeetingCard.jsx'
import ChatbotCard from '../../components/ChatbotCard/ChatbotCard.jsx'
import ProjectOverviewCard from '../../components/ProjectOverviewCard/ProjectOverviewCard.jsx'
import ProductivityCard from '../../components/ProductivityCard/ProductivityCard.jsx'
import CalendarCard from '../../components/CalendarCard/CalendarCard.jsx'
import GoalsHabitsCard from '../../components/GoalsHabitsCard/GoalsHabitsCard.jsx'

import './Dashboard.css'

export default function Dashboard({ onNavigate, onLogout, user }) {
  // Garantimos valores padrão vazios caso o contexto falhe
  const { tasks = [], projects = [], goals = [], habits = [], loading } = useApp()

  // 1. CAMADA DE SEGURANÇA (FIREWALL DE DADOS)
  // Normaliza os hábitos para garantir que arrays existam, evitando o erro .includes
  const safeHabits = useMemo(() => {
    if (!Array.isArray(habits)) return []
    
    return habits.map(h => {
      // O serviço novo usa 'completions', o antigo usava 'completed_dates'
      // Vamos garantir que AMBOS existam e sejam arrays para não quebrar o componente filho
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
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    // Proteção extra: tasks pode ser undefined no primeiro render
    const safeTasks = Array.isArray(tasks) ? tasks : []

    const tasksToday = safeTasks.filter(task => {
      if (!task.due_date) return false
      const dueDate = new Date(task.due_date)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate.getTime() === today.getTime()
    }).length

    const pending = safeTasks.filter(task => task.status !== 'done').length
    const done = safeTasks.filter(task => task.status === 'done').length

    // Calcular maior streak dos hábitos usando os dados seguros
    const streakDays = safeHabits.reduce((max, habit) => {
      return Math.max(max, habit.current_streak || 0)
    }, 0)

    return {
      total: safeTasks.length,
      pending,
      done,
      tasksToday,
      streakDays,
    }
  }, [tasks, safeHabits])

  return (
    <div className="dash">
      <TopNav user={user} active="Dashboard" onNavigate={onNavigate} onLogout={onLogout} />

      <div className="dashWrapper">
        <header className="dash__welcome">
          <div className="txt-h1">Bem-vindo de volta, {user?.name?.split(' ')[0] || 'Nalberth'} 👋</div>
          <div className="txt-lead">
            {loading ? (
              'Sincronizando seus dados...'
            ) : kpis.tasksToday > 0 ? (
              `Você tem ${kpis.tasksToday} tarefa${kpis.tasksToday > 1 ? 's' : ''} para hoje e está com um streak de ${kpis.streakDays} dias!`
            ) : (
              `Nenhuma tarefa para hoje. Seu maior streak é de ${kpis.streakDays} dias!`
            )}
          </div>
        </header>

        {/* Se estiver carregando, mostramos um estado visual mais leve ou evitamos renderizar componentes complexos */}
        {loading ? (
           <div style={{ padding: '2rem', textAlign: 'center', color: '#666' }}>
             Carregando dashboard...
           </div>
        ) : (
          <>
            <section className="dash__kpis">
              <StatCard title="Tarefas Totais" value={kpis.total} variant="total" />
              <StatCard title="Tarefas Pendentes" value={kpis.pending} variant="pending" />
              <StatCard title="Tarefas Finalizadas" value={kpis.done} variant="done" />
              <NextMeetingCard meeting={null} />
            </section>

            <main className="dash__grid">
              <ProjectOverviewCard className="bento bento--project" projects={projects || []} />
              <ProductivityCard className="bento bento--productivity" tasks={tasks || []} />
              <ChatbotCard className="bento bento--chat" />
              {/* Passamos safeHabits aqui para evitar o erro .includes dentro do card */}
              <GoalsHabitsCard className="bento bento--goals" goals={goals || []} habits={safeHabits} />
              <CalendarCard className="bento bento--calendar" tasks={tasks || []} />
            </main>
          </>
        )}
      </div>
    </div>
  )
}