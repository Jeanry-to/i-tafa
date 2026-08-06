import { cn } from '@/lib/utils'

const palette = [
  'bg-chart-1 text-primary-foreground',
  'bg-chart-3 text-primary-foreground',
  'bg-chart-4 text-primary-foreground',
  'bg-chart-5 text-primary-foreground',
  'bg-accent text-accent-foreground',
]

function initials(name: string) {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export function InitialsAvatar({
  name,
  className,
}: {
  name: string
  className?: string
}) {
  const idx =
    name.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % palette.length
  return (
    <div
      className={cn(
        'flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold',
        palette[idx],
        className,
      )}
      aria-hidden="true"
    >
      {initials(name)}
    </div>
  )
}
