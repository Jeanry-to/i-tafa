'use client'

import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

type SelectContextType = {
  value?: string
  onValueChange?: (value: string) => void
  open: boolean
  setOpen: (open: boolean) => void
  registerLabel: (value: string, label: React.ReactNode) => void
  selectedLabel: React.ReactNode
}

const SelectContext = React.createContext<SelectContextType | null>(null)

function useSelectContext() {
  const ctx = React.useContext(SelectContext)
  if (!ctx) throw new Error('Select.* doit etre utilise a l\u2019interieur de <Select>')
  return ctx
}

export function Select({
  value,
  onValueChange,
  children,
}: {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(false)
  const labelsRef = React.useRef<Map<string, React.ReactNode>>(new Map())
  const [, forceRender] = React.useState(0)

  const registerLabel = React.useCallback((val: string, label: React.ReactNode) => {
    if (labelsRef.current.get(val) !== label) {
      labelsRef.current.set(val, label)
      forceRender((n) => n + 1)
    }
  }, [])

  const containerRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const selectedLabel = value ? labelsRef.current.get(value) : undefined

  return (
    <SelectContext.Provider
      value={{ value, onValueChange, open, setOpen, registerLabel, selectedLabel }}
    >
      <div ref={containerRef} className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export function SelectTrigger({
  children,
  className = '',
}: {
  children: React.ReactNode
  className?: string
}) {
  const ctx = useSelectContext()
  return (
    <button
      type="button"
      onClick={() => ctx.setOpen(!ctx.open)}
      className={cn(
        'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50',
        className,
      )}
    >
      {children}
      <ChevronDown className="size-4 opacity-50" aria-hidden="true" />
    </button>
  )
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = useSelectContext()
  return <span className="truncate">{ctx.selectedLabel ?? placeholder ?? ''}</span>
}

export function SelectContent({ children }: { children: React.ReactNode }) {
  const ctx = useSelectContext()
  if (!ctx.open) return null
  return (
    <div className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-md border border-input bg-popover p-1 shadow-md">
      {children}
    </div>
  )
}

export function SelectItem({
  value,
  children,
}: {
  value: string
  children: React.ReactNode
}) {
  const ctx = useSelectContext()

  React.useEffect(() => {
    ctx.registerLabel(value, children)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, children])

  const isSelected = ctx.value === value

  return (
    <div
      onClick={() => {
        ctx.onValueChange?.(value)
        ctx.setOpen(false)
      }}
      className={cn(
        'cursor-pointer rounded-sm px-2 py-1.5 text-sm hover:bg-accent hover:text-accent-foreground',
        isSelected && 'bg-accent/60',
      )}
    >
      {children}
    </div>
  )
}
