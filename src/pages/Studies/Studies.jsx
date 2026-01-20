import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import TopNav from '../../components/TopNav/TopNav.jsx'
import CreateStudyModal from '../../components/CreateStudyModal/CreateStudyModal.jsx'
import FloatingCreateButton from '../../components/FloatingCreateButton/FloatingCreateButton.jsx'

import './Studies.css'

const statusLabelMap = {
  NOT_STARTED: 'Não iniciado',
  IN_PROGRESS: 'Em andamento',
  COMPLETED: 'Concluído',
}

const typeLabelMap = {
  COURSE: 'Curso Online',
  UNIVERSITY: 'Faculdade',
  BOOK: 'Livro',
}

const statusOptionsByType = {
  BOOK: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
  COURSE: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
  UNIVERSITY: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
}

const countLessons = (modules) =>
  modules.reduce(
    (acc, module) => {
      acc.total += module.lessons.length
      acc.completed += module.lessons.filter((lesson) => lesson.isCompleted).length
      return acc
    },
    { total: 0, completed: 0 }
  )

const calcProgress = (modules) => {
  const { total, completed } = countLessons(modules)
  if (!total) return 0
  return Math.round((completed / total) * 100)
}

export default function Studies({ user, onNavigate, onLogout }) {
  const { studies, addStudy, deleteStudy, addStudyModule, addStudyLesson, toggleStudyLesson, loading } = useApp()
  const [activeStudyId, setActiveStudyId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [isModalOpen, setModalOpen] = useState(false)
  const [expandedModules, setExpandedModules] = useState({})
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [newLessonInputs, setNewLessonInputs] = useState({})

  const activeStudy = useMemo(() => studies.find((study) => study.id === activeStudyId) ?? null, [studies, activeStudyId])

  const filteredStudies = useMemo(() => {
    return studies.filter((study) => {
      const statusOk = statusFilter === 'ALL' || study.status === statusFilter
      const typeOk = typeFilter === 'ALL' || study.type === typeFilter
      return statusOk && typeOk
    })
  }, [studies, statusFilter, typeFilter])

  const handleOpenModal = () => {
    setModalOpen(true)
  }

  const handleCreateStudy = async (studyData) => {
    try {
      await addStudy(studyData)
      setModalOpen(false)
    } catch (error) {
      console.error('Error creating study:', error)
      alert('Erro ao criar estudo: ' + error.message)
    }
  }

  const handleToggleModule = (moduleId) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }))
  }

  const handleAddModule = async () => {
    if (!activeStudy || !newModuleTitle.trim()) return
    try {
      await addStudyModule(activeStudy.id, { title: newModuleTitle.trim() })
      setNewModuleTitle('')
    } catch (error) {
      console.error('Error adding module:', error)
      alert('Erro ao adicionar módulo: ' + error.message)
    }
  }

  const handleLessonInputChange = (moduleId, field, value) => {
    setNewLessonInputs((prev) => ({
      ...prev,
      [moduleId]: {
        ...prev[moduleId],
        [field]: value,
      },
    }))
  }

  const handleAddLesson = async (moduleId) => {
    const input = newLessonInputs[moduleId]
    if (!activeStudy || !input?.title?.trim()) return
    try {
      await addStudyLesson(moduleId, {
        title: input.title.trim(),
        videoUrl: input.videoUrl?.trim() || null,
      })
      setNewLessonInputs((prev) => ({ ...prev, [moduleId]: { title: '', videoUrl: '' } }))
    } catch (error) {
      console.error('Error adding lesson:', error)
      alert('Erro ao adicionar lição: ' + error.message)
    }
  }

  const handleToggleLesson = async (moduleId, lessonId, currentStatus) => {
    if (!activeStudy) return
    try {
      await toggleStudyLesson(lessonId, !currentStatus)
    } catch (error) {
      console.error('Error toggling lesson:', error)
      alert('Erro ao atualizar lição: ' + error.message)
    }
  }

  return (
    <div className="studiesPage">
      <TopNav user={user} onNavigate={onNavigate} active="Estudos" onLogout={onLogout} />

      <div className="studiesWrapper">
        <section className="studiesFilters">
        <div className="studiesFilters__group">
          <button type="button" className={statusFilter === 'ALL' ? 'is-active' : ''} onClick={() => setStatusFilter('ALL')}>
            Todos
          </button>
          <button
            type="button"
            className={statusFilter === 'IN_PROGRESS' ? 'is-active' : ''}
            onClick={() => setStatusFilter('IN_PROGRESS')}
          >
            Em andamento
          </button>
          <button
            type="button"
            className={statusFilter === 'COMPLETED' ? 'is-active' : ''}
            onClick={() => setStatusFilter('COMPLETED')}
          >
            Concluídos
          </button>
        </div>
        <div className="studiesFilters__group">
          <button type="button" className={typeFilter === 'ALL' ? 'is-active' : ''} onClick={() => setTypeFilter('ALL')}>
            Todos
          </button>
          <button type="button" className={typeFilter === 'COURSE' ? 'is-active' : ''} onClick={() => setTypeFilter('COURSE')}>
            Cursos
          </button>
          <button type="button" className={typeFilter === 'BOOK' ? 'is-active' : ''} onClick={() => setTypeFilter('BOOK')}>
            Livros
          </button>
          <button type="button" className={typeFilter === 'UNIVERSITY' ? 'is-active' : ''} onClick={() => setTypeFilter('UNIVERSITY')}>
            Faculdade
          </button>
        </div>
      </section>

      <section className="studiesGrid">
        {filteredStudies.length === 0 ? (
          <div style={{ padding: '3rem', textAlign: 'center', gridColumn: '1 / -1', color: '#999' }}>
            <p>Nenhum estudo cadastrado. Clique em "Novo Estudo" para começar.</p>
          </div>
        ) : (
          filteredStudies.map((study) => {
            const progress = calcProgress(study.modules || [])
            return (
              <article key={study.id} className="studyCard" onClick={() => setActiveStudyId(study.id)} role="button">
                <div className="studyCard__cover">
                  {study.coverUrl ? <img src={study.coverUrl} alt={study.title} /> : <div className="studyCard__coverFallback" />}
                  <div className="studyCard__progress">
                    <span style={{ width: `${progress}%` }} />
                  </div>
                </div>
                <div className="studyCard__content">
                  <div className="studyCard__meta">
                    <span className="studyCard__badge">{typeLabelMap[study.type]}</span>
                  </div>
                  <h3>{study.title}</h3>
                  <p>{statusLabelMap[study.status]}</p>
                </div>
              </article>
            )
          })
        )}
      </section>

      {activeStudy ? (
        <section className="studyDetail">
          <header className="studyDetail__header">
            <div>
              <p className="txt-pill">{typeLabelMap[activeStudy.type]}</p>
              <h2>{activeStudy.title}</h2>
              <p>{activeStudy.topic}</p>
            </div>
            <div className="studyDetail__progress">
              <span>{calcProgress(activeStudy.modules)}% concluído</span>
              <div>
                <span style={{ width: `${calcProgress(activeStudy.modules)}%` }} />
              </div>
            </div>
          </header>

          <div className="studyDetail__actions">
            <input
              type="text"
              placeholder="Novo módulo"
              value={newModuleTitle}
              onChange={(event) => setNewModuleTitle(event.target.value)}
            />
            <button type="button" onClick={handleAddModule}>
              Novo módulo
            </button>
          </div>

          <div className="studyModules">
            {activeStudy.modules.map((module) => {
              const moduleProgress = calcProgress([module])
              const lessonInput = newLessonInputs[module.id] ?? { title: '', duration: '', accessUrl: '' }
              return (
                <article key={module.id} className="studyModule">
                  <button type="button" className="studyModule__toggle" onClick={() => handleToggleModule(module.id)}>
                    <div>
                      <h3>{module.title}</h3>
                      <span>{moduleProgress}% concluído</span>
                    </div>
                    <span className={expandedModules[module.id] ? 'is-open' : ''}>⌄</span>
                  </button>
                  <div className={`studyModule__content ${expandedModules[module.id] ? 'is-open' : ''}`}>
                    <div className="studyModule__progress">
                      <span style={{ width: `${moduleProgress}%` }} />
                    </div>
                    <div className="studyLessons">
                      {module.lessons.map((lesson) => (
                        <label key={lesson.id} className="studyLesson">
                          <input
                            type="checkbox"
                            checked={lesson.isCompleted || false}
                            onChange={() => handleToggleLesson(module.id, lesson.id, lesson.isCompleted)}
                          />
                          <div>
                            <strong>{lesson.title}</strong>
                          </div>
                          {lesson.accessUrl ? (
                            <a href={lesson.accessUrl} target="_blank" rel="noreferrer">
                              Abrir
                            </a>
                          ) : null}
                        </label>
                      ))}
                    </div>
                    <div className="studyLessonForm">
                      <input
                        type="text"
                        placeholder="Nova aula"
                        value={lessonInput.title}
                        onChange={(event) => handleLessonInputChange(module.id, 'title', event.target.value)}
                      />
                      <input
                        type="text"
                        placeholder="Duração (opcional)"
                        value={lessonInput.duration}
                        onChange={(event) => handleLessonInputChange(module.id, 'duration', event.target.value)}
                      />
                      <input
                        type="url"
                        placeholder="Link (opcional)"
                        value={lessonInput.accessUrl}
                        onChange={(event) => handleLessonInputChange(module.id, 'accessUrl', event.target.value)}
                      />
                      <button type="button" onClick={() => handleAddLesson(module.id)}>
                        Nova aula
                      </button>
                    </div>
                  </div>
                </article>
              )
            })}
          </div>
        </section>
      ) : null}

      {isModalOpen && (
        <CreateStudyModal
          onClose={() => setModalOpen(false)}
          onSubmit={handleCreateStudy}
        />
      )}

      <FloatingCreateButton
        label="Novo estudo"
        caption="Criar estudo"
        ariaLabel="Criar novo estudo"
        onClick={handleOpenModal}
      />
      </div>
    </div>
  )
}
