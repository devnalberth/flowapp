import { createContext, useContext, useState, useEffect } from 'react'

const AppContext = createContext()

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export function AppProvider({ children }) {
  // State for Tasks
  const [tasks, setTasks] = useState([])

  // State for Finance
  const [finances, setFinances] = useState([])

  // State for Habits - carregar do localStorage
  const [habits, setHabits] = useState(() => {
    const saved = localStorage.getItem('flowapp-habits')
    return saved ? JSON.parse(saved) : []
  })

  // Salvar hábitos no localStorage sempre que mudar
  useEffect(() => {
    localStorage.setItem('flowapp-habits', JSON.stringify(habits))
  }, [habits])

  // Actions for Tasks
  const addTask = (task) => {
    const newTask = {
      id: `task-${Date.now()}`,
      ...task,
      completed: false,
      progress: 0,
      createdAt: new Date().toISOString(),
    }
    setTasks((prev) => [newTask, ...prev])
    return newTask
  }

  const updateTask = (id, updates) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)))
  }

  const deleteTask = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id))
  }

  // Actions for Finance
  const addFinance = (finance) => {
    const newFinance = {
      id: `finance-${Date.now()}`,
      ...finance,
      createdAt: new Date().toISOString(),
    }
    setFinances((prev) => [newFinance, ...prev])
    return newFinance
  }

  const updateFinance = (id, updates) => {
    setFinances((prev) => prev.map((f) => (f.id === id ? { ...f, ...updates } : f)))
  }

  const deleteFinance = (id) => {
    setFinances((prev) => prev.filter((f) => f.id !== id))
  }

  // Actions for Habits
  const addHabit = (habit) => {
    const newHabit = {
      id: `habit-${Date.now()}`,
      ...habit,
      streak: 0,
      completions: [],
      createdAt: new Date().toISOString(),
    }
    setHabits((prev) => [newHabit, ...prev])
    return newHabit
  }

  const completeHabit = (id) => {
    setHabits((prev) =>
      prev.map((h) => {
        if (h.id === id) {
          const today = new Date().toISOString().split('T')[0]
          const completions = [...(h.completions || []), today]
          return {
            ...h,
            completions,
            streak: h.streak + 1,
            lastCompletedAt: today,
          }
        }
        return h
      })
    )
  }

  const updateHabit = (id, updates) => {
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, ...updates } : h)))
  }

  const deleteHabit = (id) => {
    setHabits((prev) => prev.filter((h) => h.id !== id))
  }

  const value = {
    // State
    tasks,
    finances,
    habits,
    // Task Actions
    addTask,
    updateTask,
    deleteTask,
    // Finance Actions
    addFinance,
    updateFinance,
    deleteFinance,
    // Habit Actions
    addHabit,
    completeHabit,
    updateHabit,
    deleteHabit,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
