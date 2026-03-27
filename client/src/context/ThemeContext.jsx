import { createContext, useContext, useState, useEffect } from 'react'

const ThemeContext = createContext()

export function ThemeProvider({ children }) {
  const [dark, setDark] = useState(() => localStorage.getItem('theme') !== 'light')

  useEffect(() => {
    localStorage.setItem('theme', dark ? 'dark' : 'light')
    const root = document.documentElement
    if (dark) {
      root.style.setProperty('--bg', '#0f0f1a')
      root.style.setProperty('--bg2', '#1a1a2e')
      root.style.setProperty('--bg3', '#16213e')
      root.style.setProperty('--card', '#1e1e3a')
      root.style.setProperty('--border', '#2a2a4a')
      root.style.setProperty('--text', '#e2e8f0')
      root.style.setProperty('--text-muted', '#94a3b8')
    } else {
      root.style.setProperty('--bg', '#f1f5f9')
      root.style.setProperty('--bg2', '#ffffff')
      root.style.setProperty('--bg3', '#f8fafc')
      root.style.setProperty('--card', '#ffffff')
      root.style.setProperty('--border', '#e2e8f0')
      root.style.setProperty('--text', '#0f172a')
      root.style.setProperty('--text-muted', '#64748b')
    }
  }, [dark])

  return (
    <ThemeContext.Provider value={{ dark, toggle: () => setDark(d => !d) }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
