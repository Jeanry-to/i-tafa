'use client'

import { useState } from 'react'
import {
  BookOpen,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  UsersRound,
} from 'lucide-react'
import { AdminMessages } from '@/components/admin/admin-messages'
import { AdminTutorial } from '@/components/admin/admin-tutorial'
import { AnnouncementComposer } from '@/components/admin/announcement-composer'
import { ClientManagement } from '@/components/admin/client-management'
import { DashboardShell, type NavItem } from '@/components/dashboard/dashboard-shell'
import { RulesCard } from '@/components/rules-card'
import { Card, CardContent } from '@/components/ui/card'
import { BRAND, clients } from '@/lib/mock-data'

const nav: NavItem[] = [
  { id: 'overview', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'annonces', label: 'Annonces', icon: Megaphone },
  { id: 'messages', label: 'Messages', icon: MessageCircle, badge: 3 },
  { id: 'clients', label: 'Clients', icon: UsersRound },
  { id: 'tutoriel', label: 'Tutoriel', icon: BookOpen },
]

const titles: Record<string, { title: string; subtitle: string }> = {
  overview: { title: 'Tableau de bord', subtitle: 'Vue d’ensemble de votre activité i-tafa.' },
  annonces: { title: 'Annonces', subtitle: 'Publiez sur le canal officiel en lecture seule.' },
  messages: { title: 'Messages', subtitle: 'Discussions privées avec vos clients.' },
  clients: { title: 'Clients', subtitle: 'Gérez, contactez et modérez vos clients.' },
  tutoriel: { title: 'Tutoriel', subtitle: 'Guide pratique de gestion du site.' },
}

export function AdminDashboard() {
  const [active, setActive] = useState('overview')
  const head = titles[active]

  return (
    <DashboardShell
      navItems={nav}
      activeId={active}
      onNavigate={setActive}
      roleLabel="Espace admin"
      userName={BRAND.owner}
      userMeta="Administrateur i-tafa"
    >
      <div className="mx-auto w-full max-w-6xl px-4 py-6 lg:px-8 lg:py-8">
        <header className="mb-6">
          <h1 className="font-display text-2xl font-bold text-balance">{head.title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{head.subtitle}</p>
        </header>

        {active === 'overview' && <Overview onNavigate={setActive} />}
        {active === 'annonces' && <AnnouncementComposer />}
        {active === 'messages' && <AdminMessages />}
        {active === 'clients' && <ClientManagement />}
        {active === 'tutoriel' && <AdminTutorial />}
      </div>
    </DashboardShell>
  )
}

function Overview({ onNavigate }: { onNavigate: (id: string) => void }) {
  const activeCount = clients.filter((c) => c.status === 'actif').length
  const unread = clients.reduce((n, c) => n + c.unread, 0)

  const stats = [
    { label: 'Clients actifs', value: activeCount, hint: `${clients.length} au total` },
    { label: 'Messages non lus', value: unread, hint: 'à traiter' },
    { label: 'Annonces publiées', value: 3, hint: 'ce mois-ci' },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-5">
              <p className="text-sm text-muted-foreground">{s.label}</p>
              <p className="mt-1 font-display text-3xl font-bold">{s.value}</p>
              <p className="mt-1 text-xs text-muted-foreground">{s.hint}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardContent className="p-5">
              <h2 className="font-display text-lg font-bold">Actions rapides</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <QuickAction
                  icon={Megaphone}
                  title="Publier une annonce"
                  onClick={() => onNavigate('annonces')}
                />
                <QuickAction
                  icon={MessageCircle}
                  title="Répondre aux messages"
                  onClick={() => onNavigate('messages')}
                />
                <QuickAction
                  icon={UsersRound}
                  title="Gérer les clients"
                  onClick={() => onNavigate('clients')}
                />
                <QuickAction
                  icon={BookOpen}
                  title="Consulter le tutoriel"
                  onClick={() => onNavigate('tutoriel')}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        <RulesCard editable />
      </div>
    </div>
  )
}

function QuickAction({
  icon: Icon,
  title,
  onClick,
}: {
  icon: typeof Megaphone
  title: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/40 hover:bg-muted/50"
    >
      <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <span className="text-sm font-semibold">{title}</span>
    </button>
  )
}
