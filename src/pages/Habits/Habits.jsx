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
  Trash2,
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

// Matriz do mês para visualização mensal (Mantido visualmente)
const MONTH_MATRIX = [
  { label: 'Semana 1', days: [{ day: 1, inMonth: true, score: 0.8 }, { day: 2, inMonth: true, score: 0.6 }, { day: 3, inMonth: true, score: 0.9 }, { day: 4, inMonth: true, score: 0.7 }, { day: 5, inMonth: true, score: 0.85 }, { day: 6, inMonth: true, score: 0.5 }, { day: 7, inMonth: true, score: 0.3 }]},
  { label: 'Semana 2', days: [{ day: 8, inMonth: true, score: 0.75 }, { day: 9, inMonth: true, score: 0.9 }, { day: 10, inMonth: true, score: 0.85 }, { day: 11, inMonth: true, score: 0.7 }, { day: 12, inMonth: true, score: 0.65 }, { day: 13, inMonth: true, score: 0.8 }, { day: 14, inMonth: true, score: 0.4 }]},
]

export default function Habits({ user, onNavigate, onLogout }) {
  const { habits, addHabit, updateHabit, deleteHabit, completeHabit } = useApp()
  
  const [viewMode, setViewMode] = useState('daily')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingHabit, setEditingHabit] = useState(null)

  // Obter ícone por ID
  const getIcon = (iconId) => {
    const iconOption = ICON_OPTIONS.find(opt => opt.id === iconId)
    return iconOption ? iconOption.icon : Sparkles
  }

  // Habits com ícones e streaks calculados
  const habitsWithMeta = useMemo(() => {
    return habits.map(habit => ({
      ...habit,
      icon: getIcon(habit.iconId || 'sparkles'),
      streak: habit.current_streak || 0,
    }))
  }, [habits])

  // === LÓGICA CORRIGIDA DE FILTRAGEM DE DIAS ===
  const filteredHabits = useMemo(() => {
    const today = new Date()
    const currentDayOfWeek = today.getDay() // 0 = Domingo, 1 = Segunda...

    return habitsWithMeta.filter((habit) => {
      // 1. Filtro de Categoria
      const matchesCategory = categoryFilter === 'all' || habit.category === categoryFilter
      
      // 2. Filtro de Busca
      const matchesSearch = (habit.label || habit.name || '').toLowerCase().includes(searchTerm.toLowerCase())
      
      if (!matchesCategory || !matchesSearch) return false

      // 3. Filtro de Dias Personalizados (CORREÇÃO PEDIDA)
      // Se for "daily" ou não tiver frequência definida, aparece sempre.
      if (!habit.frequency || habit.frequency === 'daily') return true

      // Se for "custom" ou "weekly", verifica os dias selecionados
      if (habit.frequency === 'custom' || habit.frequency === 'weekly') {
        // Tenta ler customDays (formato novo) ou selectedDays (formato antigo/modal)
        let days = []
        if (Array.isArray(habit.customDays)) days = habit.customDays
        else if (Array.isArray(habit.selectedDays)) days = habit.selectedDays
        else if (typeof habit.customDays === 'string') {
            try { days = JSON.parse(habit.customDays) } catch (e) {}
        }

        // Se não selecionou nenhum dia, mostramos por segurança, senão filtramos
        if (days.length === 0) return true;
        
        // Verifica se hoje está na lista
        return days.includes(currentDayOfWeek);
      }

      return true
    })
  }, [habitsWithMeta, categoryFilter, searchTerm])

  // === LÓGICA DE CHECKLIST CORRIGIDA ===
  const toggleHabitCompletion = async (habitId, dateStr) => {
    // Tenta usar a função otimizada do contexto se existir
    if (completeHabit) {
      await completeHabit(habitId)
    } else {
      // Fallback manual
      const habit = habits.find(h => h.id === habitId)
      if (!habit) return

      let completions = Array.isArray(habit.completions) ? [...habit.completions] : []
      // Se for formato antigo (string), tenta converter ou reseta
      if (!Array.isArray(completions) && typeof habit.completed_dates === 'object') {
         completions = Array.isArray(habit.completed_dates) ? [...habit.completed_dates] : []
      }

      const todayStr = dateStr || new Date().toISOString().split('T')[0]

      if (completions.includes(todayStr)) {
        completions = completions.filter(d => d !== todayStr)
      } else {
        completions.push(todayStr)
      }

      await updateHabit(habitId, { completions })
    }
  }

  const isHabitComplete = (habit, dateStr) => {
    // Verifica array novo ou legado
    const list = Array.isArray(habit.completions) 
      ? habit.completions 
      : (Array.isArray(habit.completed_dates) ? habit.completed_dates : [])
    
    return list.includes(dateStr)
  }

  const getDateString = (daysOffset = 0) => {
    const date = new Date()
    date.setDate(date.getDate() + daysOffset)
    return date.toISOString().split('T')[0]
  }

  // Dados para visualização Semanal (Mantido do seu código original)
  const weeklyData = useMemo(() => {
    const days = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
    const today = new Date()
    const currentDay = today.getDay()
    
    return days.map((day, index) => {
      const offset = index - currentDay
      const date = getDateString(offset)
      const dateObj = new Date()
      dateObj.setDate(dateObj.getDate() + offset)
      
      // Para o gráfico semanal, consideramos todos os hábitos ativos naquele dia
      const activeHabitsForDay = habitsWithMeta.filter(h => {
         if (!h.frequency || h.frequency === 'daily') return true;
         const days = h.customDays || h.selectedDays || [];
         if (Array.isArray(days) && days.length > 0) return days.includes(index);
         return true;
      });

      const completed = activeHabitsForDay.filter(habit => isHabitComplete(habit, date))
      const completion = activeHabitsForDay.length > 0 ? completed.length / activeHabitsForDay.length : 0
      
      return {
        day,
        date: dateObj.getDate().toString(),
        dateString: date,
        completion,
        total: activeHabitsForDay.length,
      }
    })
  }, [habitsWithMeta])

  // Handlers do Modal
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
        await addHabit({ ...habitData, completions: [] })
      }
      setShowModal(false)
      setEditingHabit(null)
    } catch (error) {
      alert('Erro ao salvar hábito')
    }
  }

  const handleDeleteHabit = async () => {
    if (!editingHabit) return
    if (confirm('Tem certeza que deseja excluir este hábito?')) {
      await deleteHabit(editingHabit.id)
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
          onDelete={editingHabit ? handleDeleteHabit : undefined}
        />
      )}

      <div className="habitsWrapper">
        {/* Controles e Filtros (Layout Original) */}
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
                  style={/** @type {any} */ ({ '--cat-color': cat.color })}
                  onClick={() => setCategoryFilter(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Board de Conteúdo */}
        <section className="habitsBoard">
          
          {/* VISUALIZAÇÃO DIÁRIA (Original + Lógica de Filtragem) */}
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
                {filteredHabits.length === 0 ? (
                  <div className="habitsEmpty">
                    <p>Nenhum hábito programado para hoje.</p>
                  </div>
                ) : (
                  filteredHabits.map((habit) => {
                    const category = CATEGORIES.find(c => c.id === habit.category)
                    const IconComponent = habit.icon
                    const todayStr = getDateString(0)
                    const isChecked = isHabitComplete(habit, todayStr)
                    
                    return (
                      <div 
                        key={habit.id} 
                        className={`dailyCheckItem ${isChecked ? 'dailyCheckItem--checked' : ''}`}
                        style={/** @type {any} */ ({ '--item-color': category?.color || '#ff4800' })}
                      >
                        <div className="dailyCheckItem__checkbox">
                           <input 
                            type="checkbox" 
                            checked={isChecked}
                            onChange={() => toggleHabitCompletion(habit.id, todayStr)}
                          />
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
                           <span className="dailyCheckItem__streak">🔥 {habit.streak}</span>
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

          {/* VISUALIZAÇÃO SEMANAL (Restaurada) */}
          {viewMode === 'weekly' && (
            <div className="habitsWeekly">
              {weeklyData.map((slot) => {
                const progressPercent = Math.round(slot.completion * 100)
                return (
                  <article key={slot.dateString} className="weekCard">
                    <div className="weekCard__header">
                      <div className="weekCard__date">
                        <span className="weekCard__day">{slot.day}</span>
                        <span className="weekCard__num">{slot.date}</span>
                      </div>
                      <span className="weekCard__percent">{progressPercent}%</span>
                    </div>
                    <div className="weekCard__progress">
                      <div className="weekCard__bar" style={{ width: `${progressPercent}%` }} />
                    </div>
                    {/* Lista simplificada */}
                    <div style={{marginTop: '8px', fontSize: '12px', color: '#666'}}>
                        {slot.total} hábitos
                    </div>
                  </article>
                )
              })}
            </div>
          )}

          {/* VISUALIZAÇÃO MENSAL (Restaurada) */}
          {viewMode === 'monthly' && (
            <div className="habitsMonthly ui-card">
              <header>
                <div>
                  <p>Visão Geral</p>
                  <h3>Calendário de Calor</h3>
                </div>
              </header>
              <div className="habitsMonthly__grid">
                {MONTH_MATRIX.map((week, idx) => (
                  <div key={idx} className="habitsMonthly__week">
                    {week.days.map((day) => (
                      <article key={`${week.label}-${day.day}`} className={day.inMonth ? '' : 'is-muted'}>
                        <header>
                          <span>{day.day}</span>
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
          icon="+"
          ariaLabel="Criar novo hábito"
        />
      </div>
    </div>
  )
}