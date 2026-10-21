import { Bell, CalendarDays, Clock, Ellipsis, MapPin, Pencil, Trash2 } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import StatusBadge from '../../components/ui/StatusBadge'
import ActionMenu from '../../components/ui/ActionMenu'
import { localDateKey } from '../../utils/habitStats'
import { eventStart } from './agendaPresentation'

const TYPES = { default: 'Padrão', event: 'Evento', meeting: 'Reunião', workout: 'Treino' }
const minutesOf = (value) => {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}
const maskText = (value, hidden) =>
  hidden
    ? String(value || '').replace(/R\$\s*[\d.,]+(?:\s*(?:mil|milhões?|mi))?/gi, 'R$ ••••')
    : value

export default function EventDetailDrawer({ event, now, onClose, onEdit, onDelete, hideValues }) {
  const start = eventStart(event)
  const date = start || new Date(`${String(event.date).slice(0, 10)}T12:00:00`)
  const remaining = start ? Math.ceil((start - now) / 60000) : null
  const upcoming = remaining != null && remaining >= 0
  const countdown =
    remaining >= 1440
      ? `Em ${Math.floor(remaining / 1440)} dia${Math.floor(remaining / 1440) === 1 ? '' : 's'}`
      : remaining >= 60
        ? `Em ${Math.floor(remaining / 60)}h${remaining % 60 ? String(remaining % 60).padStart(2, '0') : ''}`
        : remaining
          ? `Em ${remaining} min`
          : 'Agora'
  const startTime = (event.time || '').slice(0, 5)
  const endTime = (event.endTime || event.end_time || '').slice(0, 5)
  const duration =
    startTime && endTime ? (minutesOf(endTime) - minutesOf(startTime) + 1440) % 1440 : null
  const reminder = event.reminderMinutes ?? event.reminder_minutes
  const reminderTime =
    start && reminder != null && !event.isAllDay
      ? new Date(start.getTime() - reminder * 60000).toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        })
      : null
  const details = [
    [
      CalendarDays,
      'Data',
      `${localDateKey(date) === localDateKey(now) ? 'Hoje, ' : ''}${date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' }).replace('-feira', '').replace(',', '')}`,
    ],
    [
      Clock,
      'Horário',
      event.isAllDay
        ? 'Dia todo'
        : startTime
          ? `${startTime}${endTime ? ' – ' + endTime : ''}${duration != null ? ' · ' + duration + ' min' : ''}`
          : 'Sem horário',
    ],
    ...(event.location ? [[MapPin, 'Local', maskText(event.location, hideValues)]] : []),
    ...(reminder != null
      ? [
          [
            Bell,
            'Lembrete',
            `${reminder === 0 ? 'No horário' : `${reminder} min antes`}${reminderTime ? ' · às ' + reminderTime : ''}`,
          ],
        ]
      : []),
  ]
  return (
    <Modal
      drawer
      width={540}
      title="Evento"
      className="agenda-event-detail"
      onClose={onClose}
      headerActions={
        <ActionMenu
          label="Ações do evento"
          trigger={
            <button type="button" className="fa-modal__close" aria-label="Mais ações do evento">
              <Ellipsis size={16} strokeWidth={1.75} />
            </button>
          }
          items={[
            { label: 'Editar evento', icon: Pencil, onClick: onEdit },
            { separator: true },
            { label: 'Excluir evento', icon: Trash2, danger: true, onClick: onDelete },
          ]}
        />
      }
      footer={
        <>
          <Button variant="danger" icon={Trash2} onClick={onDelete}>
            Excluir
          </Button>
          <Button icon={Pencil} onClick={onEdit}>
            Editar evento
          </Button>
        </>
      }
    >
      <div className="agenda-event-detail-content">
        <h3>{maskText(event.title, hideValues)}</h3>
        <div className="agenda-event-badges">
          <StatusBadge tone="info">{TYPES[event.type] || 'Evento'}</StatusBadge>
          {upcoming && <StatusBadge tone="accent">{countdown}</StatusBadge>}
        </div>
        <dl>
          {details.map(([Icon, label, value]) => (
            <div key={label}>
              <dt>
                <Icon size={16} strokeWidth={1.75} />
                {label}
              </dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        {event.description && (
          <section>
            <h4>Descrição</h4>
            <p>{maskText(event.description, hideValues)}</p>
          </section>
        )}
      </div>
    </Modal>
  )
}
