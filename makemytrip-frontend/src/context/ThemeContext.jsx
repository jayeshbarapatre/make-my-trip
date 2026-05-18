import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export const ACCENT_PRESETS = [
  { name: 'Blue', hex: '#1a73e8' },
  { name: 'Green', hex: '#10b981' },
  { name: 'Purple', hex: '#8b5cf6' },
  { name: 'Amber', hex: '#f59e0b' },
  { name: 'Red', hex: '#ef4444' },
  { name: 'Cyan', hex: '#06b6d4' },
  { name: 'Indigo', hex: '#6366f1' },
  { name: 'Pink', hex: '#ec4899' }
]

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState('light')
  const [accentColor, setAccentColor] = useState('#1a73e8')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const storedTheme = localStorage.getItem('adminTheme')
    if (storedTheme === 'dark' || storedTheme === 'light') {
      setTheme(storedTheme)
    }

    const storedAccent = localStorage.getItem('adminAccent')
    if (storedAccent) {
      setAccentColor(storedAccent)
    }

    setMounted(true)
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(newTheme)
    localStorage.setItem('adminTheme', newTheme)
  }

  const setAccent = (hex) => {
    setAccentColor(hex)
    localStorage.setItem('adminAccent', hex)
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, accentColor, setAccent, mounted }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
