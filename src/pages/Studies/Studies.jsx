import { useState } from 'react'
import TopNav from '../../components/TopNav/TopNav.jsx'

import './Studies.css'

const STUDY_TYPES = {
  curso: {
    id: 'curso',
    label: 'Curso profissional',
    badge: 'Imersão guiada',
    description: 'Ideal para certificações, bootcamps e cursos on demand.',
    steps: [
      { title: 'Cadastrar curso', detail: 'Defina nome, plataforma, carga horária e certificação.' },
      { title: 'Preencher informações', detail: 'Detalhe objetivos, pré-requisitos e materiais.' },
      { title: 'Cadastrar módulos', detail: 'Quebre o curso em módulos temáticos.' },
      { title: 'Cadastrar aulas', detail: 'Decida se adiciona individualmente ou importa todas por módulo.' },
      { title: 'Anotações e resumo', detail: 'Ative notas, destaques e resumos GTD em cada aula.' },
    ],
    focus: 'Curso com módulos e aulas',
  },
  faculdade: {
    id: 'faculdade',
    label: 'Faculdade / Graduação',
    badge: 'Fluxo acadêmico',
    description: 'Fluxo completo com semestres, matérias, assuntos e módulos.',
    steps: [
      { title: 'Configurar semestres', detail: 'Escolha períodos (ex: 2026.1, 2026.2).' },
      { title: 'Listar matérias', detail: 'Cadastre as cadeiras de cada semestre.' },
      { title: 'Mapear assuntos', detail: 'Separe os grandes tópicos por matéria.' },
      { title: 'Organizar módulos', detail: 'Cada assunto pode ter aulas, labs e leituras.' },
      { title: 'Notas e ações', detail: 'Ative a central de estudos para cada assunto.' },
    ],
    focus: 'Semestres → matérias → assuntos → módulos',
  },
}

