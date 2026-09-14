'use client'

import { useEffect } from 'react'
import { applyTheme, getStoredTheme } from '@/lib/theme'
import { applyAccent, getStoredAccent } from '@/lib/theme'

export function ThemeInitializer() {
  useEffect(() => {
    applyTheme(getStoredTheme())
    applyAccent(getStoredAccent())
  }, [])

  return null
}
