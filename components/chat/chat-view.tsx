'use client'

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from 'react'
import {
  Check,
  CheckCheck,
  Copy,
  Edit3,
  FileText,
  Forward,
  ImageIcon,
  Loader2,
  MoreVertical,
  Paperclip,
  Reply,
  Send,
  Smile,
  Trash2,
  Video,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import { InitialsAvatar } from '@/components/initials-avatar'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

import {
  deleteMessageForEveryone,
  deleteMessageForMe,
  deleteMessagesForEveryone,
  deleteMessagesForMe,
  editMessage,
  forwardMessage,
  getMessages,
  markMessagesRead,
  mapMessage,
  sendMessage,
  subscribeToMessages,
  toggleMessageReaction,
  unsubscribeFromMessages,
  uploadAttachment,
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

const EMOJIS = [
  '😀',
  '😂',
  '😍',
  '😊',
  '👍',
  '❤️',
  '👏',
  '🙏',
  '🎉',
  '🔥',
  '😢',
  '😡',
]

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

  const [openMenuId, setOpenMenuId] =
    useState<string | null>(null)

  const [showEmojiPicker, setShowEmojiPicker] =
    useState(false)

  const [openReactionId, setOpenReactionId] =
    useState<string | null>(null)

  const [selectMode, setSelectMode] =
    useState(false)

  const [selectedIds, setSelectedIds] =
    useState<string[]>([])

  const [editingMessageId, setEditingMessageId] =
    useState<string | null>(null)

  const [replyingTo, setReplyingTo] =
    useState<ChatMessage | null>(null)

  const [forwardingMessage, setForwardingMessage] =
    useState<ChatMessage | null>(null)

  const [forwardComment, setForwardComment] =
    useState('')

  const endRef = useRef<HTMLDivElement>(null)

  const fileInputRef =
    useRef<HTMLInputElement>(null)

  useEffect(() => {
    let mounted = true

    setLoading(true)
    setMessages([])
    setSelectedIds([])
    setSelectMode(false)
    setOpenReactionId(null)

    async function loadMessages() {
      try {
        const data = await getMessages(
          clientId,
          currentUserId,
          perspective,
        )

        if (mounted) {
          setMessages(data)
        }

        await markMessagesRead(
          clientId,
          currentUserId,
        )

        if (mounted) {
          onMessagesRead?.()
        }
      } catch (error) {
        console.error(
          'Erreur chargement messages :',
          error,
        )

        if (mounted) {
          toast.error(
            'Impossible de charger les messages.',
          )
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    loadMessages()

    const channel = subscribeToMessages(
      clientId,
      (row) => {
        if (!mounted) return

        const newMessage = mapMessage(
          row,
          currentUserId,
          perspective,
        )

        setMessages((currentMessages) => {
          if (
            currentMessages.some(
              (message) =>
                message.id === newMessage.id,
            )
          ) {
            return currentMessages
          }

          return [
            ...currentMessages,
            newMessage,
          ]
        })

        if (
          row.sender_id !== currentUserId
        ) {
          markMessagesRead(
            clientId,
            currentUserId,
          ).then(() => {
            onMessagesRead?.()
          })
        }
      },
      (row) => {
        if (!mounted) return

        const updatedMessage = mapMessage(
          row,
          currentUserId,
          perspective,
        )

        setMessages((currentMessages) =>
          currentMessages.map((message) =>
            message.id === updatedMessage.id
              ? updatedMessage
              : message,
          ),
        )
      },
    )

    return () => {
      mounted = false
      unsubscribeFromMessages(channel)
    }
  }, [
    clientId,
    currentUserId,
    perspective,
    onMessagesRead,
  ])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      endRef.current?.scrollIntoView({
        behavior: 'smooth',
      })
    }, 50)

    return () => {
      window.clearTimeout(timer)
    }
  }, [messages])

  function buildDisplayMessage(
    savedMessage: ChatMessage,
  ) {
    return mapMessage(
      {
        id: savedMessage.id,
        client_id: savedMessage.clientId,
        sender_id: savedMessage.senderId,
        body: savedMessage.text ?? null,
        sent_at: savedMessage.sentAt,
        read_at: savedMessage.readAt,
        edited_at: savedMessage.editedAt,
        reply_to_id: savedMessage.replyToId,
        forwarded_from_id:
          savedMessage.forwardedFromId,
        forward_comment:
          savedMessage.forwardComment,
        reactions:
          savedMessage.reactions,
        attachment_type:
          savedMessage.attachment?.type ??
          null,
        attachment_name:
          savedMessage.attachment?.name ??
          null,
        attachment_url:
          savedMessage.attachment?.url ??
          null,
        attachments:
          savedMessage.attachments ?? [],
        deleted_for_everyone:
          savedMessage.deletedForEveryone,
        deleted_for: [],
      },
      currentUserId,
      perspective,
    )
  }

  async function handleSend(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const body = text.trim()

    if (!body || sending) return

    if (editingMessageId) {
      setSending(true)

      try {
        await editMessage(
          editingMessageId,
          currentUserId,
          body,
        )

        setMessages((current) =>
          current.map((message) =>
            message.id === editingMessageId
              ? {
                  ...message,
                  text: body,
                  editedAt:
                    new Date().toISOString(),
                }
              : message,
          ),
        )

        setText('')
        setEditingMessageId(null)

        toast.success(
          'Message modifié',
        )
      } catch (error) {
        toast.error(
          'Modification impossible',
          {
            description:
              error instanceof Error
                ? error.message
                : undefined,
          },
        )
      } finally {
        setSending(false)
      }

      return
    }

    setText('')
    setSending(true)

    try {
      const savedMessage =
        await sendMessage({
          clientId,
          senderId: currentUserId,
          body,
          replyToId:
            replyingTo?.id,
        })

      const displayMessage =
        buildDisplayMessage(
          savedMessage,
        )

      setMessages((currentMessages) => {
        if (
          currentMessages.some(
            (message) =>
              message.id ===
              displayMessage.id,
          )
        ) {
          return currentMessages
        }

        return [
          ...currentMessages,
          displayMessage,
        ]
      })

      setReplyingTo(null)
    } catch (error) {
      setText(body)

      console.error(
        'Erreur envoi message :',
        error,
      )

      toast.error(
        'Message non envoyé',
        {
          description:
            error instanceof Error
              ? error.message
              : 'Veuillez réessayer.',
        },
      )
    } finally {
      setSending(false)
    }
  }

  function triggerFilePicker() {
    if (uploading || sending) return

    fileInputRef.current?.click()
  }

  async function handleFileChange(
    event: ChangeEvent<HTMLInputElement>,
  ) {
    const file =
      event.target.files?.[0]

    event.target.value = ''

    if (!file) return

    if (uploading || sending) return

    setUploading(true)

    try {
      const uploaded =
        await uploadAttachment(file)

      const savedMessage =
        await sendMessage({
          clientId,
          senderId: currentUserId,
          attachmentType:
            uploaded.type,
          attachmentName:
            uploaded.name,
          attachmentUrl:
            uploaded.url,
          replyToId:
            replyingTo?.id,
        })

      const displayMessage =
        buildDisplayMessage(
          savedMessage,
        )

      setMessages((currentMessages) => {
        if (
          currentMessages.some(
            (message) =>
              message.id ===
              displayMessage.id,
          )
        ) {
          return currentMessages
        }

        return [
          ...currentMessages,
          displayMessage,
        ]
      })

      setReplyingTo(null)

      toast.success(
        'Fichier envoyé',
      )
    } catch (error) {
      console.error(
        'Erreur envoi fichier :',
        error,
      )

      toast.error(
        'Envoi impossible',
        {
          description:
            error instanceof Error
              ? error.message
              : 'Veuillez réessayer.',
        },
      )
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteForMe(
    messageId: string,
  ) {
    setOpenMenuId(null)

    try {
      await deleteMessageForMe(
        messageId,
        currentUserId,
      )

      setMessages((current) =>
        current.filter(
          (message) =>
            message.id !== messageId,
        ),
      )
    } catch (error) {
      toast.error(
        'Suppression impossible',
        {
          description:
            error instanceof Error
              ? error.message
              : undefined,
        },
      )
    }
  }

  async function handleDeleteForEveryone(
    messageId: string,
  ) {
    setOpenMenuId(null)

    if (
      !window.confirm(
        'Supprimer ce message pour tout le monde ?',
      )
    ) {
      return
    }

    try {
      await deleteMessageForEveryone(
        [messageId],
      )

      setMessages((current) =>
        current.map((message) =>
          message.id === messageId
            ? {
                ...message,
                text: undefined,
                attachment:
                  undefined,
                attachments: [],
                deletedForEveryone:
                  true,
              }
            : message,
        ),
      )

      toast.success(
        'Message supprimé pour tout le monde',
      )
    } catch (error) {
      toast.error(
        'Suppression impossible',
        {
          description:
            error instanceof Error
              ? error.message
              : undefined,
        },
      )
    }
  }

  function toggleSelected(
    messageId: string,
  ) {
    setSelectedIds((current) =>
      current.includes(messageId)
        ? current.filter(
            (id) => id !== messageId,
          )
        : [...current, messageId],
    )
  }

  function cancelSelection() {
    setSelectMode(false)
    setSelectedIds([])
  }

  function toggleSelectAll() {
    if (!visibleMessages.length) {
      return
    }

    const allSelected =
      visibleMessages.every(
        (message) =>
          selectedIds.includes(
            message.id,
          ),
      )

    if (allSelected) {
      setSelectedIds([])
      return
    }

    setSelectedIds(
      visibleMessages.map(
        (message) => message.id,
      ),
    )
  }

  async function handleDeleteSelectedForMe() {
    if (!selectedIds.length) return

    if (
      !window.confirm(
        `Supprimer ${selectedIds.length} message(s) pour vous ?`,
      )
    ) {
      return
    }

    try {
      await deleteMessagesForMe(
        selectedIds,
        currentUserId,
      )

      setMessages((current) =>
        current.filter(
          (message) =>
            !selectedIds.includes(
              message.id,
            ),
        ),
      )

      cancelSelection()

      toast.success(
        'Messages supprimés',
      )
    } catch (error) {
      toast.error(
        'Suppression impossible',
        {
          description:
            error instanceof Error
              ? error.message
              : undefined,
        },
      )
    }
  }

  async function handleDeleteSelectedForEveryone() {
    const ownSelectedIds =
      selectedIds.filter(
        (id) =>
          messages.find(
            (message) =>
              message.id === id,
          )?.senderId ===
          currentUserId,
      )

    if (!ownSelectedIds.length) {
      toast.error(
        'Sélectionnez vos propres messages pour cette action.',
      )
      return
    }

    if (
      !window.confirm(
        `Supprimer ${ownSelectedIds.length} message(s) pour tout le monde ?`,
      )
    ) {
      return
    }

    try {
      await deleteMessagesForEveryone(
        ownSelectedIds,
      )

      setMessages((current) =>
        current.map((message) =>
          ownSelectedIds.includes(
            message.id,
          )
            ? {
                ...message,
                text: undefined,
                attachment:
                  undefined,
                attachments: [],
                deletedForEveryone:
                  true,
              }
            : message,
        ),
      )

      cancelSelection()

      toast.success(
        'Messages supprimés pour tout le monde',
      )
    } catch (error) {
      toast.error(
        'Suppression impossible',
        {
          description:
            error instanceof Error
              ? error.message
              : undefined,
        },
      )
    }
  }

  async function handleCopy(
    message: ChatMessage,
  ) {
    setOpenMenuId(null)

    const content = [
      message.text ?? '',
      message.forwardComment
        ? `Commentaire : ${message.forwardComment}`
        : '',
      ...message.attachments.map(
        (attachment) =>
          attachment.url,
      ),
    ]
      .filter(Boolean)
      .join('\n')

    if (!content) {
      toast.error(
        'Rien à copier.',
      )
      return
    }

    try {
      await navigator.clipboard.writeText(
        content,
      )

      toast.success(
        'Message copié',
      )
    } catch {
      toast.error(
        'Impossible de copier le message.',
      )
    }
  }

  function handleEdit(
    message: ChatMessage,
  ) {
    setOpenMenuId(null)

    if (
      message.senderId !==
      currentUserId
    ) {
      return
    }

    if (!message.text) {
      toast.error(
        'Seuls les messages texte peuvent être modifiés.',
      )
      return
    }

    setEditingMessageId(
      message.id,
    )
    setReplyingTo(null)
    setForwardingMessage(null)
    setText(message.text)
  }

  function cancelEdit() {
    setEditingMessageId(null)
    setText('')
  }

  function handleReply(
    message: ChatMessage,
  ) {
    setOpenMenuId(null)
    setEditingMessageId(null)
    setForwardingMessage(null)
    setReplyingTo(message)
  }

  function handleForward(
    message: ChatMessage,
  ) {
    setOpenMenuId(null)
    setEditingMessageId(null)
    setReplyingTo(null)
    setForwardingMessage(message)
    setForwardComment('')
  }

  async function confirmForward() {
    if (!forwardingMessage) return

    setSending(true)

    try {
      const savedMessage =
        await forwardMessage(
          forwardingMessage.id,
          clientId,
          currentUserId,
          forwardComment,
        )

      const displayMessage =
        buildDisplayMessage(
          savedMessage,
        )

      setMessages((current) => [
        ...current,
        displayMessage,
      ])

      setForwardingMessage(null)
      setForwardComment('')

      toast.success(
        'Message transféré',
      )
    } catch (error) {
      toast.error(
        'Transfert impossible',
        {
          description:
            error instanceof Error
              ? error.message
              : undefined,
        },
      )
    } finally {
      setSending(false)
    }
  }

  async function handleReaction(
    messageId: string,
    emoji: string,
  ) {
    try {
      await toggleMessageReaction(
        messageId,
        currentUserId,
        emoji,
      )
    } catch (error) {
      toast.error(
        'Réaction impossible',
        {
          description:
            error instanceof Error
              ? error.message
              : undefined,
        },
      )
    }
  }

  function insertEmoji(
    emoji: string,
  ) {
    setText(
      (current) =>
        `${current}${emoji}`,
    )
  }

  const visibleMessages =
    messages.filter(
      (message) =>
        !message.deletedForMe,
    )

  const allVisibleSelected =
    visibleMessages.length > 0 &&
    visibleMessages.every(
      (message) =>
        selectedIds.includes(
          message.id,
        ),
    )

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <InitialsAvatar
          name={headerName}
          className="size-9"
        />

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">
            {headerName}
          </p>

          <p className="truncate text-xs text-muted-foreground">
            {headerMeta}
          </p>
        </div>

        <div className="ml-auto">
          {!onlyAdminPosts && (
            <Button
              type="button"
              variant={
                selectMode
                  ? 'secondary'
                  : 'ghost'
              }
              size="sm"
              onClick={() => {
                if (selectMode) {
                  cancelSelection()
                } else {
                  setSelectMode(true)
                }
              }}
            >
              {selectMode
                ? 'Annuler'
                : 'Sélectionner'}
            </Button>
          )}
        </div>
      </div>

      {selectMode && (
        <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/50 px-4 py-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={
              visibleMessages.length === 0
            }
            onClick={toggleSelectAll}
          >
            {allVisibleSelected
              ? 'Tout désélectionner'
              : 'Tout sélectionner'}
          </Button>

          <span className="text-xs text-muted-foreground">
            {selectedIds.length}{' '}
            message
            {selectedIds.length > 1
              ? 's'
              : ''}{' '}
            sélectionné
            {selectedIds.length > 1
              ? 's'
              : ''}
          </span>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!selectedIds.length}
            onClick={
              handleDeleteSelectedForMe
            }
          >
            <Trash2 className="mr-1.5 size-3.5" />
            Supprimer pour moi
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!selectedIds.length}
            onClick={
              handleDeleteSelectedForEveryone
            }
          >
            <Trash2 className="mr-1.5 size-3.5" />
            Supprimer pour tout le monde
          </Button>
        </div>
      )}

      <div className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <Loader2
              className="size-6 animate-spin text-muted-foreground"
              aria-label="Chargement des messages"
            />
          </div>
        ) : visibleMessages.length === 0 ? (
          <div className="flex h-full items-center justify-center">
            <p className="text-sm text-muted-foreground">
              Aucun message pour le moment.
            </p>
          </div>
        ) : (
          visibleMessages.map(
            (message) => {
              const mine = message.isAi ? perspective === 'admin' : message.senderId === currentUserId

              const isOpen =
                openMenuId ===
                message.id

              const selected =
                selectedIds.includes(
                  message.id,
                )

              const reactionOpen =
                openReactionId ===
                message.id

              return (
                <div
                  key={message.id}
                  className={cn(
                    'group flex',
                    mine
                      ? 'justify-end'
                      : 'justify-start',
                  )}
                >
                  <div
                    className={cn(
                      'flex max-w-[90%] items-start gap-1',
                      mine
                        ? 'flex-row-reverse'
                        : 'flex-row',
                    )}
                  >
                    {selectMode && (
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() =>
                          toggleSelected(
                            message.id,
                          )
                        }
                        className="mt-4 size-4 cursor-pointer"
                        aria-label={`Sélectionner le message ${message.id}`}
                      />
                    )}

                    <div className="flex flex-col">
                      <div
                        className={cn(
                          'max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
                          mine
                            ? 'rounded-br-md bg-primary text-primary-foreground'
                            : 'rounded-bl-md bg-card text-foreground',
                          selected &&
                            'ring-2 ring-ring',
                        )}
                      >
                        {message.deletedForEveryone ? (
                          <p
                            className={cn(
                              'italic leading-relaxed',
                              mine
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground',
                            )}
                          >
                            Message supprimé
                          </p>
                        ) : (
                          <>
                            {message.forwardedFromId && (
                              <div
                                className={cn(
                                  'mb-2 flex items-center gap-1 text-[10px]',
                                  mine
                                    ? 'text-primary-foreground/70'
                                    : 'text-muted-foreground',
                                )}
                              >
                                <Forward className="size-3" />
                                Message transféré
                              </div>
                            )}

                            {message.replyToId && (
                              <div
                                className={cn(
                                  'mb-2 rounded border-l-2 px-2 py-1 text-[10px]',
                                  mine
                                    ? 'border-primary-foreground/40 bg-primary-foreground/10'
                                    : 'border-border bg-muted',
                                )}
                              >
                                Réponse à un message
                              </div>
                            )}

                            {message.forwardComment && (
                              <p
                                className={cn(
                                  'mb-1 text-xs italic',
                                  mine
                                    ? 'text-primary-foreground/80'
                                    : 'text-muted-foreground',
                                )}
                              >
                                {message.forwardComment}
                              </p>
                            )}

                            {message.text && (
                              <p className="whitespace-pre-wrap leading-relaxed">
                                {message.text}
                              </p>
                            )}

                            {message.attachment && (
                              <AttachmentBubble
                                type={
                                  message
                                    .attachment
                                    .type
                                }
                                name={
                                  message
                                    .attachment
                                    .name
                                }
                                url={
                                  message
                                    .attachment
                                    .url
                                }
                                mine={mine}
                              />
                            )}
                          </>
                        )}

                        <div className="mt-1 flex items-center justify-end gap-1">
                          {message.editedAt &&
                            !message.deletedForEveryone && (
                              <span
                                className={cn(
                                  'text-[9px]',
                                  mine
                                    ? 'text-primary-foreground/60'
                                    : 'text-muted-foreground',
                                )}
                              >
                                Modifié
                              </span>
                            )}

                          <span
                            className={cn(
                              'text-[10px]',
                              mine
                                ? 'text-primary-foreground/70'
                                : 'text-muted-foreground',
                            )}
                          >
                            {message.time}
                          </span>

                          {mine &&
                            !message.deletedForEveryone &&
                            (message.readAt ? (
                              <CheckCheck
                                className="size-3.5"
                                aria-label="Message lu"
                              />
                            ) : (
                              <Check
                                className="size-3.5"
                                aria-label="Message envoyé"
                              />
                            ))}
                        </div>
                      </div>

                      {!message.deletedForEveryone &&
                        Object.keys(
                          message.reactions ?? {},
                        ).length > 0 && (
                          <div
                            className={cn(
                              'mt-1 flex flex-wrap gap-1',
                              mine
                                ? 'justify-end'
                                : 'justify-start',
                            )}
                          >
                            {Object.entries(
                              message.reactions ??
                                {},
                            ).map(
                              ([
                                emoji,
                                users,
                              ]) =>
                                users.length >
                                  0 && (
                                  <button
                                    key={emoji}
                                    type="button"
                                    onClick={() =>
                                      handleReaction(
                                        message.id,
                                        emoji,
                                      )
                                    }
                                    className="rounded-full border border-border bg-card px-2 py-0.5 text-xs shadow-sm hover:bg-muted"
                                  >
                                    {emoji}{' '}
                                    {users.length}
                                  </button>
                                ),
                            )}
                          </div>
                        )}

                      {!message.deletedForEveryone && (
                        <div
                          className={cn(
                            'mt-1 flex flex-wrap items-center gap-1',
                            mine
                              ? 'justify-end'
                              : 'justify-start',
                          )}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleCopy(
                                message,
                              )
                            }
                            className="rounded px-1.5 py-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Copy className="mr-1 inline size-3" />
                            Copier
                          </button>

                          {mine &&
                            message.text && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleEdit(
                                    message,
                                  )
                                }
                                className="rounded px-1.5 py-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
                              >
                                <Edit3 className="mr-1 inline size-3" />
                                Modifier
                              </button>
                            )}

                          <button
                            type="button"
                            onClick={() =>
                              handleReply(
                                message,
                              )
                            }
                            className="rounded px-1.5 py-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Reply className="mr-1 inline size-3" />
                            Répondre
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleForward(
                                message,
                              )
                            }
                            className="rounded px-1.5 py-1 text-[10px] text-muted-foreground hover:bg-muted hover:text-foreground"
                          >
                            <Forward className="mr-1 inline size-3" />
                            Transférer
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenMenuId(
                                  isOpen
                                    ? null
                                    : message.id,
                                )
                              }
                              aria-label="Options du message"
                              className="flex size-6 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                            >
                              <MoreVertical className="size-3.5" />
                            </button>

                            {isOpen && (
                              <>
                                <div
                                  className="fixed inset-0 z-10"
                                  onClick={() =>
                                    setOpenMenuId(
                                      null,
                                    )
                                  }
                                />

                                <div
                                  className={cn(
                                    'absolute z-20 bottom-7 w-52 rounded-lg border border-border bg-card py-1 shadow-lg',
                                    mine
                                      ? 'right-0'
                                      : 'left-0',
                                  )}
                                >
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleDeleteForMe(
                                        message.id,
                                      )
                                    }
                                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs hover:bg-muted"
                                  >
                                    <Trash2 className="size-3.5" />
                                    Supprimer pour moi
                                  </button>

                                  {mine && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteForEveryone(
                                          message.id,
                                        )
                                      }
                                      className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-destructive hover:bg-destructive/10"
                                    >
                                      <Trash2 className="size-3.5" />
                                      Supprimer pour tout le monde
                                    </button>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      )}

                      {!message.deletedForEveryone && (
                        <div
                          className={cn(
                            'relative mt-1 flex items-center gap-1',
                            mine
                              ? 'justify-end'
                              : 'justify-start',
                          )}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setOpenReactionId(
                                (current) =>
                                  current ===
                                  message.id
                                    ? null
                                    : message.id,
                              )
                            }
                            className="flex size-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label="Ajouter une réaction"
                            title="Réagir"
                          >
                            <Smile className="size-3.5" />
                          </button>

                          {reactionOpen && (
                            <>
                              <div
                                className="fixed inset-0 z-10"
                                onClick={() =>
                                  setOpenReactionId(
                                    null,
                                  )
                                }
                              />

                              <div
                                className={cn(
                                  'absolute bottom-7 z-20 flex flex-wrap gap-1 rounded-xl border border-border bg-card p-2 shadow-lg',
                                  mine
                                    ? 'right-0'
                                    : 'left-0',
                                )}
                              >
                                {EMOJIS.map(
                                  (emoji) => (
                                    <button
                                      key={emoji}
                                      type="button"
                                      onClick={() => {
                                        void handleReaction(
                                          message.id,
                                          emoji,
                                        )
                                        setOpenReactionId(
                                          null,
                                        )
                                      }}
                                      className="flex size-8 items-center justify-center rounded-lg text-lg transition-transform hover:scale-125 hover:bg-muted"
                                      title={`Réagir ${emoji}`}
                                    >
                                      {emoji}
                                    </button>
                                  ),
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )
            },
          )
        )}


        <div ref={endRef} />
      </div>

      {forwardingMessage && (
        <div className="border-t border-border bg-muted/40 px-4 py-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold">
              Transférer le message
            </p>

            <button
              type="button"
              onClick={() =>
                setForwardingMessage(null)
              }
              className="rounded-full p-1 hover:bg-muted"
            >
              <X className="size-4" />
            </button>
          </div>

          <div className="mb-2 rounded-lg border border-border bg-card p-2 text-xs">
            {forwardingMessage.text ||
              forwardingMessage.attachment?.name ||
              'Message'}
          </div>

          <textarea
            value={forwardComment}
            onChange={(event) =>
              setForwardComment(
                event.target.value,
              )
            }
            placeholder="Ajouter un commentaire (facultatif)..."
            className="min-h-16 w-full resize-none rounded-lg border border-input bg-background p-2 text-xs outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />

          <div className="mt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setForwardingMessage(null)
              }
            >
              Annuler
            </Button>

            <Button
              type="button"
              size="sm"
              disabled={sending}
              onClick={confirmForward}
            >
              {sending && (
                <Loader2 className="mr-1.5 size-3.5 animate-spin" />
              )}
              Transférer
            </Button>
          </div>
        </div>
      )}

      {onlyAdminPosts &&
      perspective === 'client' ? (
        <div className="border-t border-border bg-muted/50 px-4 py-3 text-center text-xs text-muted-foreground">
          Ce canal est en lecture seule.
          Utilisez votre discussion privée
          pour contacter {headerName}.
        </div>
      ) : (
        <form
          onSubmit={handleSend}
          className="border-t border-border p-3"
        >
          {editingMessageId && (
            <div className="mb-2 flex items-center justify-between rounded-lg bg-muted px-3 py-2">
              <span className="text-xs text-muted-foreground">
                Modification du message
              </span>

              <button
                type="button"
                onClick={cancelEdit}
                className="rounded p-1 hover:bg-background"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {replyingTo &&
            !editingMessageId && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-muted px-3 py-2">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold">
                    Réponse à
                  </p>

                  <p className="truncate text-xs text-muted-foreground">
                    {replyingTo.text ||
                      replyingTo.attachment?.name ||
                      'Message'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setReplyingTo(null)
                  }
                  className="rounded p-1 hover:bg-background"
                >
                  <X className="size-4" />
                </button>
              </div>
            )}

          {showEmojiPicker && (
            <div className="mb-2 flex flex-wrap gap-1 rounded-lg border border-border bg-card p-2 shadow-sm">
              {EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() =>
                    insertEmoji(emoji)
                  }
                  className="rounded p-1.5 text-lg hover:bg-muted"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*,.pdf,.doc,.docx,.xls,.xlsx,.txt"
              className="sr-only"
              onChange={
                handleFileChange
              }
            />

            <AttachButton
              icon={
                uploading
                  ? Loader2
                  : Paperclip
              }
              label={
                uploading
                  ? 'Envoi du fichier...'
                  : 'Envoyer un fichier'
              }
              onClick={
                triggerFilePicker
              }
              disabled={
                uploading ||
                sending ||
                Boolean(
                  editingMessageId,
                )
              }
              spin={uploading}
            />

            <button
              type="button"
              onClick={() =>
                setShowEmojiPicker(
                  (current) => !current,
                )
              }
              className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              aria-label="Emoji"
              title="Emoji"
            >
              <Smile className="size-4.5" />
            </button>

            <input
              value={text}
              onChange={(event) =>
                setText(
                  event.target.value,
                )
              }
              placeholder={
                editingMessageId
                  ? 'Modifier le message...'
                  : 'Écrivez un message...'
              }
              aria-label="Message"
              disabled={
                sending ||
                uploading
              }
              className="h-10 flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-60"
            />

            <Button
              type="submit"
              size="icon"
              className="size-10 shrink-0 rounded-full"
              aria-label={
                editingMessageId
                  ? 'Enregistrer'
                  : 'Envoyer'
              }
              disabled={
                sending ||
                uploading ||
                !text.trim()
              }
            >
              {sending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : editingMessageId ? (
                <Check className="size-4" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </div>
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
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 block overflow-hidden rounded-lg"
      >
        <img
          src={url}
          alt={name}
          className="max-h-56 w-full object-cover"
        />
      </a>
    )
  }

  if (type === 'video' && url) {
    return (
      <video
        src={url}
        controls
        preload="metadata"
        className="mt-1 max-h-56 w-full rounded-lg"
      />
    )
  }

  const Icon =
    type === 'image'
      ? ImageIcon
      : type === 'video'
        ? Video
        : FileText

  const content = (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg px-2.5 py-2',
        mine
          ? 'bg-primary-foreground/15'
          : 'bg-muted',
      )}
    >
      <Icon
        className="size-4 shrink-0"
        aria-hidden="true"
      />

      <span className="truncate text-xs font-medium">
        {name}
      </span>
    </div>
  )

  if (url) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-1 block"
      >
        {content}
      </a>
    )
  }

  return (
    <div className="mt-1">
      {content}
    </div>
  )
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
      <Icon
        className={cn(
          'size-4.5',
          spin && 'animate-spin',
        )}
        aria-hidden="true"
      />
    </button>
  )
}