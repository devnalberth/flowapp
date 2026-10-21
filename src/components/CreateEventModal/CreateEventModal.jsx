import { useLayoutEffect, useId, useMemo, useRef, useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Toggle from '../ui/Toggle'
import { Segmented } from '../ui/Tabs'
import { Input, Textarea, DateInput, Select } from '../ui/Field'
import './CreateEventModal.css'

const DESCRIPTION_LIMIT = 500
const EVENT_TYPES = [
  { value: 'default', label: 'Padrão' },
  { value: 'event', label: 'Evento' },
  { value: 'meeting', label: 'Reunião' },
  { value: 'workout', label: 'Treino' },
]
const REMINDERS = [5, 10, 15, 30, 60, 1440]

export default function CreateEventModal({
  open,
  onClose,
  onSubmit,
  onDelete,
  initialData = null,
}) {
  const titleRef = useRef(null)
  const formId = useId()
  const defaultForm = useMemo(
    () => ({
      title: '',
      date: '',
      time: '',
      endTime: '',
      isAllDay: false,
      reminderMinutes: 30,
      location: '',
      type: 'default',
      description: '',
    }),
    []
  )
  const [form, setForm] = useState(defaultForm)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  useLayoutEffect(() => {
    if (!open) return
    let date = initialData?.date ? String(initialData.date).slice(0, 10) : ''
    let time = initialData?.time ? String(initialData.time).slice(0, 5) : ''
    // Persisted events use separate calendar date/time. Keep legacy timestamp input compatible.
    if (!date && initialData?.start_time) {
      const d = new Date(initialData.start_time)
      if (!Number.isNaN(d.getTime())) {
        date = d.toISOString().split('T')[0]
        time = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      }
    }
    setForm(
      initialData
        ? {
            ...defaultForm,
            ...initialData,
            date,
            time,
            endTime: (initialData.endTime ?? initialData.end_time ?? '').slice(0, 5),
            isAllDay: initialData.isAllDay ?? initialData.is_all_day ?? false,
            reminderMinutes: initialData.reminderMinutes ?? initialData.reminder_minutes ?? 30,
            type: initialData.type || 'default',
            description: initialData.description || '',
            location: initialData.location || '',
          }
        : defaultForm
    )
    setPending(false)
    setError('')
    const frame = requestAnimationFrame(() => titleRef.current?.focus())
    return () => cancelAnimationFrame(frame)
  }, [open, defaultForm, initialData])
  const updateField = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))
  const handleSubmit = async (event) => {
    event.preventDefault()
    if (pending) return
    let startTime = null
    if (form.date)
      startTime =
        form.time && !form.isAllDay
          ? new Date(`${form.date}T${form.time}`).toISOString()
          : new Date(`${form.date}T00:00:00`).toISOString()
    const payload = {
      ...form,
      time: form.isAllDay ? null : form.time,
      endTime: form.isAllDay ? null : form.endTime || null,
      start_time: startTime,
    }
    setPending(true)
    setError('')
    try {
      await onSubmit?.(payload)
    } catch {
      setError('Não foi possível salvar. Tente novamente.')
    } finally {
      setPending(false)
    }
  }
  if (!open) return null
  const reminders = REMINDERS.includes(Number(form.reminderMinutes))
    ? REMINDERS
    : [...REMINDERS, Number(form.reminderMinutes)].sort((a, b) => a - b)
  return (
    <Modal
      title={initialData ? 'Editar evento' : 'Novo evento'}
      subtitle="Aparece na Agenda e no Início no dia marcado."
      icon={initialData ? Pencil : Plus}
      onClose={pending ? undefined : onClose}
      width={600}
      className="event-form"
      hint="Enter salva · Esc cancela"
      footer={
        <>
          {initialData && onDelete && (
            <Button variant="danger" icon={Trash2} onClick={onDelete} disabled={pending}>
              Excluir
            </Button>
          )}
          <Button variant="ghost" onClick={onClose} disabled={pending}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={pending}>
            {initialData ? 'Salvar' : 'Criar evento'}
          </Button>
        </>
      }
    >
      <form id={formId} className="event-form-fields" onSubmit={handleSubmit}>
        <Input
          ref={titleRef}
          label="Título"
          placeholder="Nome do compromisso"
          value={form.title}
          onChange={(event) => updateField('title', event.target.value)}
          required
          disabled={pending}
        />
        <div className="event-form-type">
          <span id={`${formId}-type`}>Tipo</span>
          <Segmented
            label="Tipo de evento"
            options={EVENT_TYPES.map((option) => ({ ...option, disabled: pending }))}
            value={form.type}
            onChange={(value) => updateField('type', value)}
          />
          <small>Organize seus compromissos por tipo.</small>
        </div>
        <div className="event-form-row event-form-row--time">
          <DateInput
            label="Data"
            value={form.date}
            onChange={(event) => updateField('date', event.target.value)}
            required
            disabled={pending}
          />
          <Input
            label="Início"
            type="time"
            value={form.time}
            onChange={(event) => updateField('time', event.target.value)}
            required={!form.isAllDay}
            disabled={pending || form.isAllDay}
          />
          <Input
            label="Fim"
            type="time"
            value={form.endTime}
            onChange={(event) => updateField('endTime', event.target.value)}
            disabled={pending || form.isAllDay}
          />
        </div>
        <div className="event-form-all-day">
          <Toggle
            label="Dia inteiro"
            checked={form.isAllDay}
            onChange={(value) => updateField('isAllDay', value)}
            disabled={pending}
          />
          <div>
            <strong>Dia inteiro</strong>
            <p>Sem horário: fica na faixa “Dia todo”.</p>
          </div>
        </div>
        <div className="event-form-row">
          <Input
            label="Local"
            optional
            placeholder="Google Meet, escritório…"
            value={form.location}
            onChange={(event) => updateField('location', event.target.value)}
            disabled={pending}
          />
          <Select
            label="Lembrete"
            value={form.reminderMinutes}
            onChange={(event) => updateField('reminderMinutes', Number(event.target.value))}
            disabled={pending}
          >
            {reminders.map((minutes) => (
              <option key={minutes} value={minutes}>
                {minutes === 0
                  ? 'No horário'
                  : minutes === 1440
                    ? '1 dia antes'
                    : `${minutes} min antes`}
              </option>
            ))}
          </Select>
        </div>
        <Textarea
          label="Descrição"
          optional
          value={form.description}
          onChange={(event) => updateField('description', event.target.value)}
          placeholder="Detalhes do compromisso"
          maxLength={DESCRIPTION_LIMIT}
          rows={3}
          disabled={pending}
        />
        {error && (
          <p className="event-form-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}
