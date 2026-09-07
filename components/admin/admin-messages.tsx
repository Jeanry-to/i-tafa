'use client'

import { useEffect, useState } from 'react'
import { Loader2, Search, MessageCircle } from 'lucide-react'

import { ChatView } from '@/components/chat/chat-view'
import { InitialsAvatar } from '@/components/initials-avatar'
import { cn } from '@/lib/utils'
import { supabase } from '@/lib/supabase'
import { getUnreadCounts } from '@/lib/services/api'

type ClientItem = {
  id: string
  status: string
  name: string
  email: string
}

export function AdminMessages() {
  const [clients, setClients] = useState<ClientItem[]>([])
  const [activeId, setActiveId] = useState<string | null>(null)
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [adminId, setAdminId] = useState<string | null>(null)
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})

  // =========================================================
  // RÉCUPÉRER L'ADMIN CONNECTÉ
  // =========================================================
  useEffect(() => {
    async function fetchCurrentUser() {
      try {
        const { data, error } = await supabase.auth.getUser()

        if (error) {
          console.error('Erreur récupération utilisateur :', error)
          return
        }

        setAdminId(data.user?.id ?? null)
      } catch (error) {
        console.error('Erreur récupération utilisateur :', error)
      }
    }

    fetchCurrentUser()
  }, [])

  // =========================================================
  // CHARGER LES CLIENTS
  // =========================================================
  useEffect(() => {
    async function fetchClients() {
      try {
        setLoading(true)

        const { data, error } = await supabase
          .from('clients')
          .select(
            `
            id,
            status,
            profiles!inner(
              id,
              full_name,
              email
            )
          `,
          )
          .order('joined_at', { ascending: false })

        if (error) {
          throw error
        }

        const formatted: ClientItem[] = (data ?? []).map((client: any) => {
          const profile = Array.isArray(client.profiles)
            ? client.profiles[0]
            : client.profiles

          return {
            id: String(client.id),
            status: client.status ?? 'actif',
            name: profile?.full_name || 'Client sans nom',
            email: profile?.email || '',
          }
        })

        setClients(formatted)

        if (formatted.length > 0) {
          setActiveId((current) =>
            current && formatted.some((client) => client.id === current)
              ? current
              : formatted[0].id,
          )
        } else {
          setActiveId(null)
        }
      } catch (error) {
        console.error('Erreur chargement clients :', error)
        setClients([])
        setActiveId(null)
      } finally {
        setLoading(false)
      }
    }

    fetchClients()
  }, [])

  // =========================================================
  // MESSAGES NON LUS : chargement initial + temps réel
  // =========================================================
  function reloadUnreadCounts() {
    if (!adminId) return
    getUnreadCounts(adminId)
      .then(setUnreadCounts)
      .catch((error) => console.error('Erreur comptage non lus :', error))
  }

  useEffect(() => {
    reloadUnreadCounts()
  }, [adminId])

  useEffect(() => {
    if (!adminId) return

    const channel = supabase
      .channel('admin-unread-messages')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          const row = payload.new as { client_id: string; sender_id: string }
          if (row.sender_id === adminId) return
          // Si la conversation est deja ouverte, ChatView va marquer le
          // message comme lu tout de suite ; on ne l'ajoute donc pas ici.
          if (row.client_id === activeId) return

          setUnreadCounts((prev) => ({
            ...prev,
            [row.client_id]: (prev[row.client_id] ?? 0) + 1,
          }))
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [adminId, activeId])

  function selectClient(id: string) {
    setActiveId(id)
    setUnreadCounts((prev) => ({ ...prev, [id]: 0 }))
  }

  // =========================================================
  // RECHERCHE
  // =========================================================
  const filteredClients = clients.filter((client) => {
    const search = query.trim().toLowerCase()
    if (!search) return true
    return (
      client.name.toLowerCase().includes(search) ||
      client.email.toLowerCase().includes(search)
    )
  })

  const activeClient = clients.find((client) => client.id === activeId)

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" aria-label="Chargement des clients" />
      </div>
    )
  }

  if (!adminId) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 text-center">
        <MessageCircle className="mb-3 size-10 text-muted-foreground" />
        <h2 className="font-display text-lg font-bold">Connexion administrateur requise</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Impossible de récupérer votre compte administrateur. Veuillez vous reconnecter.
        </p>
      </div>
    )
  }

  if (clients.length === 0) {
    return (
      <div className="flex min-h-[500px] flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 text-center">
        <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
          <MessageCircle className="size-7 text-primary" />
        </div>
        <h2 className="font-display text-lg font-bold">Aucun client</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Aucun client n&apos;est actuellement disponible pour une conversation.
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div
        className="
          grid
          min-h-[600px]
          w-full
          overflow-hidden
          rounded-2xl
          border
          border-border
          bg-card
          shadow-sm
          md:grid-cols-[280px_minmax(0,1fr)]
          lg:grid-cols-[320px_minmax(0,1fr)]
        "
      >
        <aside
          className="
            flex
            min-h-0
            flex-col
            border-b
            border-border
            bg-card
            md:border-b-0
            md:border-r
          "
        >
          <div className="border-b border-border px-4 py-4">
            <div className="flex items-center gap-2">
              <MessageCircle className="size-5 text-primary" />
              <div>
                <h2 className="font-display text-base font-bold">Messages</h2>
                <p className="text-xs text-muted-foreground">
                  {clients.length} {clients.length > 1 ? 'clients' : 'client'}
                </p>
              </div>
            </div>
          </div>

          <div className="border-b border-border p-3">
            <div className="flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-3">
              <Search className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Rechercher..."
                aria-label="Rechercher un client"
                className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {filteredClients.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Search className="mx-auto mb-2 size-6 text-muted-foreground" />
                <p className="text-sm font-medium">Aucun résultat</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Aucun client ne correspond à votre recherche.
                </p>
              </div>
            ) : (
              filteredClients.map((client) => {
                const isActive = client.id === activeId
                const unread = unreadCounts[client.id] ?? 0

                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => selectClient(client.id)}
                    className={cn(
                      'flex w-full items-center gap-3 border-b border-border px-3 py-3 text-left transition-colors',
                      isActive ? 'bg-secondary' : 'hover:bg-muted/60',
                    )}
                  >
                    <InitialsAvatar name={client.name} className="size-10 shrink-0" />

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-semibold">{client.name}</p>
                        {unread > 0 && (
                          <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                            {unread > 9 ? '9+' : unread}
                          </span>
                        )}
                      </div>

                      {client.email && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">{client.email}</p>
                      )}

                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={cn(
                            'size-1.5 rounded-full',
                            client.status === 'actif' ? 'bg-primary' : 'bg-destructive',
                          )}
                        />
                        <span className="text-[10px] text-muted-foreground">
                          {client.status === 'actif' ? 'Client actif' : 'Client suspendu'}
                        </span>
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </aside>

        <section className="min-h-[500px] min-w-0">
          {activeClient ? (
            <ChatView
              key={activeClient.id}
              clientId={activeClient.id}
              currentUserId={adminId}
              headerName={activeClient.name}
              headerMeta={activeClient.status === 'actif' ? 'Client actif' : 'Client suspendu'}
              perspective="admin"
              onMessagesRead={reloadUnreadCounts}
            />
          ) : (
            <div className="flex h-full min-h-[500px] flex-col items-center justify-center px-6 text-center">
              <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10">
                <MessageCircle className="size-7 text-primary" />
              </div>
              <h2 className="font-display text-lg font-bold">Sélectionnez un client</h2>
              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Choisissez un client dans la liste pour ouvrir sa conversation.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
