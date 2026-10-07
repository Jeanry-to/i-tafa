'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Loader2,
  Search,
  Phone,
  MessageCircle,
  UserRound,
  X,
  Ban,
  Mail,
} from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ChatView } from '@/components/chat/chat-view'

import {
  getClients,
  getCurrentProfile,
  suspendClient,
  type Client,
} from '@/lib/services/api'

type AdminMessagesProps = {
  externalSelectedClientId?: string | null
  onSelectedClientChange?: (clientId: string | null) => void
}

export function AdminMessages({
  externalSelectedClientId,
  onSelectedClientChange,
}: AdminMessagesProps) {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    externalSelectedClientId ?? null,
  )
  const [profileClient, setProfileClient] = useState<Client | null>(null)

  const [search, setSearch] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const [loadingClients, setLoadingClients] = useState(true)
  const [suspending, setSuspending] = useState(false)

  const [showSuspendModal, setShowSuspendModal] = useState(false)
  const [suspendReason, setSuspendReason] = useState('')

  useEffect(() => {
    let mounted = true

    async function loadData() {
      try {
        const [profile, loadedClients] = await Promise.all([
          getCurrentProfile(),
          getClients(),
        ])

        if (!mounted) return

        setCurrentUserId(profile?.id ?? null)
        setClients(loadedClients)
      } catch (error) {
        console.error('Erreur chargement messages admin:', error)

        if (mounted) {
          toast.error('Impossible de charger les messages')
        }
      } finally {
        if (mounted) {
          setLoadingClients(false)
        }
      }
    }

    loadData()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (externalSelectedClientId !== undefined) {
      setSelectedClientId(externalSelectedClientId)
    }
  }, [externalSelectedClientId])

  const filteredClients = useMemo(() => {
    const query = search.trim().toLowerCase()

    if (!query) {
      return clients
    }

    return clients.filter((client) => {
      const name = client.name?.toLowerCase() ?? ''
      const email = client.email?.toLowerCase() ?? ''
      const phone = client.phone?.toLowerCase() ?? ''

      return (
        name.includes(query) ||
        email.includes(query) ||
        phone.includes(query)
      )
    })
  }, [clients, search])

  const selectedClient = useMemo(() => {
    if (!selectedClientId) {
      return null
    }

    return (
      clients.find((client) => client.id === selectedClientId) ?? null
    )
  }, [clients, selectedClientId])

  function openClient(client: Client) {
    setSelectedClientId(client.id)
    setProfileClient(null)

    // Efface immédiatement le compteur local.
    // On ne recharge PAS toute la liste des clients.
    setClients((currentClients) =>
      currentClients.map((item) =>
        item.id === client.id
          ? {
              ...item,
              unread: 0,
            }
          : item,
      ),
    )

    onSelectedClientChange?.(client.id)
  }

  function openProfile(client: Client) {
    setProfileClient(client)
  }

  function closeProfile() {
    setProfileClient(null)
  }

  function openSuspendModal() {
    if (!selectedClient) {
      return
    }

    setSuspendReason('')
    setShowSuspendModal(true)
  }

  function closeSuspendModal() {
    if (suspending) {
      return
    }

    setShowSuspendModal(false)
    setSuspendReason('')
  }

  async function confirmSuspend() {
    if (!selectedClient) {
      return
    }

    setSuspending(true)

    try {
      await suspendClient(
        selectedClient.id,
        { reason: suspendReason.trim() },
      )

      toast.success('Client suspendu')

      setClients((currentClients) =>
        currentClients.map((client) =>
          client.id === selectedClient.id
            ? {
                ...client,
                status: 'suspendu',
              }
            : client,
        ),
      )

      setProfileClient((currentProfile) =>
        currentProfile?.id === selectedClient.id
          ? {
              ...currentProfile,
              status: 'suspendu',
            }
          : currentProfile,
      )

      setShowSuspendModal(false)
      setSuspendReason('')
    } catch (error) {
      console.error('Erreur suspension client:', error)
      toast.error('Impossible de suspendre le client')
    } finally {
      setSuspending(false)
    }
  }

  function callClient(client: Client) {
    if (!client.phone) {
      toast.error('Numéro de téléphone indisponible')
      return
    }

    window.location.href = `tel:${client.phone}`
  }

  function openWhatsApp(client: Client) {
    if (!client.phone) {
      toast.error('Numéro de téléphone indisponible')
      return
    }

    const cleanPhone = client.phone.replace(/[^\d+]/g, '')
    const phoneWithoutPlus = cleanPhone.replace(/^\+/, '')

    window.open(
      `https://wa.me/${phoneWithoutPlus}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  if (loadingClients) {
    return (
      <div className="flex min-h-[500px] items-center justify-center">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Chargement des messages...
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="grid min-h-[650px] grid-cols-1 gap-4 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* LISTE DES CLIENTS */}
        <Card className="flex min-h-0 flex-col overflow-hidden">
          <div className="border-b p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">
                  Messages
                </h2>

                <p className="text-xs text-muted-foreground">
                  Conversations avec vos clients
                </p>
              </div>

              <MessageCircle className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Rechercher un client..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto">
            {filteredClients.length === 0 ? (
              <div className="p-6 text-center text-sm text-muted-foreground">
                Aucun client trouvé.
              </div>
            ) : (
              <div className="divide-y">
                {filteredClients.map((client) => {
                  const isSelected = client.id === selectedClientId
                  const unreadCount = client.unread ?? 0

                  return (
                    <button
                      key={client.id}
                      type="button"
                      onClick={() => openClient(client)}
                      className={[
                        'w-full text-left transition-colors',
                        isSelected
                          ? 'bg-muted'
                          : 'hover:bg-muted/50',
                      ].join(' ')}
                    >
                      <div className="flex items-center gap-3 p-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                          <UserRound className="h-5 w-5 text-primary" />
                        </div>

                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between gap-2">
                            <p className="truncate text-sm font-medium">
                              {client.name}
                            </p>

                            {unreadCount > 0 && (
                              <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[11px] font-semibold text-primary-foreground">
                                {unreadCount > 99
                                  ? '99+'
                                  : unreadCount}
                              </span>
                            )}
                          </div>

                          <p className="truncate text-xs text-muted-foreground">
                            {client.email || client.phone || 'Client'}
                          </p>
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </Card>

        {/* CONVERSATION */}
        <Card className="min-h-[600px] min-w-0 overflow-hidden p-0">
          {!selectedClient ? (
            <div className="flex h-full min-h-[600px] flex-col items-center justify-center p-8 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <MessageCircle className="h-8 w-8 text-muted-foreground" />
              </div>

              <h3 className="text-lg font-semibold">
                Sélectionnez une conversation
              </h3>

              <p className="mt-1 max-w-md text-sm text-muted-foreground">
                Choisissez un client dans la liste pour afficher et
                envoyer ses messages.
              </p>
            </div>
          ) : !currentUserId ? (
            <div className="flex h-full min-h-[600px] items-center justify-center">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
                Chargement de votre compte...
              </div>
            </div>
          ) : (
            <ChatView
              clientId={selectedClient.id}
              currentUserId={currentUserId}
              headerName={selectedClient.name}
              headerMeta={selectedClient.email}
              perspective="admin"
            />
          )}
        </Card>
      </div>

      {/* PROFIL DU CLIENT */}
      {profileClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <div className="flex items-center justify-between border-b p-4">
              <div>
                <h3 className="font-semibold">
                  Profil du client
                </h3>

                <p className="text-xs text-muted-foreground">
                  Informations du compte
                </p>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={closeProfile}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="space-y-4 p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <UserRound className="h-6 w-6 text-primary" />
                </div>

                <div>
                  <p className="font-medium">
                    {profileClient.name}
                  </p>

                  <p className="text-sm text-muted-foreground">
                    {profileClient.status}
                  </p>
                </div>
              </div>

              {profileClient.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />

                  <span className="text-sm break-all">
                    {profileClient.email}
                  </span>
                </div>
              )}

              {profileClient.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />

                  <span className="text-sm">
                    {profileClient.phone}
                  </span>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={() => callClient(profileClient)}
                  disabled={!profileClient.phone}
                >
                  <Phone className="mr-2 h-4 w-4" />
                  Appeler
                </Button>

                <Button
                  variant="outline"
                  onClick={() => openWhatsApp(profileClient)}
                  disabled={!profileClient.phone}
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  WhatsApp
                </Button>

                <Button
                  variant="destructive"
                  onClick={openSuspendModal}
                  disabled={profileClient.status === 'suspendu'}
                >
                  <Ban className="mr-2 h-4 w-4" />
                  Suspendre
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* MODAL SUSPENSION */}
      {showSuspendModal && selectedClient && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
          <Card className="w-full max-w-md">
            <div className="border-b p-4">
              <h3 className="font-semibold">
                Suspendre le client
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Vous êtes sur le point de suspendre{' '}
                <strong>{selectedClient.name}</strong>.
              </p>
            </div>

            <div className="space-y-4 p-4">
              <div>
                <label
                  htmlFor="suspend-reason"
                  className="mb-2 block text-sm font-medium"
                >
                  Motif de suspension
                </label>

                <textarea
                  id="suspend-reason"
                  value={suspendReason}
                  onChange={(event) =>
                    setSuspendReason(event.target.value)
                  }
                  placeholder="Indiquez le motif..."
                  className="min-h-[110px] w-full rounded-md border bg-background p-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 border-t p-4">
              <Button
                variant="outline"
                onClick={closeSuspendModal}
                disabled={suspending}
              >
                Annuler
              </Button>

              <Button
                variant="destructive"
                onClick={confirmSuspend}
                disabled={suspending}
              >
                {suspending && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}

                Confirmer la suspension
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}