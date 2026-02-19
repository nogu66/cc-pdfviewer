import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { type Locale, createT } from '../i18n'

interface LanguageContextValue {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: ReturnType<typeof createT>
}

const LanguageContext = createContext<LanguageContextValue | null>(null)

export function LanguageProvider({ children }: { children: React.ReactNode }): React.ReactElement {
  const [locale, setLocaleState] = useState<Locale>('en')

  useEffect(() => {
    window.electronAPI.store.get('locale').then(stored => {
      if (stored === 'en' || stored === 'ja') {
        setLocaleState(stored)
      }
    })
  }, [])

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale)
    window.electronAPI.store.set('locale', newLocale)
  }, [])

  const t = createT(locale)

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
