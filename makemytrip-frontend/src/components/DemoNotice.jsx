/**
 * Demonstration-mode disclosure.
 *
 * Everything a visitor can touch is real — the account, the session, the
 * database write, the confirmation email, the PDF, the booking history. What
 * is not real is the travel inventory and the payment settlement, so nobody
 * actually flies and no money moves.
 *
 * Saying so is not a disclaimer for its own sake. Someone can create an
 * account, "pay", and receive a PDF ticket by email; without this they have no
 * way to know that no seat is held with any operator. The `banner` variant goes
 * where that misunderstanding would be most costly — checkout and confirmation
 * — and the `line` variant sits in the footer of every page.
 *
 * Mirrors src/config/demoMode.js on the server, which puts the same statement
 * on the PDFs and emails. Those matter more, because they leave the site.
 */
const NOTICE =
  'This is a production-quality travel booking application. Accounts, ' +
  'authentication, database operations, emails, PDFs and booking workflows are ' +
  'fully functional. Travel inventory and payments run in demonstration mode — ' +
  'no real reservation is created and no seat, room or vehicle is held with any operator.'

const DEMO_MODE = import.meta.env.VITE_DEMO_MODE !== 'false'

export default function DemoNotice ({ variant = 'banner' }) {
  if (!DEMO_MODE) return null

  if (variant === 'line') {
    return (
      <div style={{ fontSize: '12px', lineHeight: 1.6, opacity: 0.7, maxWidth: '760px' }}>
        <strong>Portfolio demonstration.</strong> {NOTICE}
      </div>
    )
  }

  return (
    <div
      role="note"
      style={{
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-start',
        margin: '0 0 20px',
        padding: '14px 16px',
        borderRadius: '10px',
        background: 'hsl(var(--wa) / 0.12)',
        borderLeft: '4px solid hsl(var(--wa))',
        color: 'hsl(var(--bc))',
        fontSize: '13px',
        lineHeight: 1.55
      }}
    >
      <span style={{ fontSize: '18px', lineHeight: 1.2 }} aria-hidden="true">ℹ️</span>
      <span>
        <strong style={{ display: 'block', marginBottom: '2px' }}>
          Portfolio demonstration — no real reservation is created
        </strong>
        <span style={{ opacity: 0.8 }}>{NOTICE}</span>
      </span>
    </div>
  )
}
