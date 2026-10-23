import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react"
import { MdClose } from "react-icons/md"
import { Button, IconButton } from "./Button.jsx"

// One toast at a time, for meaningful confirmations only (renamed, moved to trash, link copied).
const ToastContext = createContext(() => {})

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timer = useRef()

  const show = useCallback((message, action) => {
    clearTimeout(timer.current)
    setToast({ message, action, key: Date.now() })
    timer.current = setTimeout(() => setToast(null), 5000)
  }, [])

  useEffect(() => () => clearTimeout(timer.current), [])

  return (
    <ToastContext.Provider value={show}>
      {children}
      <div className="toast-region" role="status" aria-live="polite">
        {toast && (
          <div className="toast" key={toast.key}>
            {toast.message}
            {toast.action && (
              <Button variant="link" onClick={() => { toast.action.onClick(); setToast(null) }}>
                {toast.action.label}
              </Button>
            )}
            <IconButton size="sm" label="Dismiss" tooltip={false} onClick={() => setToast(null)}>
              <MdClose />
            </IconButton>
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  return useContext(ToastContext)
}
