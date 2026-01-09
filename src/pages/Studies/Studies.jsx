import { useState } from 'react'
import TopNav from '../../components/TopNav/TopNav.jsx'

import './Studies.css'

const STUDY_TYPES = {
  curso: {
    id: 'curso',
    label: 'Curso profissional',
    badge: 'Imersão guiada',
    description: 'Ideal para certificações, bootcamps e cursos on demand.',
    focus: 'Curso com módulos e aulas',
  },
  faculdade: {
    id: 'faculdade',
    label: 'Faculdade / Graduação',
    badge: 'Fluxo acadêmico',
    description: 'Fluxo completo com semestres, matérias, assuntos e módulos.',
    focus: 'Semestres → matérias → assuntos → módulos',
  },
  interesse: {
    id: 'interesse',
    label: 'Biblioteca pessoal',
    badge: 'Explorar referências',
    description: 'Trilhas de estudo, leituras e pesquisas paralelas.',
    focus: 'Interesses → materiais → insights',
  },
}

const STUDY_STATS = [
  { label: 'Horas registradas', value: '148h', detail: '+18% versus último mês' },
  { label: 'Cursos ativos', value: '5', detail: '3 em andamento · 2 em pausa' },
  { label: 'Semestres mapeados', value: '4', detail: '2025.2 → 2027.1' },
]

const STUDY_TAGS = ['GTD', 'AI copilots', 'Product Ops', 'Pesquisa', 'Mental models']

const STUDY_LIBRARY_SHELVES = [
  {
    id: 'courses',
    eyebrow: 'Imersões guiadas',
    title: 'Cursos em progresso',
    description: 'Continue assistindo, abra notas e importe módulos direto do modal.',
    actionLabel: 'Ver todos os cursos',
    cards: [
      {
        id: 'flow-systems',
        title: 'Flow Systems Mastery',
        type: 'Curso',
        status: '65% concluído',
        progress: '4 / 6 módulos',
        focus: 'Execução com GTD',
        platform: 'Flow University',
        nextAction: 'Revisar Módulo 02 · Execução focada',
        cover: 'linear-gradient(135deg, #18153a, #f77055)',
        accent: '#f77055',
      },
      {
        id: 'product-labs',
        title: 'Product Strategy Labs',
        type: 'Curso',
        status: 'Novo módulo liberado',
        progress: '2 / 5 módulos',
        focus: 'Discovery contínuo',
        platform: 'Reforge',
        nextAction: 'Assistir aula "North Star Metrics"',
        cover: 'linear-gradient(135deg, #1f2d57, #64d8ff)',
        accent: '#64d8ff',
      },
      {
        id: 'data-storytelling',
        title: 'Data Storytelling',
        type: 'Curso',
        status: 'Em revisão',
        progress: '8 / 12 aulas',
        focus: 'Narrativas com dados',
        platform: 'Coursera',
        nextAction: 'Consolidar notas GTD',
        cover: 'linear-gradient(135deg, #1d2530, #b27cff)',
        accent: '#b27cff',
      },
    ],
  },
  {
    id: 'faculty',
    eyebrow: 'Programas longos',
    title: 'Faculdades e MBAs',
    description: 'Mapa visual para semestres, matérias, assuntos e módulos.',
    actionLabel: 'Abrir blueprint',
    cards: [
      {
        id: 'software-semester',
        title: '2026.1 · Engenharia de Software',
        type: 'Semestre',
        status: '20 semanas',
        progress: '3 matérias com notas',
        focus: 'Arquitetura limpa, DDD, KPIs',
        platform: 'UF Flow',
        nextAction: 'Cadastrar assuntos de Produto',
        cover: 'linear-gradient(120deg, #082032, #2c394b)',
        accent: '#96e5ff',
      },
      {
        id: 'leadership-semester',
        title: '2026.2 · Liderança e Gestão',
        type: 'Semestre',
        status: '18 semanas',
        progress: '4 matérias planejadas',
        focus: 'Squads & comunicação',
        platform: 'Flow Business School',
        nextAction: 'Adicionar módulo AI copilots',
        cover: 'linear-gradient(120deg, #241a40, #5d2ee2)',
        accent: '#f8c24f',
      },
    ],
  },
  {
    id: 'interests',
    eyebrow: 'Biblioteca viva',
    title: 'Interesses e leituras',
    description: 'Coleções temáticas com livros, papers e playlists de aulas.',
    actionLabel: 'Explorar referências',
    cards: [
      {
        id: 'ai-copilots',
        title: 'AI copilots para squads',
        type: 'Trilha',
        status: '6 recursos prioritários',
        progress: 'Atualizada esta semana',
        focus: 'Playbooks + vídeos + prompts',
        platform: 'Notion Library',
        nextAction: 'Adicionar estudo de caso',
        cover: 'linear-gradient(140deg, #032b43, #3dc9b0)',
        accent: '#3dc9b0',
      },
      {
        id: 'deep-work',
        title: 'Rotinas de Deep Work',
        type: 'Coleção',
        status: '9 materiais',
        progress: '3 notas GTD',
        focus: 'Rituais e templates',
        platform: 'Readwise',
        nextAction: 'Registrar próximos experimentos',
        cover: 'linear-gradient(140deg, #1c1f2b, #ff9c5f)',
        accent: '#ff9c5f',
      },
    ],
  },
]

