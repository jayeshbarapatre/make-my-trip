import { createContext, useContext, useState, useCallback } from 'react'
import ToastContainer from '../components/Common/Toast'

const ToastContext = createContext(null)

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback(({ type = 'success', title = '', message = '', duration = 3500, isModal = true }) => {
    const id = Math.random().toString(36).substring(2, 9)
    setToasts((prev) => [...prev, { id, type, title, message, duration, isModal }])
    return id;
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const success = useCallback((message, title = 'Congratulations', options = {}) => {
    return showToast({ type: 'success', title, message, ...options })
  }, [showToast])

  const error = useCallback((message, title = 'Error', options = {}) => {
    return showToast({ type: 'error', title, message, ...options })
  }, [showToast])

  const warning = useCallback((message, title = 'Warning', options = {}) => {
    return showToast({ type: 'warning', title, message, ...options })
  }, [showToast])

  const info = useCallback((message, title = 'Info', options = {}) => {
    return showToast({ type: 'info', title, message, ...options })
  }, [showToast])

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast, success, error, warning, info }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

export function useToastContext() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToastContext must be used within a ToastProvider')
  }
  return context
}
