export type Theme = 'light' | 'dark'

export type AccentColor =
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink'
  | 'orange'
  | 'red'
  | 'yellow'

const STORAGE_KEY = 'itafa-theme'
const ACCENT_STORAGE_KEY = 'itafa-accent'

const VALID_ACCENTS: AccentColor[] = [
  'green',
  'blue',
  'purple',
  'pink',
  'orange',
  'red',
  'yellow',
]

export function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'light'
  const stored = window.localStorage.getItem(STORAGE_KEY)
  return stored === 'dark' ? 'dark' : 'light'
}

export function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return
  document.documentElement.classList.toggle('dark', theme === 'dark')
  window.localStorage.setItem(STORAGE_KEY, theme)
}

export function getStoredAccent(): AccentColor {
  if (typeof window === 'undefined') return 'green'
  const stored = window.localStorage.getItem(ACCENT_STORAGE_KEY)
  return VALID_ACCENTS.includes(stored as AccentColor) ? (stored as AccentColor) : 'green'
}

export function applyAccent(accent: AccentColor) {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.itafaAccent = accent
  window.localStorage.setItem(ACCENT_STORAGE_KEY, accent)
}