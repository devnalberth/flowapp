import { createContext, useContext, useState, useEffect } from 'react'
import { taskService } from '../services/taskService'
import { projectService } from '../services/projectService'
import { goalService } from '../services/goalService'
import { habitService } from '../services/habitService'
import { financeService } from '../services/financeService'
import { studyService } from '../services/studyService'
import { dreamMapService } from '../services/dreamMapService'

const AppContext = createContext(null)

export function useApp() {
  const context = useContext(AppContext)
  if (!context) {
    throw new Error('useApp must be used within AppProvider')
  }
  return context
}

export function AppProvider({ children, userId }) {
  // State for all entities - Inicializado sempre com Array Vazio
  const [tasks, setTasks] = useState([])
  const [projects, setProjects] = useState([])
  const [goals, setGoals] = useState([])
  const [habits, setHabits] = useState([])
  const [finances, setFinances] = useState([])
  const [studies, setStudies] = useState([])
  const [dreamMaps, setDreamMaps] = useState([])
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
      ])
      
      // FUNÇÃO DE SEGURANÇA: Garante que o retorno seja sempre um Array
      const safeArray = (res, label) => {
        if (res.status === 'fulfilled' && Array.isArray(res.value)) {
          return res.value
        }
        if (res.status === 'rejected') {
          console.error(`Erro ao carregar ${label}:`, res.reason)
        }
        // Se falhou ou não é array, retorna vazio para não quebrar a tela
        return []
      }

      setTasks(safeArray(results[0], 'tasks'))
      setProjects(safeArray(results[1], 'projects'))
      setGoals(safeArray(results[2], 'goals'))
      setHabits(safeArray(results[3], 'habits'))
      setFinances(safeArray(results[4], 'finances'))
      setStudies(safeArray(results[5], 'studies'))
      setDreamMaps(safeArray(results[6], 'dreamMaps'))

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

  const updateTask = async (id, updates) => {
    if (!userId) return
    const updatedTask = await taskService.updateTask(id, userId, updates)
    setTasks(prev => prev.map(t => t.id === id ? updatedTask : t))
  }

  const deleteTask = async (id) => {
    if (!userId) return
    await taskService.deleteTask(id, userId)
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  // Project Actions
  const addProject = async (project) => {
    if (!userId) return
    const newProject = await projectService.createProject(userId, project)
    setProjects(prev => [newProject, ...prev])
    return newProject
  }

  const updateProject = async (id, updates) => {
    if (!userId) return
    const updatedProject = await projectService.updateProject(id, userId, updates)
    setProjects(prev => prev.map(p => p.id === id ? updatedProject : p))
  }

  const deleteProject = async (id) => {
    if (!userId) return
    await projectService.deleteProject(id, userId)
    setProjects(prev => prev.filter(p => p.id !== id))
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
    const updatedGoal = await goalService.updateGoal(id, userId, updates)
    setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g))
  }

  const deleteGoal = async (id) => {
    if (!userId) return
    await goalService.deleteGoal(id, userId)
    setGoals(prev => prev.filter(g => g.id !== id))
  }

  // Habit Actions
  const addHabit = async (habit) => {
    if (!userId) return
    const newHabit = await habitService.createHabit(userId, habit)
    // Preserve any front-end-only fields like customDays so filtering works immediately
    if (habit.customDays !== undefined) newHabit.customDays = habit.customDays
    setHabits(prev => [newHabit, ...prev])
    return newHabit
  }

  const completeHabit = async (id) => {
    if (!userId) return
    const habit = habits.find((h) => h.id === id)
    if (!habit) return

    const today = new Date().toISOString().split('T')[0]
    // suportar campos com nomes diferentes e formatos
    const completedDates = Array.isArray(habit.completions)
      ? [...habit.completions]
      : Array.isArray(habit.completed_dates)
      ? [...habit.completed_dates]
      : []

    if (completedDates.includes(today)) {
      // já marcado — desmarcar (toggle)
      const newDates = completedDates.filter(d => d !== today)
      const newCurrent = Math.max((habit.currentStreak || 1) - 1, 0)
      const updatedHabit = await habitService.updateHabit(id, userId, {
        ...habit,
        completions: newDates,
        currentStreak: newCurrent,
      })
      setHabits(prev => prev.map(h => h.id === id ? updatedHabit : h))
      return
    }

    // não estava marcado — marcar hoje
    completedDates.push(today)
    const currentStreak = (habit.currentStreak || 0) + 1
    const bestStreak = Math.max(currentStreak, habit.bestStreak || 0)

    const updatedHabit = await habitService.updateHabit(id, userId, {
      ...habit,
      completions: completedDates,
      currentStreak,
      bestStreak,
    })
    setHabits(prev => prev.map(h => h.id === id ? updatedHabit : h))
  }

  const updateHabit = async (id, updates) => {
    if (!userId) return
    const updatedHabit = await habitService.updateHabit(id, userId, updates)
    // Preserve customDays from updates in front-end state (DB may not persist this column)
    if (updates.customDays !== undefined) updatedHabit.customDays = updates.customDays
    setHabits(prev => prev.map(h => h.id === id ? updatedHabit : h))
  }

  const deleteHabit = async (id) => {
    if (!userId) return
    await habitService.deleteHabit(id, userId)
    setHabits(prev => prev.filter(h => h.id !== id))
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
    const updatedFinance = await financeService.updateTransaction(id, userId, updates)
    setFinances(prev => prev.map(f => f.id === id ? updatedFinance : f))
  }

  const deleteFinance = async (id) => {
    if (!userId) return
    await financeService.deleteTransaction(id, userId)
    setFinances(prev => prev.filter(f => f.id !== id))
  }

  // Study Actions
  const addStudy = async (study) => {
    if (!userId) return
    const newStudy = await studyService.createStudy(userId, study)
    const allStudies = await studyService.getStudies(userId)
    setStudies(allStudies)
    return newStudy
  }

  const updateStudy = async (id, updates) => {
    if (!userId) return
    await studyService.updateStudy(id, updates)
    const allStudies = await studyService.getStudies(userId)
    setStudies(allStudies)
  }

  const deleteStudy = async (id) => {
    if (!userId) return
    await studyService.deleteStudy(id)
    setStudies(prev => prev.filter(s => s.id !== id))
  }

  const addStudyModule = async (studyItemId, moduleData) => {
    if (!userId) return
    await studyService.createModule(studyItemId, moduleData)
    const allStudies = await studyService.getStudies(userId)
    setStudies(allStudies)
  }

  const addStudyLesson = async (moduleId, lessonData) => {
    if (!userId) return
    await studyService.createLesson(moduleId, lessonData)
    const allStudies = await studyService.getStudies(userId)
    setStudies(allStudies)
  }

  const toggleStudyLesson = async (lessonId, isCompleted) => {
    if (!userId) return
    await studyService.toggleLessonComplete(lessonId, isCompleted)
    const allStudies = await studyService.getStudies(userId)
    setStudies(allStudies)
  }

  // Dream Map Actions
  const addDreamMap = async (dreamMap, imageFile) => {
    if (!userId) return
    const imageUrl = await dreamMapService.uploadImage(imageFile, userId)
    const newDreamMap = await dreamMapService.createDreamMap(userId, { ...dreamMap, imageUrl })
    setDreamMaps([newDreamMap, ...dreamMaps])
    return newDreamMap
  }

  const updateDreamMap = async (id, updates) => {
    if (!userId) return
    const updated = await dreamMapService.updateDreamMap(id, userId, updates)
    setDreamMaps(dreamMaps.map(dm => dm.id === id ? updated : dm))
  }

  const deleteDreamMap = async (id) => {
    if (!userId) return
    await dreamMapService.deleteDreamMap(id, userId)
    setDreamMaps(dreamMaps.filter(dm => dm.id !== id))
  }

  const value = {
    userId,
    tasks, projects, goals, habits, finances, studies, dreamMaps, loading,
    addTask, updateTask, deleteTask,
    addProject, updateProject, deleteProject,
    addGoal, updateGoal, deleteGoal,
    addHabit, completeHabit, updateHabit, deleteHabit,
    addFinance, updateFinance, deleteFinance,
    addStudy, updateStudy, deleteStudy, addStudyModule, addStudyLesson, toggleStudyLesson,
    addDreamMap, updateDreamMap, deleteDreamMap,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}