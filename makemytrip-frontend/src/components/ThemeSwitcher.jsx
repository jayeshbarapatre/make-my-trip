import { useTheme } from '../hooks/useTheme'

export default function ThemeSwitcher() {
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
        <li className="menu-title">
          <span>Theme</span>
        </li>
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
