import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

const ShellContext = createContext(null)
export function useShell() {
  return useContext(ShellContext)
}

export function ShellProvider({ children }) {
  const [actions, setActions] = useState(null)
  const [accountTab, setAccountTab] = useState(null)
  const [providerRevision, setProviderRevision] = useState(0)
  const refreshProvider = useCallback(() => setProviderRevision((value) => value + 1), [])
  const value = useMemo(
    () => ({ actions, setActions, accountTab, setAccountTab, providerRevision, refreshProvider }),
    [actions, accountTab, providerRevision, refreshProvider]
  )
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>
}

// Pages retain their own modals and business handlers. Only UI callbacks register here.
export function usePageActions(config) {
  const shell = useShell()
  const latest = useRef(config)
  latest.current = config
  const setActions = shell?.setActions
  const signature = JSON.stringify([
    config?.label,
    config?.title,
    config?.disabled,
    config?.options?.map((item) => [item.label, item.disabled]),
  ])
  useLayoutEffect(() => {
    if (!setActions || !latest.current) return undefined
    const current = latest.current
    setActions({
      ...current,
      onClick: () => latest.current?.onClick?.(),
      options: current.options?.map((item, index) => ({
        ...item,
        onClick: () => latest.current?.options?.[index]?.onClick?.(),
      })),
    })
    return () => setActions(null)
  }, [setActions, signature])
}
