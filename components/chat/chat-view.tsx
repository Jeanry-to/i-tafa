'use client'

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import {
  FileText,
  ImageIcon,
  Loader2,
  MoreVertical,
  Paperclip,
  Send,
  Trash2,
  Video,
} from 'lucide-react'
import { toast } from 'sonner'

import { InitialsAvatar } from '@/components/initials-avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import {
  deleteMessageForEveryone,
  deleteMessageForMe,
  getMessages,
  markMessagesRead,
  sendMessage,
  subscribeToMessages,
  unsubscribeFromMessages,
  uploadAttachment,
  mapMessage,
  getAdminProfileId,
  generateAutoReply,
  getAgentSettings,
  type ChatMessage,
} from '@/lib/services/api'

type ChatPerspective = 'client' | 'admin'

type ChatViewProps = {
  clientId: string
  currentUserId: string
  headerName: string
  headerMeta: string
  perspective: ChatPerspective
  onlyAdminPosts?: boolean
  onMessagesRead?: () => void
}

export function ChatView({
  clientId,
  currentUserId,
  headerName,
  headerMeta,
  perspective,
  onlyAdminPosts = false,
  onMessagesRead,
}: ChatViewProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [text, setText] = useState('')
  const [uploading, setUploading] = useState(false)
  const [sending, setSending] = useState(false)
  const [aiTyping, setAiTyping] = useState(false)
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)

  const endRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let mounted = true

    setLoading(true)
    setMessages([])

    async function loadMessages() {
      try {
        const data = await getMessages(clientId, currentUserId, perspective)

        if (mounted) {
          setMessages(data)
        }

        await markMessagesRead(clientId, currentUserId)
        if (mounted) {
          onMessagesRead?.()
        }
      } catch (error) {
        console.error('Erreur chargement messages :', error)

        if (mounted) {
          toast.error('Impossible de charger les messages.')
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadMessages()

    const channel = subscribeToMessages(clientId, (row) => {
      if (!mounted) return

      const newMessage = mapMessage(row, currentUserId, perspective)

      setMessages((currentMessages) => {
        if (currentMessages.some((message) => message.id === newMessage.id)) {
          return currentMessages
        }
        return [...currentMessages, newMessage]
      })

      if (row.sender_id !== currentUserId) {
        markMessagesRead(clientId, currentUserId).then(() => {
          onMessagesRead?.()
        })
      }
    })

    return () => {
      mounted = false
      unsubscribeFromMessages(channel)
    }
  }, [clientId, currentUserId, perspective])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 50)

    return () => {
      window.clearTimeout(timer)
    }
  }, [messages])
