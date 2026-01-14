import './TopNav.css'

const NAV = [
  'Dashboard',
  'Tarefas',
  'Projetos',
  'Metas',
  'Estudos',
  'Hábitos',
  'Financeiro',
  'AI Assistant',
]

const CTA_LABELS = {
  Metas: 'Criar Nova Meta',
  Tarefas: 'Criar Nova Tarefa',
  Projetos: 'Criar Novo Projeto',
  'Hábitos': 'Criar Novo Hábito',
  Financeiro: 'Nova Movimentação',
  Estudos: 'Adicionar Novo Curso',
}

export default function TopNav({ user, active = 'Dashboard', onNavigate }) {
  const quickActionLabel = CTA_LABELS[active]

  return (
    <div className="topNav">
      <div className="topNav__pill ui-card">
        <div className="topNav__brand">
          <div className="topNav__logo" />
          <div className="txt-brand topNav__brandText">FlowApp</div>
        </div>

        <nav className="topNav__nav">
          {NAV.map((label) => {
            const isActive = label === active

            return (
              <button
                key={label}
                type="button"
                aria-current={isActive ? 'page' : undefined}
                className={
                  isActive
                    ? 'topNav__item topNav__item--active txt-pill'
                    : 'topNav__item txt-pill'
                }
                onClick={() => onNavigate?.(label)}
              >
                {label}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="topNav__right">
        {quickActionLabel && (
          <button type="button" className="topNav__quickAction">
            {quickActionLabel}
          </button>
        )}
        <button className="ui-iconBtn" aria-label="Configurações">
          <svg className="topNav__gearIcon" viewBox="0 0 24 24" role="img" aria-hidden="true">
            <path
              d="M12 9.75a2.25 2.25 0 1 1 0 4.5 2.25 2.25 0 0 1 0-4.5Zm8.25 2.25a6.18 6.18 0 0 0-.094-1.062l2.051-1.6a.75.75 0 0 0 .168-.957l-1.945-3.37a.75.75 0 0 0-.908-.328l-2.414.868a7 7 0 0 0-1.842-1.065l-.368-2.54A.75.75 0 0 0 14.126 2h-4.25a.75.75 0 0 0-.742.641l-.368 2.54a7.002 7.002 0 0 0-1.842 1.065l-2.414-.868a.75.75 0 0 0-.908.328L1.657 9.076a.75.75 0 0 0 .168.956l2.051 1.6A6.23 6.23 0 0 0 3.75 12c0 .358.032.717.094 1.062l-2.05 1.6a.75.75 0 0 0-.169.957l1.946 3.37a.75.75 0 0 0 .908.328l2.414-.868c.555.45 1.176.817 1.842 1.065l.368 2.54a.75.75 0 0 0 .742.641h4.25a.75.75 0 0 0 .742-.641l.368-2.54a7.002 7.002 0 0 0 1.842-1.065l2.414.868a.75.75 0 0 0 .908-.328l1.945-3.37a.75.75 0 0 0-.168-.957l-2.051-1.6A6.2 6.2 0 0 0 20.25 12Z"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        <button className="topNav__user ui-card" aria-label="Menu do usuário">
          <div className="topNav__userInner">
            <img className="topNav__avatar" src={user?.avatarUrl} alt="" />
            <div className="topNav__userMeta">
              <div className="topNav__userName">{user?.name}</div>
              <div className="topNav__userEmail">{user?.email}</div>
            </div>
          </div>
          <span className="topNav__chev" />
        </button>
      </div>
    </div>
  )
}