const COURSE_MODULES = [
  {
    id: 'onboarding',
    title: 'Módulo 01 · Onboarding Flow',
    focus: 'Mindset e fundamentos',
    progress: '3 / 6 aulas concluídas',
    cadence: 'Sugestão: 2 aulas por semana',
    lessons: [
      { title: 'Panorama Flow OS', type: 'Vídeo · 18min', status: 'Concluída', notes: ['Resumo salvo'] },
      { title: 'Pilares do GTD aplicado', type: 'Mentoria ao vivo', status: 'Em andamento', notes: ['Destaques'] },
      { title: 'Mapeamento de projetos', type: 'Workshop guiado', status: 'Próxima', notes: [] },
    ],
  },
  {
    id: 'execucao',
    title: 'Módulo 02 · Execução focada',
    focus: 'Sistema de aulas + rituais',
    progress: '1 / 5 aulas agendadas',
    cadence: 'Sugestão: Sprint semanal',
    lessons: [
      { title: 'Design de rotinas', type: 'Vídeo · 24min', status: 'Próxima', notes: [] },
      { title: 'Rituais semanais GTD', type: 'Checklist guiado', status: 'Próxima', notes: [] },
    ],
  },
]

const LESSON_NOTE_KIT = [
  {
    id: 'notes',
    badge: 'Anotações',
    title: 'Anotações rápidas',
    description: 'Capture frameworks, exemplos e referências essenciais da aula.',
    bullets: ['Canvas FlowBoard versionado', 'Checklist de clarificação GTD', 'Links para materiais extras'],
  },
  {
    id: 'highlights',
    badge: 'Destaques',
    title: 'Destaques essenciais',
    description: 'Marque trechos críticos para revisar depois ou compartilhar com o squad.',
    tags: ['Disciplina', 'Mindset', 'Execução', 'Ferramentas'],
  },
  {
    id: 'summary',
    badge: 'Resumo GTD',
    title: 'Resumo + próximos passos',
    description: 'Transforme o que aprendeu em ações concretas e revisões periódicas.',
    checklist: ['Clarificar insights da aula', 'Gerar próximas ações', 'Agendar revisão da semana', 'Enviar follow-up para mentor'],
  },
]

