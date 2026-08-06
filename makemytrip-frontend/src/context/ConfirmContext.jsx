import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ConfirmContext = createContext(null)

/**
 * Replaces window.confirm and window.prompt.
 *
 * Twelve destructive admin and vendor actions asked for confirmation with the
 * browser's own dialogs. Two problems with that: they are unstyleable, so a
 * "Delete this flight?" looked like a browser warning rather than part of the
 * product; and window.prompt was collecting a rejection reason that the customer
 * or applicant then reads, with no validation beyond a trim, in a box that some
 * browsers refuse to show at all.
 *
 * `confirm()` returns a promise so the call sites keep their existing shape —
 *   if (!(await confirm({...}))) return
 * rather than being turned inside out into callbacks. With `requireReason` it
 * resolves to the entered text, so it covers the prompt cases too.
 */
export function ConfirmProvider ({ children }) {
  const [dialog, setDialog] = useState(null)
  const [reason, setReason] = useState('')
  const [touched, setTouched] = useState(false)
  const resolver = useRef(null)

  const confirm = useCallback((options) => {
    setReason('')
    setTouched(false)
    setDialog(options)
    return new Promise((resolve) => { resolver.current = resolve })
  }, [])

  const settle = (value) => {
    setDialog(null)
    resolver.current?.(value)
    resolver.current = null
  }

  const onConfirm = () => {
    if (dialog?.requireReason) {
      if (!reason.trim()) { setTouched(true); return }
      settle({ confirmed: true, reason: reason.trim() })
      return
    }
    settle(true)
  }

  const destructive = dialog?.tone === 'danger'

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}

      {dialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={dialog.title || 'Confirm'}
          onClick={(e) => { if (e.target === e.currentTarget) settle(false) }}
          onKeyDown={(e) => { if (e.key === 'Escape') settle(false) }}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.5)',
            display: 'grid', placeItems: 'center', padding: '24px'
          }}
        >
          <div
            style={{
              background: 'hsl(var(--b1))', color: 'hsl(var(--bc))',
              borderRadius: '14px', padding: '24px',
              width: 'min(460px, 100%)',
              boxShadow: '0 20px 48px rgba(0,0,0,0.25)',
              fontFamily: "'Space Grotesk', sans-serif"
            }}
          >
            <h2 style={{ margin: '0 0 8px', fontSize: '19px', fontWeight: 800 }}>
              {dialog.title || 'Are you sure?'}
            </h2>

            {dialog.message && (
              <p style={{ margin: '0 0 16px', lineHeight: 1.6, opacity: 0.8, fontSize: '14px' }}>
                {dialog.message}
              </p>
            )}

            {dialog.requireReason && (
              <>
                <textarea
                  autoFocus
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={dialog.reasonPlaceholder || 'Give a reason…'}
                  rows={3}
                  style={{
                    width: '100%', padding: '10px 12px', marginBottom: '4px',
                    borderRadius: '8px', resize: 'vertical',
                    border: `1px solid hsl(var(--${touched && !reason.trim() ? 'er' : 'b3'}))`,
                    background: 'hsl(var(--b1))', color: 'hsl(var(--bc))',
                    fontFamily: 'inherit', fontSize: '14px'
                  }}
                />
                <div style={{ minHeight: '18px', marginBottom: '10px', fontSize: '12px', color: 'hsl(var(--er))' }}>
                  {touched && !reason.trim() ? 'A reason is required.' : ''}
                </div>
              </>
            )}

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={() => settle(false)}>
                {dialog.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                className={`btn ${destructive ? 'btn-error' : 'btn-primary'}`}
                onClick={onConfirm}
                autoFocus={!dialog.requireReason}
              >
                {dialog.confirmLabel || 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  )
}

export function useConfirm () {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>')
  return ctx
}
