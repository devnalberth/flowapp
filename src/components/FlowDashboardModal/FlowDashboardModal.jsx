import { useMemo, useState } from 'react'
import { X, Briefcase, BookOpen, Clock, ListChecks, BarChart3 } from 'lucide-react'
import { focusLogService } from '../../services/focusLogService'
import { CATEGORY_META } from '../../utils/taskCategory'
import Modal from '../ui/Modal.jsx'
import { Segmented } from '../ui/Tabs.jsx'
import { useApp } from '../../context/AppContext'
import './FlowDashboardModal.css'

const fmtMin = (m) => {
  const v = Math.round(m || 0)
  if (v <= 0) return '0m'
  if (v < 60) return `${v}m`
  return `${Math.floor(v / 60)}h ${v % 60}m`
}

export default function FlowDashboardModal({ open, onClose }) {
  const { prefs = {} } = useApp()
  const mask = (value) =>
    prefs.hideFinanceValues
      ? String(value || '').replace(/R\$\s*[\d.,]+(?:\s*(?:mil|milhões?|mi))?/gi, 'R$ ••••')
      : value
  const [period, setPeriod] = useState('today') // 'today' | 'week'
  const daysBack = period === 'today' ? 1 : 7

  const totals = useMemo(() => focusLogService.getCategoryTotals(daysBack), [period, open])
  const series = useMemo(() => focusLogService.getDailySeries(7), [open])
  const taskTotals = useMemo(
    () => focusLogService.getTaskTotals(daysBack).slice(0, 8),
    [period, open]
  )

  if (!open) return null

  const total = totals.total || 0
  const workPct = total > 0 ? Math.round((totals.work / total) * 100) : 0
  const studyPct = total > 0 ? 100 - workPct : 0
  const workDeg = total > 0 ? (totals.work / total) * 360 : 0
  const maxDay = Math.max(1, ...series.map((d) => d.total))
  const maxTask = Math.max(1, ...taskTotals.map((t) => t.minutes))

  return (
    <Modal
      title="Tempo de foco"
      subtitle={`Painel de produtividade · ${new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}`}
      icon={BarChart3}
      width={640}
      className="flowDash"
      onClose={onClose}
    >
      <Segmented
        label="Período do painel"
        value={period}
        onChange={setPeriod}
        options={[
          { value: 'today', label: 'Hoje' },
          { value: 'week', label: '7 dias' },
        ]}
      />

      {/* Hero: donut + métricas */}
      <div className="flowDash__hero">
        <div
          className="flowDash__donut"
          style={{
            background: `conic-gradient(var(--fa-area-profissional) ${workDeg}deg, var(--fa-area-estudos) ${workDeg}deg 360deg)`,
          }}
        >
          <div className="flowDash__donutHole">
            <strong>{fmtMin(total)}</strong>
            <span>foco</span>
          </div>
        </div>
        <div className="flowDash__metrics">
          <div className="flowDash__metric" style={{ '--c': 'var(--fa-area-profissional)' }}>
            <span className="flowDash__metricIcon">
              <Briefcase size={15} />
            </span>
            <div>
              <strong>{fmtMin(totals.work)}</strong>
              <span className="flowDash__metricLabel">Produtividade · {workPct}%</span>
            </div>
          </div>
          <div className="flowDash__metric" style={{ '--c': 'var(--fa-area-estudos)' }}>
            <span className="flowDash__metricIcon">
              <BookOpen size={15} />
            </span>
            <div>
              <strong>{fmtMin(totals.study)}</strong>
              <span className="flowDash__metricLabel">Estudos · {studyPct}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tendência semanal (sempre 7d) */}
      {
        <div className="flowDash__block">
          <h4>
            <Clock size={14} /> Por dia (7 dias)
          </h4>
          <div className="flowDash__bars">
            {series.map((d) => (
              <div
                className="flowDash__barCol"
                key={d.dateStr}
                title={`${d.label}: ${fmtMin(d.total)}`}
              >
                <span className="flowDash__barValue">{d.total ? fmtMin(d.total) : '—'}</span>
                <div
                  className="flowDash__barStack"
                  style={{ height: `${(d.total / maxDay) * 188}px` }}
                >
                  <span
                    className="flowDash__barSeg"
                    style={{
                      height: `${d.total > 0 ? (d.study / d.total) * 100 : 0}%`,
                      background: 'var(--fa-area-estudos)',
                    }}
                  />
                  <span
                    className="flowDash__barSeg"
                    style={{
                      height: `${d.total > 0 ? (d.work / d.total) * 100 : 0}%`,
                      background: 'var(--fa-area-profissional)',
                    }}
                  />
                </div>
                <span className="flowDash__barLabel">{d.label}</span>
              </div>
            ))}
          </div>
        </div>
      }

      {/* Tempo por tarefa */}
      <div className="flowDash__block">
        <h4>
          <ListChecks size={14} /> Tempo por tarefa
        </h4>
        {taskTotals.length === 0 ? (
          <p className="flowDash__empty">
            Nenhum tempo de foco registrado {period === 'today' ? 'hoje' : 'nos últimos 7 dias'}.
            Foque em uma tarefa para começar.
          </p>
        ) : (
          <div className="flowDash__tasks">
            {taskTotals.map((t) => {
              const meta = {
                color:
                  t.category === 'study' ? 'var(--fa-area-estudos)' : 'var(--fa-area-profissional)',
              }
              return (
                <div className="flowDash__task" key={t.taskId}>
                  <div className="flowDash__taskTop">
                    <span className="flowDash__taskDot" style={{ background: meta.color }} />
                    <span className="flowDash__taskName">{mask(t.title)}</span>
                    <span className="flowDash__taskTime">{fmtMin(t.minutes)}</span>
                  </div>
                  <div className="flowDash__taskTrack">
                    <span
                      style={{ width: `${(t.minutes / maxTask) * 100}%`, background: meta.color }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Modal>
  )
}
