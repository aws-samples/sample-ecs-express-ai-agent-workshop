import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { updatePreferences, UserPreferences } from '../lib/api'

export type Theme = 'light' | 'dark' | 'system'

interface ThemeState {
  theme: Theme
  changeTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeState>({
  theme: 'system',
  changeTheme: () => {},
})

function applyTheme(theme: Theme) {
  const root = document.documentElement
  if (theme === 'system') {
    root.removeAttribute('data-theme')
    root.style.colorScheme = 'light dark'
  } else {
    root.setAttribute('data-theme', theme)
    root.style.colorScheme = theme
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { user, accessToken } = useAuth()
  const [theme, setTheme] = useState<Theme>('system')

  useEffect(() => {
    const userTheme = (user?.preferences as UserPreferences | null)?.theme
    const next = userTheme ?? 'system'
    setTheme(next)
    applyTheme(next)
  }, [user?.preferences])

  function changeTheme(next: Theme) {
    setTheme(next)
    applyTheme(next)
    if (accessToken) {
      updatePreferences(accessToken, { theme: next }).catch(() => {})
    }
  }

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeState {
  return useContext(ThemeContext)
}
