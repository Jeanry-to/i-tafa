import { MessagesSquare } from 'lucide-react'
import { cn } from '@/lib/utils'

export function BrandLogo({
  className,
  showText = true,
  variant = 'default',
}: {
  className?: string
  showText?: boolean
  variant?: 'default' | 'light'
}) {
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
        <MessagesSquare className="size-5" strokeWidth={2.2} aria-hidden="true" />
      </div>
      {showText && (
        <span
          className={cn(
            'font-display text-xl font-bold tracking-tight',
            variant === 'light' ? 'text-sidebar-foreground' : 'text-foreground',
          )}
        >
          i-tafa
        </span>
      )}
    </div>
  )
}
