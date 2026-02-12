import { createContext, useContext, useState, useEffect } from 'react'
import { taskService } from '../services/taskService'
import { projectService } from '../services/projectService'
import { goalService } from '../services/goalService'
import { habitService } from '../services/habitService'
import { financeService } from '../services/financeService'
import { studyService } from '../services/studyService'
import { dreamMapService } from '../services/dreamMapService'
import { eventService } from '../services/eventService'

const AppContext = createContext(null)

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export function AppProvider({ children, userId }) {
  // State for all entities
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [goals, setGoals] = useState([])
  const [habits, setHabits] = useState([])
  const [finances, setFinances] = useState([])
  const [studies, setStudies] = useState([])
  const [dreamMaps, setDreamMaps] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  // Load all data when userId changes
  useEffect(() => {
    if (userId) {
      loadAllData()
    } else {
      setTasks([])
      setProjects([])
      setGoals([])
      setHabits([])
      setFinances([])
      setStudies([])
      setDreamMaps([])
      setLoading(false)
    }
  }, [userId])

  const loadAllData = async () => {
    if (!userId) return

    setLoading(true)
    try {
      const results = await Promise.allSettled([
        taskService.getTasks(userId),
        projectService.getProjects(userId),
        goalService.getGoals(userId),
        habitService.getHabits(userId),
        financeService.getTransactions(userId),
        studyService.getStudies(userId),
        dreamMapService.getDreamMaps(userId),
        eventService.getEvents(userId),
      ])

      const safeArray = (res, label) => {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          return res.value
        }
        if (res.status === 'rejected') {
          console.error(`Erro ao carregar ${label}:`, res.reason)
        }
        return []
      }

      setTasks(safeArray(results[0], 'tasks'))
      setProjects(safeArray(results[1], 'projects'))
      setGoals(safeArray(results[2], 'goals'))
      setHabits(safeArray(results[3], 'habits'))
      setFinances(safeArray(results[4], 'finances'))
      setStudies(safeArray(results[5], 'studies'))
      setDreamMaps(safeArray(results[6], 'dreamMaps'))
      setEvents(safeArray(results[7], 'events'))

    } catch (error) {
      console.error('Erro fatal no carregamento:', error)
    } finally {
      setLoading(false)
    }
  }

  // Task Actions
  const addTask = async (task) => {
    if (!userId) return
    const newTask = await taskService.createTask(userId, task)
    setTasks(prev => [newTask, ...prev])
    return newTask
  }

  // === CORREÇÃO BLINDADA AQUI ===
  const updateTask = async (id, updates) => {
    if (!userId) return

    // CORREÇÃO: Normaliza os campos para snake_case para que o filtro funcione corretamente
    const normalizedUpdates = {
      ...updates,
      // Converte dueDate para due_date se existir
      due_date: updates.dueDate ?? updates.due_date,
      start_date: updates.startDate ?? updates.start_date,
      project_id: updates.projectId ?? updates.project_id,
    }

    // 1. OTIMISMO TOTAL: Atualiza a tela imediatamente e confia nisso
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...normalizedUpdates } : t))

    try {
      // 2. Envia para o servidor
      const updatedTask = await taskService.updateTask(id, userId, normalizedUpdates)

      // 3. TRAVA DE SEGURANÇA:
      // Só atualizamos o estado com a resposta do servidor se ela não contradizer
      // a ação que acabamos de fazer (ex: marcar como concluída).
      if (updatedTask && updatedTask.id) {
        setTasks(prev => prev.map(t => {
          if (t.id !== id) return t;

          // Se o usuário mandou completar (true) e o servidor devolveu incompleto (false),
          // IGNORAMOS o servidor e mantemos a versão local (que é a correta visualmente).
          if (updates.completed === true && !updatedTask.completed) {
            return t; // Mantém o que já está na tela (true)
          }

          // O mesmo para desmarcar
          if (updates.completed === false && updatedTask.completed) {
            return t;
          }

          return updatedTask;
        }))
      }
    } catch (error) {
      console.error("Erro ao sincronizar tarefa:", error)
      // Se der erro de rede, aí sim poderíamos reverter, mas manter assim é melhor para UX
    }
  }

  const deleteTask = async (id) => {
    if (!userId) return
    setTasks(prev => prev.filter(t => t.id !== id))
    await taskService.deleteTask(id, userId)
  }

  // Goal Actions
  const addGoal = async (goal) => {
    if (!userId) return
    const newGoal = await goalService.createGoal(userId, goal)
    setGoals(prev => [newGoal, ...prev])
    return newGoal
  }

  const updateGoal = async (id, updates) => {
    if (!userId) return
    setGoals(prev => prev.map(g => g.id === id ? { ...g, ...updates } : g))
    const updatedGoal = await goalService.updateGoal(id, userId, updates)
    if (updatedGoal) setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g))
  }

  const deleteGoal = async (id) => {
    if (!userId) return
    setGoals(prev => prev.filter(g => g.id !== id))
    await goalService.deleteGoal(id, userId)
  }

  // Project Actions (Moved here to access updateGoal)
  const addProject = async (project) => {
    if (!userId) return
    const newProject = await projectService.createProject(userId, project)
    setProjects(prev => [newProject, ...prev])
    return newProject
  }

  const updateProject = async (id, updates) => {
    if (!userId) return
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    const updatedProject = await projectService.updateProject(id, userId, updates)

    // Sincronização automática com Metas
    if (updatedProject && (updates.status || updates.goalId || updates.goal_id)) {
      const goalId = updatedProject.goalId || updatedProject.goal_id
      if (goalId) {
        const goal = goals.find(g => g.id === goalId)
        if (goal) {
          const goalProjects = projects.filter(p => (p.goalId === goalId || p.goal_id === goalId))
          const updatedGoalProjects = goalProjects.map(p => p.id === id ? updatedProject : p)

          const allCompleted = updatedGoalProjects.every(p => p.status === 'completed')
          const allTodo = updatedGoalProjects.every(p => p.status === 'todo')
          const isActive = ['in_progress', 'review'].includes(updatedProject.status)
          const isCompleted = updatedProject.status === 'completed'

          let newProgress = null

          if (allCompleted) {
            if ((goal.progress || 0) < 1) newProgress = 1
          } else if (allTodo) {
            if ((goal.progress || 0) > 0) newProgress = 0
          } else {
            // Estado Misto
            if ((goal.progress || 0) === 1) {
              // Reabrir meta
              newProgress = 0.9
            } else if ((goal.progress || 0) === 0 && (isActive || isCompleted)) {
              // Iniciar meta
              newProgress = 0.1
            }
          }

          if (newProgress !== null) {
            await updateGoal(goal.id, { progress: newProgress })
          }
        }
      }
    }

    if (updatedProject) setProjects(prev => prev.map(p => p.id === id ? updatedProject : p))
  }

  const deleteProject = async (id) => {
    if (!userId) return
    setProjects(prev => prev.filter(p => p.id !== id))
    await projectService.deleteProject(id, userId)
  }

  // Habit Actions
  const addHabit = async (habit) => {
    if (!userId) return
    const newHabit = await habitService.createHabit(userId, habit)
    if (habit.customDays !== undefined) newHabit.customDays = habit.customDays
    setHabits(prev => [newHabit, ...prev])
    return newHabit
  }

  const completeHabit = async (id) => {
    if (!userId) return
    const habit = habits.find((h) => h.id === id)
    if (!habit) return

    const today = new Date().toISOString().split('T')[0]
    const completedDates = Array.isArray(habit.completions)
      ? [...habit.completions]
      : Array.isArray(habit.completed_dates)
        ? [...habit.completed_dates]
        : []

    let updates = {}

    if (completedDates.includes(today)) {
      const newDates = completedDates.filter(d => d !== today)
      const newCurrent = Math.max((habit.currentStreak || 1) - 1, 0)
      updates = { ...habit, completions: newDates, currentStreak: newCurrent }
    } else {
      completedDates.push(today)
      const currentStreak = (habit.currentStreak || 0) + 1
      const bestStreak = Math.max(currentStreak, habit.bestStreak || 0)
      updates = { ...habit, completions: completedDates, currentStreak, bestStreak }
    }

    setHabits(prev => prev.map(h => h.id === id ? updates : h))
    const updatedHabit = await habitService.updateHabit(id, userId, updates)
    if (updatedHabit) {
      setHabits(prev => prev.map(h => h.id === id ? updatedHabit : h))
    }
  }

  // NOVA FUNÇÃO: Permite marcar/desmarcar hábito para uma data específica
  const completeHabitForDate = async (id, dateStr) => {
    if (!userId) return
    const habit = habits.find((h) => h.id === id)
    if (!habit) return

    const completedDates = Array.isArray(habit.completions)
      ? [...habit.completions]
      : Array.isArray(habit.completed_dates)
        ? [...habit.completed_dates]
        : []

    let updates = {}

    if (completedDates.includes(dateStr)) {
      // Desmarcar
      const newDates = completedDates.filter(d => d !== dateStr)
      updates = { ...habit, completions: newDates }
    } else {
      // Marcar
      completedDates.push(dateStr)
      updates = { ...habit, completions: completedDates }
    }

    setHabits(prev => prev.map(h => h.id === id ? updates : h))
    const updatedHabit = await habitService.updateHabit(id, userId, updates)
    if (updatedHabit) {
      setHabits(prev => prev.map(h => h.id === id ? updatedHabit : h))
    }
  }

  const updateHabit = async (id, updates) => {
    if (!userId) return
    setHabits(prev => prev.map(h => h.id === id ? { ...h, ...updates } : h))
    const updatedHabit = await habitService.updateHabit(id, userId, updates)
    if (updates.customDays !== undefined && updatedHabit) updatedHabit.customDays = updates.customDays
    if (updatedHabit) setHabits(prev => prev.map(h => h.id === id ? updatedHabit : h))
  }

  const deleteHabit = async (id) => {
    if (!userId) return
    setHabits(prev => prev.filter(h => h.id !== id))
    await habitService.deleteHabit(id, userId)
  }

  // Finance Actions
  const addFinance = async (finance) => {
    if (!userId) return
    const newFinance = await financeService.createTransaction(userId, finance)
    setFinances(prev => [newFinance, ...prev])
    return newFinance
  }

  const updateFinance = async (id, updates) => {
    if (!userId) return
    setFinances(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
    const updatedFinance = await financeService.updateTransaction(id, userId, updates)
    if (updatedFinance) setFinances(prev => prev.map(f => f.id === id ? updatedFinance : f))
  }

  const deleteFinance = async (id) => {
    if (!userId) return
    setFinances(prev => prev.filter(f => f.id !== id))
    await financeService.deleteTransaction(id, userId)
  }

  // Study & Dream Actions
  const addStudy = async (study) => {
    if (!userId) return
    const newStudy = await studyService.createStudy(userId, study)
    const allStudies = await studyService.getStudies(userId)
    setStudies(allStudies)
    return newStudy
  }

  const updateStudy = async (id, updates) => {
    if (!userId) return
    setStudies(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s))
    await studyService.updateStudy(id, updates)
    const allStudies = await studyService.getStudies(userId)
    setStudies(allStudies)
  }

  const deleteStudy = async (id) => {
    if (!userId) return
    setStudies(prev => prev.filter(s => s.id !== id))
    await studyService.deleteStudy(id)
  }

  const addStudyModule = async (studyItemId, moduleData) => {
    if (!userId) return
    await studyService.createModule(studyItemId, moduleData)
    const allStudies = await studyService.getStudies(userId)
    setStudies(allStudies)
  }

  const updateStudyModule = async (moduleId, updates) => {
    if (!userId) return
    await studyService.updateModule(moduleId, updates)
    const allStudies = await studyService.getStudies(userId)
    setStudies(allStudies)
  }

  const deleteStudyModule = async (moduleId) => {
    if (!userId) return
    await studyService.deleteModule(moduleId)
    const allStudies = await studyService.getStudies(userId)
    setStudies(allStudies)
  }

  const addStudyLesson = async (moduleId, lessonData) => {
    if (!userId) return
    await studyService.createLesson(moduleId, lessonData)
    const allStudies = await studyService.getStudies(userId)
    setStudies(allStudies)
  }

  const updateStudyLesson = async (lessonId, updates) => {
    if (!userId) return
    await studyService.updateLesson(lessonId, updates)
    const allStudies = await studyService.getStudies(userId)
    setStudies(allStudies)
  }

  const deleteStudyLesson = async (lessonId) => {
    if (!userId) return
    await studyService.deleteLesson(lessonId)
    const allStudies = await studyService.getStudies(userId)
    setStudies(allStudies)
  }

  const toggleStudyLesson = async (lessonId, isCompleted) => {
    if (!userId) return
    await studyService.toggleLessonComplete(lessonId, isCompleted)
    const allStudies = await studyService.getStudies(userId)
    setStudies(allStudies)
  }

  const addDreamMap = async (dreamMap, imageFile) => {
    if (!userId) return
    const imageUrl = await dreamMapService.uploadImage(imageFile, userId)
    const newDreamMap = await dreamMapService.createDreamMap(userId, { ...dreamMap, imageUrl })
    setDreamMaps([newDreamMap, ...dreamMaps])
    return newDreamMap
  }

  const updateDreamMap = async (id, updates) => {
    if (!userId) return
    setDreamMaps(dreamMaps.map(dm => dm.id === id ? { ...dm, ...updates } : dm))
    const updated = await dreamMapService.updateDreamMap(id, userId, updates)
    if (updated) setDreamMaps(dreamMaps.map(dm => dm.id === id ? updated : dm))
  }

  const deleteDreamMap = async (id) => {
    if (!userId) return
    setDreamMaps(dreamMaps.filter(dm => dm.id !== id))
    await dreamMapService.deleteDreamMap(id, userId)
  }

  // Event Actions
  const addEvent = async (event) => {
    if (!userId) return
    const newEvent = await eventService.createEvent(userId, event)
    setEvents(prev => [newEvent, ...prev])
    return newEvent
  }

  const updateEvent = async (id, updates) => {
    if (!userId) return
    setEvents(prev => prev.map(e => e.id === id ? { ...e, ...updates } : e))
    const updatedEvent = await eventService.updateEvent(id, userId, updates)
    if (updatedEvent) setEvents(prev => prev.map(e => e.id === id ? updatedEvent : e))
  }

  const deleteEvent = async (id) => {
    if (!userId) return
    setEvents(prev => prev.filter(e => e.id !== id))
    await eventService.deleteEvent(id, userId)
  }

  const value = {
    userId,
    tasks, projects, goals, habits, finances, studies, dreamMaps, events, loading,
    addTask, updateTask, deleteTask,
    addProject, updateProject, deleteProject,
    addGoal, updateGoal, deleteGoal,
    addHabit, completeHabit, completeHabitForDate, updateHabit, deleteHabit,
    addFinance, updateFinance, deleteFinance,
    addStudy, updateStudy, deleteStudy,
    addStudyModule, updateStudyModule, deleteStudyModule,
    addStudyLesson, updateStudyLesson, deleteStudyLesson,
    toggleStudyLesson,
    addDreamMap, updateDreamMap, deleteDreamMap,
    addEvent, updateEvent, deleteEvent,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}