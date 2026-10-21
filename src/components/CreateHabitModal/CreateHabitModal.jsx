import { useId, useState } from 'react'
import { Flame, Pencil, Trash2, Zap } from 'lucide-react'
import Modal from '../ui/Modal'
import Button from '../ui/Button'
import Toggle from '../ui/Toggle'
import { Input, Select, Textarea } from '../ui/Field'
import {
  CATEGORIES,
  ICON_OPTIONS,
  WEEKDAY_NAMES,
} from '../../pages/Habits/habitsMeta'
import { parseCustomDays } from '../../utils/habitStats'
import './CreateHabitModal.css'

const DESCRIPTION_LIMIT = 200
const TIMER_CATEGORY_OF = { produtividade: 'work', estudos: 'study' }

export default function CreateHabitModal({
  habit,
  onClose,
  onSubmit,
  onDelete,
}) {
  const formId = useId()
  const [pending, setPending] = useState(false)
  const [formData, setFormData] = useState(() => {
    const days = parseCustomDays(habit)
    const goalMin = habit?.timerGoalMinutes ?? null
    return {
      label: habit?.label || habit?.name || '',
      category: habit?.category || 'saude',
      description: habit?.description || '',
      time: habit?.time || '',
      iconId: habit?.iconId || 'sparkles',
      frequency: days.length ? 'custom' : habit?.frequency || 'daily',
      selectedDays: days,
      timerEnabled: !!habit?.timerCategory,
      timerHours: goalMin != null ? Math.floor(goalMin / 60) : 0,
      timerMinutes: goalMin != null ? goalMin % 60 : 30,
    }
  })
  const [nameTouched, setNameTouched] = useState(false)
  const update = (field) => (event) =>
    setFormData((prev) => ({ ...prev, [field]: event.target.value }))
  const toggleDay = (day) =>
    setFormData((prev) => ({
      ...prev,
      selectedDays: prev.selectedDays.includes(day)
        ? prev.selectedDays.filter((d) => d !== day)
        : [...prev.selectedDays, day],
    }))
  const handleSubmit = async (event) => {
    event.preventDefault()
    if (pending) return
    const timerChannel = TIMER_CATEGORY_OF[formData.category]
    const linkTimer = formData.timerEnabled && !!timerChannel
    const goalMinutes =
      (Number(formData.timerHours) || 0) * 60 +
      (Number(formData.timerMinutes) || 0)
    const payload = {
      label: formData.label,
      name: formData.label,
      category: formData.category,
      description: formData.description,
      time: formData.time,
      iconId: formData.iconId,
      frequency: formData.frequency,
      customDays: formData.frequency === 'custom' ? formData.selectedDays : [],
      selectedDays:
        formData.frequency === 'custom' ? formData.selectedDays : [],
      timerCategory: linkTimer ? timerChannel : null,
      timerGoalMinutes: linkTimer && goalMinutes > 0 ? goalMinutes : null,
    }
    setPending(true)
    try {
      await onSubmit?.(payload)
    } finally {
      setPending(false)
    }
  }
  return (
    <Modal
      className="habit-form-modal"
      width={600}
      title={habit ? 'Editar hábito' : 'Novo hábito'}
      subtitle={
        habit
          ? 'Ajuste sua rotina. As conclusões registradas são preservadas.'
          : 'Construa rotinas consistentes. Comece pequeno.'
      }
      icon={habit ? Pencil : Flame}
      onClose={onClose}
      hint={!habit ? 'Enter salva · Esc cancela' : undefined}
      footer={
        <>
          {onDelete && (
            <Button
              variant="danger"
              icon={Trash2}
              disabled={pending}
              onClick={onDelete}
            >
              Excluir hábito
            </Button>
          )}
          <Button variant="ghost" disabled={pending} onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form={formId} loading={pending}>
            {habit ? 'Salvar alterações' : 'Criar hábito'}
          </Button>
        </>
      }
    >
      <form id={formId} className="habit-form" onSubmit={handleSubmit}>
        <Input
          label="Nome do hábito"
          placeholder="Ex: Treino de Muay Thai"
          value={formData.label}
          onChange={update('label')}
          required
          autoFocus
          onBlur={() => setNameTouched(true)}
          error={
            nameTouched && !formData.label
              ? 'Informe o nome do hábito.'
              : undefined
          }
        />
        <fieldset className="habit-form-options">
          <legend>Categoria</legend>
          <div className="habit-form-categories">
            {CATEGORIES.filter((c) => c.id !== 'all').map((category) => (
              <button
                type="button"
                key={category.id}
                aria-pressed={formData.category === category.id}
                onClick={() =>
                  setFormData((prev) => ({ ...prev, category: category.id }))
                }
              >
                <i style={{ background: category.color }} />
                {category.id === 'saude' ? 'Saúde & Energia' : category.label}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="habit-form-options">
          <legend>Ícone</legend>
          <div className="habit-form-icons">
            {ICON_OPTIONS.map(({ id, icon: Icon, label }) => (
              <button
                type="button"
                key={id}
                aria-label={`Ícone ${label}`}
                aria-pressed={formData.iconId === id}
                onClick={() => setFormData((prev) => ({ ...prev, iconId: id }))}
              >
                <Icon size={20} strokeWidth={1.75} />
              </button>
            ))}
          </div>
        </fieldset>
        <div className="habit-form-grid">
          <Select
            label="Frequência"
            value={formData.frequency}
            onChange={update('frequency')}
          >
            <option value="daily">Todos os dias</option>
            <option value="custom">Personalizado</option>
          </Select>
          <Input
            label="Horário ideal"
            type="time"
            value={formData.time}
            onChange={update('time')}
          />
        </div>
        {formData.frequency === 'custom' && (
          <fieldset className="habit-form-options">
            <legend>Dias da semana</legend>
            <div className="habit-form-weekdays">
              {WEEKDAY_NAMES.map((day, index) => (
                <button
                  type="button"
                  key={day}
                  aria-pressed={formData.selectedDays.includes(index)}
                  onClick={() => toggleDay(index)}
                >
                  {day}
                </button>
              ))}
            </div>
          </fieldset>
        )}
        {TIMER_CATEGORY_OF[formData.category] && (
          <div className="habit-form-timer">
            <div className="habit-form-timer-toggle">
              <Toggle
                label="Concluir pelo timer de foco"
                checked={formData.timerEnabled}
                onChange={(value) =>
                  setFormData((prev) => ({ ...prev, timerEnabled: value }))
                }
              />
              <div>
                <strong>Concluir pelo timer de foco</strong>
                <p>
                  Marca sozinho ao atingir a meta de foco em{' '}
                  {formData.category === 'estudos'
                    ? 'Estudos'
                    : 'Produtividade'}{' '}
                  no dia.
                </p>
              </div>
              <Zap size={16} />
            </div>
            {formData.timerEnabled && (
              <div className="habit-form-timer-goal">
                <span>Meta de tempo por dia</span>
                <Input
                  aria-label="Horas de foco por dia"
                  type="number"
                  min="0"
                  max="23"
                  value={formData.timerHours}
                  onChange={update('timerHours')}
                />
                <span>h</span>
                <Input
                  aria-label="Minutos de foco por dia"
                  type="number"
                  min="0"
                  max="59"
                  step="5"
                  value={formData.timerMinutes}
                  onChange={update('timerMinutes')}
                />
                <span>min</span>
              </div>
            )}
          </div>
        )}
        <Textarea
          className={
            formData.description.length > 75
              ? 'habit-form-description-long'
              : undefined
          }
          label="Descrição"
          optional
          placeholder="Por que este hábito é importante?"
          maxLength={DESCRIPTION_LIMIT}
          value={formData.description}
          onChange={update('description')}
          rows={2}
        />
      </form>
    </Modal>
  )
}
