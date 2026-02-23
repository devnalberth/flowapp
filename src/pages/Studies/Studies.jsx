import { useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import TopNav from '../../components/TopNav/TopNav.jsx'
import CreateStudyModal from '../../components/CreateStudyModal/CreateStudyModal.jsx'
import LessonModal from '../../components/LessonModal/LessonModal.jsx'
import FloatingCreateButton from '../../components/FloatingCreateButton/FloatingCreateButton.jsx'
import { Pencil, Trash2, X, Check, ArrowLeft, ChevronDown, PlayCircle, Plus } from 'lucide-react'

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

const countLessonsRecursively = (modules = []) =>
  modules.reduce(
    (acc, module) => {
      const moduleLessons = Array.isArray(module.lessons) ? module.lessons : []
      const completedModuleLessons = moduleLessons.filter((lesson) => lesson.isCompleted).length
      const nested = countLessonsRecursively(module.submodules || [])

      acc.total += moduleLessons.length + nested.total
      acc.completed += completedModuleLessons + nested.completed
      return acc
    },
    { total: 0, completed: 0 }
  )

const calcProgressFromStats = ({ total, completed }) => {
  if (!total) return 0
  return Math.round((completed / total) * 100)
}

const calcStudyProgress = (study) => calcProgressFromStats(countLessonsRecursively(study?.modules || []))
const calcModuleProgress = (module) => calcProgressFromStats(countLessonsRecursively([module]))

const getLessonCounts = (entity) => {
  const stats = countLessonsRecursively([entity])
  return { total: stats.total, completed: stats.completed }
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
  const [isAddModuleModalOpen, setAddModuleModalOpen] = useState(false)
  const [isAddSubmoduleModalOpen, setAddSubmoduleModalOpen] = useState(false)
  const [expandedModules, setExpandedModules] = useState({})
  const [expandedSubmodules, setExpandedSubmodules] = useState({})
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [newSubmoduleTitle, setNewSubmoduleTitle] = useState('')
  const [submoduleParentId, setSubmoduleParentId] = useState(null)
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

  const handleToggleSubmodule = (submoduleId) => {
    setExpandedSubmodules((prev) => ({ ...prev, [submoduleId]: !prev[submoduleId] }))
  }

  const handleAddModule = async () => {
    if (!activeStudy || !newModuleTitle.trim()) return
    try {
      await addStudyModule(activeStudy.id, { title: newModuleTitle.trim() })
      setNewModuleTitle('')
      setAddModuleModalOpen(false)
    } catch (error) {
      console.error('Error adding module:', error)
      alert('Erro ao adicionar módulo: ' + error.message)
    }
  }

  const openAddSubmoduleModal = (moduleId) => {
    setSubmoduleParentId(moduleId)
    setNewSubmoduleTitle('')
    setAddSubmoduleModalOpen(true)
  }

  const handleAddSubmodule = async () => {
    const title = newSubmoduleTitle.trim()
    if (!activeStudy || !title) return
    if (!submoduleParentId) return

    try {
      await addStudyModule(activeStudy.id, { title, parentModuleId: submoduleParentId })
      setNewSubmoduleTitle('')
      setAddSubmoduleModalOpen(false)
      setExpandedModules((prev) => ({ ...prev, [submoduleParentId]: true }))
    } catch (error) {
      console.error('Error adding submodule:', error)
      alert('Erro ao adicionar sub-módulo: ' + error.message)
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

  const handleAddLesson = async (submoduleId) => {
    const input = newLessonInputs[submoduleId]
    if (!activeStudy || !input?.title?.trim()) return
    try {
      await addStudyLesson(submoduleId, {
        title: input.title.trim(),
        videoUrl: input.accessUrl?.trim() || null,
      })
      setNewLessonInputs((prev) => ({ ...prev, [submoduleId]: { title: '', duration: '', accessUrl: '' } }))
    } catch (error) {
      console.error('Error adding lesson:', error)
      alert('Erro ao adicionar lição: ' + error.message)
    }
  }

  const handleToggleLesson = async (lessonId, currentStatus) => {
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

  const renderLessonRow = (lesson) => (
    <div key={lesson.id} className="studyLessonRow">
      <button
        type="button"
        className={`studyLessonRow__check ${lesson.isCompleted ? 'is-done' : ''}`}
        onClick={() => handleToggleLesson(lesson.id, lesson.isCompleted)}
        title={lesson.isCompleted ? 'Marcar como não concluída' : 'Marcar como concluída'}
      >
        {lesson.isCompleted ? <Check size={12} /> : null}
      </button>

      {editingLessonId === lesson.id ? (
        <input
          type="text"
          className="studyLessonRow__editInput"
          value={editingLessonTitle}
          onChange={(e) => setEditingLessonTitle(e.target.value)}
          autoFocus
        />
      ) : (
        <div className="studyLessonRow__title" onClick={() => handleOpenLesson(lesson)}>
          <strong>{lesson.title}</strong>
        </div>
      )}

      {lesson.accessUrl && (
        <a href={lesson.accessUrl} target="_blank" rel="noreferrer" className="studyLessonRow__link">
          Abrir
        </a>
      )}

      <div className="studyLessonRow__actions">
        {editingLessonId === lesson.id ? (
          <>
            <button className="studyLessonRow__actionBtn" onClick={handleSaveLessonEdit} title="Salvar"><Check size={12} /></button>
            <button className="studyLessonRow__actionBtn" onClick={() => setEditingLessonId(null)} title="Cancelar"><X size={12} /></button>
          </>
        ) : (
          <>
            <button className="studyLessonRow__actionBtn" onClick={() => handleStartEditLesson(lesson)} title="Editar"><Pencil size={12} /></button>
            <button className="studyLessonRow__actionBtn studyLessonRow__actionBtn--danger" onClick={() => handleDeleteLesson(lesson.id, lesson.title)} title="Excluir"><Trash2 size={12} /></button>
          </>
        )}
      </div>
    </div>
  )

  const renderSubmodule = (submodule) => {
    const progress = calcModuleProgress(submodule)
    const isOpen = expandedSubmodules[submodule.id]
    const lessonInput = newLessonInputs[submodule.id] ?? { title: '', duration: '', accessUrl: '' }
    const lessonCount = getLessonCounts(submodule)

    return (
      <article key={submodule.id} className="studySubmodule">
        <header className="studySubmodule__header">
          <button type="button" className="studySubmodule__toggle" onClick={() => handleToggleSubmodule(submodule.id)}>
            <span className="studySubmodule__icon"><PlayCircle size={18} /></span>
            {editingModuleId === submodule.id ? (
              <input
                type="text"
                className="studySubmodule__editInput"
                value={editingModuleTitle}
                onChange={(e) => setEditingModuleTitle(e.target.value)}
                onClick={(e) => e.stopPropagation()}
                autoFocus
              />
            ) : (
              <div className="studySubmodule__meta">
                <div className="studySubmodule__titleRow">
                  <h4>{submodule.title}</h4>
                  <span className="studySubmodule__badge">MÓDULO</span>
                  <span className="studySubmodule__stats">{lessonCount.total} AULAS • {progress}%</span>
                </div>
              </div>
            )}
            <ChevronDown size={16} className={`studySubmodule__chevron ${isOpen ? 'is-open' : ''}`} />
          </button>

          <div className="studySubmodule__actions">
            {editingModuleId === submodule.id ? (
              <>
                <button className="studySubmodule__actionBtn" onClick={handleSaveModuleEdit} title="Salvar"><Check size={14} /></button>
                <button className="studySubmodule__actionBtn" onClick={() => setEditingModuleId(null)} title="Cancelar"><X size={14} /></button>
              </>
            ) : (
              <>
                <button className="studySubmodule__actionBtn" onClick={() => handleStartEditModule(submodule)} title="Editar"><Pencil size={14} /></button>
                <button className="studySubmodule__actionBtn studySubmodule__actionBtn--danger" onClick={() => handleDeleteModule(submodule.id, submodule.title)} title="Excluir"><Trash2 size={14} /></button>
              </>
            )}
          </div>
        </header>

        <div className={`studySubmodule__content ${isOpen ? 'is-open' : ''}`}>
          <div className="studySubmodule__progressBar"><span style={{ width: `${progress}%` }} /></div>

          <div className="studySubmodule__lessons">
            {submodule.lessons.length > 0 ? (
              submodule.lessons.map(renderLessonRow)
            ) : (
              <p className="studySubmodule__empty">Nenhuma aula neste sub-módulo.</p>
            )}
          </div>

          <div className="studyAddLessonForm">
            <input
              type="text"
              placeholder="Nova aula"
              value={lessonInput.title}
              onChange={(event) => handleLessonInputChange(submodule.id, 'title', event.target.value)}
            />
            <input
              type="text"
              placeholder="Duração (opcional)"
              value={lessonInput.duration}
              onChange={(event) => handleLessonInputChange(submodule.id, 'duration', event.target.value)}
            />
            <input
              type="url"
              placeholder="Link (opcional)"
              value={lessonInput.accessUrl}
              onChange={(event) => handleLessonInputChange(submodule.id, 'accessUrl', event.target.value)}
            />
            <button type="button" onClick={() => handleAddLesson(submodule.id)}>
              Nova aula
            </button>
          </div>
        </div>
      </article>
    )
  }

  const renderLevel = (module, index) => {
    const isOpen = expandedModules[module.id]
    const progress = calcModuleProgress(module)
    const lessonCount = getLessonCounts(module)

    return (
      <section key={module.id} className="studyLevel">
        <header className="studyLevel__header">
          <button type="button" className="studyLevel__toggle" onClick={() => handleToggleModule(module.id)}>
            <div className="studyLevel__meta">
              <span className="studyLevel__eyebrow">NÍVEL {index + 1}</span>
              {editingModuleId === module.id ? (
                <input
                  type="text"
                  className="studyLevel__editInput"
                  value={editingModuleTitle}
                  onChange={(e) => setEditingModuleTitle(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  autoFocus
                />
              ) : (
                <div className="studyLevel__titleRow">
                  <h3>{module.title}</h3>
                </div>
              )}
            </div>
            <ChevronDown size={16} className={`studyLevel__chevron ${isOpen ? 'is-open' : ''}`} />
          </button>

          <div className="studyLevel__actions">
            {editingModuleId === module.id ? (
              <>
                <button className="studyLevel__actionBtn" onClick={handleSaveModuleEdit} title="Salvar"><Check size={14} /></button>
                <button className="studyLevel__actionBtn" onClick={() => setEditingModuleId(null)} title="Cancelar"><X size={14} /></button>
              </>
            ) : (
              <>
                <button className="studyLevel__actionBtn" onClick={() => handleStartEditModule(module)} title="Editar"><Pencil size={14} /></button>
                <button className="studyLevel__actionBtn studyLevel__actionBtn--danger" onClick={() => handleDeleteModule(module.id, module.title)} title="Excluir"><Trash2 size={14} /></button>
              </>
            )}
          </div>
        </header>

        <div className={`studyLevel__content ${isOpen ? 'is-open' : ''}`}>
          <div className="studyLevel__progressMeta">
            <span>{lessonCount.completed}/{lessonCount.total} aulas concluídas</span>
            <strong>{progress}% concluído</strong>
          </div>
          <div className="studyLevel__progressBar"><span style={{ width: `${progress}%` }} /></div>

          {Array.isArray(module.lessons) && module.lessons.length > 0 && (
            <div className="studyLevel__legacyLessons">
              <h4>Aulas deste nível</h4>
              {module.lessons.map(renderLessonRow)}
            </div>
          )}

          <div className="studySubmodules">
            {module.submodules?.length > 0 ? (
              module.submodules.map(renderSubmodule)
            ) : (
              <p className="studyLevel__empty">Ainda não há sub-módulos. Crie o primeiro abaixo.</p>
            )}
          </div>

          <div className="studyAddSubmodule">
            <button type="button" className="studyAddSubmodule__iconBtn" onClick={() => openAddSubmoduleModal(module.id)}>
              <Plus size={16} />
              Novo sub-módulo
            </button>
          </div>
        </div>
      </section>
    )
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
                  const progress = calcStudyProgress(study)
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

            <header className="studyDetailHeader">
              <div className="studyDetailHeader__left">
                <p className="studyDetailHeader__type">{typeLabelMap[activeStudy.type]}</p>
                <h2>{activeStudy.title}</h2>
              </div>
              <div className="studyDetailHeader__right">
                <div className="studyDetailHeader__progress">
                  <span>{calcStudyProgress(activeStudy)}% concluído</span>
                  <div>
                    <span style={{ width: `${calcStudyProgress(activeStudy)}%` }} />
                  </div>
                </div>
                <button className="studyDetailPage__deleteBtn" onClick={handleDeleteStudy} title="Excluir curso">
                  <Trash2 size={16} />
                </button>
              </div>
            </header>

            <div className="studyAddModule">
              <button type="button" className="studyAddModule__iconBtn" onClick={() => setAddModuleModalOpen(true)}>
                <Plus size={16} />
                Novo módulo
              </button>
            </div>

            <div className="studyLevels">
              {activeStudy.modules.map((module, index) => renderLevel(module, index))}
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

        {isAddModuleModalOpen && (
          <AddNameModal
            title="Novo módulo"
            placeholder="Nome do módulo"
            value={newModuleTitle}
            onChange={setNewModuleTitle}
            onClose={() => {
              setAddModuleModalOpen(false)
              setNewModuleTitle('')
            }}
            onSubmit={handleAddModule}
            submitLabel="Criar módulo"
          />
        )}

        {isAddSubmoduleModalOpen && (
          <AddNameModal
            title="Novo sub-módulo"
            placeholder="Nome do sub-módulo"
            value={newSubmoduleTitle}
            onChange={setNewSubmoduleTitle}
            onClose={() => {
              setAddSubmoduleModalOpen(false)
              setNewSubmoduleTitle('')
              setSubmoduleParentId(null)
            }}
            onSubmit={handleAddSubmodule}
            submitLabel="Criar sub-módulo"
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

function AddNameModal({ title, placeholder, value, onChange, onClose, onSubmit, submitLabel }) {
  return (
    <div className="studyQuickModal" onClick={onClose}>
      <div className="studyQuickModal__backdrop" />
      <form
        className="studyQuickModal__panel"
        onClick={(e) => e.stopPropagation()}
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
      >
        <header className="studyQuickModal__header">
          <h3>{title}</h3>
          <button type="button" onClick={onClose} className="studyQuickModal__close">×</button>
        </header>

        <div className="studyQuickModal__body">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            autoFocus
          />
        </div>

        <footer className="studyQuickModal__footer">
          <button type="button" className="studyQuickModal__btn studyQuickModal__btn--secondary" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="studyQuickModal__btn studyQuickModal__btn--primary">
            {submitLabel}
          </button>
        </footer>
      </form>
    </div>
  )
}
