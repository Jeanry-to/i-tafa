'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { ChatView } from '@/components/chat/chat-view'
import { InitialsAvatar } from '@/components/initials-avatar'
import { clients, privateThread } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export function AdminMessages() {
  const [activeId, setActiveId] = useState(clients[0].id)
  const [query, setQuery] = useState('')

  const filtered = clients.filter((c) =>
    c.name.toLowerCase().includes(query.toLowerCase()),
  )
  const active = clients.find((c) => c.id === activeId) ?? clients[0]

  return (
    <div className="grid h-[calc(100vh-13rem)] grid-cols-1 gap-4 md:grid-cols-[300px_1fr]">
      {/* Conversation list */}
      <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
        <div className="border-b border-border p-3">
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3">
            <Search className="size-4 text-muted-foreground" aria-hidden="true" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un client…"
              aria-label="Rechercher un client"
              className="h-9 flex-1 bg-transparent text-sm outline-none"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveId(c.id)}
              className={cn(
                'flex w-full items-center gap-3 border-b border-border px-3 py-3 text-left transition-colors',
                c.id === activeId ? 'bg-secondary' : 'hover:bg-muted/60',
              )}
            >
              <InitialsAvatar name={c.name} className="size-10" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="truncate text-sm font-semibold">{c.name}</p>
                  {c.unread > 0 && (
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {c.unread}
                    </span>
                  )}
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {c.lastMessage}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Active conversation */}
      <div className="hidden min-h-0 md:block">
        <ChatView
          headerName={active.name}
          headerMeta={active.status === 'actif' ? 'Client actif' : 'Client suspendu'}
          initialMessages={privateThread[active.id] ?? []}
          perspective="admin"
        />
      </div>
    </div>
  )
}
