import { useState, useEffect, useRef } from 'react'
import { useTheme } from '../../hooks/useTheme'

export default function ThemeSwitcher() {
  const { currentTheme, changeTheme, themes } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div
      ref={dropdownRef}
      className={`dropdown dropdown-end ${isOpen ? 'dropdown-open' : ''}`}
      title="Change Theme"
      style={{ position: 'relative', display: 'inline-block', zIndex: 1000 }}
    >
      {/* Theme Switcher Toggle Button (Screenshot 2) */}
      <div
        tabIndex={0}
        role="button"
        aria-label="Change Theme"
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '4px 8px',
          borderRadius: '8px',
          border: '1px solid hsl(var(--b3))',
          backgroundColor: isHovered || isOpen ? 'hsl(var(--b3))' : 'hsl(var(--b1))',
          cursor: 'pointer',
          transition: 'all 0.2s ease',
          height: '36px',
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => {
          setIsHovered(false)
        }}
        onClick={(e) => {
          e.preventDefault()
          setIsOpen(!isOpen)
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            setIsOpen(!isOpen)
          } else if (e.key === 'Escape') {
            e.preventDefault()
            setIsOpen(false)
          }
        }}
      >
        {/* 2x2 Grid representing the active theme's colors - 26x26 size with 6px right space */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '2px',
          width: '26px',
          height: '26px',
          padding: '4px',
          borderRadius: '6px',
          border: '1px solid hsl(var(--bc) / 0.1)',
          backgroundColor: 'hsl(var(--b1))',
          boxSizing: 'border-box',
          marginRight: '6px',
        }}>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'hsl(var(--p))' }}></div>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'hsl(var(--s))' }}></div>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'hsl(var(--a))' }}></div>
          <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'hsl(var(--bc))' }}></div>
        </div>

        {/* Down Arrow / Chevron */}
        <svg
          width="11"
          height="11"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{
            opacity: 0.7,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </div>

      {/* Theme List Dropdown - Only render when open */}
      {isOpen && (
      <div
        className="dropdown-content bg-base-200 text-base-content rounded-box border-white/5 shadow-2xl outline-black/5"
        style={{
          position: 'absolute',
          top: '100%',
          right: 0,
          marginTop: '8px',
          height: '30.5rem',
          maxHeight: 'calc(100vh - 8.6rem)',
          overflowY: 'auto',
          border: '1px solid hsl(var(--b3))',
          zIndex: 9999,
        }}
      >
        <ul className="menu w-64 p-2 bg-base-200">
          <li className="menu-title text-xs text-base-content/60 font-semibold mb-2" style={{ textTransform: 'uppercase', letterSpacing: '0.5px' }}>Theme</li>
          {themes.map((themeName) => {
            const isActive = currentTheme === themeName
            return (
              <li key={themeName} className="mb-0.5">
                <button
                  className={`gap-3 px-2 flex items-center justify-between w-full hover:bg-base-300 rounded-lg text-left transition-colors duration-150 ${
                    isActive ? 'bg-base-300 font-bold' : ''
                  }`}
                  style={{
                    border: 'none',
                    outline: 'none',
                    boxShadow: 'none',
                    background: isActive ? 'hsl(var(--b3))' : 'transparent',
                    color: 'hsl(var(--bc))',
                    padding: '8px 12px',
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderRadius: '8px',
                    cursor: 'pointer',
                  }}
                  onClick={() => {
                    changeTheme(themeName)
                    setIsOpen(false)
                  }}
                >
                  <div className="flex items-center">
                    {/* Scoped color palette display - 26x26 size with 6px right space */}
                    <div
                      data-theme={themeName}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '2px',
                        width: '26px',
                        height: '26px',
                        padding: '4px',
                        borderRadius: '6px',
                        border: '1px solid hsl(var(--bc) / 0.1)',
                        backgroundColor: 'hsl(var(--b1))',
                        boxSizing: 'border-box',
                        marginRight: '6px',
                      }}
                    >
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'hsl(var(--p))' }}></div>
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'hsl(var(--s))' }}></div>
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'hsl(var(--a))' }}></div>
                      <div style={{ width: '7px', height: '7px', borderRadius: '50%', backgroundColor: 'hsl(var(--bc))' }}></div>
                    </div>
                    <div className="w-32 truncate text-sm font-medium text-left" style={{ textTransform: 'capitalize' }}>
                      {themeName}
                    </div>
                  </div>
                  
                  {/* Active Tick indicator */}
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                      color: 'hsl(var(--p))',
                      visibility: isActive ? 'visible' : 'hidden',
                      marginRight: '4px',
                    }}
                  >
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </button>
              </li>
            )
          })}
        </ul>
      </div>
      )}
    </div>
  )
}
