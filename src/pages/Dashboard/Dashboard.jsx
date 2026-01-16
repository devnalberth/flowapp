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
  const { tasks, projects, goals, habits, loading } = useApp()

  const kpis = useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const tasksToday = tasks.filter(task => {
      if (!task.due_date) return false
      const dueDate = new Date(task.due_date)
      dueDate.setHours(0, 0, 0, 0)
      return dueDate.getTime() === today.getTime()
    }).length

    const pending = tasks.filter(task => task.status !== 'done').length
    const done = tasks.filter(task => task.status === 'done').length

    // Calcular maior streak dos hábitos
    const streakDays = habits.reduce((max, habit) => {
      return Math.max(max, habit.current_streak || 0)
    }, 0)

    return {
      total: tasks.length,
      pending,
      done,
      tasksToday,
      streakDays,
    }
  }, [tasks, habits])

  return (
    <div className="dash">
      <TopNav user={user} active="Dashboard" onNavigate={onNavigate} onLogout={onLogout} />

      <div className="dashWrapper">
        <header className="dash__welcome">
          <div className="txt-h1">Bem-vindo de volta, {user?.name?.split(' ')[0] || 'Nalberth'} 👋</div>
          <div className="txt-lead">
            {loading ? (
              'Carregando suas tarefas...'
            ) : kpis.tasksToday > 0 ? (
              `Você tem ${kpis.tasksToday} tarefa${kpis.tasksToday > 1 ? 's' : ''} para hoje e está com um streak de ${kpis.streakDays} dias!`
            ) : (
              `Nenhuma tarefa para hoje. Seu maior streak é de ${kpis.streakDays} dias!`
            )}
          </div>
        </header>

        <section className="dash__kpis">
          <StatCard title="Tarefas Totais" value={kpis.total} variant="total" />
          <StatCard title="Tarefas Pendentes" value={kpis.pending} variant="pending" />
          <StatCard title="Tarefas Finalizadas" value={kpis.done} variant="done" />
          <NextMeetingCard meeting={null} />
        </section>

        <main className="dash__grid">
          <ProjectOverviewCard className="bento bento--project" projects={projects} />
          <ProductivityCard className="bento bento--productivity" tasks={tasks} />
          <ChatbotCard className="bento bento--chat" />
          <GoalsHabitsCard className="bento bento--goals" goals={goals} habits={habits} />
          <CalendarCard className="bento bento--calendar" tasks={tasks} />
        </main>
      </div>
    </div>
  )
}
