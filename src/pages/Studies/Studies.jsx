import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import TopNav from '../../components/TopNav/TopNav.jsx'
import CreateStudyModal from '../../components/CreateStudyModal/CreateStudyModal.jsx'
import LessonModal from '../../components/LessonModal/LessonModal.jsx'
import FloatingCreateButton from '../../components/FloatingCreateButton/FloatingCreateButton.jsx'
import { Pencil, Trash2, X, Check, ArrowLeft } from 'lucide-react'

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
  const {
    studies, addStudy, deleteStudy, updateStudy,
    addStudyModule, updateStudyModule, deleteStudyModule,
    addStudyLesson, updateStudyLesson, deleteStudyLesson,
    toggleStudyLesson, loading
  } = useApp()
  const [activeStudyId, setActiveStudyId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [isModalOpen, setModalOpen] = useState(false)
  const [expandedModules, setExpandedModules] = useState({})
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [newLessonInputs, setNewLessonInputs] = useState({})
  // Edit states
  const [editingModuleId, setEditingModuleId] = useState(null)
  const [editingModuleTitle, setEditingModuleTitle] = useState('')
  const [editingLessonId, setEditingLessonId] = useState(null)
  const [editingLessonTitle, setEditingLessonTitle] = useState('')
  // Lesson modal state
  const [selectedLesson, setSelectedLesson] = useState(null)

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
      // O studyData já vem com o coverUrl (se houver upload feito no modal)
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

  // Delete Study
  const handleDeleteStudy = async () => {
    if (!activeStudy) return
    if (!confirm(`Excluir "${activeStudy.title}"? Todos os módulos e aulas serão perdidos.`)) return
    try {
      await deleteStudy(activeStudy.id)
      setActiveStudyId(null)
    } catch (error) {
      console.error('Error deleting study:', error)
      alert('Erro ao excluir estudo')
    }
  }

  // Module CRUD
  const handleStartEditModule = (module) => {
    setEditingModuleId(module.id)
    setEditingModuleTitle(module.title)
  }

  const handleSaveModuleEdit = async () => {
    if (!editingModuleId || !editingModuleTitle.trim()) return
    try {
      await updateStudyModule(editingModuleId, { title: editingModuleTitle.trim() })
      setEditingModuleId(null)
      setEditingModuleTitle('')
    } catch (error) {
      console.error('Error updating module:', error)
      alert('Erro ao atualizar módulo')
    }
  }

  const handleDeleteModule = async (moduleId, moduleTitle) => {
    if (!confirm(`Excluir módulo "${moduleTitle}"? Todas as aulas serão perdidas.`)) return
    try {
      await deleteStudyModule(moduleId)
    } catch (error) {
      console.error('Error deleting module:', error)
      alert('Erro ao excluir módulo')
    }
  }

  // Lesson CRUD
  const handleStartEditLesson = (lesson) => {
    setEditingLessonId(lesson.id)
    setEditingLessonTitle(lesson.title)
  }

  const handleSaveLessonEdit = async () => {
    if (!editingLessonId || !editingLessonTitle.trim()) return
    try {
      await updateStudyLesson(editingLessonId, { title: editingLessonTitle.trim() })
      setEditingLessonId(null)
      setEditingLessonTitle('')
    } catch (error) {
      console.error('Error updating lesson:', error)
      alert('Erro ao atualizar aula')
    }
  }

  const handleDeleteLesson = async (lessonId, lessonTitle) => {
    if (!confirm(`Excluir aula "${lessonTitle}"?`)) return
    try {
      await deleteStudyLesson(lessonId)
    } catch (error) {
      console.error('Error deleting lesson:', error)
      alert('Erro ao excluir aula')
    }
  }

  // Open lesson modal
  const handleOpenLesson = (lesson) => {
    setSelectedLesson(lesson)
  }

  // Save lesson from modal
  const handleSaveLesson = async (lessonId, updates) => {
    await updateStudyLesson(lessonId, updates)
  }

  return (
    <div className="studiesPage">
      <TopNav user={user} onNavigate={onNavigate} active="Estudos" onLogout={onLogout} />

      <div className="studiesWrapper">
        {/* Show filters and grid only when no study is selected */}
        {!activeStudy ? (
          <>
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
          </>
        ) : (
          /* Study Detail Page View */
          <div className="studyDetailPage">
            {/* Back Button */}
            <button className="studyDetailPage__back" onClick={() => setActiveStudyId(null)}>
              <ArrowLeft size={20} />
              <span>Voltar para Estudos</span>
            </button>

            <header className="studyDetail__header">
              <div>
                <p className="txt-pill">{typeLabelMap[activeStudy.type]}</p>
                <h2>{activeStudy.title}</h2>
                <p>{activeStudy.topic}</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                <div className="studyDetail__progress">
                  <span>{calcProgress(activeStudy.modules)}% concluído</span>
                  <div>
                    <span style={{ width: `${calcProgress(activeStudy.modules)}%` }} />
                  </div>
                </div>
                <button className="studyDetailPage__deleteBtn" onClick={handleDeleteStudy} title="Excluir curso">
                  <Trash2 size={16} />
                </button>
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
                    <div className="studyModule__header">
                      <button type="button" className="studyModule__toggle" onClick={() => handleToggleModule(module.id)}>
                        {editingModuleId === module.id ? (
                          <input
                            type="text"
                            className="studyModule__editInput"
                            value={editingModuleTitle}
                            onChange={(e) => setEditingModuleTitle(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                          />
                        ) : (
                          <div>
                            <h3>{module.title}</h3>
                            <span>{moduleProgress}% concluído</span>
                          </div>
                        )}
                        <span className={expandedModules[module.id] ? 'is-open' : ''}>⌄</span>
                      </button>
                      <div className="studyModule__actions">
                        {editingModuleId === module.id ? (
                          <>
                            <button className="studyModule__actionBtn" onClick={handleSaveModuleEdit} title="Salvar"><Check size={14} /></button>
                            <button className="studyModule__actionBtn" onClick={() => setEditingModuleId(null)} title="Cancelar"><X size={14} /></button>
                          </>
                        ) : (
                          <>
                            <button className="studyModule__actionBtn" onClick={() => handleStartEditModule(module)} title="Editar"><Pencil size={14} /></button>
                            <button className="studyModule__actionBtn studyModule__actionBtn--danger" onClick={() => handleDeleteModule(module.id, module.title)} title="Excluir"><Trash2 size={14} /></button>
                          </>
                        )}
                      </div>
                    </div>
                    <div className={`studyModule__content ${expandedModules[module.id] ? 'is-open' : ''}`}>
                      <div className="studyModule__progress">
                        <span style={{ width: `${moduleProgress}%` }} />
                      </div>
                      <div className="studyLessons">
                        {module.lessons.map((lesson) => (
                          <div key={lesson.id} className="studyLesson">
                            <input
                              type="checkbox"
                              checked={lesson.isCompleted || false}
                              onChange={() => handleToggleLesson(module.id, lesson.id, lesson.isCompleted)}
                            />
                            {editingLessonId === lesson.id ? (
                              <input
                                type="text"
                                className="studyLesson__editInput"
                                value={editingLessonTitle}
                                onChange={(e) => setEditingLessonTitle(e.target.value)}
                                autoFocus
                              />
                            ) : (
                              <div className="studyLesson__title" onClick={() => handleOpenLesson(lesson)} style={{ cursor: 'pointer' }}>
                                <strong>{lesson.title}</strong>
                              </div>
                            )}
                            {lesson.accessUrl && (
                              <a href={lesson.accessUrl} target="_blank" rel="noreferrer">Abrir</a>
                            )}
                            <div className="studyLesson__actions">
                              {editingLessonId === lesson.id ? (
                                <>
                                  <button className="studyLesson__actionBtn" onClick={handleSaveLessonEdit} title="Salvar"><Check size={12} /></button>
                                  <button className="studyLesson__actionBtn" onClick={() => setEditingLessonId(null)} title="Cancelar"><X size={12} /></button>
                                </>
                              ) : (
                                <>
                                  <button className="studyLesson__actionBtn" onClick={() => handleStartEditLesson(lesson)} title="Editar"><Pencil size={12} /></button>
                                  <button className="studyLesson__actionBtn studyLesson__actionBtn--danger" onClick={() => handleDeleteLesson(lesson.id, lesson.title)} title="Excluir"><Trash2 size={12} /></button>
                                </>
                              )}
                            </div>
                          </div>
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
          </div>
        )}

        {isModalOpen && (
          <CreateStudyModal
            onClose={() => setModalOpen(false)}
            onSubmit={handleCreateStudy}
            userId={user?.id}
          />
        )}

        {selectedLesson && (
          <LessonModal
            lesson={selectedLesson}
            onClose={() => setSelectedLesson(null)}
            onSave={handleSaveLesson}
          />
        )}

        {!activeStudy && (
          <FloatingCreateButton
            label="Novo estudo"
            caption="Criar estudo"
            ariaLabel="Criar novo estudo"
            onClick={handleOpenModal}
          />
        )}
      </div>
    </div>
  )
}
