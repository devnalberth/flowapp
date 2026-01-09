import { useState } from 'react'
import TopNav from '../../components/TopNav/TopNav.jsx'

import './Habits.css'

const VIEW_MODES = [
  { id: 'daily', label: 'Diário' },
  { id: 'weekly', label: 'Semanal' },
  { id: 'monthly', label: 'Mensal' },
]

const HABITS = [
  { id: 'gratidao', icon: '🙏', label: 'Gratidão', focus: 'Manhã' },
  { id: 'treino', icon: '🏋️‍♂️', label: 'Treino', focus: 'Corpo' },
  { id: 'deep-work', icon: '🧠', label: '4h Trabalho focado', focus: 'FlowWork' },
  { id: 'estudos', icon: '📚', label: '2h de Estudos', focus: 'Trilha' },
  { id: 'leitura', icon: '📖', label: '30m de Leitura', focus: 'Noite' },
]

const WEEKLY_TRACK = [
  { day: 'dom.', date: '2', completion: 0.1, done: ['treino'], missed: ['gratidao', 'deep-work', 'estudos', 'leitura'] },
  { day: 'seg.', date: '3', completion: 0.8, done: ['gratidao', 'treino', 'deep-work', 'estudos', 'leitura'], missed: [] },
  { day: 'ter.', date: '4', completion: 0.2, done: ['gratidao'], missed: ['treino', 'deep-work', 'estudos', 'leitura'] },
  { day: 'qua.', date: '5', completion: 0.4, done: ['gratidao', 'deep-work'], missed: ['treino', 'estudos', 'leitura'] },
  { day: 'qui.', date: '6', completion: 0.6, done: ['gratidao', 'treino', 'deep-work'], missed: ['estudos', 'leitura'] },
  { day: 'sex.', date: '7', completion: 0.5, done: ['gratidao', 'treino', 'leitura'], missed: ['deep-work', 'estudos'] },
  { day: 'sáb.', date: '8', completion: 0.3, done: ['gratidao', 'leitura'], missed: ['treino', 'deep-work', 'estudos'] },
]

const DAILY_TIMELINE = [
  { time: '06:30', title: 'Check-in de gratidão', description: 'Escrever 3 pontos no Flow Journal', habit: 'Gratidão' },
  { time: '07:15', title: 'Treino funcional', description: 'Série A · 45 minutos', habit: 'Treino' },
  { time: '09:00', title: 'Deep work', description: 'Sprint GTD · Projetos FlowApp', habit: '4h Trabalho focado' },
  { time: '14:30', title: 'Estudos', description: 'Curso Flow Systems · Módulo 02', habit: '2h de Estudos' },
  { time: '22:00', title: 'Leitura', description: '30 minutos · Atomic Habits', habit: '30m de Leitura' },
]

const MONTH_MATRIX = [
  { label: 'Semana 01', days: [
    { day: 1, inMonth: true, score: 0.7 },
    { day: 2, inMonth: true, score: 0.2 },
    { day: 3, inMonth: true, score: 0.8 },
    { day: 4, inMonth: true, score: 0.3 },
    { day: 5, inMonth: true, score: 0.4 },
    { day: 6, inMonth: true, score: 0.6 },
    { day: 7, inMonth: true, score: 0.5 },
  ] },
  { label: 'Semana 02', days: [
    { day: 8, inMonth: true, score: 0.3 },
    { day: 9, inMonth: true, score: 0.4 },
    { day: 10, inMonth: true, score: 0.7 },
    { day: 11, inMonth: true, score: 0.6 },
    { day: 12, inMonth: true, score: 0.5 },
    { day: 13, inMonth: true, score: 0.4 },
    { day: 14, inMonth: true, score: 0.9 },
  ] },
  { label: 'Semana 03', days: [
    { day: 15, inMonth: true, score: 0.2 },
    { day: 16, inMonth: true, score: 0.6 },
    { day: 17, inMonth: true, score: 0.7 },
    { day: 18, inMonth: true, score: 0.4 },
    { day: 19, inMonth: true, score: 0.5 },
    { day: 20, inMonth: true, score: 0.3 },
    { day: 21, inMonth: true, score: 0.8 },
  ] },
  { label: 'Semana 04', days: [
    { day: 22, inMonth: true, score: 0.6 },
    { day: 23, inMonth: true, score: 0.7 },
    { day: 24, inMonth: true, score: 0.4 },
    { day: 25, inMonth: true, score: 0.5 },
    { day: 26, inMonth: true, score: 0.3 },
    { day: 27, inMonth: true, score: 0.2 },
    { day: 28, inMonth: true, score: 0.9 },
  ] },
  { label: 'Semana 05', days: [
    { day: 29, inMonth: true, score: 0.5 },
    { day: 30, inMonth: true, score: 0.6 },
    { day: 31, inMonth: true, score: 0.35 },
    { day: 1, inMonth: false, score: 0 },
    { day: 2, inMonth: false, score: 0 },
    { day: 3, inMonth: false, score: 0 },
    { day: 4, inMonth: false, score: 0 },
  ] },
]

