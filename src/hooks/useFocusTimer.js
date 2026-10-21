import { useEffect, useMemo, useRef, useState } from 'react'
import { Timer, Zap, Coffee, Settings } from 'lucide-react'
import { focusLogService } from '../services/focusLogService'
import { categorizeTask, CATEGORY_META } from '../utils/taskCategory'

export const POMODORO_TECHNIQUES = {
  classic: {
    id: 'classic',
    label: 'Clássico',
    focus: 25,
    break: 5,
    longBreak: 15,
    sessions: 4,
    icon: Timer,
  },
  deep: {
    id: 'deep',
    label: 'Deep Work',
    focus: 50,
    break: 10,
    longBreak: 20,
    sessions: 4,
    icon: Zap,
  },
  flow: {
    id: 'flow',
    label: 'Flow 90',
    focus: 90,
    break: 30,
    longBreak: 30,
    sessions: 1,
    icon: Coffee,
  },
  custom: {
    id: 'custom',
    label: 'Personalizado',
    focus: 25,
    break: 5,
    longBreak: 15,
    sessions: 4,
    icon: Settings,
  },
}

// Existing Tasks timer, shared without changing its accounting or lifecycle.
export default function useFocusTimer({
  tasks,
  lessonCtxMap,
  updateTask,
  syncTimerHabits,
  userId,
  studyTarget = null,
}) {
  const [freeFocusCategory, setFreeFocusCategory] = useState('work')
  const [focusedBlock, setFocusedBlock] = useState(studyTarget || null)
  const [activeTechnique, setActiveTechnique] = useState('classic')
  const [pomodoroMode, setPomodoroMode] = useState('focus') // 'focus', 'break', 'longBreak'
  const [timeLeft, setTimeLeft] = useState(25 * 60)
  const [isRunning, setIsRunning] = useState(false)
  const [sessionsCompleted, setSessionsCompleted] = useState(0)
  const [focusedTaskId, setFocusedTaskId] = useState(null)

  const [customConfig, setCustomConfig] = useState({
    focus: 25,
    break: 5,
    longBreak: 15,
    sessions: 4,
  })

  // --- REFS PARA O TIMER REAL (FIX DO SEGUNDO PLANO) ---
  const endTimeRef = useRef(null)
  const timerIntervalRef = useRef(null)
  const lastTimeRef = useRef(timeLeft) // Para calcular o tempo gasto ao pausar

  const focusedTaskData = useMemo(
    () => (focusedTaskId ? tasks.find((t) => t.id === focusedTaskId) : null),
    [focusedTaskId, tasks]
  )

  // --- LÓGICA ROBUSTA DO TIMER (TIMESTAMP) ---
  useEffect(() => {
    if (isRunning) {
      // Se acabou de iniciar/retomar, define o tempo de término baseado no agora
      if (!endTimeRef.current) {
        endTimeRef.current = Date.now() + timeLeft * 1000
        lastTimeRef.current = timeLeft // Marca onde começou
      }

      timerIntervalRef.current = setInterval(() => {
        const now = Date.now()
        const diff = endTimeRef.current - now
        const secondsLeft = Math.ceil(diff / 1000)

        if (secondsLeft <= 0) {
          handleTimerComplete()
        } else {
          setTimeLeft(secondsLeft)
        }
      }, 100) // Verifica a cada 100ms para maior precisão visual
    } else {
      clearInterval(timerIntervalRef.current)
      endTimeRef.current = null // Limpa a referência ao pausar
    }

    return () => clearInterval(timerIntervalRef.current)
  }, [isRunning])

  // Salva o tempo focado. Funciona em dois modos:
  // - com tarefa: acumula em task.time_spent e credita a categoria da tarefa;
  // - ciclo livre: sem tarefa nenhuma, credita a categoria escolhida no timer.
  // Nos dois casos o tempo entra no log do dia, que é o que alimenta a meta
  // diária dos hábitos e os totais do painel de produtividade.
  const saveFocusTime = async (secondsElapsed) => {
    if (!secondsElapsed || secondsElapsed <= 0) return
    if (pomodoroMode !== 'focus') return // Só salva tempo de foco, não de pausa

    const minutesToAdd = secondsElapsed / 60
    const currentTask = focusedTaskId ? tasks.find((t) => t.id === focusedTaskId) : null

    // Data local, para não jogar o foco da noite no dia seguinte (UTC)
    const now = new Date()
    const offset = now.getTimezoneOffset()
    const localDate = new Date(now.getTime() - offset * 60 * 1000)
    const todayStr = localDate.toISOString().split('T')[0]

    if (currentTask) {
      const lid = currentTask.studyLessonId || currentTask.study_lesson_id
      const displayTitle = (lid && lessonCtxMap[lid]?.lessonTitle) || currentTask.title
      focusLogService.addTime(todayStr, minutesToAdd, {
        category: categorizeTask(currentTask),
        taskId: currentTask.id,
        taskTitle: displayTitle,
      })
    } else if (focusedBlock?.id) {
      // Bloco de estudo em foco: o tempo fica no nome do bloco, sem tarefa.
      focusLogService.addTime(todayStr, minutesToAdd, {
        category: 'study',
        taskId: `block:${focusedBlock.id}`,
        taskTitle: focusedBlock.title,
      })
    } else {
      // Ciclo livre: agrupa por categoria numa linha própria, para o painel de
      // produtividade não mostrar um total maior que a soma das tarefas.
      const cat = CATEGORY_META[freeFocusCategory] || CATEGORY_META.work
      focusLogService.addTime(todayStr, minutesToAdd, {
        category: freeFocusCategory,
        taskId: `free:${freeFocusCategory}`,
        taskTitle: `Ciclo livre · ${cat.label}`,
      })
    }

    // Persiste o dia de foco no banco (histórico durável, sobrevive a limpar cache)
    focusLogService.persistDay(userId, todayStr)

    // Conclui automaticamente hábitos vinculados ao timer cuja meta do dia foi atingida
    syncTimerHabits?.()

    if (currentTask) {
      await updateTask(currentTask.id, {
        time_spent: (currentTask.time_spent || 0) + minutesToAdd,
        updated_at: new Date().toISOString(),
      })
    }
  }

  const handleTimerComplete = () => {
    setIsRunning(false)
    clearInterval(timerIntervalRef.current)

    // Salva o tempo total do ciclo que acabou
    const config =
      activeTechnique === 'custom' ? customConfig : POMODORO_TECHNIQUES[activeTechnique]
    if (pomodoroMode === 'focus') {
      saveFocusTime(config.focus * 60) // Salva o ciclo completo
    }

    endTimeRef.current = null

    if (pomodoroMode === 'focus') {
      const newSessions = sessionsCompleted + 1
      setSessionsCompleted(newSessions)

      if (newSessions >= config.sessions) {
        setPomodoroMode('longBreak')
        setTimeLeft(config.longBreak * 60)
        setSessionsCompleted(0)
      } else {
        setPomodoroMode('break')
        setTimeLeft(config.break * 60)
      }
    } else {
      setPomodoroMode('focus')
      setTimeLeft(config.focus * 60)
    }
  }

  const switchTechnique = (techId) => {
    // Se estava rodando, salva o progresso parcial antes de trocar
    if (isRunning && pomodoroMode === 'focus') {
      const elapsed = lastTimeRef.current - timeLeft
      saveFocusTime(elapsed)
    }

    setActiveTechnique(techId)
    setIsRunning(false)
    setPomodoroMode('focus')
    setSessionsCompleted(0)
    endTimeRef.current = null

    const config = techId === 'custom' ? customConfig : POMODORO_TECHNIQUES[techId]
    setTimeLeft(config.focus * 60)
    lastTimeRef.current = config.focus * 60
  }

  const handleFocusTask = (taskId) => {
    setFocusedBlock(null)
    // Se estava rodando em outra tarefa, salva o tempo dela
    if (isRunning && focusedTaskId && focusedTaskId !== taskId && pomodoroMode === 'focus') {
      const elapsed = lastTimeRef.current - timeLeft
      saveFocusTime(elapsed)
    }

    setFocusedTaskId(taskId)
    const config =
      activeTechnique === 'custom' ? customConfig : POMODORO_TECHNIQUES[activeTechnique]
    setPomodoroMode('focus')
    setTimeLeft(config.focus * 60)
    setIsRunning(false)
    endTimeRef.current = null
    lastTimeRef.current = config.focus * 60
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleTimer = () => {
    if (isRunning) {
      // Vai pausar: Salva o tempo decorrido desde o último start/resume
      if (pomodoroMode === 'focus') {
        const currentSeconds = Math.ceil((endTimeRef.current - Date.now()) / 1000)
        const elapsed = lastTimeRef.current - currentSeconds
        saveFocusTime(elapsed)

        // Atualiza a referência "último tempo" para o tempo atual (pausado)
        // para que na próxima retomada a conta comece daqui
        setTimeLeft(currentSeconds)
        lastTimeRef.current = currentSeconds
      }
    }
    setIsRunning(!isRunning)
  }

  const resetTimer = () => {
    // Se resetar durante o foco, salva o que foi feito até agora
    if (isRunning && pomodoroMode === 'focus') {
      const currentSeconds = Math.ceil((endTimeRef.current - Date.now()) / 1000)
      const elapsed = lastTimeRef.current - currentSeconds
      saveFocusTime(elapsed)
    }

    setIsRunning(false)
    endTimeRef.current = null
    const config =
      activeTechnique === 'custom' ? customConfig : POMODORO_TECHNIQUES[activeTechnique]
    const resetTime =
      (pomodoroMode === 'focus'
        ? config.focus
        : pomodoroMode === 'break'
          ? config.break
          : config.longBreak) * 60
    setTimeLeft(resetTime)
    lastTimeRef.current = resetTime
  }

  // Salva o tempo de foco ainda não persistido (sem mexer em estado).
  const persistElapsedFocus = () => {
    if (pomodoroMode !== 'focus') return
    let currentSeconds = timeLeft
    if (isRunning && endTimeRef.current) {
      currentSeconds = Math.ceil((endTimeRef.current - Date.now()) / 1000)
    }
    const elapsed = lastTimeRef.current - currentSeconds
    if (elapsed > 0) saveFocusTime(elapsed)
  }

  // Sai do modo foco: salva o tempo, para o timer e fecha o card do Flow.
  const exitFocusMode = () => {
    persistElapsedFocus()
    clearInterval(timerIntervalRef.current)
    endTimeRef.current = null
    setIsRunning(false)
    setFocusedTaskId(null)
  }

  // Garante que o foco decorrido seja salvo ao sair da página (desmonte).
  const persistRef = useRef(persistElapsedFocus)
  persistRef.current = persistElapsedFocus
  useEffect(
    () => () => {
      persistRef.current()
    },
    []
  )

  const formatTime = (seconds) => {
    const safeSeconds = Math.max(0, seconds)
    const m = Math.floor(safeSeconds / 60)
    const s = safeSeconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  return {
    freeFocusCategory,
    setFreeFocusCategory,
    focusedBlock,
    setFocusedBlock,
    activeTechnique,
    setActiveTechnique,
    pomodoroMode,
    setPomodoroMode,
    timeLeft,
    setTimeLeft,
    isRunning,
    setIsRunning,
    sessionsCompleted,
    setSessionsCompleted,
    focusedTaskId,
    setFocusedTaskId,
    customConfig,
    setCustomConfig,
    focusedTaskData,
    switchTechnique,
    handleFocusTask,
    toggleTimer,
    resetTimer,
    exitFocusMode,
    formatTime,
  }
}
