import { useEffect, useState } from 'react'

const DAISYUI_THEMES = [
  'light', 'dark', 'cupcake', 'bumblebee', 'emerald', 'corporate',
  'synthwave', 'retro', 'cyberpunk', 'valentine', 'halloween', 'garden',
  'forest', 'aqua', 'lofi', 'pastel', 'fantasy', 'wireframe',
  'black', 'luxury', 'dracula', 'cmyk', 'autumn', 'business',
  'acid', 'lemonade', 'night', 'coffee', 'winter', 'dim', 'nord', 'sunset'
]

const THEME_COLORS = {
  light: { base: '#ffffff', primary: '#0284c7', secondary: '#64748b', accent: '#06b6d4' },
  dark: { base: '#1f2937', primary: '#38bdf8', secondary: '#64748b', accent: '#06b6d4' },
  cupcake: { base: '#faf7f5', primary: '#65c3c8', secondary: '#f1c40f', accent: '#f5a5c9' },
  bumblebee: { base: '#fffbeb', primary: '#fbbf24', secondary: '#78350f', accent: '#f59e0b' },
  emerald: { base: '#f8fafc', primary: '#66cc8a', secondary: '#06b6d4', accent: '#ec4899' },
  corporate: { base: '#f8fafc', primary: '#4b6bfb', secondary: '#06b6d4', accent: '#ec4899' },
  synthwave: { base: '#1a103c', primary: '#e0a82e', secondary: '#ff006e', accent: '#00d9ff' },
  retro: { base: '#ece3ca', primary: '#ef9995', secondary: '#f1dcc3', accent: '#c471ed' },
  cyberpunk: { base: '#ffee00', primary: '#ff007f', secondary: '#00ffff', accent: '#00d4ff' },
  valentine: { base: '#efeae6', primary: '#e96d7b', secondary: '#8b5fbf', accent: '#fbbf24' },
  halloween: { base: '#1f1d1b', primary: '#d97706', secondary: '#7c3aed', accent: '#f1f5f9' },
  garden: { base: '#f2f4f1', primary: '#16a34a', secondary: '#059669', accent: '#d946ef' },
  forest: { base: '#171212', primary: '#1eb854', secondary: '#16a34a', accent: '#ec4899' },
  aqua: { base: '#0f172a', primary: '#09ecf3', secondary: '#06b6d4', accent: '#34d399' },
  lofi: { base: '#f8f9fa', primary: '#000000', secondary: '#808080', accent: '#c0c0c0' },
  pastel: { base: '#fdf5f7', primary: '#f471b6', secondary: '#00d4d4', accent: '#ffc0cb' },
  fantasy: { base: '#f9f5ff', primary: '#a78bfa', secondary: '#f472b6', accent: '#22d3ee' },
  wireframe: { base: '#ffffff', primary: '#000000', secondary: '#808080', accent: '#404040' },
  black: { base: '#000000', primary: '#ffffff', secondary: '#808080', accent: '#c0c0c0' },
  luxury: { base: '#09090b', primary: '#c5a880', secondary: '#3a2d29', accent: '#fbbf24' },
  dracula: { base: '#282a36', primary: '#ff79c6', secondary: '#8be9fd', accent: '#50fa7b' },
  cmyk: { base: '#ffffff', primary: '#0284c7', secondary: '#fbbf24', accent: '#ec4899' },
  autumn: { base: '#f8f4f0', primary: '#ea580c', secondary: '#dc2626', accent: '#f59e0b' },
  business: { base: '#1a2e40', primary: '#1f6db8', secondary: '#3b82f6', accent: '#1e40af' },
  acid: { base: '#ffff00', primary: '#00ff00', secondary: '#ff00ff', accent: '#00ffff' },
  lemonade: { base: '#fffbeb', primary: '#fbbf24', secondary: '#0369a1', accent: '#ec4899' },
  night: { base: '#0f172a', primary: '#38bdf8', secondary: '#0284c7', accent: '#06b6d4' },
  coffee: { base: '#1c1415', primary: '#a89968', secondary: '#6f4e37', accent: '#d4a574' },
  winter: { base: '#f8fafc', primary: '#0284c7', secondary: '#06b6d4', accent: '#0369a1' },
  dim: { base: '#2a303c', primary: '#93c5fd', secondary: '#60a5fa', accent: '#34d399' },
  nord: { base: '#2e3440', primary: '#88c0d0', secondary: '#81a1c1', accent: '#8fbcbb' },
  sunset: { base: '#120c18', primary: '#ff9e2c', secondary: '#ff006e', accent: '#fbbf24' }
}

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
    themeColors: THEME_COLORS,
    mounted
  }
}