async function handleSend(event: FormEvent<HTMLFormElement>) {
  event.preventDefault()

  const body = text.trim()

  if (!body || sending) return

  setText('')
  setSending(true)

  try {
    const savedMessage = await sendMessage({
      clientId,
      senderId: currentUserId,
      body,
    })

    const displayMessage = mapMessage(
      {
        id: savedMessage.id,
        client_id: savedMessage.clientId,
        sender_id: savedMessage.senderId,
        body: savedMessage.text ?? null,
        sent_at: savedMessage.sentAt,
        attachment_type: savedMessage.attachment?.type ?? null,
        attachment_name: savedMessage.attachment?.name ?? null,
        attachment_url: savedMessage.attachment?.url ?? null,
      },
      currentUserId,
      perspective,
    )

    setMessages((currentMessages) => {
      if (currentMessages.some((message) => message.id === displayMessage.id)) {
        return currentMessages
      }

      return [...currentMessages, displayMessage]
    })

    if (perspective === 'client') {
      void (async () => {
        try {
          const settings = await getAgentSettings()

          if (settings?.autoReplyEnabled) {
            setAiTyping(true)

            try {
              await generateAutoReply(body, clientId)
            } finally {
              setAiTyping(false)
            }
          }
        } catch (autoReplyError) {
          console.error('Erreur reponse automatique :', autoReplyError)
        }
      })()
    }
  } catch (error) {
    setText(body)
    console.error('Erreur envoi message :', error)

    toast.error('Message non envoyé', {
      description:
        error instanceof Error
          ? error.message
          : 'Veuillez réessayer.',
    })
  } finally {
    setSending(false)
  }
}

  function triggerFilePicker() {
    if (uploading || sending) return
    fileInputRef.current?.click()
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return
    if (uploading || sending) return

    setUploading(true)

    try {
      const uploaded = await uploadAttachment(file)

      const savedMessage = await sendMessage({
        clientId,
        senderId: currentUserId,
        attachmentType: uploaded.type,
        attachmentName: uploaded.name,
        attachmentUrl: uploaded.url,
      })

      const displayMessage = mapMessage(
        {
          id: savedMessage.id,
          client_id: savedMessage.clientId,
          sender_id: savedMessage.senderId,
          body: savedMessage.text ?? null,
          sent_at: savedMessage.sentAt,
          attachment_type: savedMessage.attachment?.type ?? null,
          attachment_name: savedMessage.attachment?.name ?? null,
          attachment_url: savedMessage.attachment?.url ?? null,
        },
        currentUserId,
        perspective,
      )

      setMessages((currentMessages) => {
        if (currentMessages.some((message) => message.id === displayMessage.id)) {
          return currentMessages
        }
        return [...currentMessages, displayMessage]
      })

      toast.success('Fichier envoyé')
    } catch (error) {
      console.error('Erreur envoi fichier :', error)
      toast.error('Envoi impossible', {
        description: error instanceof Error ? error.message : 'Veuillez réessayer.',
      })
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteForMe(messageId: string) {
    setOpenMenuId(null)
    try {
      await deleteMessageForMe(messageId, currentUserId)
      setMessages((current) => current.filter((m) => m.id !== messageId))
    } catch (error) {
      toast.error('Suppression impossible', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  async function handleDeleteForEveryone(messageId: string) {
    setOpenMenuId(null)
    try {
      await deleteMessageForEveryone(messageId)
      setMessages((current) =>
        current.map((m) =>
          m.id === messageId
            ? { ...m, text: undefined, attachment: undefined, attachments: [], deletedForEveryone: true }
            : m,
        ),
      )
      toast.success('Message supprimé pour tout le monde')
    } catch (error) {
      toast.error('Suppression impossible', {
        description: error instanceof Error ? error.message : undefined,
      })
    }
  }

  const visibleMessages = messages.filter((m) => !m.deletedForMe)

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <InitialsAvatar name={headerName} className="size-9" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{headerName}</p>
          <p className="truncate text-xs text-muted-foreground">{headerMeta}</p>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-label="Chargement des messages" />
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">Aucun message pour le moment.</p>
          </div>
        ) : (
          visibleMessages.map((message) => {
            const mine = message.senderId === currentUserId
            const isOpen = openMenuId === message.id

            return (
              <div key={message.id} className={cn('group flex', mine ? 'justify-end' : 'justify-start')}>
                <div className={cn('flex items-start gap-1', mine ? 'flex-row-reverse' : 'flex-row')}>
                  <div
                    className={cn(
                      'max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
                      mine
                        ? 'rounded-br-md bg-primary text-primary-foreground'
                        : 'rounded-bl-md bg-card text-foreground',
                    )}
                  >
                    {message.deletedForEveryone ? (
                      <p
                        className={cn(
                          'italic leading-relaxed',
                          mine ? 'text-primary-foreground/70' : 'text-muted-foreground',
                        )}
                      >
                        Message supprimé
                      </p>
                    ) : (
                      <>
                        {message.text && (
                          <p className="whitespace-pre-wrap leading-relaxed">{message.text}</p>
                        )}
                        {message.attachment && (
                          <AttachmentBubble
                            type={message.attachment.type}
                            name={message.attachment.name}
                            url={message.attachment.url}
                            mine={mine}
                          />
                        )}
                      </>
                    )}
                    <span
                      className={cn(
                        'mt-1 block text-[10px]',
                        mine ? 'text-primary-foreground/70' : 'text-muted-foreground',
                      )}
                    >
                      {message.time}
                    </span>
                  </div>

                  {!message.deletedForEveryone && (
                    <div className="relative shrink-0 self-center">
                      <button
                        type="button"
                        onClick={() => setOpenMenuId(isOpen ? null : message.id)}
                        aria-label="Options du message"
                        className="flex size-7 items-center justify-center rounded-full text-muted-foreground opacity-0 transition-opacity hover:bg-muted hover:text-foreground group-hover:opacity-100"
                      >
                        <MoreVertical className="size-3.5" aria-hidden="true" />
                      </button>

                      {isOpen && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                          <div
                            className={cn(
                              'absolute z-20 mt-1 w-48 rounded-lg border border-border bg-card py-1 shadow-lg',
                              mine ? 'right-0' : 'left-0',
                            )}
                          >
                            <button
                              type="button"
                              onClick={() => handleDeleteForMe(message.id)}
                              className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted"
                            >
                              <Trash2 className="size-3.5" aria-hidden="true" />
                              Supprimer pour moi
                            </button>
                            {mine && (
                              <button
                                type="button"
                                onClick={() => handleDeleteForEveryone(message.id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="size-3.5" aria-hidden="true" />
                                Supprimer pour tout le monde
                              </button>
                            )}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })
        )}
{aiTyping && perspective === 'client' && (
  <div className="flex justify-start">
    <div className="flex items-center gap-2 rounded-2xl rounded-bl-md bg-card px-3.5 py-2 text-sm text-muted-foreground shadow-sm">
      <Loader2 className="size-3.5 animate-spin" />
      L’IA est en train d’écrire…
    </div>
  </div>
)}
        
	<div ref={endRef} />
      </div>

      {onlyAdminPosts && perspective === 'client' ? (
        <div className="border-t border-border bg-muted/50 px-4 py-3 text-center text-xs text-muted-foreground">
          Ce canal est en lecture seule. Utilisez votre discussion privée pour contacter {headerName}.
        </div>
      ) : (
        <form onSubmit={handleSend} className="flex items-center gap-2 border-t border-border p-3">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
            className="sr-only"
            onChange={handleFileChange}
          />

          <AttachButton
            icon={uploading ? Loader2 : Paperclip}
            label={uploading ? 'Envoi du fichier...' : 'Envoyer un fichier'}
            onClick={triggerFilePicker}
            disabled={uploading || sending}
            spin={uploading}
          />

          <input
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Écrivez un message..."
            aria-label="Message"
            disabled={sending || uploading}
            className="h-10 flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
          />

          <Button
            type="submit"
            size="icon"
            className="size-10 shrink-0 rounded-full"
            aria-label="Envoyer"
            disabled={sending || uploading || !text.trim()}
          >
            {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          </Button>
        </form>
      )}
    </div>
  )
}

function AttachmentBubble({
  type,
  name,
  url,
  mine,
}: {
  type: 'image' | 'video' | 'file'
  name: string
  url?: string
  mine: boolean
}) {
  if (type === 'image' && url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 block overflow-hidden rounded-lg">
        <img src={url} alt={name} className="max-h-56 w-full object-cover" />
      </a>
    )
  }

  if (type === 'video' && url) {
    return <video src={url} controls preload="metadata" className="mt-1 max-h-56 w-full rounded-lg" />
  }

  const Icon = type === 'image' ? ImageIcon : type === 'video' ? Video : FileText

  const content = (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg px-2.5 py-2',
        mine ? 'bg-primary-foreground/15' : 'bg-muted',
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="truncate text-xs font-medium">{name}</span>
    </div>
  )

  if (url) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 block">
        {content}
      </a>
    )
  }

  return <div className="mt-1">{content}</div>
}

function AttachButton({
  icon: Icon,
  label,
  onClick,
  disabled,
  spin,
}: {
  icon: typeof ImageIcon
  label: string
  onClick: () => void
  disabled?: boolean
  spin?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Icon className={cn('size-4.5', spin && 'animate-spin')} aria-hidden="true" />
    </button>
  )
}



