import { useMemo, useState } from 'react'
import TopNav from '../../components/TopNav/TopNav.jsx'

import './Studies.css'

const initialStudies = [
  {
    id: 'study-01',
    title: 'React Mastery',
    type: 'COURSE',
    status: 'STUDYING',
    topic: 'Programação',
    coverUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1200&auto=format&fit=crop',
    accessUrl: 'https://www.udemy.com/',
    modules: [
      {
        id: 'module-01',
        title: 'Setup & Base',
        lessons: [
          { id: 'lesson-01', title: 'Instalando Node', completed: true, duration: '12 min' },
          { id: 'lesson-02', title: 'Configurando Vite', completed: false, duration: '18 min' },
        ],
      },
      {
        id: 'module-02',
        title: 'Componentização',
        lessons: [
          { id: 'lesson-03', title: 'Componentes inteligentes', completed: false, duration: '24 min' },
          { id: 'lesson-04', title: 'State management', completed: false, duration: '30 min' },
        ],
      },
    ],
  },
  {
    id: 'study-02',
    title: 'Arquitetura de Informação',
    type: 'COURSE',
    status: 'NOT_STARTED',
    topic: 'Design',
    coverUrl: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1200&auto=format&fit=crop',
    accessUrl: 'https://www.coursera.org/',
    modules: [
      {
        id: 'module-03',
        title: 'Estruturas mentais',
        lessons: [
          { id: 'lesson-05', title: 'Mapas de conteúdo', completed: false, duration: '15 min' },
        ],
      },
    ],
  },
  {
    id: 'study-03',
    title: 'FlowApp - Faculdade',
    type: 'COLLEGE',
    status: 'STUDYING',
    topic: 'Engenharia',
    coverUrl: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop',
    accessUrl: 'https://www.university.com/',
    modules: [
      {
        id: 'module-04',
        title: 'Capítulo 1',
        lessons: [
          { id: 'lesson-06', title: 'Introdução', completed: true, duration: '20 min' },
          { id: 'lesson-07', title: 'Atividade prática', completed: false, duration: '35 min' },
        ],
      },
    ],
  },
  {
    id: 'study-04',
    title: 'Pense Rápido, Pense Devagar',
    type: 'BOOK',
    status: 'READING',
    topic: 'Filosofia',
    coverUrl: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop',
    accessUrl: 'https://www.amazon.com.br/',
    modules: [
      {
        id: 'module-05',
        title: 'Capítulo 1',
        lessons: [
          { id: 'lesson-08', title: 'Sistema 1', completed: true, duration: '30 páginas' },
          { id: 'lesson-09', title: 'Sistema 2', completed: false, duration: '28 páginas' },
        ],
      },
    ],
  },
]

const statusLabelMap = {
  NOT_STARTED: 'Não iniciado',
  STUDYING: 'Em andamento',
  COMPLETED: 'Concluído',
  READING: 'Lendo',
  READ: 'Lido',
}

const typeLabelMap = {
  COURSE: 'Curso Online',
  COLLEGE: 'Faculdade',
  BOOK: 'Livro',
}

const statusOptionsByType = {
  BOOK: ['NOT_STARTED', 'READING', 'READ'],
  COURSE: ['NOT_STARTED', 'STUDYING', 'COMPLETED'],
  COLLEGE: ['NOT_STARTED', 'STUDYING', 'COMPLETED'],
}

