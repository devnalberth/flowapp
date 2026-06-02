import { createContext, useContext, useState, useEffect } from 'react'
import { taskService } from '../services/taskService'
import { projectService } from '../services/projectService'
import { clientService } from '../services/clientService'
import { goalService } from '../services/goalService'
import { habitService } from '../services/habitService'
import { financeService } from '../services/financeService'
import { studyService } from '../services/studyService'
import { focusLogService } from '../services/focusLogService'
import { dreamMapService } from '../services/dreamMapService'
import { eventService } from '../services/eventService'

/**
 * Advances (or rewinds) a date string by `months` months.
 * Accepts "YYYY-MM-DD" or a full ISO string.
 * Returns an ISO string at noon UTC to prevent local-timezone day shifts.
 * The day is clamped to the last valid day of the target month (e.g. Jan 31 + 1 → Feb 28).
 */
function addMonthsToDate(dateInput, months) {
  const base = (typeof dateInput === 'string' ? dateInput : dateInput.toISOString()).substring(0, 10)
  const [y, m, d] = base.split('-').map(Number)
  const totalMonths = (y * 12 + m - 1) + months
  const newYear = Math.floor(totalMonths / 12)
  const newMonth = (totalMonths % 12) + 1
  const lastDay = new Date(newYear, newMonth, 0).getDate()
  const newDay = Math.min(d, lastDay)
  return `${newYear}-${String(newMonth).padStart(2, '0')}-${String(newDay).padStart(2, '0')}T12:00:00.000Z`
}

// Chave de data LOCAL (YYYY-MM-DD) — evita o bug de fuso (UTC adiantava o dia à noite no BR).
function localDateKey(date = new Date()) {
  const d = new Date(date)
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60 * 1000).toISOString().split('T')[0]
}

// Busca uma aula (lesson) dentro da árvore de estudos (study → módulos → matérias → aulas).
// Retorna a aula normalizada (com taskId, scheduledDate) ou null.
function findLessonInStudies(studies, lessonId) {
  const searchModules = (modules) => {
    for (const mod of modules || []) {
      const found = (mod.lessons || []).find((l) => l.id === lessonId)
      if (found) return found
      const nested = searchModules(mod.submodules || [])
      if (nested) return nested
    }
    return null
  }
  for (const study of studies || []) {
    const found = searchModules(study.modules || [])
    if (found) return found
  }
  return null
}

// Aplica um patch a uma aula dentro da árvore de estudos, de forma imutável.
// Usado para updates otimistas (UI instantânea) sem recarregar tudo do banco.
function mapLessonInStudies(studies, lessonId, patch) {
  const mapModules = (modules) =>
    (modules || []).map((mod) => ({
      ...mod,
      lessons: (mod.lessons || []).map((l) => (l.id === lessonId ? { ...l, ...patch } : l)),
      submodules: mapModules(mod.submodules || []),
    }))
  return (studies || []).map((s) => ({ ...s, modules: mapModules(s.modules || []) }))
}

