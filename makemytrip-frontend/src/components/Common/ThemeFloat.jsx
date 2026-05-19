import { useState, useRef, useEffect } from 'react'
import { useToast } from '../../hooks/useToast'

const DAISYUI_THEMES = [
  { name: 'business',  label: '💼 Business (Default)' },
  { name: 'luxury',    label: '✨ Luxury' },
  { name: 'dracula',   label: '🧛 Dracula' },
  { name: 'night',     label: '🌙 Night' },
  { name: 'dim',       label: '🌫️ Dim' },
  { name: 'synthwave', label: '👾 Synthwave' },
  { name: 'cyberpunk', label: '🤖 Cyberpunk' },
  { name: 'retro',     label: '📻 Retro' },
  { name: 'cupcake',   label: '🧁 Cupcake' },
  { name: 'valentine', label: '💖 Valentine' },
  { name: 'forest',    label: '🌲 Forest' },
  { name: 'aqua',      label: '🌊 Aqua' },
  { name: 'nord',      label: '❄️ Nord' },
  { name: 'sunset',    label: '🌇 Sunset' },
  { name: 'emerald',   label: '✳️ Emerald' },
  { name: 'corporate', label: '🏢 Corporate' },
  { name: 'light',     label: '☀️ Light' },
  { name: 'dark',      label: '🌑 Dark' }
]

export default function ThemeFloat() {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const dropdownRef = useRef(null)
  const toast = useToast()

  const [activeTheme, setActiveTheme] = useState(() => {
    return localStorage.getItem('daisyui-theme') || 'business'
  })

  // Apply theme to document element whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', activeTheme)
    localStorage.setItem('daisyui-theme', activeTheme)
  }, [activeTheme])

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={dropdownRef} style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 9999 }}>
      {/* Floating Button */}
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        style={{
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: 'hsl(var(--p))',
          color: 'hsl(var(--pc))',
          border: 'none',
          cursor: 'pointer',
          fontSize: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          transition: 'all 0.3s ease',
          transform: dropdownOpen ? 'scale(1.1)' : 'scale(1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.25)'
          e.currentTarget.style.transform = 'scale(1.15)'
        }}
        onMouseLeave={(e) => {
          if (!dropdownOpen) {
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)'
            e.currentTarget.style.transform = 'scale(1)'
          }
        }}
      >
        🎨
      </button>

      {/* Dropdown Menu */}
      {dropdownOpen && (
        <div
          style={{
            position: 'absolute',
            bottom: '70px',
            right: 0,
            background: 'hsl(var(--b1))',
            color: 'hsl(var(--bc))',
            borderRadius: '12px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
            border: '1px solid hsl(var(--b2))',
            minWidth: '220px',
            maxHeight: '380px',
            overflowY: 'auto',
            padding: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          <div style={{
            fontSize: '11px',
            color: 'hsl(var(--bc) / 0.5)',
            fontWeight: 800,
            textTransform: 'uppercase',
            letterSpacing: '1px',
            padding: '0 8px 6px',
            borderBottom: '1px solid hsl(var(--b2))',
          }}>
            🎨 Choose Theme
          </div>

          {DAISYUI_THEMES.map((theme) => (
            <button
              key={theme.name}
              onClick={() => {
                setActiveTheme(theme.name)
                setDropdownOpen(false)
                toast.success(`Applied ${theme.label}! 🎨`)
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                cursor: 'pointer',
                border: activeTheme === theme.name ? '1px solid hsl(var(--p))' : '1px solid transparent',
                background: activeTheme === theme.name ? 'hsl(var(--p) / 0.1)' : 'transparent',
                color: 'inherit',
                fontSize: '13px',
                fontWeight: activeTheme === theme.name ? 700 : 500,
                transition: 'all 0.15s ease',
                textAlign: 'left',
                font: 'inherit',
              }}
              onMouseEnter={(e) => {
                if (activeTheme !== theme.name) {
                  e.currentTarget.style.background = 'hsl(var(--bc) / 0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (activeTheme !== theme.name) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <span>{theme.label.split(' ')[0]}</span>
              <span style={{ fontSize: '12px', flex: 1 }}>
                {theme.label.substring(theme.label.indexOf(' ') + 1)}
              </span>
              {activeTheme === theme.name && <span>✅</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
