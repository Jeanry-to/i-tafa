'use client'

import { useState } from 'react'
import { ImageIcon, Megaphone, Send, Video } from 'lucide-react'
import { toast } from 'sonner'
import { InitialsAvatar } from '@/components/initials-avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { announcements as seed, BRAND, type Announcement } from '@/lib/mock-data'

export function AnnouncementComposer() {
  const [list, setList] = useState<Announcement[]>(seed)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')

  function publish(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    setList((l) => [
      {
        id: `${Date.now()}`,
        title: title.trim(),
        body: body.trim(),
        date: "À l'instant",
      },
      ...l,
    ])
    setTitle('')
    setBody('')
    toast.success('Annonce publiée', {
      description: 'Tous les clients la verront sur leur tableau de bord.',
    })
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Card className="lg:sticky lg:top-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Megaphone className="size-4" aria-hidden="true" />
              Nouvelle annonce
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Vous êtes le seul à publier. Les clients lisent sans répondre.
            </p>
            <form onSubmit={publish} className="mt-4 flex flex-col gap-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de l'annonce"
                required
              />
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Votre message…"
                rows={5}
                required
              />
              <div className="flex items-center gap-1">
                <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                  <ImageIcon className="size-4" aria-hidden="true" />
                  Photo
                </Button>
                <Button type="button" variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                  <Video className="size-4" aria-hidden="true" />
                  Vidéo
                </Button>
              </div>
              <Button type="submit" className="gap-2">
                <Send className="size-4" aria-hidden="true" />
                Publier l&apos;annonce
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 lg:col-span-3">
        {list.map((a) => (
          <Card key={a.id}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <InitialsAvatar name={BRAND.owner} className="size-9" />
                <div>
                  <p className="text-sm font-semibold">{BRAND.owner}</p>
                  <p className="text-xs text-muted-foreground">{a.date}</p>
                </div>
              </div>
              <h3 className="mt-3 font-display text-lg font-bold">{a.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-foreground/90">{a.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
