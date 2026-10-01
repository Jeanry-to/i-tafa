'use client'

import { useEffect, useRef, useState } from 'react'
import {
  Loader2,
  Send,
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
import {
  getClients,
  getCurrentProfile,
  getMessages,
  sendMessage,
  markMessagesRead,
  subscribeToMessages,
  unsubscribeFromMessages,
  suspendClient,
  type Client,
  type ChatMessage,
} from '@/lib/services/api'

export function AdminMessages({
  selectedClientId: externalSelectedClientId,
  onSelectedClientChange,
}: {
  selectedClientId?: string | null
  onSelectedClientChange?: (clientId: string | null) => void
}) {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(
    externalSelectedClientId ?? null,
  )
  const [profileClient, setProfileClient] = useState<Client | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [search, setSearch] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)

  const [suspensionClient, setSuspensionClient] =
    useState<Client | null>(null)
  const [suspensionReason, setSuspensionReason] = useState('')
  const [suspensionUntil, setSuspensionUntil] = useState('')
  const [suspending, setSuspending] = useState(false)

  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getCurrentProfile()
      .then((profile: any) => {
        setCurrentUserId(profile?.id ?? null)
      })
      .catch((err) => {
        console.error('Erreur chargement profil:', err)
      })

    getClients()
      .then(setClients)
      .catch((err) => {
        console.error('Erreur chargement clients:', err)

        toast.error('Impossible de charger les clients')
      })
      .finally(() => {
        setLoadingClients(false)
      })
  }, [])

  useEffect(() => {
    if (externalSelectedClientId !== undefined) {
      setSelectedClientId(externalSelectedClientId ?? null)

      if (externalSelectedClientId) {
        const client = clients.find(
          (item) => item.id === externalSelectedClientId,
        )

        if (client) {
          setProfileClient(null)
        }
      }
    }
  }, [externalSelectedClientId, clients])

  useEffect(() => {
    if (!selectedClientId || !currentUserId) {
      setMessages([])
      return
    }

    setLoadingMessages(true)

    getMessages(selectedClientId, currentUserId, 'admin')
      .then(setMessages)
      .catch((err) => {
        console.error('Erreur chargement messages:', err)

        toast.error('Impossible de charger les messages')
      })
      .finally(() => {
        setLoadingMessages(false)
      })

    markMessagesRead(selectedClientId, currentUserId).catch(() => {})

    const channel = subscribeToMessages(selectedClientId, () => {
      getMessages(selectedClientId, currentUserId, 'admin').then(setMessages)
    })

    return () => {
      unsubscribeFromMessages(channel)
    }
  }, [selectedClientId, currentUserId])

  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: 'smooth',
    })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()

    if (!input.trim() || !selectedClientId || !currentUserId) {
      return
    }

    setSending(true)

    try {
      await sendMessage({
        clientId: selectedClientId,
        senderId: currentUserId,
        body: input.trim(),
      })

      setInput('')

      const updated = await getMessages(
        selectedClientId,
        currentUserId,
        'admin',
      )

      setMessages(updated)
    } catch (err) {
      toast.error('Envoi impossible', {
        description:
          err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSending(false)
    }
  }

  function getClientPhone(client: Client | null) {
    if (!client) return ''

    const data = client as Client & {
      phone?: string | null
      telephone?: string | null
      mobile?: string | null
    }

    return data.phone || data.telephone || data.mobile || ''
  }

  function getClientDescription(client: Client | null) {
    if (!client) return ''

    const data = client as Client & {
      description?: string | null
      bio?: string | null
    }

    return data.description || data.bio || ''
  }

  function getInitials(name?: string | null) {
    if (!name) return 'CL'

    const parts = name
      .trim()
      .split(/\s+/)
      .filter(Boolean)

    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase()
    }

    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
  }

  function getWhatsAppNumber(phone: string) {
    const cleaned = phone.replace(/[^\d+]/g, '')

    if (cleaned.startsWith('+261')) {
      return cleaned.replace('+', '')
    }

    if (cleaned.startsWith('261')) {
      return cleaned
    }

    if (cleaned.startsWith('0')) {
      return `261${cleaned.slice(1)}`
    }

    return cleaned
  }

  function openClient(client: Client) {
    setSelectedClientId(client.id)
    setProfileClient(null)

    onSelectedClientChange?.(client.id)
  }

  function openProfile(client: Client) {
    setProfileClient(client)
  }

  function closeProfile() {
    setProfileClient(null)
  }

  function handleCall(phone: string) {
    if (!phone) {
      toast.error('Aucun numéro de téléphone disponible')
      return
    }

    window.location.href = `tel:${phone}`
  }

  function handleWhatsApp(phone: string) {
    if (!phone) {
      toast.error('Aucun numéro de téléphone disponible')
      return
    }

    const number = getWhatsAppNumber(phone)

    if (!number) {
      toast.error('Numéro de téléphone invalide')
      return
    }

    window.open(
      `https://wa.me/${number}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  function openSuspension(client: Client) {
    setSuspensionClient(client)
    setSuspensionReason('')
    setSuspensionUntil('')
  }

  function closeSuspension() {
    if (suspending) return

    setSuspensionClient(null)
    setSuspensionReason('')
    setSuspensionUntil('')
  }

  async function confirmSuspension(
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault()

    if (!suspensionClient) return

    try {
      setSuspending(true)

      await suspendClient(suspensionClient.id, {
        reason: suspensionReason.trim() || null,
        until: suspensionUntil || null,
      })

      toast.success('Client suspendu', {
        description: `${suspensionClient.name} a été suspendu.`,
      })

      const updatedClients = await getClients()
      setClients(updatedClients)

      setProfileClient(null)
      setSuspensionClient(null)
      setSuspensionReason('')
      setSuspensionUntil('')
    } catch (err) {
      console.error('Erreur suspension client:', err)

      toast.error('Suspension impossible', {
        description:
          err instanceof Error
            ? err.message
            : 'Impossible de suspendre ce client.',
      })
    } finally {
      setSuspending(false)
    }
  }

  const selectedClient =
    clients.find((client) => client.id === selectedClientId) ?? null

  const normalizedSearch = search.trim().toLowerCase()

  const filteredClients = clients.filter((client) => {
    if (!normalizedSearch) return true

    return (
      client.name?.toLowerCase().includes(normalizedSearch) ||
      client.email?.toLowerCase().includes(normalizedSearch)
    )
  })

  const profilePhone = getClientPhone(profileClient)
  const profileDescription = getClientDescription(profileClient)

  return (
    <>
      <div
        className={`grid min-h-[600px] gap-4 ${
          profileClient
            ? 'xl:grid-cols-[280px_minmax(0,1fr)_300px]'
            : 'xl:grid-cols-[280px_minmax(0,1fr)]'
        }`}
      >
        {/* LISTE DES CLIENTS */}
        <Card className="flex min-h-[600px] flex-col overflow-hidden p-0">
          <div className="border-b border-border p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">
                  Messages privés
                </p>

                <p className="text-xs text-muted-foreground">
                  Conversations avec vos clients
                </p>
              </div>

              <span className="rounded-full bg-muted px-2 py-1 text-xs font-medium">
                {clients.length}
              </span>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un client..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {loadingClients ? (
              <div className="flex justify-center py-10">
                <Loader2
                  className="size-5 animate-spin text-muted-foreground"
                  aria-hidden="true"
                />
              </div>
            ) : filteredClients.length === 0 ? (
              <div className="p-5 text-center">
                <UserRound className="mx-auto mb-2 size-8 text-muted-foreground" />

                <p className="text-sm text-muted-foreground">
                  Aucun client trouvé.
                </p>
              </div>
            ) : (
              filteredClients.map((client) => {
                const active = selectedClientId === client.id

                return (
                  <button
                    key={client.id}
                    type="button"
                    onClick={() => openClient(client)}
                    className={`flex w-full items-center gap-3 border-b border-border/50 p-3 text-left transition-colors ${
                      active
                        ? 'bg-primary/10'
                        : 'hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {getInitials(client.name)}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {client.name}
                        </span>

                        {client.unread > 0 && (
                          <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                            {client.unread}
                          </span>
                        )}
                      </div>

                      <p className="truncate text-xs text-muted-foreground">
                        {client.lastMessage || client.email}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </Card>

        {/* CONVERSATION */}
        <Card className="flex min-h-[600px] min-w-0 flex-col overflow-hidden p-0">
          {!selectedClient ? (
            <div className="flex flex-1 flex-col items-center justify-center p-6 text-center">
              <div className="mb-3 flex size-14 items-center justify-center rounded-full bg-primary/10">
                <MessageCircle className="size-7 text-primary" />
              </div>

              <p className="text-sm font-semibold">
                Vos messages privés
              </p>

              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Sélectionnez un client dans la liste pour consulter et
                gérer votre conversation.
              </p>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-3 border-b border-border p-4">
                <button
                  type="button"
                  onClick={() => openProfile(selectedClient)}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                  title="Afficher le profil du client"
                >
                  {getInitials(selectedClient.name)}
                </button>

                <button
                  type="button"
                  onClick={() => openProfile(selectedClient)}
                  className="min-w-0 text-left"
                  title="Afficher le profil du client"
                >
                  <p className="truncate text-sm font-semibold hover:text-primary">
                    {selectedClient.name}
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {selectedClient.email}
                  </p>
                </button>

                <div className="ml-auto flex items-center gap-1">
                  {getClientPhone(selectedClient) && (
                    <>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleCall(getClientPhone(selectedClient))
                        }
                        title="Appeler"
                      >
                        <Phone className="size-4" />
                      </Button>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          handleWhatsApp(
                            getClientPhone(selectedClient),
                          )
                        }
                        title="WhatsApp"
                      >
                        <MessageCircle className="size-4" />
                      </Button>
                    </>
                  )}

                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => openProfile(selectedClient)}
                    title="Afficher le profil"
                  >
                    <UserRound className="size-4" />
                  </Button>
                </div>
              </div>

              <div
                ref={scrollRef}
                className="flex flex-1 flex-col gap-2 overflow-y-auto p-4"
              >
                {loadingMessages ? (
                  <div className="flex justify-center py-6">
                    <Loader2
                      className="size-5 animate-spin text-muted-foreground"
                      aria-hidden="true"
                    />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-1 items-center justify-center">
                    <p className="text-sm text-muted-foreground">
                      Aucun message pour le moment.
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                        message.from === 'admin'
                          ? 'self-end rounded-br-sm bg-primary text-primary-foreground'
                          : 'self-start rounded-bl-sm bg-muted'
                      }`}
                    >
                      {message.deletedForEveryone ? (
                        <em className="text-xs opacity-70">
                          Message supprimé
                        </em>
                      ) : (
                        <>
                          {message.text}

                          {message.attachments?.map((att, idx) => (
                            <a
                              key={idx}
                              href={att.url}
                              target="_blank"
                              rel="noreferrer"
                              className="mt-1 block truncate text-xs underline"
                            >
                              {att.name}
                            </a>
                          ))}
                        </>
                      )}

                      <span className="mt-1 block text-[10px] opacity-70">
                        {message.time}
                      </span>
                    </div>
                  ))
                )}
              </div>

              <form
                onSubmit={handleSend}
                className="flex gap-2 border-t border-border p-3"
              >
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder={`Écrire à ${selectedClient.name}...`}
                  className="flex-1"
                />

                <Button
                  type="submit"
                  disabled={sending || !input.trim()}
                  size="icon"
                >
                  {sending ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Send
                      className="size-4"
                      aria-hidden="true"
                    />
                  )}
                </Button>
              </form>
            </>
          )}
        </Card>

        {/* PROFIL CLIENT */}
        {profileClient && (
          <Card className="relative min-h-[600px] overflow-hidden p-0">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <p className="text-sm font-semibold">
                  Profil du client
                </p>

                <p className="text-xs text-muted-foreground">
                  Informations du client
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeProfile}
                title="Fermer le profil"
              >
                <X className="size-4" />
              </Button>
            </div>

            <div className="p-5">
              <div className="flex flex-col items-center text-center">
                <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                  {getInitials(profileClient.name)}
                </div>

                <h3 className="mt-3 text-lg font-semibold">
                  {profileClient.name}
                </h3>

                <p className="mt-1 break-all text-xs text-muted-foreground">
                  {profileClient.email}
                </p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <Mail className="size-4 text-muted-foreground" />
                    Email
                  </div>

                  <p className="mt-1 break-all text-sm text-muted-foreground">
                    {profileClient.email || 'Non renseigné'}
                  </p>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <Phone className="size-4 text-muted-foreground" />
                    Téléphone
                  </div>

                  <p className="mt-1 text-sm text-muted-foreground">
                    {profilePhone || 'Non renseigné'}
                  </p>
                </div>

                {profileDescription && (
                  <div className="rounded-lg border border-border p-3">
                    <div className="flex items-center gap-2 text-xs font-medium">
                      <UserRound className="size-4 text-muted-foreground" />
                      Description
                    </div>

                    <p className="mt-1 text-sm text-muted-foreground">
                      {profileDescription}
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6 grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  className="w-full"
                  onClick={() => {
                    setSelectedClientId(profileClient.id)
                    onSelectedClientChange?.(profileClient.id)

                    toast.success(
                      `Conversation ouverte avec ${profileClient.name}`,
                    )
                  }}
                >
                  <MessageCircle className="mr-2 size-4" />
                  Message
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleCall(profilePhone)}
                >
                  <Phone className="mr-2 size-4" />
                  Appel
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => handleWhatsApp(profilePhone)}
                >
                  <MessageCircle className="mr-2 size-4" />
                  WhatsApp
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full text-destructive hover:text-destructive"
                  onClick={() => openSuspension(profileClient)}
                >
                  <Ban className="mr-2 size-4" />
                  Suspendre
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* PETITE FENÊTRE DE SUSPENSION */}
      {suspensionClient && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <div>
                <h3 className="text-base font-semibold">
                  Suspendre le client
                </h3>

                <p className="mt-1 text-xs text-muted-foreground">
                  {suspensionClient.name}
                </p>
              </div>

              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={closeSuspension}
                disabled={suspending}
                title="Fermer"
              >
                <X className="size-4" />
              </Button>
            </div>

            <form
              onSubmit={confirmSuspension}
              className="space-y-4 p-5"
            >
              <div>
                <label
                  htmlFor="message-suspension-reason"
                  className="mb-2 block text-sm font-medium"
                >
                  Motif de suspension
                </label>

                <textarea
                  id="message-suspension-reason"
                  value={suspensionReason}
                  onChange={(e) =>
                    setSuspensionReason(e.target.value)
                  }
                  placeholder="Indiquez la raison de la suspension..."
                  rows={4}
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
                  disabled={suspending}
                />
              </div>

              <div>
                <label
                  htmlFor="message-suspension-until"
                  className="mb-2 block text-sm font-medium"
                >
                  Suspension jusqu'au
                </label>

                <Input
                  id="message-suspension-until"
                  type="datetime-local"
                  value={suspensionUntil}
                  onChange={(e) =>
                    setSuspensionUntil(e.target.value)
                  }
                  disabled={suspending}
                />

                <p className="mt-1 text-xs text-muted-foreground">
                  Laissez vide pour une suspension sans date de fin.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeSuspension}
                  disabled={suspending}
                >
                  Annuler
                </Button>

                <Button
                  type="submit"
                  variant="destructive"
                  disabled={suspending}
                >
                  {suspending && (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  )}

                  Suspendre le client
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}