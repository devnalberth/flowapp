import { useMemo, useState } from 'react'
import { X, Briefcase, BookOpen, Clock, ListChecks } from 'lucide-react'
import { focusLogService } from '../../services/focusLogService'
import { CATEGORY_META } from '../../utils/taskCategory'
import './FlowDashboardModal.css'

const fmtMin = (m) => {
  const v = Math.round(m || 0)
  if (v <= 0) return '0m'
  if (v < 60) return `${v}m`
  return `${Math.floor(v / 60)}h ${v % 60}m`
}

export default function FlowDashboardModal({ open, onClose }) {
  const [period, setPeriod] = useState('today') // 'today' | 'week'
  const daysBack = period === 'today' ? 1 : 7

  const totals = useMemo(() => focusLogService.getCategoryTotals(daysBack), [period, open])
  const series = useMemo(() => focusLogService.getDailySeries(7), [open])
  const taskTotals = useMemo(() => focusLogService.getTaskTotals(daysBack).slice(0, 8), [period, open])

  if (!open) return null

  const total = totals.total || 0
  const workPct = total > 0 ? Math.round((totals.work / total) * 100) : 0
  const studyPct = total > 0 ? 100 - workPct : 0
  const workDeg = total > 0 ? (totals.work / total) * 360 : 0
  const maxDay = Math.max(1, ...series.map((d) => d.total))
  const maxTask = Math.max(1, ...taskTotals.map((t) => t.minutes))

  return (
    <div className="flowDash" role="dialog" aria-modal="true">
      <div className="flowDash__backdrop" onClick={onClose} />
      <section className="flowDash__panel">
        <header className="flowDash__header">
          <div>
            <span className="flowDash__eyebrow">Painel de produtividade</span>
            <h3>Tempo de foco</h3>
          </div>
          <button className="flowDash__close" onClick={onClose} aria-label="Fechar"><X size={18} /></button>
        </header>

        <div className="flowDash__period">
          <button className={period === 'today' ? 'is-active' : ''} onClick={() => setPeriod('today')}>Hoje</button>
          <button className={period === 'week' ? 'is-active' : ''} onClick={() => setPeriod('week')}>7 dias</button>
        </div>

        {/* Hero: donut + métricas */}
        <div className="flowDash__hero">
          <div
            className="flowDash__donut"
            style={{ background: `conic-gradient(${CATEGORY_META.work.color} ${workDeg}deg, ${CATEGORY_META.study.color} ${workDeg}deg 360deg)` }}
          >
            <div className="flowDash__donutHole">
              <strong>{fmtMin(total)}</strong>
              <span>foco</span>
            </div>
          </div>
          <div className="flowDash__metrics">
            <div className="flowDash__metric" style={{ '--c': CATEGORY_META.work.color }}>
              <span className="flowDash__metricIcon"><Briefcase size={15} /></span>
              <div>
                <strong>{fmtMin(totals.work)}</strong>
                <span className="flowDash__metricLabel">Produtividade · {workPct}%</span>
              </div>
            </div>
            <div className="flowDash__metric" style={{ '--c': CATEGORY_META.study.color }}>
              <span className="flowDash__metricIcon"><BookOpen size={15} /></span>
              <div>
                <strong>{fmtMin(totals.study)}</strong>
                <span className="flowDash__metricLabel">Estudos · {studyPct}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tendência semanal (sempre 7d) */}
        {period === 'week' && (
          <div className="flowDash__block">
            <h4><Clock size={14} /> Por dia (7 dias)</h4>
            <div className="flowDash__bars">
              {series.map((d) => (
                <div className="flowDash__barCol" key={d.dateStr} title={`${d.label}: ${fmtMin(d.total)}`}>
                  <div className="flowDash__barStack" style={{ height: `${(d.total / maxDay) * 100}%` }}>
                    <span className="flowDash__barSeg" style={{ height: `${d.total > 0 ? (d.study / d.total) * 100 : 0}%`, background: CATEGORY_META.study.color }} />
                    <span className="flowDash__barSeg" style={{ height: `${d.total > 0 ? (d.work / d.total) * 100 : 0}%`, background: CATEGORY_META.work.color }} />
                  </div>
                  <span className="flowDash__barLabel">{d.label}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tempo por tarefa */}
        <div className="flowDash__block">
          <h4><ListChecks size={14} /> Tempo por tarefa</h4>
          {taskTotals.length === 0 ? (
            <p className="flowDash__empty">Nenhum tempo de foco registrado {period === 'today' ? 'hoje' : 'nos últimos 7 dias'}. Foque em uma tarefa para começar.</p>
          ) : (
            <div className="flowDash__tasks">
              {taskTotals.map((t) => {
                const meta = CATEGORY_META[t.category] || CATEGORY_META.work
                return (
                  <div className="flowDash__task" key={t.taskId}>
                    <div className="flowDash__taskTop">
                      <span className="flowDash__taskDot" style={{ background: meta.color }} />
                      <span className="flowDash__taskName">{t.title}</span>
                      <span className="flowDash__taskTime">{fmtMin(t.minutes)}</span>
                    </div>
                    <div className="flowDash__taskTrack">
                      <span style={{ width: `${(t.minutes / maxTask) * 100}%`, background: meta.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
