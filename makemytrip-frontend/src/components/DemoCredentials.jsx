/**
 * Fills a demo account's credentials into a login form.
 *
 * A portfolio site is useless if a recruiter cannot get past the login screen,
 * so the vendor and admin portals advertise a demo account and fill it in on
 * one click.
 *
 * The values come from environment config, never from source. This repository
 * is public: a credential committed here would be published to GitHub and, more
 * importantly, would stay in the git history after any later "fix". Config can
 * be rotated; history cannot.
 *
 * Renders nothing at all when the variables are unset, so a real deployment
 * that never sets them simply has no demo box — there is no way to accidentally
 * ship a live credential by leaving this component mounted.
 */
export default function DemoCredentials ({ email, password, label = 'Demo account', onFill }) {
  if (!email || !password) return null

  return (
    <div
      style={{
        margin: '0 0 18px',
        padding: '12px 14px',
        borderRadius: '10px',
        background: 'rgba(255, 193, 7, 0.10)',
        border: '1px solid rgba(255, 193, 7, 0.45)',
        fontSize: '13px',
        lineHeight: 1.5
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span aria-hidden="true">🔑</span> {label}
      </div>

      <div style={{ opacity: 0.85, fontFamily: 'monospace', fontSize: '12.5px', wordBreak: 'break-all' }}>
        {email}
      </div>
      <div style={{ opacity: 0.85, fontFamily: 'monospace', fontSize: '12.5px', marginBottom: '10px' }}>
        {password}
      </div>

      <button
        type="button"
        onClick={() => onFill(email, password)}
        style={{
          border: 0,
          borderRadius: '7px',
          padding: '8px 14px',
          fontWeight: 700,
          fontSize: '13px',
          cursor: 'pointer',
          background: 'hsl(var(--p, 217 91% 60%))',
          color: '#fff'
        }}
      >
        Fill in these details
      </button>
    </div>
  )
}
