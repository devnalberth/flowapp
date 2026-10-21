import './SidebarItem.css'

export default function SidebarItem({ label, icon: Icon, active, count, onClick }) {
  return (
    <button
      type="button"
      className={`fa-sidebar-item ${active ? 'is-active' : ''}`}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      title={label}
    >
      <Icon size={20} strokeWidth={1.75} aria-hidden="true" />
      <span className="fa-sidebar-item__label">{label}</span>
      {count > 0 && <span className="fa-sidebar-item__count">{count}</span>}
    </button>
  )
}
