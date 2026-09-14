'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader2, Send } from 'lucide-react'
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
  type Client,
  type ChatMessage,
} from '@/lib/services/api'

export function AdminMessages() {
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [loadingClients, setLoadingClients] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    getCurrentProfile()
      .then((profile: any) => setCurrentUserId(profile?.id ?? null))
      .catch((err) => console.error('Erreur chargement profil:', err))

    getClients()
      .then(setClients)
      .catch((err) => {
        console.error('Erreur chargement clients:', err)
        toast.error('Impossible de charger les clients')
      })
      .finally(() => setLoadingClients(false))
  }, [])

  useEffect(() => {
    if (!selectedClientId || !currentUserId) return

    setLoadingMessages(true)
    getMessages(selectedClientId, currentUserId, 'admin')
      .then(setMessages)
      .catch((err) => console.error('Erreur chargement messages:', err))
      .finally(() => setLoadingMessages(false))

    markMessagesRead(selectedClientId, currentUserId).catch(() => {})

    const channel = subscribeToMessages(selectedClientId, () => {
      getMessages(selectedClientId, currentUserId, 'admin').then(setMessages)
    })

    return () => {
      unsubscribeFromMessages(channel)
    }
  }, [selectedClientId, currentUserId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!input.trim() || !selectedClientId || !currentUserId) return

    setSending(true)
    try {
      await sendMessage({
        clientId: selectedClientId,
        senderId: currentUserId,
        body: input.trim(),
      })
      setInput('')
      const updated = await getMessages(selectedClientId, currentUserId, 'admin')
      setMessages(updated)
    } catch (err) {
      toast.error('Envoi impossible', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSending(false)
    }
  }

  const selectedClient = clients.find((c) => c.id === selectedClientId) ?? null

  return (
    <div className="grid h-[600px] gap-4 md:grid-cols-[280px_1fr]">
      <Card className="flex flex-col overflow-hidden p-0">
        <div className="border-b border-border p-3">
          <p className="text-sm font-semibold">Clients</p>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingClients ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
            </div>
          ) : clients.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground">Aucun client pour le moment.</p>
          ) : (
            clients.map((client) => (
              <button
                key={client.id}
                onClick={() => setSelectedClientId(client.id)}
                className={`flex w-full flex-col items-start gap-0.5 border-b border-border/50 p-3 text-left transition-colors hover:bg-muted/50 ${
                  selectedClientId === client.id ? 'bg-muted' : ''
                }`}
              >
                <span className="flex w-full items-center justify-between text-sm font-medium">
                  {client.name}
                  {client.unread > 0 && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                      {client.unread}
                    </span>
                  )}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {client.lastMessage || client.email}
                </span>
              </button>
            ))
          )}
        </div>
      </Card>

      <Card className="flex flex-col overflow-hidden p-0">
        {!selectedClient ? (
          <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
            Selectionnez un client pour voir la conversation.
          </div>
        ) : (
          <>
            <div className="border-b border-border p-3">
              <p className="text-sm font-semibold">{selectedClient.name}</p>
              <p className="text-xs text-muted-foreground">{selectedClient.email}</p>
            </div>

            <div ref={scrollRef} className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
              {loadingMessages ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="size-5 animate-spin text-muted-foreground" aria-hidden="true" />
                </div>
              ) : messages.length === 0 ? (
                <p className="text-sm text-muted-foreground">Aucun message pour le moment.</p>
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
                      <em className="text-xs opacity-70">Message supprime</em>
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
                    <span className="mt-1 block text-[10px] opacity-70">{message.time}</span>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleSend} className="flex gap-2 border-t border-border p-3">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ecrire un message..."
                className="flex-1"
              />
              <Button type="submit" disabled={sending || !input.trim()} size="icon">
                {sending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
              </Button>
            </form>
          </>
        )}
      </Card>
    </div>
  )
}
