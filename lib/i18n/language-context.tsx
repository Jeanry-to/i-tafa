'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { translations, resolveLocale, type Locale, type LocalePreference } from './translations'
import { getAgentSettings, updateAgentLanguage } from '@/lib/services/api'

type LanguageContextType = {
  locale: Locale
  preference: LocalePreference
  setPreference: (pref: LocalePreference) => void
  t: (key: string) => string
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<LocalePreference>('fr')
  const [locale, setLocale] = useState<Locale>('fr')

  useEffect(() => {
    getAgentSettings()
      .then((settings) => {
        const pref = (settings?.language ?? 'fr') as LocalePreference
        setPreferenceState(pref)
        setLocale(resolveLocale(pref))
      })
      .catch((err) => console.error('Erreur chargement langue:', err))
  }, [])

  function setPreference(pref: LocalePreference) {
    setPreferenceState(pref)
    setLocale(resolveLocale(pref))
    updateAgentLanguage(pref as any).catch((err) =>
      console.error('Erreur enregistrement langue:', err),
    )
  }

  function t(key: string): string {
    return translations[locale]?.[key] ?? translations.fr[key] ?? key
  }

  return (
    <LanguageContext.Provider value={{ locale, preference, setPreference, t }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage doit etre utilise a l\u2019interieur de <LanguageProvider>')
  return ctx
}
