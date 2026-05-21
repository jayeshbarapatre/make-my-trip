import { useState } from 'react'
import { useTheme, ACCENT_PRESETS } from '../../context/ThemeContext'
import './ThemeBuilderPanel.css'

const ThemeBuilderPanel = () => {
  const { theme, toggleTheme, accentColor, setAccent } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      

      <div className={`theme-builder-panel ${isOpen ? 'open' : ''}`}>
        <div className="builder-header">
          <h3>Theme Builder</h3>
          <button className="close-btn" onClick={() => setIsOpen(false)}>
            <i className="fas fa-times"></i>
          </button>
        </div>

        <div className="builder-section">
          <label className="section-label">Light / Dark</label>
          <div className="theme-buttons">
            <button
              className={`theme-btn ${theme === 'light' ? 'active' : ''}`}
              onClick={toggleTheme}
            >
              <i className="fas fa-sun"></i> Light
            </button>
            <button
              className={`theme-btn ${theme === 'dark' ? 'active' : ''}`}
              onClick={toggleTheme}
            >
              <i className="fas fa-moon"></i> Dark
            </button>
          </div>
        </div>

        <div className="builder-section">
          <label className="section-label">Choose Color</label>
          <div className="color-swatches">
            {ACCENT_PRESETS.map((preset) => (
              <button
                key={preset.hex}
                className={`color-swatch ${accentColor === preset.hex ? 'active' : ''}`}
                style={{ backgroundColor: preset.hex }}
                onClick={() => setAccent(preset.hex)}
                title={preset.name}
              />
            ))}
          </div>
        </div>

        <div className="builder-info">
          <small>Colors update in real-time</small>
        </div>
      </div>
    </>
  )
}

export default ThemeBuilderPanel