const FACULTY_BLUEPRINT = [
  {
    semester: '2026.1',
    cadence: '20 semanas · ciclo principal',
    subjects: [
      {
        name: 'Engenharia de Software',
        topics: [
          { name: 'Arquitetura limpa', modules: 3 },
          { name: 'Domain Driven Design', modules: 2 },
        ],
      },
      {
        name: 'Produto e Pesquisa',
        topics: [
          { name: 'Discovery contínuo', modules: 2 },
          { name: 'KPIs e métricas', modules: 1 },
        ],
      },
    ],
  },
  {
    semester: '2026.2',
    cadence: '18 semanas · imersão aplicada',
    subjects: [
      {
        name: 'Liderança e Gestão',
        topics: [
          { name: 'Design de squads', modules: 2 },
          { name: 'Comunicação estratégica', modules: 1 },
        ],
      },
      {
        name: 'Tecnologias emergentes',
        topics: [
          { name: 'AI copilots', modules: 2 },
          { name: 'Automação de processos', modules: 1 },
        ],
      },
    ],
  },
]

const STUDY_FORM_FIELDS = {
  curso: [
    { id: 'name', label: 'Nome do curso', placeholder: 'Ex: Design Ops Lab' },
    { id: 'platform', label: 'Plataforma / instituição', placeholder: 'Reforge, Coursera, Alura...' },
    { id: 'hours', label: 'Carga horária', placeholder: '60h · 5 semanas' },
    { id: 'format', label: 'Formato', type: 'select', options: ['On demand', 'Ao vivo', 'Híbrido'] },
    { id: 'url', label: 'Link de acesso', placeholder: 'https://...' },
    { id: 'notes', label: 'Notas iniciais', type: 'textarea', placeholder: 'Objetivos, certificação, tags...' },
  ],
  faculdade: [
    { id: 'semesters', label: 'Semestres ativos', placeholder: '2026.1 / 2026.2' },
    { id: 'subjects', label: 'Matérias por semestre', placeholder: 'Ex: Engenharia, Produto, Dados' },
    { id: 'topics', label: 'Assuntos por matéria', placeholder: 'Arquitetura, Estratégia, KPIs' },
    { id: 'modules', label: 'Módulos padrão', placeholder: 'Aulas, laboratórios, leituras' },
    { id: 'rituals', label: 'Rituais e checkpoints', placeholder: 'Revisão quinzenal, provas, labs' },
    { id: 'notes', label: 'Notas estratégicas', type: 'textarea', placeholder: 'Critérios de aprovação, integrações...' },
  ],
  interesse: [
    { id: 'collection', label: 'Título da coleção', placeholder: 'Pesquisa · AI copilots' },
    { id: 'source', label: 'Origem', placeholder: 'Readwise, Notion, YouTube...' },
    { id: 'materials', label: 'Materiais principais', placeholder: 'Livros, papers, playlists' },
    { id: 'cadence', label: 'Ritmo de revisão', placeholder: 'Revisão semanal / mensal' },
    { id: 'outcome', label: 'Resultado esperado', placeholder: 'Preparar workshop, nova skill...' },
    { id: 'notes', label: 'Observações', type: 'textarea', placeholder: 'Links, prompts, insights GTD' },
  ],
}

