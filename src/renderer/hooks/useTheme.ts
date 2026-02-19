import { useState, useEffect, useCallback } from 'react'

export type Theme = 'system' | 'dark' | 'light'

function applyTheme(theme: Theme): void {
  const html = document.documentElement
  if (theme === 'system') {
    html.removeAttribute('data-theme')
  } else {
    html.setAttribute('data-theme', theme)
  }
}

export function useTheme(): { theme: Theme; setTheme: (t: Theme) => void } {
  const [theme, setThemeState] = useState<Theme>('system')

  useEffect(() => {
    window.electronAPI.store.get('theme').then(stored => {
      const t = stored as Theme
      if (t === 'dark' || t === 'light' || t === 'system') {
        applyTheme(t)
        setThemeState(t)
      }
      // 未設定の場合は system のまま (data-theme 属性なし)
    })
  }, [])

  const setTheme = useCallback((t: Theme) => {
    applyTheme(t)
    setThemeState(t)
    window.electronAPI.store.set('theme', t)
  }, [])

  return { theme, setTheme }
}
