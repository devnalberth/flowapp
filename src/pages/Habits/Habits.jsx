import { useState, useMemo, useEffect } from 'react'
import TopNav from '../../components/TopNav/TopNav.jsx'
import { useApp } from '../../context/AppContext.jsx'
import CreateHabitModal from '../../components/CreateHabitModal/CreateHabitModal.jsx'
import FloatingCreateButton from '../../components/FloatingCreateButton/FloatingCreateButton.jsx'
import { 
  Calendar, 
  BarChart3, 
  TrendingUp, 
  Search, 
  Sparkles, 
  Dumbbell, 
  Brain, 
  BookOpen, 
  Book,
  Plus,
  X,
  Trash2
} from 'lucide-react'

import './Habits.css'

const VIEW_MODES = [
  { id: 'daily', label: 'Diário', icon: Calendar },
  { id: 'weekly', label: 'Semanal', icon: BarChart3 },
  { id: 'monthly', label: 'Mensal', icon: TrendingUp },
]

const CATEGORIES = [
  { id: 'all', label: 'Todos', color: '#ff4800' },
  { id: 'health', label: 'Saúde', color: '#0a9463' },
  { id: 'work', label: 'Trabalho', color: '#ff7a00' },
  { id: 'learning', label: 'Aprendizado', color: '#4f5bd5' },
  { id: 'mindfulness', label: 'Mindfulness', color: '#ff4800' },
]

const ICON_OPTIONS = [
  { id: 'sparkles', icon: Sparkles, label: 'Sparkles' },
  { id: 'dumbbell', icon: Dumbbell, label: 'Dumbbell' },
  { id: 'brain', icon: Brain, label: 'Brain' },
  { id: 'bookopen', icon: BookOpen, label: 'Book Open' },
  { id: 'book', icon: Book, label: 'Book' },
]

// Matriz do mês para visualização mensal
const MONTH_MATRIX = [
  { label: 'Semana 1', days: [
    { day: 1, inMonth: true, score: 0.8 },
    { day: 2, inMonth: true, score: 0.6 },
    { day: 3, inMonth: true, score: 0.9 },
    { day: 4, inMonth: true, score: 0.7 },
    { day: 5, inMonth: true, score: 0.85 },
    { day: 6, inMonth: true, score: 0.5 },
    { day: 7, inMonth: true, score: 0.3 },
  ]},
  { label: 'Semana 2', days: [
    { day: 8, inMonth: true, score: 0.75 },
    { day: 9, inMonth: true, score: 0.9 },
    { day: 10, inMonth: true, score: 0.85 },
    { day: 11, inMonth: true, score: 0.7 },
    { day: 12, inMonth: true, score: 0.65 },
    { day: 13, inMonth: true, score: 0.8 },
    { day: 14, inMonth: true, score: 0.4 },
  ]},
  { label: 'Semana 3', days: [
    { day: 15, inMonth: true, score: 0.9 },
    { day: 16, inMonth: true, score: 0.85 },
    { day: 17, inMonth: true, score: 0.7 },
    { day: 18, inMonth: true, score: 0.75 },
    { day: 19, inMonth: true, score: 0.8 },
    { day: 20, inMonth: true, score: 0.6 },
    { day: 21, inMonth: true, score: 0.5 },
  ]},
  { label: 'Semana 4', days: [
    { day: 22, inMonth: true, score: 0.85 },
    { day: 23, inMonth: true, score: 0.9 },
    { day: 24, inMonth: true, score: 0.75 },
    { day: 25, inMonth: true, score: 0.8 },
    { day: 26, inMonth: true, score: 0.7 },
    { day: 27, inMonth: true, score: 0.65 },
    { day: 28, inMonth: true, score: 0.6 },
  ]},
  { label: 'Semana 5', days: [
    { day: 29, inMonth: true, score: 0.8 },
    { day: 30, inMonth: true, score: 0.75 },
    { day: 1, inMonth: false, score: 0 },
    { day: 2, inMonth: false, score: 0 },
    { day: 3, inMonth: false, score: 0 },
    { day: 4, inMonth: false, score: 0 },
    { day: 5, inMonth: false, score: 0 },
  ]},
]

