'use client'

import { useEffect, useState } from 'react'
import { Check } from 'lucide-react'
import { applyAccent, getStoredAccent, type AccentColor } from '@/lib/theme'

const ACCENT_OPTIONS: { value: AccentColor; label: string; swatch: string }[] = [
  { value: 'green', label: 'Vert', swatch: 'oklch(0.52 0.1 175)' },
  { value: 'blue', label: 'Bleu', swatch: 'oklch(0.55 0.18 250)' },
  { value: 'purple', label: 'Violet', swatch: 'oklch(0.55 0.18 300)' },
  { value: 'pink', label: 'Rose', swatch: 'oklch(0.62 0.2 350)' },
  { value: 'orange', label: 'Orange', swatch: 'oklch(0.68 0.18 55)' },
  { value: 'red', label: 'Rouge', swatch: 'oklch(0.58 0.2 25)' },
  { value: 'yellow', label: 'Jaune', swatch: 'oklch(0.78 0.16 90)' },
]

export function AccentColorPicker() {
  const [accent, setAccent] = useState<AccentColor>('green')

  useEffect(() => {
    setAccent(getStoredAccent())
  }, [])

  function choose(value: AccentColor) {
    setAccent(value)
    applyAccent(value)
  }

  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-sm font-medium">Couleur d&apos;accentuation</p>
      <p className="mb-3 text-xs text-muted-foreground">
        Choisissez la couleur principale de votre espace.
      </p>
      <div className="flex flex-wrap gap-3">
        {ACCENT_OPTIONS.map((opt) => {
          const selected = accent === opt.value
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => choose(opt.value)}
              aria-label={opt.label}
              aria-pressed={selected}
              title={opt.label}
              className="flex size-9 items-center justify-center rounded-full ring-offset-2 ring-offset-background transition-shadow"
              style={{
                backgroundColor: opt.swatch,
                boxShadow: selected ? `0 0 0 2px ${opt.swatch}` : undefined,
              }}
            >
              {selected && <Check className="size-4 text-white drop-shadow" aria-hidden="true" />}
            </button>
          )
        })}
      </div>
    </div>
  )
}