const makeId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}`

const countLessons = (modules) =>
  modules.reduce(
    (acc, module) => {
      acc.total += module.lessons.length
      acc.completed += module.lessons.filter((lesson) => lesson.completed).length
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
  const [studies, setStudies] = useState(initialStudies)
  const [activeStudyId, setActiveStudyId] = useState(null)
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [isModalOpen, setModalOpen] = useState(false)
  const [expandedModules, setExpandedModules] = useState({})
  const [newModuleTitle, setNewModuleTitle] = useState('')
  const [newLessonInputs, setNewLessonInputs] = useState({})
  const [formState, setFormState] = useState({
    title: '',
    type: 'COURSE',
    topic: '',
    tags: '',
    accessUrl: '',
    status: 'NOT_STARTED',
    coverUrl: '',
  })

  const activeStudy = useMemo(() => studies.find((study) => study.id === activeStudyId) ?? null, [studies, activeStudyId])

  const filteredStudies = useMemo(() => {
    return studies.filter((study) => {
      const statusOk = statusFilter === 'ALL' || study.status === statusFilter
      const typeOk = typeFilter === 'ALL' || study.type === typeFilter
      return statusOk && typeOk
    })
  }, [studies, statusFilter, typeFilter])

  const statusOptions = statusOptionsByType[formState.type] ?? statusOptionsByType.COURSE

  const handleOpenModal = () => {
    setFormState({
      title: '',
      type: 'COURSE',
      topic: '',
      tags: '',
      accessUrl: '',
      status: 'NOT_STARTED',
      coverUrl: '',
    })
    setModalOpen(true)
  }

  const handleCreateStudy = (event) => {
    event.preventDefault()
    const newStudy = {
      id: makeId('study'),
      title: formState.title || 'Novo estudo',
      type: formState.type,
      status: formState.status,
      topic: formState.topic || 'Sem categoria',
      coverUrl: formState.coverUrl,
      accessUrl: formState.accessUrl,
      tags: formState.tags
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
      modules: [],
    }
    setStudies((prev) => [newStudy, ...prev])
    setModalOpen(false)
  }

  const handleToggleModule = (moduleId) => {
    setExpandedModules((prev) => ({ ...prev, [moduleId]: !prev[moduleId] }))
  }

  const handleAddModule = () => {
    if (!activeStudy || !newModuleTitle.trim()) return
    setStudies((prev) =>
      prev.map((study) =>
        study.id === activeStudy.id
          ? {
              ...study,
              modules: [
                ...study.modules,
                {
                  id: makeId('module'),
                  title: newModuleTitle.trim(),
                  lessons: [],
                },
              ],
            }
          : study
      )
    )
    setNewModuleTitle('')
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

  const handleAddLesson = (moduleId) => {
    const input = newLessonInputs[moduleId]
    if (!activeStudy || !input?.title?.trim()) return
    setStudies((prev) =>
      prev.map((study) => {
        if (study.id !== activeStudy.id) return study
        return {
          ...study,
          modules: study.modules.map((module) => {
            if (module.id !== moduleId) return module
            return {
              ...module,
              lessons: [
                ...module.lessons,
                {
                  id: makeId('lesson'),
                  title: input.title.trim(),
                  duration: input.duration?.trim() || '',
                  accessUrl: input.accessUrl?.trim() || '',
                  completed: false,
                },
              ],
            }
          }),
        }
      })
    )
    setNewLessonInputs((prev) => ({ ...prev, [moduleId]: { title: '', duration: '', accessUrl: '' } }))
  }

  const handleToggleLesson = (moduleId, lessonId) => {
    if (!activeStudy) return
    setStudies((prev) =>
      prev.map((study) => {
        if (study.id !== activeStudy.id) return study
        return {
          ...study,
          modules: study.modules.map((module) => {
            if (module.id !== moduleId) return module
            return {
              ...module,
              lessons: module.lessons.map((lesson) =>
                lesson.id === lessonId ? { ...lesson, completed: !lesson.completed } : lesson
              ),
            }
          }),
        }
      })
    )
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
            className={statusFilter === 'STUDYING' ? 'is-active' : ''}
            onClick={() => setStatusFilter('STUDYING')}
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
          <button type="button" className={typeFilter === 'COLLEGE' ? 'is-active' : ''} onClick={() => setTypeFilter('COLLEGE')}>
            Faculdade
          </button>
        </div>
      </section>

      <section className="studiesGrid">
        {filteredStudies.map((study) => {
          const progress = calcProgress(study.modules)
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
                  <span className="studyCard__tag">{study.topic}</span>
                </div>
                <h3>{study.title}</h3>
                <p>{statusLabelMap[study.status]}</p>
              </div>
            </article>
          )
        })}
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
                            checked={lesson.completed}
                            onChange={() => handleToggleLesson(module.id, lesson.id)}
                          />
                          <div>
                            <strong>{lesson.title}</strong>
                            <span>{lesson.duration || 'Duração livre'}</span>
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

      {isModalOpen ? (
        <div className="studyModal" role="dialog" aria-modal="true">
          <div className="studyModal__content">
            <header>
              <div>
                <p className="txt-pill">Novo estudo</p>
                <h2>Cadastrar estudo</h2>
                <p>Organize cursos, livros e faculdade em um único lugar.</p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Fechar">
                ✕
              </button>
            </header>
            <form onSubmit={handleCreateStudy}>
              <div className="studyModal__upload">
                <label htmlFor="coverUpload">Imagem de capa</label>
                <input
                  id="coverUpload"
                  type="url"
                  placeholder="Cole uma URL da capa (ou arraste um link)"
                  value={formState.coverUrl}
                  onChange={(event) => setFormState((prev) => ({ ...prev, coverUrl: event.target.value }))}
                />
              </div>
              <div className="studyModal__grid">
                <label>
                  Nome
                  <input
                    type="text"
                    placeholder="Ex: React Mastery"
                    value={formState.title}
                    onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
                  />
                </label>
                <label>
                  Tipo
                  <select
                    value={formState.type}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        type: event.target.value,
                        status: statusOptionsByType[event.target.value][0],
                      }))
                    }
                  >
                    <option value="COURSE">Curso Online</option>
                    <option value="COLLEGE">Faculdade</option>
                    <option value="BOOK">Livro</option>
                  </select>
                </label>
                <label>
                  Categoria
                  <input
                    type="text"
                    placeholder="Ex: Programação"
                    value={formState.topic}
                    onChange={(event) => setFormState((prev) => ({ ...prev, topic: event.target.value }))}
                  />
                </label>
                <label>
                  Tópicos (tags)
                  <input
                    type="text"
                    placeholder="UX, Frontend, Filosofia"
                    value={formState.tags}
                    onChange={(event) => setFormState((prev) => ({ ...prev, tags: event.target.value }))}
                  />
                </label>
                <label>
                  URL de acesso
                  <input
                    type="url"
                    placeholder="https://"
                    value={formState.accessUrl}
                    onChange={(event) => setFormState((prev) => ({ ...prev, accessUrl: event.target.value }))}
                  />
                </label>
                <label>
                  Status
                  <select
                    value={formState.status}
                    onChange={(event) => setFormState((prev) => ({ ...prev, status: event.target.value }))}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {statusLabelMap[status]}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="studyModal__actions">
                <button type="button" className="secondary" onClick={() => setModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="primary">
                  Salvar estudo
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
      </div>
    </div>
  )
}
