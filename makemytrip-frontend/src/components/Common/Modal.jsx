import { useEffect, useRef } from 'react'
import './Modal.css'

/**
 * A small confirm/alert dialog.
 *
 * The CSS is imported here rather than left to the page, because the version
 * this replaces was styled from FlightResults.css and BusResults.css — so the
 * hotel results page rendered the same markup with no styles at all and showed
 * an invisible dialog at the bottom of the document. Importing the component
 * now brings its appearance with it.
 *
 * Behaviour a dialog is expected to have, and the old markup did not:
 *   - Escape closes it
 *   - clicking the backdrop closes it
 *   - the primary action takes focus on open, so Enter confirms
 *   - focus returns to whatever was focused before it opened
 *   - the page behind cannot scroll while it is up
 */
export default function Modal ({
  open,
  title,
  message,
  icon = '⚠️',
  tone = 'warning',
  confirmLabel = 'Continue',
  cancelLabel = 'Cancel',
  onConfirm,
  onClose
}) {
  const confirmRef = useRef(null)
  const previouslyFocused = useRef(null)

  useEffect(() => {
    if (!open) return

    previouslyFocused.current = document.activeElement
    confirmRef.current?.focus()

    // A dialog that lets the page scroll behind it feels broken on mobile.
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    document.addEventListener('keydown', onKeyDown)

    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      // Returning focus matters for keyboard and screen-reader users, who would
      // otherwise be dropped back at the top of the document.
      previouslyFocused.current?.focus?.()
    }
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="mmt-modal-backdrop"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="mmt-modal-card"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="mmt-modal-title"
        aria-describedby="mmt-modal-message"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`mmt-modal-icon ${tone}`} aria-hidden="true">{icon}</div>

        <h3 className="mmt-modal-title" id="mmt-modal-title">{title}</h3>
        <p className="mmt-modal-message" id="mmt-modal-message">{message}</p>

        <div className="mmt-modal-actions">
          {onClose && (
            <button type="button" className="mmt-modal-btn secondary" onClick={onClose}>
              {cancelLabel}
            </button>
          )}
          <button
            type="button"
            ref={confirmRef}
            className="mmt-modal-btn primary"
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
