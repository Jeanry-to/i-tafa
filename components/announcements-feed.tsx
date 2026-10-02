'use client'

import { useEffect, useState } from 'react'
import {
  ImageIcon,
  Loader2,
  Megaphone,
  Video,
} from 'lucide-react'
import { InitialsAvatar } from '@/components/initials-avatar'
import { LiveBroadcast } from '@/components/live/live-broadcast'
import { LiveViewer } from '@/components/live/live-viewer'
import {
  getActiveLiveSession,
  getAnnouncements,
  type Announcement,
  type LiveSession,
} from '@/lib/services/api'
import { Card, CardContent } from '@/components/ui/card'
import { supabase } from '@/lib/supabase'

export function AnnouncementsFeed() {
  const [announcements, setAnnouncements] =
    useState<Announcement[]>([])

  const [liveSession, setLiveSession] =
    useState<LiveSession | null>(null)

  const [currentUserId, setCurrentUserId] =
    useState<string | null>(null)

  const [hostingLive, setHostingLive] =
    useState(false)

  const [loading, setLoading] =
    useState(true)

  async function loadLive() {
    try {
      const session =
        await getActiveLiveSession()

      setLiveSession(session)

      if (
        currentUserId &&
        session?.hostId === currentUserId
      ) {
        setHostingLive(true)
      } else {
        setHostingLive(false)
      }
    } catch (error) {
      console.error(
        'Erreur chargement Live:',
        error,
      )
    }
  }

  useEffect(() => {
    let active = true

    async function load() {
      try {
        const [
          announcementData,
          liveData,
          userData,
        ] = await Promise.all([
          getAnnouncements(),
          getActiveLiveSession(),
          supabase.auth.getUser(),
        ])

        if (!active) return

        setAnnouncements(
          announcementData,
        )

        setLiveSession(liveData)

        const userId =
          userData.data.user?.id ?? null

        setCurrentUserId(userId)

        setHostingLive(
          Boolean(
            userId &&
              liveData?.hostId === userId,
          ),
        )
      } catch (error) {
        console.error(
          'Erreur chargement annonces:',
          error,
        )
      } finally {
        if (active) {
          setLoading(false)
        }
      }
    }

    load()

    const interval = window.setInterval(
      () => {
        loadLive()
      },
      5000,
    )

    return () => {
      active = false
      window.clearInterval(interval)
    }
  }, [currentUserId])

  return (
    <div className="flex flex-col gap-4">
      <LiveBroadcast
        onStarted={(session) => {
          setLiveSession(session)
          setHostingLive(true)
        }}
        onEnded={() => {
          setLiveSession(null)
          setHostingLive(false)
        }}
      />

      {liveSession &&
        !hostingLive && (
          <LiveViewer
            session={liveSession}
            onEnded={() => {
              setLiveSession(null)
              setHostingLive(false)
            }}
          />
        )}

      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4">
        <Megaphone
          className="mt-0.5 size-5 shrink-0 text-primary"
          aria-hidden="true"
        />

        <p className="text-sm leading-relaxed text-muted-foreground">
          Canal d&apos;annonces officiel.
          Consultez les annonces de votre
          boutique et les Lives disponibles.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2
            className="size-6 animate-spin text-muted-foreground"
            aria-hidden="true"
          />
        </div>
      ) : announcements.length ===
        0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Aucune annonce pour le moment.
        </p>
      ) : (
        announcements.map((a) => (
          <Card key={a.id}>
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <InitialsAvatar
                  name="Admin"
                  className="size-9"
                />

                <div>
                  <p className="text-sm font-semibold">
                    Admin{' '}
                    <span className="font-normal text-muted-foreground">
                      · Admin
                    </span>
                  </p>

                  <p className="text-xs text-muted-foreground">
                    {a.date}
                  </p>
                </div>
              </div>

              <h3 className="mt-4 font-display text-lg font-bold">
                {a.title}
              </h3>

              <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
                {a.body}
              </p>

              {a.attachment && (
                <AnnouncementAttachment
                  type={
                    a.attachment.type
                  }
                  name={
                    a.attachment.name
                  }
                  url={
                    a.attachment.url
                  }
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
  if (
    type === 'image' &&
    url
  ) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className="mt-4 block overflow-hidden rounded-lg"
      >
        <img
          src={url}
          alt={name}
          className="max-h-80 w-full object-cover"
        />
      </a>
    )
  }

  if (
    type === 'video' &&
    url
  ) {
    return (
      <video
        src={url}
        controls
        className="mt-4 max-h-80 w-full rounded-lg"
      />
    )
  }

  const Icon =
    type === 'image'
      ? ImageIcon
      : Video

  return (
    <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/60 p-3 text-sm text-muted-foreground">
      <Icon
        className="size-4"
        aria-hidden="true"
      />

      {name}
    </div>
  )
}