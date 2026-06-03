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

  // Dynamic colors mapped directly to system HSL variables
  const getThemeStyles = () => {
    switch (toast.type) {
      case 'error':
        return {
          iconBg: 'hsl(var(--er) / 0.15)',
          iconColor: 'hsl(var(--er))',
          titleColor: 'hsl(var(--er))'
        }
      case 'warning':
        return {
          iconBg: 'hsl(var(--wa) / 0.15)',
          iconColor: 'hsl(var(--wa))',
          titleColor: 'hsl(var(--wa))'
        }
      case 'info':
        return {
          iconBg: 'hsl(var(--p) / 0.15)',
          iconColor: 'hsl(var(--p))',
          titleColor: 'hsl(var(--p))'
        }
      case 'success':
      default:
        return {
          iconBg: 'hsl(var(--su) / 0.15)',
          iconColor: 'hsl(var(--su))',
          titleColor: 'hsl(var(--su))'
        }
    }
  }

  // Icons based on toast type
  const renderIcon = () => {
    const { iconBg, iconColor } = getThemeStyles()
    switch (toast.type) {
      case 'error':
        return (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '50%', background: iconBg, color: iconColor }}>
            <svg style={{ width: '22px', height: '22px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
        )
      case 'warning':
        return (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '50%', background: iconBg, color: iconColor }}>
            <svg style={{ width: '22px', height: '22px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        )
      case 'info':
        return (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '50%', background: iconBg, color: iconColor }}>
            <svg style={{ width: '22px', height: '22px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        )
      case 'success':
      default:
        return (
          <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px', height: '44px', borderRadius: '50%', background: iconBg, color: iconColor }}>
            <svg style={{ width: '24px', height: '24px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )
    }
  }

  const themeStyles = getThemeStyles()

  return (
    <div
      style={{
        background: 'hsl(var(--b1))',
        border: '1px solid hsl(var(--b3))',
        borderLeft: `5px solid ${themeStyles.iconColor}`,
        color: 'hsl(var(--bc))',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.15)',
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        position: 'relative',
        width: '100%',
        maxWidth: '480px',
        transform: isMounted ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(12px)',
        opacity: isMounted ? 1 : 0,
        transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        pointerEvents: 'auto'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Icon */}
      {renderIcon()}

      {/* Content */}
      <div style={{ flexGrow: 1, paddingRight: '24px' }}>
        <h3 style={{
          fontSize: '16px',
          fontWeight: '700',
          margin: 0,
          color: 'hsl(var(--bc))',
          letterSpacing: '-0.01em',
          lineHeight: 1.3
        }}>
          {toast.title}
        </h3>
        <p style={{
          fontSize: '13px',
          color: 'hsl(var(--bc) / 0.75)',
          margin: '4px 0 0 0',
          lineHeight: 1.4,
          fontWeight: '500'
        }}>
          {toast.message}
        </p>
      </div>

      {/* Close button */}
      <button
        onClick={handleCloseClick}
        style={{
          position: 'absolute',
          top: '12px',
          right: '12px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
          color: 'hsl(var(--bc) / 0.4)',
          padding: '4px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '50%',
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={e => {
          e.currentTarget.style.color = 'hsl(var(--bc) / 0.8)'
          e.currentTarget.style.background = 'hsl(var(--b2))'
        }}
        onMouseLeave={e => {
          e.currentTarget.style.color = 'hsl(var(--bc) / 0.4)'
          e.currentTarget.style.background = 'transparent'
        }}
        aria-label="Close notification"
      >
        <svg style={{ width: '16px', height: '16px' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
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
