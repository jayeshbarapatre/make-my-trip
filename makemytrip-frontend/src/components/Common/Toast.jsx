import { useEffect, useState } from 'react'

function ToastItem({ toast, onClose }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Trigger entry animation
    const frame = requestAnimationFrame(() => setIsMounted(true))
    
    // Set auto-close timer
    const timer = setTimeout(() => {
      setIsMounted(false)
      // Wait for exit animation to complete before removing
      const closeTimer = setTimeout(onClose, 300)
      return () => clearTimeout(closeTimer)
    }, toast.duration)

    return () => {
      cancelAnimationFrame(frame)
      clearTimeout(timer)
    }
  }, [toast.duration, onClose])

  const handleCloseClick = () => {
    setIsMounted(false)
    setTimeout(onClose, 300)
  }

  // Icons based on toast type
  const renderIcon = () => {
    switch (toast.type) {
      case 'error':
        return (
          <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      case 'warning':
        return (
          <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-amber-100 text-amber-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        )
      case 'info':
        return (
          <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'success':
      default:
        return (
          <div className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-full bg-[#24a353] text-white">
            <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
    }
  }

  // Colors based on type
  const getTitleColor = () => {
    switch (toast.type) {
      case 'error': return 'text-red-600'
      case 'warning': return 'text-amber-600'
      case 'info': return 'text-blue-600'
      case 'success':
      default: return 'text-[#24a353]'
    }
  }

  return (
    <div
      className={`relative w-full max-w-lg bg-white rounded-xl shadow-2xl p-6 md:p-8 flex items-center gap-5 md:gap-6 border border-gray-100 transform transition-all duration-300 pointer-events-auto ${
        isMounted ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Icon */}
      {renderIcon()}

      {/* Content */}
      <div className="flex-grow pr-6">
        <h3 className={`text-xl font-bold tracking-tight ${getTitleColor()}`}>
          {toast.title}
        </h3>
        <p className="text-sm md:text-base text-gray-600 mt-1 font-medium leading-relaxed">
          {toast.message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={handleCloseClick}
        className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1.5 rounded-full hover:bg-gray-50 focus:outline-none"
        aria-label="Close notification"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export default function ToastContainer({ toasts, removeToast }) {
  const activeModalToast = toasts.find((t) => t.isModal)
  const [showBackdrop, setShowBackdrop] = useState(false)

  useEffect(() => {
    if (activeModalToast) {
      setShowBackdrop(true)
    } else {
      setShowBackdrop(false)
    }
  }, [activeModalToast])

  if (toasts.length === 0) return null

  return (
    <div className="fixed inset-0 z-[999999] flex flex-col items-center justify-center p-4 pointer-events-none">
      {/* Backdrop overlay */}
      <div
        className={`fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300 pointer-events-auto ${
          showBackdrop ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => {
          if (activeModalToast) {
            removeToast(activeModalToast.id)
          }
        }}
      />

      {/* Toast Card Stack */}
      <div className="relative z-10 w-full flex flex-col items-center justify-center gap-4">
        {toasts.map((toast) => (
          <ToastItem
            key={toast.id}
            toast={toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </div>
  )
}
