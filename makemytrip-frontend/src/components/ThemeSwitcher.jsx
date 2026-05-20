import { useTheme } from '../hooks/useTheme'
import { useState, useEffect, useRef } from 'react'

export default function ThemeSwitcher() {
  const { currentTheme: theme, changeTheme: setTheme, themes } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div
      ref={dropdownRef}
      title="Change Theme"
      className={`dropdown dropdown-end block z-[100] ${isOpen ? 'dropdown-open' : ''}`}
    >
      <button
        type="button"
        className="btn group btn-sm gap-1.5 px-1.5 btn-ghost"
        aria-label="Change Theme"
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(!isOpen)
        }}
      >
        <div
          data-theme={theme}
          className="bg-base-100 group-hover:border-base-content/20 border-base-content/10 rounded-md border transition-all"
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: '2px',
            padding: '3px',
            width: '20px',
            height: '20px',
            flexShrink: 0
          }}
        >
          <div className="bg-base-content rounded-full" style={{ width: '6px', height: '6px' }}></div>
          <div className="bg-primary rounded-full" style={{ width: '6px', height: '6px' }}></div>
          <div className="bg-secondary rounded-full" style={{ width: '6px', height: '6px' }}></div>
          <div className="bg-accent rounded-full" style={{ width: '6px', height: '6px' }}></div>
        </div>
        <svg
          width="12px"
          height="12px"
          className="mt-px hidden size-2 fill-current opacity-60 sm:inline-block"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 2048 2048"
        >
          <path d="M1799 349l242 241-1017 1017L7 590l242-241 775 775 775-775z"></path>
        </svg>
      </button>
      {isOpen && (
        <div
          className="dropdown-content bg-base-200 text-base-content rounded-box top-px h-[30.5rem] max-h-[calc(100vh-8.6rem)] overflow-y-auto border border-white/5 shadow-2xl mt-16 z-[100]"
        >
          <ul className="menu w-56 p-2 gap-0.5" style={{ listStyleType: 'none', margin: 0, padding: '8px' }}>
            <li className="menu-title text-xs font-bold uppercase tracking-wider opacity-60 px-3 py-1.5" style={{ listStyleType: 'none' }}>Theme</li>
            {themes.map((t) => (
              <li key={t} style={{ listStyleType: 'none' }}>
                <button
                  type="button"
                  className={`gap-3 px-3 py-2 flex items-center justify-between w-full text-left rounded-lg transition-all ${
                    theme === t ? 'bg-base-300 font-bold' : 'hover:bg-base-300/60'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation()
                    setTheme(t)
                    setIsOpen(false)
                  }}
                  data-set-theme={t}
                >
                  <div className="flex items-center gap-3">
                    <div
                      data-theme={t}
                      className="bg-base-100 rounded-md p-1 shadow-sm border border-base-content/5"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                        gap: '2px',
                        padding: '3px',
                        width: '20px',
                        height: '20px',
                        flexShrink: 0
                      }}
                    >
                      <div className="bg-base-content rounded-full" style={{ width: '6px', height: '6px' }}></div>
                      <div className="bg-primary rounded-full" style={{ width: '6px', height: '6px' }}></div>
                      <div className="bg-secondary rounded-full" style={{ width: '6px', height: '6px' }}></div>
                      <div className="bg-accent rounded-full" style={{ width: '6px', height: '6px' }}></div>
                    </div>
                    <div className="w-28 truncate text-sm capitalize">{t}</div>
                  </div>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                    className={`${theme === t ? 'visible' : 'invisible'} h-3.5 w-3.5 shrink-0 text-primary`}
                  >
                    <path d="M20.285 2l-11.285 11.567-5.286-5.011-3.714 3.716 9 8.728 15-15.285z" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
