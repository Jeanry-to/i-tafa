'use client'

import Link from 'next/link'
import { useState } from 'react'
import { LogOut, Menu, X, type LucideIcon } from 'lucide-react'
import { BrandLogo } from '@/components/brand-logo'
import { InitialsAvatar } from '@/components/initials-avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type NavItem = {
  id: string
  label: string
  icon: LucideIcon
  badge?: number
}

export function DashboardShell({
  navItems,
  activeId,
  onNavigate,
  roleLabel,
  userName,
  userMeta,
  children,
}: {
  navItems: NavItem[]
  activeId: string
  onNavigate: (id: string) => void
  roleLabel: string
  userName: string
  userMeta: string
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const nav = (
    <nav className="flex flex-1 flex-col gap-1" aria-label="Navigation principale">
      {navItems.map((item) => {
        const active = item.id === activeId
        return (
          <button
            key={item.id}
            onClick={() => {
              onNavigate(item.id)
              setMobileOpen(false)
            }}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              active
                ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground',
            )}
            aria-current={active ? 'page' : undefined}
          >
            <item.icon className="size-4.5 shrink-0" aria-hidden="true" />
            <span className="flex-1 text-left">{item.label}</span>
            {item.badge ? (
              <span className="flex size-5 items-center justify-center rounded-full bg-sidebar-primary text-xs font-bold text-sidebar-primary-foreground">
                {item.badge}
              </span>
            ) : null}
          </button>
        )
      })}
    </nav>
  )

  const sidebarBody = (
    <>
      <div className="flex items-center justify-between">
        <BrandLogo variant="light" />
        <button
          className="lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-label="Fermer le menu"
        >
          <X className="size-5 text-sidebar-foreground" />
        </button>
      </div>
      <span className="mt-6 mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/40">
        {roleLabel}
      </span>
      {nav}
      <div className="mt-4 flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-3">
        <InitialsAvatar name={userName} className="size-9" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-sidebar-foreground">
            {userName}
          </p>
          <p className="truncate text-xs text-sidebar-foreground/60">{userMeta}</p>
        </div>
      </div>
      <Button
        asChild
        variant="ghost"
        className="mt-2 justify-start gap-3 px-3 text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground"
      >
        <Link href="/">
          <LogOut className="size-4.5" aria-hidden="true" />
          Se déconnecter
        </Link>
      </Button>
    </>
  )

  return (
    <div className="flex min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-72 shrink-0 flex-col bg-sidebar p-4 lg:flex">
        {sidebarBody}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
            aria-hidden="true"
          />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-sidebar p-4">
            {sidebarBody}
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile top bar */}
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:hidden">
          <BrandLogo />
          <button onClick={() => setMobileOpen(true)} aria-label="Ouvrir le menu">
            <Menu className="size-6" />
          </button>
        </header>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  )
}
