'use client'

import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Loader2,
  Megaphone,
  MessageCircle,
  UserRound,
} from 'lucide-react'
import { AnnouncementsFeed } from '@/components/announcements-feed'
import { ChatView } from '@/components/chat/chat-view'
import { ProfileForm } from '@/components/client/profile-form'
import { DashboardShell, type NavItem } from '@/components/dashboard/dashboard-shell'
import { RulesCard } from '@/components/rules-card'
import { Card, CardContent } from '@/components/ui/card'
import { BRAND } from '@/lib/mock-data'
import { supabase } from '@/lib/supabase'
import { applyTheme, getStoredTheme } from '@/lib/theme'
import {
  getAnnouncements,
  getClientForProfile,
  getCurrentProfile,
  getUnreadCountForClient,
  isClientSuspended,
  signOut,
  type Announcement,
  type Client,
} from '@/lib/services/api'

const baseNav: Omit<NavItem, 'badge'>[] = [
  { id: 'overview', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'annonces', label: 'Annonces', icon: Megaphone },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'profil', label: 'Mon profil', icon: UserRound },
]

function formatSuspensionDate(value?: string) {
  return value
    ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(value))
    : null
}

export function ClientDashboard() {
  const [active, setActive] = useState('overview')
  const [profile, setProfile] = useState<{ id: string; full_name: string; email: string } | null>(null)
  const [client, setClient] = useState<Client | null>(null)
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [suspendedClient, setSuspendedClient] = useState<Client | null>(null)
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    applyTheme(getStoredTheme())
  }, [])

  useEffect(() => {
    async function load() {
      try {
        const currentProfile = await getCurrentProfile()
        if (!currentProfile) {
          setLoading(false)
          return
        }

        const [clientRow, announcementRows] = await Promise.all([
          getClientForProfile(currentProfile.id),
          getAnnouncements(),
        ])

        if (clientRow && isClientSuspended(clientRow)) {
          setSuspendedClient(clientRow)
          await signOut()
          setLoading(false)
          return
        }

        setProfile(currentProfile)
        setClient(clientRow)
        setAnnouncements(announcementRows)

        if (clientRow) {
          getUnreadCountForClient(clientRow.id, currentProfile.id)
            .then(setUnreadCount)
            .catch((err) => console.error('Erreur comptage non lus:', err))
        }
      } catch (err) {
        console.error('Erreur chargement espace client:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  useEffect(() => {
    if (!client) return

    const channel = supabase
      .channel(`client-status:${client.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'clients', filter: `id=eq.${client.id}` },
        async (payload) => {
          const updated = payload.new as {
            status: 'actif' | 'suspendu'
            suspension_reason: string | null
            suspended_until: string | null
          }
          const nowSuspended = isClientSuspended({
            status: updated.status,
            suspendedUntil: updated.suspended_until ?? undefined,
          })
          if (nowSuspended) {
            setSuspendedClient({
              ...client,
              status: updated.status,
              suspensionReason: updated.suspension_reason ?? undefined,
              suspendedUntil: updated.suspended_until ?? undefined,
            })
            setClient(null)
            await signOut()
          }
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [client])

  useEffect(() => {
    if (!client || !profile) return

    const channel = supabase
      .channel(`client-unread:${client.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `client_id=eq.${client.id}` },
        (payload) => {
          const row = payload.new as { sender_id: string }
          if (row.sender_id === profile.id) return
          if (active === 'messages') return
          setUnreadCount((prev) => prev + 1)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [client, profile, active])

  const nav: NavItem[] = baseNav.map((item) =>
    item.id === 'messages' && unreadCount > 0 ? { ...item, badge: unreadCount } : item,
  )

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="size-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    )
  }

  if (suspendedClient) {
    const until = formatSuspensionDate(suspendedClient.suspendedUntil)
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div className="max-w-md">
          <h1 className="font-display text-xl font-bold text-destructive">Compte suspendu</h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {suspendedClient.suspensionReason || 'Votre acces a i-tafa est actuellement suspendu.'}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {until ? `Fin prevue : ${until}` : 'Aucune date de fin definie.'}
          </p>
          <p className="mt-4 text-sm text-muted-foreground">
            Contactez Admin si vous pensez qu&apos;il s&apos;agit d&apos;une erreur.
          </p>
        </div>
      </div>
    )
  }

  if (!profile || !client) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">
          Impossible de charger votre profil. Reconnectez-vous ou contactez Admin.
        </p>
      </div>
    )
  }

  const titles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: `Bonjour, ${profile.full_name?.split(' ')[0] ?? 'vous'}`,
      subtitle: 'Voici votre espace i-tafa.',
    },
    annonces: { title: 'Annonces', subtitle: `Publications officielles de Admin.` },
    messages: { title: 'Messages', subtitle: `Discussion privee avec Admin.` },
    profil: { title: 'Mon profil', subtitle: 'Gerez vos informations et votre securite.' },
  }
  const head = titles[active]

  return (
    <DashboardShell
      navItems={nav}
      activeId={active}
      onNavigate={setActive}
      roleLabel="Espace client"
      userName={profile.full_name || profile.email}
      userMeta={profile.email}
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-6 lg:px-8 lg:py-8">
        <header className="mb-6">
          <h1 className="font-display text-2xl font-bold text-balance">{head.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{head.subtitle}</p>
        </header>

        {active === 'overview' && (
          <Overview announcements={announcements} onOpenMessages={() => setActive('messages')} />
        )}
        {active === 'annonces' && <AnnouncementsFeed />}
        {active === 'messages' && (
          <div className="h-[calc(100vh-13rem)]">
            <ChatView
              clientId={client.id}
              currentUserId={profile.id}
              headerName="Admin"
              headerMeta="Administrateur i-tafa"
              perspective="client"
              onMessagesRead={() => setUnreadCount(0)}
            />
          </div>
        )}
        {active === 'profil' && <ProfileForm />}
      </div>
    </DashboardShell>
  )
}

function Overview({
  announcements,
  onOpenMessages,
}: {
  announcements: Announcement[]
  onOpenMessages: () => void
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <RulesCard />
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Dernieres annonces</h2>
          </div>
          <div className="flex flex-col gap-3">
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">Aucune annonce pour le moment.</p>
            ) : (
              announcements.slice(0, 2).map((a) => (
                <Card key={a.id}>
                  <CardContent className="p-4">
                    <p className="text-xs text-muted-foreground">{a.date}</p>
                    <p className="mt-0.5 font-semibold">{a.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                      {a.body}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <h3 className="font-display font-bold">Besoin d&apos;aide ?</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Contactez Admin directement dans votre discussion privee.
            </p>
            <button
              onClick={onOpenMessages}
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              <MessageCircle className="size-4" aria-hidden="true" />
              Ouvrir la discussion
            </button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex flex-col gap-3 p-5 text-sm">
            <p className="font-semibold">Statut du compte</p>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Acces</span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Actif
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
