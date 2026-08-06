'use client'

import { useState } from 'react'
import {
  LayoutDashboard,
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
import {
  announcements,
  BRAND,
  currentClient,
  privateThread,
} from '@/lib/mock-data'

const nav: NavItem[] = [
  { id: 'overview', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'annonces', label: 'Annonces', icon: Megaphone },
  { id: 'messages', label: 'Messages', icon: MessageCircle, badge: 1 },
  { id: 'profil', label: 'Mon profil', icon: UserRound },
]

const titles: Record<string, { title: string; subtitle: string }> = {
  overview: {
    title: `Bonjour, ${currentClient.name.split(' ')[0]}`,
    subtitle: 'Voici votre espace i-tafa.',
  },
  annonces: { title: 'Annonces', subtitle: `Publications officielles de ${BRAND.owner}.` },
  messages: { title: 'Messages', subtitle: `Discussion privée avec ${BRAND.owner}.` },
  profil: { title: 'Mon profil', subtitle: 'Gérez vos informations et votre sécurité.' },
}

export function ClientDashboard() {
  const [active, setActive] = useState('overview')
  const head = titles[active]

  return (
    <DashboardShell
      navItems={nav}
      activeId={active}
      onNavigate={setActive}
      roleLabel="Espace client"
      userName={currentClient.name}
      userMeta={currentClient.email}
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-6 lg:px-8 lg:py-8">
        <header className="mb-6">
          <h1 className="font-display text-2xl font-bold text-balance">{head.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{head.subtitle}</p>
        </header>

        {active === 'overview' && <Overview onOpenMessages={() => setActive('messages')} />}
        {active === 'annonces' && <AnnouncementsFeed />}
        {active === 'messages' && (
          <div className="h-[calc(100vh-13rem)]">
            <ChatView
              headerName={BRAND.owner}
              headerMeta="Administrateur i-tafa · en ligne"
              initialMessages={privateThread.c1}
              perspective="client"
            />
          </div>
        )}
        {active === 'profil' && <ProfileForm />}
      </div>
    </DashboardShell>
  )
}

function Overview({ onOpenMessages }: { onOpenMessages: () => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <RulesCard />
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">Dernières annonces</h2>
          </div>
          <div className="flex flex-col gap-3">
            {announcements.slice(0, 2).map((a) => (
              <Card key={a.id}>
                <CardContent className="p-4">
                  <p className="text-xs text-muted-foreground">{a.date}</p>
                  <p className="mt-0.5 font-semibold">{a.title}</p>
                  <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                    {a.body}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <h3 className="font-display font-bold">Besoin d&apos;aide ?</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Contactez {BRAND.owner} directement dans votre discussion privée.
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
              <span className="text-muted-foreground">Accès</span>
              <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                Actif
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Appareil</span>
              <span className="font-medium">1 connecté</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Membre depuis</span>
              <span className="font-medium">Janv. 2026</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
