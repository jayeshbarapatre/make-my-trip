import { useTheme } from '../hooks/useTheme'

/**
 * VARIANT 1: Dropdown Menu (RECOMMENDED)
 * Best for: Limited space, header/navbar
 */
export function ThemeSwitcherDropdown() {
  const { theme, setTheme, themes } = useTheme()

  return (
    <div className="dropdown dropdown-end">
      <button
        tabIndex={0}
        className="btn btn-circle btn-ghost"
        title="Switch theme"
        aria-label="Toggle theme"
      >
        🎨
      </button>
      <ul
        tabIndex={0}
        className="dropdown-content z-50 menu p-2 shadow bg-base-100 rounded-box w-52"
      >
        <li className="menu-title"><span>Theme</span></li>
        {themes.map((t) => (
          <li key={t}>
            <a
              onClick={() => setTheme(t)}
              className={theme === t ? 'active' : ''}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {theme === t && <span>✓</span>}
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

/**
 * VARIANT 2: Button Group (For Settings Page)
 * Best for: Settings, full visibility, multiple selections
 */
export function ThemeSwitcherButtons() {
  const { theme, setTheme, themes } = useTheme()

  return (
    <div className="flex flex-wrap gap-2">
      {themes.map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className={`btn btn-sm ${
            theme === t ? 'btn-active' : 'btn-ghost'
          }`}
        >
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      ))}
    </div>
  )
}

/**
 * VARIANT 3: Select Input
 * Best for: Mobile, compact form
 */
export function ThemeSwitcherSelect() {
  const { theme, setTheme, themes } = useTheme()

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value)}
      className="select select-bordered select-sm"
      aria-label="Select theme"
    >
      {themes.map((t) => (
        <option key={t} value={t}>
          {t.charAt(0).toUpperCase() + t.slice(1)} Theme
        </option>
      ))}
    </select>
  )
}

/**
 * VARIANT 4: DaisyUI Official - Radio Buttons
 * Best for: Settings, accessibility
 */
export function ThemeSwitcherRadios() {
  const { theme, setTheme, themes } = useTheme()

  return (
    <div className="form-control">
      <label className="label">
        <span className="label-text font-bold">Select Theme</span>
      </label>
      <div className="flex flex-wrap gap-3">
        {themes.map((t) => (
          <label key={t} className="label cursor-pointer">
            <input
              type="radio"
              name="theme-radio"
              value={t}
              checked={theme === t}
              onChange={() => setTheme(t)}
              className="radio"
            />
            <span className="label-text ml-2">
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </span>
          </label>
        ))}
      </div>
    </div>
  )
}

/**
 * VARIANT 5: Grid Layout (for Theme Showcase)
 * Best for: Landing page, theme showcase
 */
export function ThemeSwitcherGrid() {
  const { theme, setTheme, themes } = useTheme()

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {themes.map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className={`card bg-base-100 cursor-pointer transition hover:shadow-lg ${
            theme === t ? 'ring-2 ring-primary' : ''
          }`}
        >
          <div className="card-body p-4">
            <h3 className="card-title text-sm">
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </h3>
            <div className="flex gap-1">
              <div className="w-4 h-4 bg-primary rounded"></div>
              <div className="w-4 h-4 bg-secondary rounded"></div>
              <div className="w-4 h-4 bg-accent rounded"></div>
            </div>
            {theme === t && (
              <p className="text-xs text-success font-bold">✓ Active</p>
            )}
          </div>
        </button>
      ))}
    </div>
  )
}

/**
 * VARIANT 6: Pills/Chips (Modern, Popular)
 * Best for: Modern UI, compact spacing
 */
export function ThemeSwitcherChips() {
  const { theme, setTheme, themes } = useTheme()

  return (
    <div className="flex flex-wrap gap-2">
      {themes.map((t) => (
        <button
          key={t}
          onClick={() => setTheme(t)}
          className={`badge badge-lg cursor-pointer transition ${
            theme === t
              ? 'badge-primary'
              : 'badge-ghost'
          }`}
        >
          {t.charAt(0).toUpperCase() + t.slice(1)}
        </button>
      ))}
    </div>
  )
}

/**
 * VARIANT 7: Floating Action Button (Current Implementation)
 * Best for: Always-accessible, subtle
 */
export function ThemeSwitcherFAB() {
  const { theme, setTheme, themes } = useTheme()

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <div className="dropdown dropdown-top dropdown-end">
        <button
          tabIndex={0}
          className="btn btn-circle btn-primary shadow-lg"
          title="Switch theme"
        >
          🎨
        </button>
        <ul
          tabIndex={0}
          className="dropdown-content z-50 menu p-2 shadow bg-base-100 rounded-box w-52"
        >
          <li className="menu-title"><span>Theme</span></li>
          {themes.map((t) => (
            <li key={t}>
              <a
                onClick={() => setTheme(t)}
                className={theme === t ? 'active' : ''}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
                {theme === t && <span>✓</span>}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
