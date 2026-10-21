import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Toast from './Toast.jsx'

const ToastContext = createContext(null)
export function useToast() {
  return useContext(ToastContext)
}

function TimedToast({ toast, dismiss }) {
  const timer = useRef(null)
  const start = useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(
      () => dismiss(toast.id),
      toast.duration ?? (toast.onAction ? 6000 : 5000)
    )
  }, [toast, dismiss])
  useEffect(() => {
    start()
    return () => clearTimeout(timer.current)
  }, [start])
  return (
    <Toast
      {...toast}
      onClose={() => dismiss(toast.id)}
      onAction={
        toast.onAction
          ? () => {
              toast.onAction()
              dismiss(toast.id)
            }
          : undefined
      }
      onMouseEnter={() => clearTimeout(timer.current)}
      onMouseLeave={start}
      onFocusCapture={() => clearTimeout(timer.current)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) start()
      }}
    />
  )
}
export default function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const dismiss = useCallback(
    (id) => setToasts((current) => current.filter((item) => item.id !== id)),
    []
  )
  const notify = useCallback((toast) => {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { ...toast, id }])
    return id
  }, [])
  return (
    <ToastContext.Provider value={notify}>
      {children}
      {createPortal(
        <div className="fa-toast-stack" aria-label="Avisos">
          {toasts.map((toast) => (
            <TimedToast key={toast.id} toast={toast} dismiss={dismiss} />
          ))}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  )
}