export default function Habits({ user, onNavigate }) {
  const [viewMode, setViewMode] = useState('weekly')

  return (
    <div className="habitsPage">
      <TopNav user={user} active="Hábitos" onNavigate={onNavigate} />

      <section className="habitsModes ui-card">
        <div className="habitsModes__intro">
          <div>
            <p className="habitsModes__eyebrow">Selecione a visão</p>
            <h2>Alterne entre diário · semanal · mensal</h2>
            <p>O checklist permanece igual, apenas mudamos o recorte temporal e a densidade de informação.</p>
          </div>
          <div className="habitsModes__toggle">
            {VIEW_MODES.map((mode) => (
              <button
                key={mode.id}
                type="button"
                className={viewMode === mode.id ? 'is-active' : ''}
                onClick={() => setViewMode(mode.id)}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        <div className="habitsModes__legend">
          {HABITS.map((habit) => (
            <div key={habit.id}>
              <span>{habit.icon}</span>
              <div>
                <strong>{habit.label}</strong>
                <small>{habit.focus}</small>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="habitsBoard">
        {viewMode === 'daily' && (
          <article className="habitsDaily ui-card">
            <header>
              <div>
                <p>Hoje · 8 de janeiro</p>
                <h3>Checklist diário e timeline</h3>
                <p>Espelhando o bloco "Day Review" do Notion.</p>
              </div>
              <button type="button">Abrir rotina completa</button>
            </header>
            <div className="habitsDaily__content">
              <div className="habitsDaily__checklist">
                {HABITS.map((habit) => (
                  <label key={habit.id}>
                    <input type="checkbox" readOnly checked={habit.id === 'gratidao'} />
                    <span>
                      {habit.icon} {habit.label}
                    </span>
                  </label>
                ))}
              </div>
              <div className="habitsDaily__timeline">
                {DAILY_TIMELINE.map((block) => (
                  <article key={block.time}>
                    <span>{block.time}</span>
                    <div>
                      <strong>{block.title}</strong>
                      <p>{block.description}</p>
                      <small>{block.habit}</small>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </article>
        )}

        {viewMode === 'weekly' && (
          <div className="habitsWeekly">
            {WEEKLY_TRACK.map((slot) => {
              const progressPercent = Math.round(slot.completion * 100)
              return (
                <article key={slot.date} className="habitWeekCard">
                  <header>
                    <div>
                      <p>{slot.day}</p>
                      <strong>{slot.date} nov</strong>
                    </div>
                    <span>{progressPercent}%</span>
                  </header>
                  <div className="habitWeekCard__bar" role="progressbar" aria-valuenow={progressPercent} aria-valuemin={0} aria-valuemax={100}>
                    <span style={{ width: `${progressPercent}%` }} />
                  </div>
                  <ul>
                    {HABITS.map((habit) => (
                      <li key={habit.id}>
                        <label>
                          <input type="checkbox" readOnly checked={slot.done.includes(habit.id)} />
                          <span>
                            {habit.icon} {habit.label}
                          </span>
                        </label>
                      </li>
                    ))}
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
    </div>
  )
}
