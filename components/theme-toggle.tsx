'use client'

import { useEffect, useState } from 'react'
import { Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { applyTheme, getStoredTheme, type Theme } from '@/lib/theme'

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light')

  useEffect(() => {
    setTheme(getStoredTheme())
  }, [])

  function toggle() {
    const next: Theme = theme === 'light' ? 'dark' : 'light'
    setTheme(next)
    applyTheme(next)
  }

  return (
    <div className="flex items-center justify-between rounded-lg border border-border p-3">
      <div>
        <p className="text-sm font-medium">Theme</p>
        <p className="text-xs text-muted-foreground">
          {theme === 'dark' ? 'Sombre active' : 'Clair active'}
        </p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={toggle} className="gap-1.5">
        {theme === 'dark' ? (
          <>
            <Sun className="size-4" aria-hidden="true" />
            Clair
          </>
        ) : (
          <>
            <Moon className="size-4" aria-hidden="true" />
            Sombre
          </>
        )}
      </Button>
    </div>
  )
}
