import { useTranslation } from '../../hooks/useTranslation'

/**
 * The search action at the end of every vertical's search strip.
 *
 * There were two of these. The home page used the design system
 * (`btn btn-primary btn-lg`) with a magnifier and a translated label; the eleven
 * inner pages used a hand-rolled `.inner-search-cta` — no base class, so its own
 * font size, weight, letter-spacing, shadow and hover, a square-left corner, no
 * icon, and the literal string "SEARCH" that no locale could translate. Both sit
 * in the same structure (a bordered grid strip with the button as the last
 * `auto` column), so the difference was not a response to anything.
 *
 * Twelve call sites is past the point where duplicating markup is cheaper than a
 * component, and the label has to come from the locale table in one place or it
 * drifts again.
 */
export default function SearchButton ({ onClick, type = 'button', className = '', label }) {
  const { t } = useTranslation()

  return (
    <button
      type={type}
      onClick={onClick}
      className={`btn btn-primary btn-lg rounded-full px-12 h-full ${className}`.trim()}
    >
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
        <path d="M20 20l-3.5-3.5" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
      {label ?? t('search')}
    </button>
  )
}
