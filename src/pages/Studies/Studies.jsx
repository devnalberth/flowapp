import TopNav from '../../components/TopNav/TopNav.jsx'

import './Studies.css'

export default function Studies({ user, onNavigate }) {
  return (
    <div className="studiesPage">
      <TopNav user={user} onNavigate={onNavigate} active="Estudos" />

      <section className="studiesPlaceholder ui-card">
        <p className="studiesPlaceholder__eyebrow">Em desenvolvimento</p>
        <h1>Estamos construindo a área de Estudos</h1>
        <p className="studiesPlaceholder__lead">
          Esta seção faz parte do MVP e ainda está em construção. Em breve você poderá cadastrar cursos,
          mapear módulos e acompanhar seus rituais de aprendizado dentro do FlowApp.
        </p>
        <p className="studiesPlaceholder__note">
          Enquanto finalizamos o blueprint, siga utilizando as demais áreas (Metas, Projetos, Hábitos e Financeiro)
          para organizar sua operação.
        </p>
      </section>
    </div>
  )
}
