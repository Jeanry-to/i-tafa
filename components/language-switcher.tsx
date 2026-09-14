'use client'

import { LOCALES } from '@/lib/i18n/translations'
import { useLanguage } from '@/lib/i18n/language-context'
import type { LocalePreference } from '@/lib/i18n/translations'

const selectClassName =
  'h-9 w-full max-w-xs rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

export function LanguageSwitcher() {
  const { preference, setPreference, t } = useLanguage()

  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-sm font-medium">{t('language.label')}</p>
      <p className="mb-3 text-xs text-muted-foreground">
        Cette langue s&apos;applique a l&apos;interface du widget ET aux reponses de l&apos;Agent IA.
      </p>
      <select
        className={selectClassName}
        value={preference}
        onChange={(e) => setPreference(e.target.value as LocalePreference)}
      >
        {LOCALES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
}
