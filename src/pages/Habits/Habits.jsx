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
  Edit2,
  Check
} from 'lucide-react'

import './Habits.css'

const VIEW_MODES = [
  { id: 'daily', label: 'Diário', icon: Calendar },
  { id: 'weekly', label: 'Semanal', icon: BarChart3 },
  { id: 'monthly', label: 'Mensal', icon: TrendingUp },
]

const CATEGORIES = [
  { id: 'all', label: 'Todos', color: '#ff4800' },
  { id: 'saude', label: 'Saúde', color: '#0a9463' },
  { id: 'trabalho', label: 'Trabalho', color: '#ff7a00' },
  { id: 'aprendizado', label: 'Aprendizado', color: '#4f5bd5' },
  { id: 'mindfulness', label: 'Mindfulness', color: '#ff4800' },
]

const ICON_OPTIONS = [
  { id: 'sparkles', icon: Sparkles, label: 'Sparkles' },
  { id: 'dumbbell', icon: Dumbbell, label: 'Dumbbell' },
  { id: 'brain', icon: Brain, label: 'Brain' },
  { id: 'bookopen', icon: BookOpen, label: 'Book Open' },
  { id: 'book', icon: Book, label: 'Book' },
]

export default function Habits({ user, onNavigate, onLogout }) {
  const { habits, addHabit, updateHabit, deleteHabit, completeHabit } = useApp()
  
  const [viewMode, setViewMode] = useState('daily')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)
  
  // Controle de data para navegação
  const [selectedDateOffset, setSelectedDateOffset] = useState(0) 

  const currentDate = useMemo(() => {
    const date = new Date()
    date.setDate(date.getDate() + selectedDateOffset)
    return date
  }, [selectedDateOffset])

  const dateString = currentDate.toISOString().split('T')[0]

  const getIcon = (iconId) => {
    const iconOption = ICON_OPTIONS.find(opt => opt.id === iconId)
    return iconOption ? iconOption.icon : Sparkles
  }

  const habitsWithMeta = useMemo(() => {
    return habits.map(habit => ({
      ...habit,
      icon: getIcon(habit.iconId || 'sparkles'),
      current_streak: habit.current_streak || habit.streak || 0, 
    }))
  }, [habits])

  const habitsDisplay = useMemo(() => {
    const dayOfWeek = currentDate.getDay() // 0 = Domingo

    const parseDays = (raw) => {
      if (!raw && raw !== 0) return []
      if (Array.isArray(raw)) return raw.map((d) => Number(d))
      if (typeof raw === 'string') {
        try {
          const parsed = JSON.parse(raw)
          if (Array.isArray(parsed)) return parsed.map((d) => Number(d))
        } catch (e) {
          // fallback: comma / semicolon separated
          return raw.split(/[;,]/).map(s => Number(s.trim())).filter(n => !Number.isNaN(n))
        }
      }
      return []
    }

    return habitsWithMeta.filter((habit) => {
      // 1. Filtro de Categoria e Busca
      const matchesCategory = categoryFilter === 'all' || habit.category === categoryFilter
      const matchesSearch = (habit.label || habit.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      if (!matchesCategory || !matchesSearch) return false

      // 2. Filtro de Frequência
      if (habit.frequency === 'daily' || !habit.frequency) return true
      
      if (habit.frequency === 'custom' || habit.frequency === 'weekly') {
        const days = parseDays(habit.customDays ?? habit.selectedDays ?? habit.selected_days ?? habit.days)
        if (days.length === 0) return true
        return days.includes(dayOfWeek)
      }

      return true
    })
  }, [habitsWithMeta, categoryFilter, searchTerm, currentDate])

  const handleToggleCheck = async (habitId) => {
    if (completeHabit) {
      await completeHabit(habitId)
    }
  }

  const isHabitComplete = (habit) => {
    const list = Array.isArray(habit.completions) ? habit.completions : (Array.isArray(habit.completed_dates) ? habit.completed_dates : [])
    return list.includes(dateString)
  }

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
        await addHabit(habitData)
      }
      setShowModal(false)
      setEditingHabit(null)
    } catch (error) {
      console.error('Erro ao salvar:', error)
      alert('Erro ao salvar hábito')
    }
  }

  const handleDeleteHabit = async () => {
    if (!editingHabit) return
    if (confirm('Tem certeza que deseja excluir este hábito?')) {
      try {
        await deleteHabit(editingHabit.id)
        setShowModal(false)
        setEditingHabit(null)
      } catch (error) {
        alert('Erro ao excluir')
      }
    }
  }

  return (
    <div className="habitsPage">
      <TopNav user={user} active="Hábitos" onNavigate={onNavigate} onLogout={onLogout} />
      
      {/* CORREÇÃO DO ERRO 1: Props 'open' e 'initialData' passadas corretamente */}
      {showModal && (
        <CreateHabitModal
          open={showModal} 
          initialData={editingHabit} 
          onClose={() => {
            setShowModal(false)
            setEditingHabit(null)
          }}
          onSubmit={handleSaveHabit}
          onDelete={editingHabit ? handleDeleteHabit : undefined}
        />
      )}

      <div className="habitsWrapper">
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
                  // CORREÇÃO DO ERRO 2: Cast para 'any' silencia o erro de CSS variable no TS
                  style={/** @type {any} */ ({ '--cat-color': cat.color })}
                  onClick={() => setCategoryFilter(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

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
                {habitsDisplay.length === 0 ? (
                  <div className="habitsEmpty">
                    <p>Nenhum hábito programado para hoje.</p>
                  </div>
                ) : (
                  habitsDisplay.map((habit) => {
                    const category = CATEGORIES.find(c => c.id === habit.category)
                    const IconComponent = habit.icon
                    const isChecked = isHabitComplete(habit)
                    
                    return (
                      <div 
                        key={habit.id} 
                        className={`dailyCheckItem ${isChecked ? 'dailyCheckItem--checked' : ''}`}
                        // CORREÇÃO DO ERRO 3: Cast para 'any' aqui também
                        style={/** @type {any} */ ({ '--item-color': category?.color || '#ff4800' })}
                      >
                        <div 
                          className="dailyCheckItem__checkbox"
                          onClick={() => handleToggleCheck(habit.id)}
                        >
                          {isChecked && <Check size={16} color="white" strokeWidth={3} />}
                        </div>

                        <div 
                          className="dailyCheckItem__content"
                          onClick={() => handleEditHabit(habit)}
                        >
                          <IconComponent className="dailyCheckItem__icon" size={20} strokeWidth={2} />
                          <span className="dailyCheckItem__label">{habit.label || habit.name}</span>
                          {habit.focus && <span className="dailyCheckItem__focus">{habit.focus}</span>}
                        </div>
                        
                        <div className="dailyCheckItem__actions">
                           <span className="dailyCheckItem__streak">🔥 {habit.current_streak}</span>
                           <button className="iconBtn" onClick={() => handleEditHabit(habit)}>
                             <Edit2 size={16} />
                           </button>
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}

          {viewMode !== 'daily' && (
             <div style={{padding: '40px', textAlign: 'center', color: '#666'}}>
                Visualização {viewMode === 'weekly' ? 'Semanal' : 'Mensal'} em desenvolvimento.
                <br/>Volte para a visualização Diária para gerenciar os hábitos.
             </div>
          )}
        </section>

        <FloatingCreateButton
          label="Novo hábito"
          caption="Criar hábito"
          onClick={handleAddHabit}
          icon="+"
          ariaLabel="Criar novo hábito"
        />
      </div>
    </div>
  )
}