const COURSE_FIELDS = [
  { label: 'Nome do curso', value: 'Flow Systems Mastery', helper: 'Como aparecerá no certificado.' },
  { label: 'Plataforma / Instituição', value: 'Flow University · Live + On demand', helper: 'Udemy, Alura, Coursera, etc.' },
  { label: 'Carga horária total', value: '60 horas · 5 semanas intensivas', helper: 'Use horas ou módulos.' },
  { label: 'Formato', value: 'Vídeos gravados + mentorias síncronas', helper: 'On demand, live, híbrido.' },
  { label: 'Certificação', value: 'Emitir certificado ao concluir 85% das aulas', helper: 'Defina critérios.' },
  { label: 'Tags e trilhas', value: 'GTD, FlowOS, Produtividade', helper: 'Ajuda a filtrar e conectar com metas.' },
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

const FACULTY_MODAL_FIELDS = [
  { icon: '🗓️', label: 'Semestres ativos', value: '2026.1 · 2026.2', detail: 'Defina duração e férias.' },
  { icon: '📚', label: 'Matérias por semestre', value: '5 matérias', detail: 'Engenharia, Produto, Dados, etc.' },
  { icon: '🧠', label: 'Assuntos por matéria', value: '3 assuntos cada', detail: 'Ex: Arquitetura, Estratégia.' },
  { icon: '🧩', label: 'Módulos por assunto', value: '2 módulos padrão', detail: 'Aulas, laboratórios, leituras.' },
]

export default function Studies({ user, onNavigate }) {
  const [studyMode, setStudyMode] = useState('curso')
  const activeType = STUDY_TYPES[studyMode]

  return (
    <div className="studiesPage">
      <TopNav user={user} active="Estudos" onNavigate={onNavigate} />

      <header className="studiesHero ui-card">
        <div>
          <p className="studiesHero__eyebrow">Central de estudos detalhada</p>
          <h1>Orquestre cursos, módulos e faculdades no mesmo fluxo</h1>
          <p>
            Respeitamos o passo a passo: cadastrar curso, preencher dados, mapear módulos e aulas. Quando for faculdade,
            simplificamos a configuração no modal de semestres para seguir direto para o fluxo escolhido.
          </p>
        </div>
        <div className="studiesHero__panel">
          <div>
            <span>Trilhas ativas</span>
            <strong>05</strong>
            <small>3 cursos · 2 faculdades</small>
          </div>
          <div>
            <span>Aulas registradas</span>
            <strong>124</strong>
            <small>Com notas, destaques e resumos</small>
          </div>
          <button type="button">Nova trilha de estudos</button>
        </div>
      </header>

      <section className="studiesConfigurator ui-card">
        <div className="studiesConfigurator__intro">
          <div>
            <p className="studiesConfigurator__eyebrow">Escolha o fluxo</p>
            <h2>Curso ou faculdade? Configure no modal e prossiga.</h2>
            <p>
              Primeiro escolhemos o tipo. Se for curso, já abrimos campos de cadastro e módulos. Se for faculdade, o modal
              concentra semestres, matérias, assuntos e módulos para manter o processo enxuto.
            </p>
          </div>
          <span>{activeType.focus}</span>
        </div>

        <div className="studiesConfigurator__options">
          {Object.values(STUDY_TYPES).map((type) => {
            const isActive = type.id === studyMode
            return (
              <button
                key={type.id}
                type="button"
                className={isActive ? 'studyType studyType--active' : 'studyType'}
                onClick={() => setStudyMode(type.id)}
              >
                <span>{type.badge}</span>
                <h3>{type.label}</h3>
                <p>{type.description}</p>
              </button>
            )
          })}
        </div>

        <div className="studiesConfigurator__timeline">
          {activeType.steps.map((step, index) => (
            <div key={step.title} className="studyStep">
              <span>{String(index + 1).padStart(2, '0')}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="studiesConfigurator__modal">
          <div className="modalPreview">
            <div className="modalPreview__header">
              <p>Configuração do modal</p>
              <span>{activeType.label}</span>
            </div>
            <div className="modalPreview__fields">
              {(studyMode === 'faculdade' ? FACULTY_MODAL_FIELDS : COURSE_FIELDS.slice(0, 4)).map((field) => (
                <article key={field.label}>
                  {field.icon ? <span className="modalPreview__icon">{field.icon}</span> : null}
                  <div>
                    <p>{field.label}</p>
                    <strong>{field.value}</strong>
                    <small>{field.detail ?? field.helper}</small>
                  </div>
                </article>
              ))}
            </div>
            <button type="button">Prosseguir com {activeType.id === 'curso' ? 'curso' : 'faculdade'}</button>
          </div>
          <div className="modalPreview__note">
            <p>
              Assim que confirma no modal, carregamos automaticamente as próximas etapas para o fluxo escolhido. Nada de
              telas extras: você parte direto para módulos/aulas ou para o blueprint acadêmico de semestres.
            </p>
          </div>
        </div>
      </section>

      {studyMode === 'curso' ? (
        <>
          <section className="courseDetails ui-card">
            <header>
              <div>
                <p>Cadastrar curso · Etapa 1</p>
                <h2>Preencha as informações essenciais do curso</h2>
                <p>Nome, plataforma, carga horária e formatação já ficam salvos e versionados.</p>
              </div>
              <div className="courseDetails__actions">
                <button type="button" className="ghost">Salvar rascunho</button>
                <button type="button">Ir para módulos</button>
              </div>
            </header>
            <div className="courseDetails__fields">
              {COURSE_FIELDS.map((field) => (
                <article key={field.label}>
                  <p>{field.label}</p>
                  <strong>{field.value}</strong>
                  <span>{field.helper}</span>
                </article>
              ))}
            </div>
          </section>

          <section className="courseModules ui-card">
            <header>
              <div>
                <p>Módulos do curso · Etapa 2</p>
                <h2>Defina módulos e organize as aulas</h2>
                <p>
                  Cadastre módulos e escolha se adiciona uma aula por vez ou importa todas do módulo. Cada aula já abre
                  espaço para notas, destaques e resumo GTD.
                </p>
              </div>
              <div className="courseModules__actions">
                <button type="button" className="ghost">Adicionar aula</button>
                <button type="button">Cadastrar todas do módulo</button>
                <button type="button" className="ghost">Importar planilha</button>
              </div>
            </header>

            <div className="courseModules__grid">
              {COURSE_MODULES.map((module) => (
                <article key={module.id} className="moduleCard">
                  <header>
                    <div>
                      <p>{module.focus}</p>
                      <h3>{module.title}</h3>
                    </div>
                    <span>{module.progress}</span>
                  </header>
                  <p className="moduleCard__cadence">{module.cadence}</p>
                  <ul>
                    {module.lessons.map((lesson) => (
                      <li key={lesson.title}>
                        <div>
                          <strong>{lesson.title}</strong>
                          <span>{lesson.type}</span>
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
                  <footer>
                    <button type="button" className="ghost">Adicionar aula</button>
                    <button type="button">Importar todas</button>
                  </footer>
                </article>
              ))}
            </div>
          </section>

          <section className="lessonNotebook ui-card">
            <header>
              <div>
                <p>Aulas · Etapa 3</p>
                <h2>Anote, destaque e faça resumos da aula</h2>
                <p>Funciona tanto para registrar aula a aula quanto para consolidar todas de um módulo.</p>
              </div>
              <div className="lessonNotebook__filters">
                <button type="button" className="ghost">Aula individual</button>
                <button type="button">Todas do módulo</button>
              </div>
            </header>

            <div className="lessonNotebook__grid">
              {LESSON_NOTE_KIT.map((block) => (
                <article key={block.id}>
                  <span className="lessonNotebook__badge">{block.badge}</span>
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
                    <div className="lessonNotebook__tags">
                      {block.tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </div>
                  ) : null}
                  {block.checklist ? (
                    <div className="lessonNotebook__checklist">
                      {block.checklist.map((item) => (
                        <label key={item}>
                          <input type="checkbox" />
                          <span>{item}</span>
                        </label>
                      ))}
                    </div>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
        </>
      ) : (
        <section className="facultyBlueprint ui-card">
          <header>
            <div>
              <p>Faculdade · Blueprint completo</p>
              <h2>Semestres, matérias, assuntos e módulos organizados</h2>
              <p>
                Após configurar no modal, trazemos o semestre escolhido com matérias, assuntos e módulos encadeados. Cada
                assunto pode abrir a mesma central de notas, destaques e resumos.
              </p>
            </div>
            <button type="button">Editar configuração</button>
          </header>

          <div className="facultyBlueprint__grid">
            {FACULTY_BLUEPRINT.map((semester) => (
              <article key={semester.semester} className="facultyCard">
                <header>
                  <div>
                    <p>Semestre</p>
                    <h3>{semester.semester}</h3>
                  </div>
                  <span>{semester.cadence}</span>
                </header>
                <div className="facultySubjects">
                  {semester.subjects.map((subject) => (
                    <div key={subject.name} className="facultySubject">
                      <div className="facultySubject__head">
                        <strong>{subject.name}</strong>
                        <span>{subject.topics.length} assuntos</span>
                      </div>
                      <ul>
                        {subject.topics.map((topic) => (
                          <li key={topic.name}>
                            <p>{topic.name}</p>
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
        </section>
      )}
    </div>
  )
}
