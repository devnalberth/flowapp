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
  useEffect(() => {
    // TEMP DEBUG: log userId changes to help trace aborted creates
    try {
      console.debug('AppProvider: userId changed =>', userId)
    } catch (err) {
      console.debug('AppProvider: failed to log userId change', err)
    }
  }, [userId])
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
      // Clear data when logged out
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
    
    try {
      setLoading(true)
      const [tasksData, projectsData, goalsData, habitsData, financesData, studiesData, dreamMapsData] = await Promise.all([
        taskService.getTasks(userId),
        projectService.getProjects(userId),
        goalService.getGoals(userId),
        habitService.getHabits(userId),
        financeService.getTransactions(userId),
        studyService.getStudies(userId),
        dreamMapService.getDreamMaps(userId),
      ])
      
      setTasks(tasksData)
      setProjects(projectsData)
      setGoals(goalsData)
      setHabits(habitsData)
      setFinances(financesData)
      setStudies(studiesData)
      setDreamMaps(dreamMapsData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Task Actions
  const addTask = async (task) => {
    if (!userId) {
      console.warn('addTask aborted: no userId')
      return
    }
    console.debug('addTask called for userId:', userId, 'task:', task)
    try {
      const newTask = await taskService.createTask(userId, task)
      setTasks((prev) => [newTask, ...prev])
      return newTask
    } catch (error) {
      console.error('Error adding task:', error)
      throw error
    }
  }

  const updateTask = async (id, updates) => {
    if (!userId) return
    try {
      const updatedTask = await taskService.updateTask(id, userId, updates)
      setTasks((prev) => prev.map((t) => (t.id === id ? updatedTask : t)))
    } catch (error) {
      console.error('Error updating task:', error)
      throw error
    }
  }

  const deleteTask = async (id) => {
    if (!userId) return
    try {
      await taskService.deleteTask(id, userId)
      setTasks((prev) => prev.filter((t) => t.id !== id))
    } catch (error) {
      console.error('Error deleting task:', error)
      throw error
    }
  }

  // Project Actions
  const addProject = async (project) => {
    if (!userId) {
      console.warn('addProject aborted: no userId')
      return
    }
    console.debug('addProject called for userId:', userId, 'project:', project)
    try {
      const newProject = await projectService.createProject(userId, project)
      setProjects((prev) => [newProject, ...prev])
      return newProject
    } catch (error) {
      console.error('Error adding project:', error)
      throw error
    }
  }

  const updateProject = async (id, updates) => {
    if (!userId) return
    try {
      const updatedProject = await projectService.updateProject(id, userId, updates)
      setProjects((prev) => prev.map((p) => (p.id === id ? updatedProject : p)))
    } catch (error) {
      console.error('Error updating project:', error)
      throw error
    }
  }

  const deleteProject = async (id) => {
    if (!userId) return
    try {
      await projectService.deleteProject(id, userId)
      setProjects((prev) => prev.filter((p) => p.id !== id))
    } catch (error) {
      console.error('Error deleting project:', error)
      throw error
    }
  }

  // Goal Actions
  const addGoal = async (goal) => {
    if (!userId) {
      console.warn('addGoal aborted: no userId')
      return
    }
    console.debug('addGoal called for userId:', userId, 'goal:', goal)
    try {
      const newGoal = await goalService.createGoal(userId, goal)
      setGoals((prev) => [newGoal, ...prev])
      return newGoal
    } catch (error) {
      console.error('Error adding goal:', error)
      throw error
    }
  }

  const updateGoal = async (id, updates) => {
    if (!userId) return
    try {
      const updatedGoal = await goalService.updateGoal(id, userId, updates)
      setGoals((prev) => prev.map((g) => (g.id === id ? updatedGoal : g)))
    } catch (error) {
      console.error('Error updating goal:', error)
      throw error
    }
  }

  const deleteGoal = async (id) => {
    if (!userId) return
    try {
      await goalService.deleteGoal(id, userId)
      setGoals((prev) => prev.filter((g) => g.id !== id))
    } catch (error) {
      console.error('Error deleting goal:', error)
      throw error
    }
  }

  // Habit Actions
  const addHabit = async (habit) => {
    if (!userId) {
      console.warn('addHabit aborted: no userId')
      return
    }
    console.debug('addHabit called for userId:', userId, 'habit:', habit)
    try {
      const newHabit = await habitService.createHabit(userId, habit)
      setHabits((prev) => [newHabit, ...prev])
      return newHabit
    } catch (error) {
      console.error('Error adding habit:', error)
      throw error
    }
  }

  const completeHabit = async (id) => {
    if (!userId) return
    try {
      const habit = habits.find((h) => h.id === id)
      if (!habit) return

      const today = new Date().toISOString().split('T')[0]
      const completedDates = JSON.parse(habit.completed_dates || '[]')
      
      if (!completedDates.includes(today)) {
        completedDates.push(today)
        const currentStreak = habit.current_streak + 1
        const bestStreak = Math.max(currentStreak, habit.best_streak)

        const updatedHabit = await habitService.updateHabit(id, userId, {
          ...habit,
          completedDates: JSON.stringify(completedDates),
          currentStreak,
          bestStreak,
        })
        
        setHabits((prev) => prev.map((h) => (h.id === id ? updatedHabit : h)))
      }
    } catch (error) {
      console.error('Error completing habit:', error)
      throw error
    }
  }

  const updateHabit = async (id, updates) => {
    if (!userId) return
    try {
      const updatedHabit = await habitService.updateHabit(id, userId, updates)
      setHabits((prev) => prev.map((h) => (h.id === id ? updatedHabit : h)))
    } catch (error) {
      console.error('Error updating habit:', error)
      throw error
    }
  }

  const deleteHabit = async (id) => {
    if (!userId) return
    try {
      await habitService.deleteHabit(id, userId)
      setHabits((prev) => prev.filter((h) => h.id !== id))
    } catch (error) {
      console.error('Error deleting habit:', error)
      throw error
    }
  }

  // Finance Actions
  const addFinance = async (finance) => {
    if (!userId) {
      console.warn('addFinance aborted: no userId')
      return
    }
    console.debug('addFinance called for userId:', userId, 'finance:', finance)
    try {
      const newFinance = await financeService.createTransaction(userId, finance)
      setFinances((prev) => [newFinance, ...prev])
      return newFinance
    } catch (error) {
      console.error('Error adding finance:', error)
      throw error
    }
  }

  const updateFinance = async (id, updates) => {
    if (!userId) return
    try {
      const updatedFinance = await financeService.updateTransaction(id, userId, updates)
      setFinances((prev) => prev.map((f) => (f.id === id ? updatedFinance : f)))
    } catch (error) {
      console.error('Error updating finance:', error)
      throw error
    }
  }

  const deleteFinance = async (id) => {
    if (!userId) return
    try {
      await financeService.deleteTransaction(id, userId)
      setFinances((prev) => prev.filter((f) => f.id !== id))
    } catch (error) {
      console.error('Error deleting finance:', error)
      throw error
    }
  }

  // Study Actions
  const addStudy = async (study) => {
    if (!userId) return
    try {
      const newStudy = await studyService.createStudy(userId, study)
      // Reload para pegar com modules
      const allStudies = await studyService.getStudies(userId)
      setStudies(allStudies)
      return newStudy
    } catch (error) {
      console.error('Error adding study:', error)
      throw error
    }
  }

  const updateStudy = async (id, updates) => {
    if (!userId) return
    try {
      await studyService.updateStudy(id, updates)
      const allStudies = await studyService.getStudies(userId)
      setStudies(allStudies)
    } catch (error) {
      console.error('Error updating study:', error)
      throw error
    }
  }

  const deleteStudy = async (id) => {
    if (!userId) return
    try {
      await studyService.deleteStudy(id)
      setStudies((prev) => prev.filter((s) => s.id !== id))
    } catch (error) {
      console.error('Error deleting study:', error)
      throw error
    }
  }

  const addStudyModule = async (studyItemId, moduleData) => {
    if (!userId) return
    try {
      await studyService.createModule(studyItemId, moduleData)
      const allStudies = await studyService.getStudies(userId)
      setStudies(allStudies)
    } catch (error) {
      console.error('Error adding module:', error)
      throw error
    }
  }

  const addStudyLesson = async (moduleId, lessonData) => {
    if (!userId) return
    try {
      await studyService.createLesson(moduleId, lessonData)
      const allStudies = await studyService.getStudies(userId)
      setStudies(allStudies)
    } catch (error) {
      console.error('Error adding lesson:', error)
      throw error
    }
  }

  const toggleStudyLesson = async (lessonId, isCompleted) => {
    if (!userId) return
    try {
      await studyService.toggleLessonComplete(lessonId, isCompleted)
      const allStudies = await studyService.getStudies(userId)
      setStudies(allStudies)
    } catch (error) {
      console.error('Error toggling lesson:', error)
      throw error
    }
  }

  // Dream Map Actions
  const addDreamMap = async (dreamMap, imageFile) => {
    if (!userId) return
    try {
      // Upload image first
      const imageUrl = await dreamMapService.uploadImage(imageFile, userId)
      
      // Create dream map with image URL
      const newDreamMap = await dreamMapService.createDreamMap(userId, {
        ...dreamMap,
        imageUrl,
      })
      setDreamMaps([newDreamMap, ...dreamMaps])
      return newDreamMap
    } catch (error) {
      console.error('Error adding dream map:', error)
      throw error
    }
  }

  const updateDreamMap = async (id, updates) => {
    if (!userId) return
    try {
      const updated = await dreamMapService.updateDreamMap(id, userId, updates)
      setDreamMaps(dreamMaps.map((dm) => (dm.id === id ? updated : dm)))
    } catch (error) {
      console.error('Error updating dream map:', error)
      throw error
    }
  }

  const deleteDreamMap = async (id) => {
    if (!userId) return
    try {
      await dreamMapService.deleteDreamMap(id, userId)
      setDreamMaps(dreamMaps.filter((dm) => dm.id !== id))
    } catch (error) {
      console.error('Error deleting dream map:', error)
      throw error
    }
  }

  const value = {
    // State
    tasks,
    projects,
    goals,
    habits,
    finances,
    studies,
    dreamMaps,
    loading,
    // Task Actions
    addTask,
    updateTask,
    deleteTask,
    // Project Actions
    addProject,
    updateProject,
    deleteProject,
    // Goal Actions
    addGoal,
    updateGoal,
    deleteGoal,
    // Habit Actions
    addHabit,
    completeHabit,
    updateHabit,
    deleteHabit,
    // Finance Actions
    addFinance,
    updateFinance,
    deleteFinance,
    // Study Actions
    addStudy,
    updateStudy,
    deleteStudy,
    addStudyModule,
    addStudyLesson,
    toggleStudyLesson,
    // Dream Map Actions
    addDreamMap,
    updateDreamMap,
    deleteDreamMap,
  }

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}
