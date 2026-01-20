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
  // State for all entities
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

    } catch (error) {
      console.error('Erro fatal no carregamento:', error)
    } finally {
      setLoading(false)
    }
  }

  // Task Actions - CORREÇÃO DE FLICKER AQUI
  const addTask = async (task) => {
    if (!userId) return
    // Adiciona temporariamente para feedback instantâneo (com ID temporário se necessário, mas o service retorna rápido)
    const newTask = await taskService.createTask(userId, task)
    setTasks(prev => [newTask, ...prev])
    return newTask
  }

  const updateTask = async (id, updates) => {
    if (!userId) return
    
    // 1. ATUALIZAÇÃO OTIMISTA (A MÁGICA ACONTECE AQUI)
    // Atualiza o estado global IMEDIATAMENTE, antes mesmo de chamar o servidor.
    // Isso impede que a tarefa "volte" para o estado anterior enquanto o servidor processa.
    setTasks(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t))

    try {
      // 2. Chama o servidor em segundo plano
      const updatedTask = await taskService.updateTask(id, userId, updates)
      
      // 3. Confirmação silenciosa (só atualiza se o servidor devolver algo válido)
      if (updatedTask && updatedTask.id) {
        setTasks(prev => prev.map(t => t.id === id ? updatedTask : t))
      }
    } catch (error) {
      console.error("Erro ao sincronizar tarefa:", error)
      // Opcional: Reverter em caso de erro crítico, mas para UX é melhor manter o estado visual
    }
  }

  const deleteTask = async (id) => {
    if (!userId) return
    // Otimista também para exclusão
    setTasks(prev => prev.filter(t => t.id !== id))
    await taskService.deleteTask(id, userId)
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
    // Otimista
    setProjects(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p))
    const updatedProject = await projectService.updateProject(id, userId, updates)
    if(updatedProject) setProjects(prev => prev.map(p => p.id === id ? updatedProject : p))
  }

  const deleteProject = async (id) => {
    if (!userId) return
    setProjects(prev => prev.filter(p => p.id !== id))
    await projectService.deleteProject(id, userId)
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
    if(updatedGoal) setGoals(prev => prev.map(g => g.id === id ? updatedGoal : g))
  }

  const deleteGoal = async (id) => {
    if (!userId) return
    setGoals(prev => prev.filter(g => g.id !== id))
    await goalService.deleteGoal(id, userId)
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

    // Otimista: Atualiza localmente AGORA
    setHabits(prev => prev.map(h => h.id === id ? updates : h))

    // Envia pro servidor
    const updatedHabit = await habitService.updateHabit(id, userId, updates)
    
    // Confirma
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
    if(updatedFinance) setFinances(prev => prev.map(f => f.id === id ? updatedFinance : f))
  }

  const deleteFinance = async (id) => {
    if (!userId) return
    setFinances(prev => prev.filter(f => f.id !== id))
    await financeService.deleteTransaction(id, userId)
  }

  // Study & Dream Actions (Mantidos simples)
  const addStudy = async (study) => {
    if (!userId) return
    const newStudy = await studyService.createStudy(userId, study)
    const allStudies = await studyService.getStudies(userId)
    setStudies(allStudies)
    return newStudy
  }

  const updateStudy = async (id, updates) => {
    if (!userId) return
    // Otimista parcial
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

  const addDreamMap = async (dreamMap, imageFile) => {
    if (!userId) return
    // Note: Upload de imagem é difícil de ser otimista visualmente sem preview local complexo
    const imageUrl = await dreamMapService.uploadImage(imageFile, userId)
    const newDreamMap = await dreamMapService.createDreamMap(userId, { ...dreamMap, imageUrl })
    setDreamMaps([newDreamMap, ...dreamMaps])
    return newDreamMap
  }

  const updateDreamMap = async (id, updates) => {
    if (!userId) return
    setDreamMaps(dreamMaps.map(dm => dm.id === id ? { ...dm, ...updates } : dm))
    const updated = await dreamMapService.updateDreamMap(id, userId, updates)
    if(updated) setDreamMaps(dreamMaps.map(dm => dm.id === id ? updated : dm))
  }

  const deleteDreamMap = async (id) => {
    if (!userId) return
    setDreamMaps(dreamMaps.filter(dm => dm.id !== id))
    await dreamMapService.deleteDreamMap(id, userId)
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