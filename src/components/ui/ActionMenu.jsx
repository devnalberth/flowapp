import { cloneElement, useEffect, useId, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import './ActionMenu.css'

export default function ActionMenu({
  trigger,
  items,
  label = 'Ações',
  side = 'auto',
  className = '',
}) {
  const [open, setOpen] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0, visibility: 'hidden' })
  const anchor = useRef(null)
  const menu = useRef(null)
  const menuId = useId()
  const close = (restoreFocus = false) => {
    setOpen(false)
    if (restoreFocus) anchor.current?.querySelector('button')?.focus()
  }
  useLayoutEffect(() => {
    if (!open) return undefined
    const place = () => {
      const rect = anchor.current.getBoundingClientRect()
      const height = menu.current.offsetHeight
      const width = menu.current.offsetWidth
      const above =
        side === 'top' || (side === 'auto' && rect.bottom + height + 6 > window.innerHeight)
      setPosition({
        top: Math.max(8, above ? rect.top - height - 6 : rect.bottom + 6),
        left: Math.max(8, Math.min(rect.right - width, window.innerWidth - width - 8)),
        visibility: 'visible',
      })
    }
    place()
    window.addEventListener('resize', place)
    const click = (event) => {
      if (!menu.current?.contains(event.target) && !anchor.current?.contains(event.target)) close()
    }
    document.addEventListener('pointerdown', click, true)
    return () => {
      window.removeEventListener('resize', place)
      document.removeEventListener('pointerdown', click, true)
    }
  }, [open, side])
  useLayoutEffect(() => {
    if (open && position.visibility === 'visible')
      menu.current?.querySelector('button:not(:disabled)')?.focus()
  }, [open, position.visibility])
  useEffect(() => {
    if (!open) return undefined
    const dismissOnScroll = (event) => {
      if (!menu.current?.contains(event.target)) setOpen(false)
    }
    document.addEventListener('scroll', dismissOnScroll, true)
    return () => document.removeEventListener('scroll', dismissOnScroll, true)
  }, [open])
  const keydown = (event) => {
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      close(true)
      return
    }
    if (event.key === 'Tab') {
      close()
      return
    }
    if (!['ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return
    event.preventDefault()
    const buttons = [...menu.current.querySelectorAll('button:not(:disabled)')]
    const current = buttons.indexOf(document.activeElement)
    const index =
      event.key === 'Home'
        ? 0
        : event.key === 'End'
          ? buttons.length - 1
          : (current + (event.key === 'ArrowDown' ? 1 : -1) + buttons.length) % buttons.length
    buttons[index]?.focus()
  }
  return (
    <>
      <span className="fa-menu-anchor" ref={anchor}>
        {cloneElement(trigger, {
          'aria-haspopup': 'menu',
          'aria-expanded': open,
          'aria-controls': open ? menuId : undefined,
          onClick: (event) => {
            trigger.props.onClick?.(event)
            setOpen((value) => !value)
          },
          onKeyDown: (event) => {
            trigger.props.onKeyDown?.(event)
            if (event.key === 'ArrowDown') {
              event.preventDefault()
              setOpen(true)
            }
          },
        })}
      </span>
      {open &&
        createPortal(
          <div
            ref={menu}
            id={menuId}
            role="menu"
            aria-label={label}
            className={`fa-action-menu ${className}`}
            style={position}
            onKeyDown={keydown}
          >
            {items.map((item, index) =>
              item.separator ? (
                <div
                  key={`separator-${index}`}
                  className="fa-action-menu__separator"
                  role="separator"
                />
              ) : (
                <button
                  key={item.id || item.label}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled}
                  className={`fa-action-menu__item ${item.danger ? 'is-danger' : ''}`}
                  onClick={() => {
                    close(true)
                    item.onClick?.()
                  }}
                >
                  {item.icon && <item.icon size={16} strokeWidth={1.75} aria-hidden="true" />}
                  <span>{item.label}</span>
                </button>
              )
            )}
          </div>,
          anchor.current?.closest('dialog') || document.body
        )}
    </>
  )
}
