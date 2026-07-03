import { useMemo } from 'react'
import { useApp } from '../context/AppContext.jsx'

// Contexto entregue às ferramentas do FlowChat — sempre com o estado mais
// recente do app. Compartilhado entre a página FlowChat e o card do Dashboard.
export function useJarvisToolCtx(userName) {
  const app = useApp()

  return useMemo(() => {
    const catName = (slug) => app.financeCategories?.find((c) => c.slug === slug)?.name || slug || 'Outros'
    return {
      userName,
      tasks: app.tasks || [],
      projects: app.projects || [],
      goals: app.goals || [],
      habits: app.habits || [],
      events: app.events || [],
      finances: app.finances || [],
      financeAccounts: app.financeAccounts || [],
      financeCards: app.financeCards || [],
      financeLimits: app.financeLimits || [],
      financeCategories: app.financeCategories || [],
      catName,
      actions: {
        addTask: app.addTask,
        updateTask: app.updateTask,
        addFinance: app.addFinance,
        completeHabit: app.completeHabit,
      },
    }
  }, [app, userName])
}