const INITIAL_HABITS = [
  { id: 'gratidao', iconId: 'sparkles', label: 'Gratidão', focus: 'Manhã', category: 'mindfulness' },
  { id: 'treino', iconId: 'dumbbell', label: 'Treino', focus: 'Corpo', category: 'health' },
  { id: 'deep-work', iconId: 'brain', label: '4h Trabalho focado', focus: 'FlowWork', category: 'work' },
  { id: 'estudos', iconId: 'bookopen', label: '2h de Estudos', focus: 'Trilha', category: 'learning' },
  { id: 'leitura', iconId: 'book', label: '30m de Leitura', focus: 'Noite', category: 'learning' },
]

export default function Habits({ user, onNavigate, onLogout }) {
  const { habits, addHabit, updateHabit, deleteHabit } = useApp()
  
  const [viewMode, setViewMode] = useState('weekly')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  const [completionsByDate, setCompletionsByDate] = useState({})
  const [initialized, setInitialized] = useState(false)

  // Inicializar hábitos padrão se estiver vazio (apenas uma vez)
  useEffect(() => {
    if (!initialized && habits.length === 0) {
      INITIAL_HABITS.forEach(habit => {
        addHabit({
          ...habit,
          completions: {},
          streak: 0,
        })
      })
      setInitialized(true)
    }
  }, [habits, addHabit, initialized])

  // Obter ícone por ID
  const getIcon = (iconId) => {
    const iconOption = ICON_OPTIONS.find(opt => opt.id === iconId)
    return iconOption ? iconOption.icon : Sparkles
  }

  // Calcular streak de um hábito
  const calculateStreak = (habit) => {
    if (!habit.completions || Object.keys(habit.completions).length === 0) return 0
    
    const dates = Object.keys(habit.completions).sort().reverse()
    let streak = 0
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    for (let i = 0; i < dates.length; i++) {
      const checkDate = new Date(dates[i])
      checkDate.setHours(0, 0, 0, 0)
      const expectedDate = new Date(today)
      expectedDate.setDate(expectedDate.getDate() - i)
      expectedDate.setHours(0, 0, 0, 0)
      
      if (checkDate.getTime() === expectedDate.getTime()) {
        streak++
      } else {
        break
      }
    }
    
    return streak
  }

  // Habits com ícones e streaks calculados
  const habitsWithMeta = useMemo(() => {
    return habits.map(habit => ({
      ...habit,
      icon: getIcon(habit.iconId || 'sparkles'),
      streak: calculateStreak(habit),
    }))
  }, [habits])

  // Filtrar hábitos
  const filteredHabits = useMemo(() => {
    return habitsWithMeta.filter((habit) => {
      const matchesCategory = categoryFilter === 'all' || habit.category === categoryFilter
      const matchesSearch = habit.label.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (habit.focus && habit.focus.toLowerCase().includes(searchTerm.toLowerCase()))
      return matchesCategory && matchesSearch
    })
  }, [habitsWithMeta, categoryFilter, searchTerm])

  // Toggle de completude para um hábito em uma data
  const toggleHabitCompletion = (habitId, date) => {
    const habit = habits.find(h => h.id === habitId)
    if (!habit) return

    const completions = { ...(habit.completions || {}) }
    
    if (completions[date]) {
      delete completions[date]
    } else {
      completions[date] = true
    }

    updateHabit(habitId, { completions })
  }

  // Verificar se hábito está completo em uma data
  const isHabitComplete = (habitId, date) => {
    const habit = habits.find(h => h.id === habitId)
    return habit?.completions?.[date] || false
  }

  // Obter data formatada YYYY-MM-DD
  const getDateString = (daysOffset = 0) => {
    const date = new Date()
    date.setDate(date.getDate() + daysOffset)
    return date.toISOString().split('T')[0]
  }

  // Gerar dados da semana
  const weeklyData = useMemo(() => {
    const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
    const today = new Date()
    const currentDay = today.getDay()
    
    return days.map((day, index) => {
      const offset = index - currentDay
      const date = getDateString(offset)
      const dateObj = new Date(date)
      
      const completed = filteredHabits.filter(habit => isHabitComplete(habit.id, date))
      const completion = filteredHabits.length > 0 ? completed.length / filteredHabits.length : 0
      
      return {
        day,
        date: dateObj.getDate().toString(),
        dateString: date,
        completion,
        done: completed.map(h => h.id),
        total: filteredHabits.length,
      }
    })
  }, [filteredHabits, habits])

  // Estatísticas semanais
  const weeklyStats = useMemo(() => {
    const total = weeklyData.reduce((acc, day) => acc + day.completion, 0)
    const average = weeklyData.length > 0 ? total / weeklyData.length : 0
    const bestDay = weeklyData.reduce((max, day) => day.completion > max.completion ? day : max, weeklyData[0] || { completion: 0 })
    
    return { 
      average, 
      bestDay: bestDay.day,
      totalHabits: filteredHabits.length,
    }
  }, [weeklyData, filteredHabits])

  // Modal handlers
  const handleAddHabit = () => {
    setEditingHabit(null)
    setShowModal(true)
  }

  const handleEditHabit = (habit) => {
    setEditingHabit(habit)
    setShowModal(true)
  }

  const handleSaveHabit = async (habitData) => {
    try {
      if (editingHabit) {
        await updateHabit(editingHabit.id, habitData)
      } else {
        await addHabit({
          ...habitData,
          completions: {},
        })
      }
      setShowModal(false)
      setEditingHabit(null)
    } catch (error) {
      console.error('Erro ao salvar hábito:', error)
      alert('Erro ao salvar hábito: ' + error.message)
    }
  }

  const handleDeleteHabit = (habitId) => {
    if (confirm('Tem certeza que deseja excluir este hábito?')) {
      deleteHabit(habitId)
      setShowModal(false)
      setEditingHabit(null)
    }
  }

  return (
    <div className="habitsPage">
      <TopNav user={user} active="Hábitos" onNavigate={onNavigate} onLogout={onLogout} />
      
      {showModal && (
        <CreateHabitModal
          habit={editingHabit}
          onClose={() => {
            setShowModal(false)
            setEditingHabit(null)
          }}
          onSubmit={handleSaveHabit}
          onDelete={editingHabit ? () => handleDeleteHabit(editingHabit.id) : undefined}
        />
      )}

      <div className="habitsWrapper">
        {/* Filtros e Controles */}
        <section className="habitsControls">
        <div className="habitsControls__modes">
          {VIEW_MODES.map((mode) => {
            const IconComponent = mode.icon
            return (
              <button
                key={mode.id}
                type="button"
                className={`modeBtn ${viewMode === mode.id ? 'modeBtn--active' : ''}`}
                onClick={() => setViewMode(mode.id)}
              >
                <IconComponent className="modeBtn__icon" size={18} />
                <span className="modeBtn__label">{mode.label}</span>
              </button>
            )
          })}
        </div>

        <div className="habitsControls__filters">
          <div className="searchBox">
            <Search className="searchBox__icon" size={16} />
            <input
              type="text"
              placeholder="Buscar hábitos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="categoryFilters">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={`categoryBtn ${categoryFilter === cat.id ? 'categoryBtn--active' : ''}`}
                style={{ '--cat-color': cat.color }}
                onClick={() => setCategoryFilter(cat.id)}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Board de conteúdo */}
      <section className="habitsBoard">
        {viewMode === 'daily' && (
          <div className="habitsDaily">
            <div className="dailyHeader">
              <div>
                <h3>Hoje · {new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</h3>
                <p>Checklist diário dos seus hábitos</p>
              </div>
              <button type="button" className="btnPrimary" onClick={handleAddHabit}>
                <Plus size={18} strokeWidth={2.5} />
                <span>Adicionar hábito</span>
              </button>
            </div>
            <div className="dailyChecklist">
              {filteredHabits.map((habit) => {
                const category = CATEGORIES.find(c => c.id === habit.category)
                const IconComponent = habit.icon
                const today = getDateString(0)
                const isChecked = isHabitComplete(habit.id, today)
                
                return (
                  <div 
                    key={habit.id} 
                    className="dailyCheckItem" 
                    style={{ '--item-color': category?.color }}
                  >
                    <input 
                      type="checkbox" 
                      checked={isChecked}
                      onChange={() => toggleHabitCompletion(habit.id, today)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div 
                      className="dailyCheckItem__content"
                      onClick={() => handleEditHabit(habit)}
                    >
                      <IconComponent className="dailyCheckItem__icon" size={20} strokeWidth={2} />
                      <span className="dailyCheckItem__label">{habit.label}</span>
                      <span className="dailyCheckItem__focus">{habit.focus}</span>
                    </div>
                    <span className="dailyCheckItem__streak">🔥 {habit.streak}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {viewMode === 'weekly' && (
          <div className="habitsWeekly">
            {weeklyData.map((slot) => {
              const progressPercent = Math.round(slot.completion * 100)
              return (
                <article key={slot.dateString} className="weekCard">
                  <div className="weekCard__header">
                    <div className="weekCard__date">
                      <span className="weekCard__day">{slot.day}</span>
                      <span className="weekCard__num">{slot.date} jan</span>
                    </div>
                    <span className="weekCard__percent">{progressPercent}%</span>
                  </div>
                  <div className="weekCard__progress">
                    <div className="weekCard__bar" style={{ width: `${progressPercent}%` }} />
                  </div>
                  <ul className="weekCard__list">
                    {filteredHabits.map((habit) => {
                      const isChecked = isHabitComplete(habit.id, slot.dateString)
                      const category = CATEGORIES.find(c => c.id === habit.category)
                      const IconComponent = habit.icon
                      return (
                        <li key={habit.id} style={{ '--habit-color': category?.color }}>
                          <div className={`weekCheckbox ${isChecked ? 'weekCheckbox--checked' : ''}`}>
                            <input 
                              type="checkbox" 
                              checked={isChecked}
                              onChange={() => toggleHabitCompletion(habit.id, slot.dateString)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div 
                              className="weekCheckbox__content"
                              onClick={() => handleEditHabit(habit)}
                            >
                              <IconComponent className="weekCheckbox__icon" size={16} strokeWidth={2} />
                              <span className="weekCheckbox__label">{habit.label}</span>
                            </div>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                </article>
              )
            })}
          </div>
        )}

        {viewMode === 'monthly' && (
          <div className="habitsMonthly ui-card">
            <header>
              <div>
                <p>Novembro · 2025</p>
                <h3>Calendário com calor de hábitos</h3>
                <p>Cada célula mostra o score do dia e o estado geral (0% · 100%).</p>
              </div>
              <button type="button">Exportar CSV</button>
            </header>
            <div className="habitsMonthly__grid">
              {MONTH_MATRIX.map((week) => (
                <div key={week.label} className="habitsMonthly__week">
                  {week.days.map((day) => (
                    <article key={`${week.label}-${day.day}`} className={day.inMonth ? '' : 'is-muted'}>
                      <header>
                        <span>{day.day}</span>
                        <small>{day.inMonth ? `${Math.round(day.score * 100)}%` : '–'}</small>
                      </header>
                      {day.inMonth && (
                        <div className="habitsMonthly__track">
                          <span style={{ width: `${day.score * 100}%` }} />
                        </div>
                      )}
                    </article>
                  ))}
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      <FloatingCreateButton
        label="Novo hábito"
        caption="Criar hábito"
        onClick={handleAddHabit}
      />
      </div>
    </div>
  )
}
