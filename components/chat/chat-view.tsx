'use client'

import { useEffect, useRef, useState } from 'react'
import {
  FileText,
  ImageIcon,
  Paperclip,
  Send,
  Video,
} from 'lucide-react'
import { InitialsAvatar } from '@/components/initials-avatar'
import { Button } from '@/components/ui/button'
import type { ChatMessage } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export function ChatView({
  headerName,
  headerMeta,
  initialMessages,
  perspective,
  onlyAdminPosts = false,
}: {
  headerName: string
  headerMeta: string
  initialMessages: ChatMessage[]
  perspective: 'client' | 'admin'
  onlyAdminPosts?: boolean
}) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [text, setText] = useState('')
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMessages(initialMessages)
  }, [initialMessages])

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function now() {
    return new Date().toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function send(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return
    setMessages((m) => [
      ...m,
      { id: `${Date.now()}`, from: perspective, text: text.trim(), time: now() },
    ])
    setText('')
  }

  function attach(type: 'image' | 'video' | 'file') {
    const names = {
      image: 'photo.jpg',
      video: 'video.mp4',
      file: 'document.pdf',
    }
    setMessages((m) => [
      ...m,
      {
        id: `${Date.now()}`,
        from: perspective,
        attachment: { type, name: names[type] },
        time: now(),
      },
    ])
  }

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-3">
        <InitialsAvatar name={headerName} className="size-9" />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{headerName}</p>
          <p className="truncate text-xs text-muted-foreground">{headerMeta}</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto bg-muted/30 p-4">
        {messages.map((m) => {
          const mine = m.from === perspective
          return (
            <div
              key={m.id}
              className={cn('flex', mine ? 'justify-end' : 'justify-start')}
            >
              <div
                className={cn(
                  'max-w-[78%] rounded-2xl px-3.5 py-2 text-sm shadow-sm',
                  mine
                    ? 'rounded-br-md bg-primary text-primary-foreground'
                    : 'rounded-bl-md bg-card text-foreground',
                )}
              >
                {m.text && <p className="leading-relaxed">{m.text}</p>}
                {m.attachment && <AttachmentBubble type={m.attachment.type} name={m.attachment.name} mine={mine} />}
                <span
                  className={cn(
                    'mt-1 block text-[10px]',
                    mine ? 'text-primary-foreground/70' : 'text-muted-foreground',
                  )}
                >
                  {m.time}
                </span>
              </div>
            </div>
          )
        })}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      {onlyAdminPosts && perspective === 'client' ? (
        <div className="border-t border-border bg-muted/50 px-4 py-3 text-center text-xs text-muted-foreground">
          Ce canal est en lecture seule. Utilisez votre discussion privée pour
          contacter {headerName}.
        </div>
      ) : (
        <form onSubmit={send} className="flex items-center gap-2 border-t border-border p-3">
          <div className="flex items-center">
            <AttachButton icon={ImageIcon} label="Envoyer une photo" onClick={() => attach('image')} />
            <AttachButton icon={Video} label="Envoyer une vidéo" onClick={() => attach('video')} />
            <AttachButton icon={Paperclip} label="Envoyer un fichier" onClick={() => attach('file')} />
          </div>
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Écrivez un message…"
            aria-label="Message"
            className="h-10 flex-1 rounded-full border border-input bg-background px-4 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="icon" className="size-10 shrink-0 rounded-full" aria-label="Envoyer">
            <Send className="size-4" />
          </Button>
        </form>
      )}
    </div>
  )
}

function AttachmentBubble({
  type,
  name,
  mine,
}: {
  type: 'image' | 'video' | 'file'
  name: string
  mine: boolean
}) {
  const Icon = type === 'image' ? ImageIcon : type === 'video' ? Video : FileText
  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-lg px-2.5 py-2',
        mine ? 'bg-primary-foreground/15' : 'bg-muted',
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      <span className="text-xs font-medium">{name}</span>
    </div>
  )
}

function AttachButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof ImageIcon
  label: string
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      <Icon className="size-4.5" aria-hidden="true" />
    </button>
  )
}
