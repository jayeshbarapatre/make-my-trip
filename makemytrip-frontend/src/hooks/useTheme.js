import { useEffect, useState } from 'react'

const DAISYUI_THEMES = [
  'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate',
  'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween', 'garden',
  'forest', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe',
  'black', 'luxury', 'dracula', 'cmyk', 'autumn', 'business',
  'acid', 'lemonade', 'night', 'coffee', 'winter', 'dim', 'nord', 'sunset'
]

// Read persisted state during initialisation rather than in an effect: the
// first paint then already uses the saved theme, instead of rendering the
// default and immediately re-rendering over it.
const readSavedTheme = () => {
  try {
    return localStorage.getItem('daisyui-theme') || 'business'
  } catch {
    return 'business'
  }
}

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState(readSavedTheme)

  // `mounted` used to be returned here as an SSR hydration guard. Nothing
  // consumed it, and this is a client-only Vite SPA, so it was dead state.
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme)
  }, [currentTheme])

  const changeTheme = (themeName) => {
    if (!DAISYUI_THEMES.includes(themeName)) {
      console.warn(`Theme "${themeName}" not found in DaisyUI themes`)
      return
    }
    setCurrentTheme(themeName)
    document.documentElement.setAttribute('data-theme', themeName)
    localStorage.setItem('daisyui-theme', themeName)
  }

  return {
    currentTheme,
    changeTheme,
    themes: DAISYUI_THEMES
  }
}