// Monta os campos da tarefa-espelho de uma aula agendada.
// - Combina data + horário no due_date; sem horário, usa só a data.
// - Prioridade Alta/Urgente entra no Flow (tag 'flow'), além da tag 'Estudos'.
function buildLessonTaskFields({ date, time, priority, title, completed }) {
  const prio = priority || 'Normal'
  const isFlow = prio === 'Alta' || prio === 'Urgente'
  const due = date ? (time ? `${date}T${time}:00` : date) : null
  return {
    title,
    dueDate: due,
    startDate: date || null,
    priority: prio,
    tags: isFlow ? ['Estudos', 'flow'] : ['Estudos'],
    ...(completed !== undefined ? { completed: !!completed } : {}),
  }
}

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
  const [clients, setClients] = useState([])
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
      setClients([])
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
        clientService.getClients(userId),
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
      setClients(safeArray(results[8], 'clients'))

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

    // Sync reverso: se a tarefa veio de uma aula (study_lesson_id) e o usuário
    // alterou a conclusão na aba de Tarefas, espelha a conclusão na aula.
    const existingTask = tasks.find(t => t.id === id)
    const linkedLessonId = existingTask?.studyLessonId || existingTask?.study_lesson_id || null

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

    // Espelha a conclusão na aula vinculada (otimista + service direto p/ não re-disparar o sync).
    if (linkedLessonId && updates.completed !== undefined) {
      const done = !!updates.completed
      setStudies(prev => mapLessonInStudies(prev, linkedLessonId, { isCompleted: done, is_completed: done }))
      try {
        await studyService.toggleLessonComplete(linkedLessonId, done)
      } catch (error) {
        console.error('Erro ao espelhar conclusão na aula:', error)
        setStudies(prev => mapLessonInStudies(prev, linkedLessonId, { isCompleted: !done, is_completed: !done }))
      }
    }
  }

  const deleteTask = async (id) => {
    if (!userId) return
    // Se a tarefa veio de uma aula, desvincula a aula (limpa task_id) para não
    // deixar referência órfã.
    const existing = tasks.find(t => t.id === id)
    const linkedLessonId = existing?.studyLessonId || existing?.study_lesson_id || null
    setTasks(prev => prev.filter(t => t.id !== id))
    await taskService.deleteTask(id, userId)
    if (linkedLessonId) {
      try {
        await studyService.updateLesson(linkedLessonId, { taskId: null })
        const allStudies = await studyService.getStudies(userId)
        setStudies(allStudies)
      } catch (error) {
        console.error('Erro ao desvincular aula da tarefa removida:', error)
      }
    }
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

  // Client Actions (cliente é opcional e reutilizável entre projetos)
  const addClient = async (client) => {
    if (!userId) return
    const newClient = await clientService.createClient(userId, client)
    setClients(prev => [newClient, ...prev])
    return newClient
  }

  const updateClient = async (id, updates) => {
    if (!userId) return
    setClients(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c))
    const updated = await clientService.updateClient(id, userId, updates)
    if (updated) setClients(prev => prev.map(c => c.id === id ? updated : c))
    return updated
  }

  const deleteClient = async (id) => {
    if (!userId) return
    setClients(prev => prev.filter(c => c.id !== id))
    // Desvincula o cliente dos projetos localmente (no banco o FK é ON DELETE SET NULL)
    setProjects(prev => prev.map(p => (p.clientId === id || p.client_id === id) ? { ...p, clientId: null, client_id: null } : p))
    await clientService.deleteClient(id, userId)
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

    const today = localDateKey()
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

  // Marca um hábito como concluído numa data (idempotente: só adiciona, nunca remove).
  const markHabitComplete = async (id, dateStr) => {
    if (!userId) return
    const habit = habits.find((h) => h.id === id)
    if (!habit) return
    const completedDates = Array.isArray(habit.completions) ? [...habit.completions] : []
    if (completedDates.includes(dateStr)) return // já concluído
    completedDates.push(dateStr)
    const currentStreak = (habit.currentStreak || 0) + 1
    const bestStreak = Math.max(currentStreak, habit.bestStreak || 0)
    const updates = { ...habit, completions: completedDates, currentStreak, bestStreak }
    setHabits(prev => prev.map(h => h.id === id ? updates : h))
    const updated = await habitService.updateHabit(id, userId, updates)
    if (updated) setHabits(prev => prev.map(h => h.id === id ? updated : h))
  }

  // Conclui automaticamente os hábitos vinculados ao timer cuja meta de foco
  // (Produtividade/Estudos) já foi atingida HOJE. Chamado pelo Flow e ao abrir Hábitos.
  const syncTimerHabits = async () => {
    if (!userId) return
    const totals = focusLogService.getCategoryTotals(1) // hoje: { work, study }
    const today = localDateKey()
    for (const h of habits) {
      if (!h.timerCategory || !h.timerGoalMinutes) continue
      const got = h.timerCategory === 'study' ? totals.study : totals.work
      const done = Array.isArray(h.completions) && h.completions.includes(today)
      if (got >= h.timerGoalMinutes && !done) {
        await markHabitComplete(h.id, today)
      }
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

    // Installment purchase: create one transaction per parcela
    if (finance.isInstallment && finance.installmentCount > 1) {
      const groupId = crypto.randomUUID()
      const totalAmount = parseFloat(finance.amount)
      const N = parseInt(finance.installmentCount, 10)
      const perInstallment = totalAmount / N
      const baseDate = finance.date.substring(0, 10) // YYYY-MM-DD
      const baseDesc = finance.description.replace(/\s*\(\d+\/\d+\)$/, '')

      const transactions = Array.from({ length: N }, (_, i) => ({
        description: `${baseDesc} (${i + 1}/${N})`,
        amount: perInstallment.toFixed(2),
        type: finance.type,
        category: finance.category,
        date: addMonthsToDate(baseDate, i),   // 1ª parcela = data escolhida, 2ª = +1 mês, etc.
        isInstallment: true,
        installmentCount: N,
        installmentTotal: totalAmount.toFixed(2),
        installmentGroupId: groupId,
        installmentIndex: i + 1,
        // Propaga conta/cartão/pagamento/tags/observação para cada parcela
        accountId: finance.accountId ?? null,
        cardId: finance.cardId ?? null,
        paymentMethod: finance.paymentMethod ?? null,
        purchaseDate: finance.purchaseDate ?? null,
        tags: Array.isArray(finance.tags) ? finance.tags : [],
        notes: finance.notes ?? null,
      }))

      const newTransactions = await financeService.createTransactions(userId, transactions)
      setFinances(prev => [...newTransactions, ...prev])
      return newTransactions
    }

    // Non-installment: single transaction
    const newFinance = await financeService.createTransaction(userId, finance)
    setFinances(prev => [newFinance, ...prev])
    return newFinance
  }

  const updateFinance = async (id, updates) => {
    if (!userId) return
    const existing = finances.find(f => f.id === id)

    // Installment group: update all sibling parcelas together
    if (existing?.installment_group_id) {
      const N = existing.installment_count
      const confirmed = window.confirm(
        `Esta é uma compra parcelada (${N}x). Deseja atualizar todas as parcelas?`
      )
      if (!confirmed) return

      const groupId = existing.installment_group_id
      const siblings = finances
        .filter(f => f.installment_group_id === groupId)
        .sort((a, b) => (a.installment_index ?? 0) - (b.installment_index ?? 0))

      // Derive the first-parcela base date from whichever parcela the user edited
      const editedDate = (updates.date ?? existing.date).substring(0, 10)
      const editedIndex = existing.installment_index ?? 1
      const firstParcelDate = addMonthsToDate(editedDate, -(editedIndex - 1)).substring(0, 10)

      // Strip any existing "(X/N)" suffix from the description being set
      const baseDesc = (updates.description ?? existing.description).replace(/\s*\(\d+\/\d+\)$/, '')
      const perInstallment = parseFloat(updates.amount ?? existing.amount).toFixed(2)

      const siblingUpdates = siblings.map(sib => ({
        id: sib.id,
        updates: {
          ...updates,
          description: `${baseDesc} (${sib.installment_index}/${N})`,
          amount: perInstallment,
          date: addMonthsToDate(firstParcelDate, (sib.installment_index ?? 1) - 1),
        },
      }))

      // Optimistic update in state
      setFinances(prev => prev.map(f => {
        const match = siblingUpdates.find(u => u.id === f.id)
        return match ? { ...f, ...match.updates } : f
      }))

      // Persist each sibling
      for (const { id: sibId, updates: sibUpdates } of siblingUpdates) {
        await financeService.updateTransaction(sibId, userId, sibUpdates)
      }
      return
    }

    // Single (non-installment) transaction update
    setFinances(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
    const updatedFinance = await financeService.updateTransaction(id, userId, updates)
    if (updatedFinance) setFinances(prev => prev.map(f => f.id === id ? updatedFinance : f))
  }

  const deleteFinance = async (id) => {
    if (!userId) return
    const existing = finances.find(f => f.id === id)

    // Installment group: delete all sibling parcelas together
    if (existing?.installment_group_id) {
      const N = existing.installment_count
      const confirmed = window.confirm(
        `Esta é uma compra parcelada (${N}x). Deseja excluir todas as parcelas?`
      )
      if (!confirmed) return

      const groupId = existing.installment_group_id
      setFinances(prev => prev.filter(f => f.installment_group_id !== groupId))
      await financeService.deleteTransactionsByGroupId(groupId, userId)
      return
    }

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

  // Cria uma tarefa espelho de uma aula agendada (aparece na aba de Tarefas).
  const createLessonTask = async (lesson) => {
    const newTask = await taskService.createTask(userId, {
      ...buildLessonTaskFields({
        date: lesson.scheduledDate,
        time: lesson.scheduledTime,
        priority: lesson.priority,
        title: lesson.title,
        completed: lesson.isCompleted,
      }),
      status: 'todo',
      studyLessonId: lesson.id,
    })
    setTasks(prev => [newTask, ...prev])
    return newTask
  }

  const addStudyLesson = async (moduleId, lessonData) => {
    if (!userId) return
    const lesson = await studyService.createLesson(moduleId, lessonData)
    // Só aulas COM data agendada viram tarefa (aparecem na aba de Tarefas).
    if (lesson?.id && lessonData.scheduledDate) {
      const task = await createLessonTask(lesson)
      await studyService.updateLesson(lesson.id, { taskId: task.id })
    }
    const allStudies = await studyService.getStudies(userId)
    setStudies(allStudies)
    return lesson
  }

  const updateStudyLesson = async (lessonId, updates) => {
    if (!userId) return
    const current = findLessonInStudies(studies, lessonId)
    const hadTask = current?.taskId || null
    // Valores resultantes após o update (mantém os atuais se não vierem)
    const nextDate = updates.scheduledDate !== undefined ? updates.scheduledDate : current?.scheduledDate
    const nextTime = updates.scheduledTime !== undefined ? updates.scheduledTime : current?.scheduledTime
    const nextPriority = updates.priority !== undefined ? updates.priority : current?.priority
    const nextTitle = updates.title !== undefined ? updates.title : current?.title

    const saved = await studyService.updateLesson(lessonId, updates)

    // Sincroniza a tarefa-espelho conforme data/horário/prioridade
    try {
      if (nextDate) {
        const fields = buildLessonTaskFields({ date: nextDate, time: nextTime, priority: nextPriority, title: nextTitle })
        if (hadTask) {
          const updatedTask = await taskService.updateTask(hadTask, userId, fields)
          setTasks(prev => prev.map(t => t.id === hadTask ? updatedTask : t))
        } else {
          // Acabou de ganhar uma data → cria a tarefa e vincula
          const task = await createLessonTask(saved)
          await studyService.updateLesson(lessonId, { taskId: task.id })
        }
      } else if (hadTask) {
        // Removeu a data → remove a tarefa-espelho
        await taskService.deleteTask(hadTask, userId)
        setTasks(prev => prev.filter(t => t.id !== hadTask))
        await studyService.updateLesson(lessonId, { taskId: null })
      }
    } catch (error) {
      console.error('Erro ao sincronizar aula↔tarefa:', error)
    }

    const allStudies = await studyService.getStudies(userId)
    setStudies(allStudies)
    return saved
  }

  const deleteStudyLesson = async (lessonId) => {
    if (!userId) return
    const current = findLessonInStudies(studies, lessonId)
    await studyService.deleteLesson(lessonId)
    // Remove a tarefa-espelho vinculada, se houver
    if (current?.taskId) {
      try {
        await taskService.deleteTask(current.taskId, userId)
        setTasks(prev => prev.filter(t => t.id !== current.taskId))
      } catch (error) {
        console.error('Erro ao remover tarefa da aula:', error)
      }
    }
    const allStudies = await studyService.getStudies(userId)
    setStudies(allStudies)
  }

  const toggleStudyLesson = async (lessonId, isCompleted) => {
    if (!userId) return
    const current = findLessonInStudies(studies, lessonId)
    // 1. OTIMISTA: atualiza a UI na hora (progresso/anéis recalculam ao vivo)
    setStudies(prev => mapLessonInStudies(prev, lessonId, { isCompleted, is_completed: isCompleted }))
    if (current?.taskId) {
      const completedAt = isCompleted ? new Date().toISOString() : null
      setTasks(prev => prev.map(t => t.id === current.taskId
        ? { ...t, completed: isCompleted, completed_at: completedAt, status: isCompleted ? 'done' : 'todo' }
        : t))
    }
    // 2. Persiste em background (não bloqueia a UI já atualizada)
    try {
      await studyService.toggleLessonComplete(lessonId, isCompleted)
      if (current?.taskId) {
        const completedAt = isCompleted ? new Date().toISOString() : null
        await taskService.updateTask(current.taskId, userId, {
          completed: isCompleted,
          status: isCompleted ? 'done' : 'todo',
          completed_at: completedAt,
        })
      }
    } catch (error) {
      console.error('Erro ao concluir aula:', error)
      // Reverte em caso de falha
      setStudies(prev => mapLessonInStudies(prev, lessonId, { isCompleted: !isCompleted, is_completed: !isCompleted }))
    }
  }

  const addDreamMap = async (dreamMap, imageFile) => {
    if (!userId) return
    const imageUrl = await dreamMapService.uploadImage(imageFile, userId)
    const newDreamMap = await dreamMapService.createDreamMap(userId, { ...dreamMap, imageUrl })
    setDreamMaps([newDreamMap, ...dreamMaps])
    return newDreamMap
  }

  const updateDreamMap = async (id, updates, imageFile = null) => {
    if (!userId) return
    // Troca de imagem é opcional: só faz upload se vier um novo arquivo
    let payload = { ...updates }
    if (imageFile) {
      const imageUrl = await dreamMapService.uploadImage(imageFile, userId)
      payload = { ...payload, imageUrl }
    }
    setDreamMaps(dreamMaps.map(dm => dm.id === id ? { ...dm, ...payload } : dm))
    const updated = await dreamMapService.updateDreamMap(id, userId, payload)
    if (updated) setDreamMaps(dreamMaps.map(dm => dm.id === id ? updated : dm))
    return updated
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
    tasks, projects, clients, goals, habits, finances, studies, dreamMaps, events, loading,
    addTask, updateTask, deleteTask,
    addProject, updateProject, deleteProject,
    addClient, updateClient, deleteClient,
    addGoal, updateGoal, deleteGoal,
    addHabit, completeHabit, completeHabitForDate, updateHabit, deleteHabit, markHabitComplete, syncTimerHabits,
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