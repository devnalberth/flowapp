import TopNav from '../../components/TopNav/TopNav.jsx'
import StatCard from '../../components/StatCard/StatCard.jsx'
import NextMeetingCard from '../../components/NextMeetingCard/NextMeetingCard.jsx'
import ChatbotCard from '../../components/ChatbotCard/ChatbotCard.jsx'
import ProjectOverviewCard from '../../components/ProjectOverviewCard/ProjectOverviewCard.jsx'
import ProductivityCard from '../../components/ProductivityCard/ProductivityCard.jsx'
import CalendarCard from '../../components/CalendarCard/CalendarCard.jsx'
import GoalsHabitsCard from '../../components/GoalsHabitsCard/GoalsHabitsCard.jsx'

import './Dashboard.css'

const mock = {
  user: {
    name: 'Matheus Nalberth',
    email: 'Nalberthdev@gmail.com',
    avatarUrl: 'https://placehold.co/42x42',
  },
  kpis: {
    total: 234,
    pending: 234,
    done: 234,
    tasksToday: 4,
    streakDays: 0,
  },
  nextMeeting: {
    title: 'Reunião com a Arc Company',
    time: '14h00 - 16h00',
  },
}

export default function Dashboard({ onNavigate, user }) {
  const currentUser = user ?? mock.user

  return (
    <div className="dash">
      <TopNav user={currentUser} active="Dashboard" onNavigate={onNavigate} />

      <div className="dashWrapper">
        <header className="dash__welcome">
          <div className="txt-h1">Bem-vindo de volta, Nalberth 👋</div>
          <div className="txt-lead">
            Você tem {mock.kpis.tasksToday} tarefas para hoje e está com um streak de{' '}
            {mock.kpis.streakDays} dias!
          </div>
        </header>

        <section className="dash__kpis">
          <StatCard title="Tarefas da Semana" value={mock.kpis.total} variant="total" />
          <StatCard title="Tarefas Pendentes" value={mock.kpis.pending} variant="pending" />
          <StatCard title="Tarefas Finalizadas" value={mock.kpis.done} variant="done" />
          <NextMeetingCard meeting={mock.nextMeeting} />
        </section>

        <main className="dash__grid">
          <ProjectOverviewCard className="bento bento--project" />
          <ProductivityCard className="bento bento--productivity" />
          <ChatbotCard className="bento bento--chat" />
          <GoalsHabitsCard className="bento bento--goals" />
          <CalendarCard className="bento bento--calendar" />
        </main>
      </div>
    </div>
  )
}
