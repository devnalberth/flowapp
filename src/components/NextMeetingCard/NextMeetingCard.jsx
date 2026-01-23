import { useState, useMemo, useEffect } from 'react'
import { Calendar, Clock, MapPin, Video, Dumbbell, Users, ChevronRight } from 'lucide-react'
import './NextMeetingCard.css'

// Ícones por tipo de evento
const EVENT_ICONS = {
  reuniao: Video,
  treino: Dumbbell,
  evento: Calendar,
  default: Users,
}

// Cores por tipo
const EVENT_COLORS = {
  reuniao: '#3b82f6',
  treino: '#10b981',
  evento: '#8b5cf6',
  default: '#ff6a00',
}

export default function NextMeetingCard({ events = [] }) {
  const [, setTick] = useState(0)

  // Atualiza a cada minuto para verificar se o próximo evento mudou
  useEffect(() => {
    const interval = setInterval(() => {
      setTick(t => t + 1)
    }, 60000) // 1 minuto

    return () => clearInterval(interval)
  }, [])

  // Encontra o próximo evento baseado no horário atual
  const nextEvent = useMemo(() => {
    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const currentTime = now.getHours() * 60 + now.getMinutes() // Minutos desde meia-noite

    // Filtra eventos de hoje e futuros
    const upcomingEvents = events
      .filter(event => {
        if (!event.date) return false

        const eventDate = event.date.split('T')[0]

        // Evento de hoje
        if (eventDate === todayStr) {
          // Se o evento tem horário, verifica se ainda não passou
          if (event.time) {
            const [hours, minutes] = event.time.split(':').map(Number)
            const eventTime = hours * 60 + minutes
            return eventTime > currentTime
          }
          // Evento sem horário (dia todo) - mostra se ainda é hoje
          return true
        }

        // Evento futuro (não é hoje)
        return eventDate > todayStr
      })
      .sort((a, b) => {
        // Ordena por data primeiro
        const dateA = new Date(a.date)
        const dateB = new Date(b.date)
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime()
        }

        // Depois por horário
        if (a.time && b.time) {
          return a.time.localeCompare(b.time)
        }

        // Eventos com horário vêm antes de eventos sem horário
        if (a.time && !b.time) return -1
        if (!a.time && b.time) return 1

        return 0
      })

    return upcomingEvents[0] || null
  }, [events])

  // Formata a data do evento
  const formatEventDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00')
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const tomorrow = new Date(today)
    tomorrow.setDate(tomorrow.getDate() + 1)

    if (date.getTime() === today.getTime()) {
      return 'Hoje'
    } else if (date.getTime() === tomorrow.getTime()) {
      return 'Amanhã'
    } else {
      return date.toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })
    }
  }

  // Formata o horário
  const formatTime = (time) => {
    if (!time) return 'Dia todo'
    const [hours, minutes] = time.split(':')
    return `${hours}:${minutes}`
  }

  // Determina o tipo do evento pelo título (simplificado)
  const getEventType = (title) => {
    const lowerTitle = (title || '').toLowerCase()
    if (lowerTitle.includes('reunião') || lowerTitle.includes('reuniao') || lowerTitle.includes('call') || lowerTitle.includes('meeting')) {
      return 'reuniao'
    }
    if (lowerTitle.includes('treino') || lowerTitle.includes('academia') || lowerTitle.includes('muay')) {
      return 'treino'
    }
    if (lowerTitle.includes('evento') || lowerTitle.includes('festa') || lowerTitle.includes('aniversário')) {
      return 'evento'
    }
    return 'default'
  }

  const eventType = nextEvent ? getEventType(nextEvent.title) : 'default'
  const EventIcon = EVENT_ICONS[eventType]
  const eventColor = EVENT_COLORS[eventType]

  // Calcula tempo restante
  const timeUntil = useMemo(() => {
    if (!nextEvent || !nextEvent.time) return null

    const now = new Date()
    const todayStr = now.toISOString().split('T')[0]
    const eventDateStr = nextEvent.date?.split('T')[0]

    if (eventDateStr !== todayStr) return null

    const [hours, minutes] = nextEvent.time.split(':').map(Number)
    const eventDate = new Date()
    eventDate.setHours(hours, minutes, 0, 0)

    const diff = eventDate.getTime() - now.getTime()
    if (diff <= 0) return null

    const diffMinutes = Math.floor(diff / 60000)
    if (diffMinutes < 60) {
      return `em ${diffMinutes} min`
    }

    const diffHours = Math.floor(diffMinutes / 60)
    const remainingMinutes = diffMinutes % 60
    return remainingMinutes > 0
      ? `em ${diffHours}h ${remainingMinutes}min`
      : `em ${diffHours}h`
  }, [nextEvent])

  return (
    <section className="meeting ui-card">
      <header className="meeting__header">
        <span className="meeting__titleLabel">Próximo Compromisso</span>
        <button className="meeting__arrow" aria-label="Ver detalhes">
          <ChevronRight size={18} />
        </button>
      </header>

      {nextEvent ? (
        <div className="meeting__card" style={{ '--event-color': eventColor }}>
          <div className="meeting__icon">
            <EventIcon size={20} />
          </div>
          <div className="meeting__content">
            <div className="meeting__title">{nextEvent.title}</div>
            <div className="meeting__meta">
              <span className="meeting__time">
                <Clock size={12} />
                {formatEventDate(nextEvent.date)} • {formatTime(nextEvent.time)}
              </span>
              {timeUntil && (
                <span className="meeting__countdown">{timeUntil}</span>
              )}
            </div>
            {nextEvent.location && (
              <div className="meeting__location">
                <MapPin size={12} />
                {nextEvent.location}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="meeting__empty">
          <Calendar size={24} strokeWidth={1.5} />
          <p>Nenhum compromisso agendado</p>
        </div>
      )}
    </section>
  )
}
