'use client'

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { translations, resolveLocale, type Locale, type LocalePreference } from './translations'
import { getAgentSettings, ownsShop, updateAgentLanguage } from '@/lib/services/api'
import { createClient } from '@/lib/supabase/client'

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
  const hasSession = useRef(false)

  useEffect(() => {
    const supabase = createClient()
    let cancelled = false

    async function loadLanguage() {
      try {
        const { data } = await supabase.auth.getSession()
        if (!data.session) return
        hasSession.current = true
        // Pas de boutique (acheteur) : aucune langue a charger
        if (!(await ownsShop())) return
        const settings = await getAgentSettings()
        if (cancelled) return
        const pref = (settings?.language ?? 'fr') as LocalePreference
        setPreferenceState(pref)
        setLocale(resolveLocale(pref))
      } catch (err) {
        console.error('Erreur chargement langue:', err)
      }
    }

    loadLanguage()

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      hasSession.current = !!session
    })

    return () => {
      cancelled = true
      sub.subscription.unsubscribe()
    }
  }, [])

  function setPreference(pref: LocalePreference) {
    setPreferenceState(pref)
    setLocale(resolveLocale(pref))
    if (!hasSession.current) return
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
