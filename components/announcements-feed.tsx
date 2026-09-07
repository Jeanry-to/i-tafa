'use client'

import { useEffect, useState } from 'react'
import { ImageIcon, Loader2, Megaphone, Video } from 'lucide-react'
import { InitialsAvatar } from '@/components/initials-avatar'
import { Card, CardContent } from '@/components/ui/card'
import { BRAND } from '@/lib/mock-data'
import { getAnnouncements, type Announcement } from '@/lib/services/api'

export function AnnouncementsFeed() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    getAnnouncements()
      .then((data) => {
        if (active) setAnnouncements(data)
      })
      .catch((err) => console.error('Erreur chargement annonces:', err))
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4">
        <Megaphone className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          Canal d&apos;annonces officiel. Seul {BRAND.owner} publie ici ; la
          lecture seule est activee pour les clients.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : announcements.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Aucune annonce pour le moment.
        </p>
      ) : (
        announcements.map((a) => (
          <Card key={a.id}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <InitialsAvatar name={BRAND.owner} className="size-9" />
                <div>
                  <p className="text-sm font-semibold">
                    {BRAND.owner}{' '}
                    <span className="font-normal text-muted-foreground">· Admin</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{a.date}</p>
                </div>
              </div>
              <h3 className="mt-4 font-display text-lg font-bold">{a.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
                {a.body}
              </p>
              {a.attachment && (
                <AnnouncementAttachment
                  type={a.attachment.type}
                  name={a.attachment.name}
                  url={a.attachment.url}
                />
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}

function AnnouncementAttachment({
  type,
  name,
  url,
}: {
  type: 'image' | 'video'
  name: string
  url?: string
}) {
  if (type === 'image' && url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="mt-4 block overflow-hidden rounded-lg">
        <img src={url} alt={name} className="max-h-80 w-full object-cover" />
      </a>
    )
  }

  if (type === 'video' && url) {
    return <video src={url} controls className="mt-4 max-h-80 w-full rounded-lg" />
  }

  const Icon = type === 'image' ? ImageIcon : Video
  return (
    <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/60 p-3 text-sm text-muted-foreground">
      <Icon className="size-4" aria-hidden="true" />
      {name}
    </div>
  )
}