function CreateStudyModal({ isOpen, onClose }) {
  const [step, setStep] = useState(1)
  const [selectedType, setSelectedType] = useState(null)
  const [formData, setFormData] = useState({})

  if (!isOpen) return null

  const fields = selectedType ? STUDY_FORM_FIELDS[selectedType] : []

  const handleInputChange = (fieldId, value) => {
    setFormData((prev) => ({ ...prev, [fieldId]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    onClose()
  }

  return (
    <div className="studyModal__backdrop">
      <div className="studyModal" role="dialog" aria-modal="true">
        <header className="studyModal__header">
          <div>
            <p>Modal de novos estudos</p>
            <h3>{step === 1 ? 'Escolha o fluxo ideal' : 'Configure os campos principais'}</h3>
          </div>
          <button type="button" className="ghost" onClick={onClose}>
            Fechar
          </button>
        </header>

        <div className="studyModal__steps">
          {[1, 2].map((modalStep) => (
            <div key={modalStep} className={step === modalStep ? 'modalStep modalStep--active' : 'modalStep'}>
              <span>{String(modalStep).padStart(2, '0')}</span>
              <p>{modalStep === 1 ? 'Tipo e objetivo' : 'Campos dinâmicos'}</p>
            </div>
          ))}
        </div>

        {step === 1 ? (
          <div className="studyModal__types">
            {Object.values(STUDY_TYPES).map((type) => {
              const isActive = selectedType === type.id
              return (
                <button
                  key={type.id}
                  type="button"
                  className={isActive ? 'modalType modalType--active' : 'modalType'}
                  onClick={() => setSelectedType(type.id)}
                >
                  <span>{type.badge}</span>
                  <h4>{type.label}</h4>
                  <p>{type.description}</p>
                  <small>{type.focus}</small>
                </button>
              )
            })}
          </div>
        ) : (
          <form className="studyModal__form" onSubmit={handleSubmit}>
            <div className="studyModal__formHeader">
              <div>
                <p>Seleção</p>
                <strong>{STUDY_TYPES[selectedType].label}</strong>
              </div>
              <button type="button" className="ghost" onClick={() => setStep(1)}>
                Voltar para tipo
              </button>
            </div>
            <div className="studyModal__fields">
              {fields.map((field) => {
                const commonProps = {
                  id: field.id,
                  value: formData[field.id] || '',
                  onChange: (event) => handleInputChange(field.id, event.target.value),
                  placeholder: field.placeholder,
                }

                return (
                  <label key={field.id}>
                    <span>{field.label}</span>
                    {field.type === 'textarea' ? (
                      <textarea {...commonProps} rows={3} />
                    ) : field.type === 'select' ? (
                      <select
                        value={formData[field.id] || ''}
                        onChange={(event) => handleInputChange(field.id, event.target.value)}
                      >
                        <option value="">Selecione</option>
                        {field.options?.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input type="text" {...commonProps} />
                    )}
                  </label>
                )
              })}
            </div>
            <footer>
              <button type="button" className="ghost" onClick={() => setStep(1)}>
                Voltar
              </button>
              <button type="submit">Salvar blueprint</button>
            </footer>
          </form>
        )}

        {step === 1 ? (
          <footer className="studyModal__footer">
            <p>Selecione um fluxo para liberar os campos dinâmicos.</p>
            <button type="button" onClick={() => selectedType && setStep(2)} disabled={!selectedType}>
              Prosseguir
            </button>
          </footer>
        ) : null}
      </div>
    </div>
  )
}

export default function Studies({ user, onNavigate }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const highlightCourse = STUDY_LIBRARY_SHELVES[0].cards[0]

  return (
    <div className="studiesPage">
      <TopNav user={user} active="Estudos" onNavigate={onNavigate} />

      <section className="studiesHero ui-card">
        <div className="studiesHero__content">
          <p className="studiesHero__eyebrow">Centro de Estudos · Netflix mode</p>
          <h1>Estudos em prateleiras inteligentes</h1>
          <p>
            Organize cursos, faculdades e interesses como uma biblioteca viva. Cada cartão abre o modal certo, já com
            módulos, aulas, notas e integrações GTD.
          </p>
          <div className="studiesHero__actions">
            <button type="button" onClick={() => setIsModalOpen(true)}>Novo estudo</button>
            <button type="button" className="ghost">Ver calendário semanal</button>
          </div>
          <ul className="studiesHero__stats">
            {STUDY_STATS.map((stat) => (
              <li key={stat.label}>
                <strong>{stat.value}</strong>
                <span>{stat.label}</span>
                <small>{stat.detail}</small>
              </li>
            ))}
          </ul>
          <div className="studiesHero__tags">
            {STUDY_TAGS.map((tag) => (
              <span key={tag}>{tag}</span>
            ))}
          </div>
        </div>
        <article className="studiesHero__highlight" style={{ backgroundImage: highlightCourse.cover }}>
          <div>
            <p>{highlightCourse.type}</p>
            <h3>{highlightCourse.title}</h3>
            <span>{highlightCourse.nextAction}</span>
          </div>
          <div>
            <p>{highlightCourse.status}</p>
            <strong>{highlightCourse.progress}</strong>
          </div>
        </article>
      </section>

      <section className="studiesShelves">
        {STUDY_LIBRARY_SHELVES.map((shelf) => (
          <article key={shelf.id} className="studyShelf ui-card">
            <header>
              <div>
                <p>{shelf.eyebrow}</p>
                <h2>{shelf.title}</h2>
                <span>{shelf.description}</span>
              </div>
              <button type="button" className="ghost">
                {shelf.actionLabel}
              </button>
            </header>
            <div className="studyShelf__scroller">
              {shelf.cards.map((card) => (
                <div key={card.id} className="studyCard" style={{ backgroundImage: card.cover }}>
                  <div className="studyCard__meta">
                    <span>{card.type}</span>
                    <strong>{card.status}</strong>
                  </div>
                  <h3>{card.title}</h3>
                  <p>{card.focus}</p>
                  <div className="studyCard__footer">
                    <span>{card.platform}</span>
                    <button type="button">{card.nextAction}</button>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </section>

      <section className="buildersGrid">
        <div className="courseBuilderStack">
          <article className="courseBuilder ui-card">
            <header>
              <div>
                <p>Cursos · Blueprint vivo</p>
                <h2>Módulos → aulas → notas</h2>
                <span>
                  Cada módulo já abre espaço para cadência, notas e importação em massa, tudo sincronizado com o modal de
                  criação.
                </span>
              </div>
              <button type="button" className="ghost">Adicionar módulo</button>
            </header>
            <div className="courseBuilder__modules">
              {COURSE_MODULES.map((module) => (
                <article key={module.id}>
                  <header>
                    <div>
                      <p>{module.focus}</p>
                      <h3>{module.title}</h3>
                    </div>
                    <span>{module.progress}</span>
                  </header>
                  <p>{module.cadence}</p>
                  <ul>
                    {module.lessons.map((lesson) => (
                      <li key={lesson.title}>
                        <div>
                          <strong>{lesson.title}</strong>
                          <small>{lesson.type}</small>
                        </div>
                        <div className="lessonBadges">
                          <span className="status">{lesson.status}</span>
                          {lesson.notes.map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </article>

          <article className="lessonKit ui-card">
            <header>
              <div>
                <p>Kit de profundidade</p>
                <h2>Notas, destaques e resumo GTD</h2>
              </div>
              <button type="button" className="ghost">Abrir workspace</button>
            </header>
            <div className="lessonKit__grid">
              {LESSON_NOTE_KIT.map((block) => (
                <div key={block.id}>
                  <span>{block.badge}</span>
                  <h3>{block.title}</h3>
                  <p>{block.description}</p>
                  {block.bullets ? (
                    <ul>
                      {block.bullets.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  ) : null}
                  {block.tags ? (
                    <div className="lessonKit__tags">
                      {block.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  ) : null}
                  {block.checklist ? (
                    <div className="lessonKit__checklist">
                      {block.checklist.map((item) => (
                        <label key={item}>
                          <input type="checkbox" />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          </article>
        </div>

        <article className="facultyBuilder ui-card">
          <header>
            <div>
              <p>Faculdade · Blueprint completo</p>
              <h2>Semestres → matérias → assuntos</h2>
              <span>Importe tudo do modal e navegue semestre a semestre.</span>
            </div>
            <button type="button" className="ghost">Editar semestres</button>
          </header>
          <div className="facultyBuilder__grid">
            {FACULTY_BLUEPRINT.map((semester) => (
              <article key={semester.semester}>
                <header>
                  <div>
                    <p>Semestre</p>
                    <h3>{semester.semester}</h3>
                  </div>
                  <span>{semester.cadence}</span>
                </header>
                <div className="facultyBuilder__subjects">
                  {semester.subjects.map((subject) => (
                    <div key={subject.name}>
                      <div className="facultySubject__head">
                        <strong>{subject.name}</strong>
                        <small>{subject.topics.length} assuntos</small>
                      </div>
                      <ul>
                        {subject.topics.map((topic) => (
                          <li key={topic.name}>
                            <span>{topic.name}</span>
                            <small>{topic.modules} módulos</small>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </article>
      </section>

      <CreateStudyModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  )
}
