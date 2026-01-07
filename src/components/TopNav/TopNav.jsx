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

export default function TopNav({ user, active = 'Dashboard', onNavigate }) {
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
        <button className="ui-iconBtn" aria-label="Configurações">
          <span className="topNav__gear" />
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
