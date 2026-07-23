import { useEffect, useState } from 'react'

const DAISYUI_THEMES = [
  'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate',
  'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween', 'garden',
  'forest', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe',
  'black', 'luxury', 'dracula', 'cmyk', 'autumn', 'business',
  'acid', 'lemonade', 'night', 'coffee', 'winter', 'dim', 'nord', 'sunset'
]

export const useTheme = () => {
  const [currentTheme, setCurrentTheme] = useState('business')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('daisyui-theme') || 'business'
    setCurrentTheme(savedTheme)
    document.documentElement.setAttribute('data-theme', savedTheme)
    setMounted(true)
  }, [])

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
    themes: DAISYUI_THEMES,
    mounted
  }
}
