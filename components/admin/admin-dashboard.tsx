'use client'

import { useState, useEffect } from 'react'
import {
  BookOpen,
  LayoutDashboard,
  Megaphone,
  MessageCircle,
  CreditCard,
  UsersRound,
} from 'lucide-react'
import { AdminMessages } from '@/components/admin/admin-messages'
import { AdminTutorial } from '@/components/admin/admin-tutorial'
import { AnnouncementComposer } from '@/components/admin/announcement-composer'
import { ClientManagement } from '@/components/admin/client-management'
import { AdminPaymentMethods } from '@/components/admin/admin-payment-methods'
import { DashboardShell, type NavItem } from '@/components/dashboard/dashboard-shell'
import { RulesCard } from '@/components/rules-card'
import { Card, CardContent } from '@/components/ui/card'
import { BRAND } from '@/lib/mock-data'
import { supabase } from '@/lib/supabase'

const nav: NavItem[] = [
  { id: 'overview', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'annonces', label: 'Annonces', icon: Megaphone },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'clients', label: 'Clients', icon: UsersRound },
  { id: 'paiements', label: 'Paiements', icon: CreditCard },
  { id: 'tutoriel', label: 'Tutoriel', icon: BookOpen },
]

const titles: Record<string, { title: string; subtitle: string }> = {
  overview: { title: 'Tableau de bord', subtitle: 'Vue ensemble de votre activite.' },
  annonces: { title: 'Annonces', subtitle: 'Publiez sur le canal officiel.' },
  messages: { title: 'Messages', subtitle: 'Discussions privees avec vos clients.' },
  clients: { title: 'Clients', subtitle: 'Gerez vos clients.' },
  paiements: { title: 'Paiements', subtitle: 'Gerez les moyens proposes a l’inscription.' },
  tutoriel: { title: 'Tutoriel', subtitle: 'Guide pratique.' },
}

export function AdminDashboard() {
  const [active, setActive] = useState('overview')
  const head = titles[active] || titles.overview

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
        {active === 'paiements' && <AdminPaymentMethods />}
        {active === 'tutoriel' && <AdminTutorial />}
      </div>
    </DashboardShell>
  )
}

function Overview({ onNavigate }: { onNavigate: (id: string) => void }) {
  const [statsData, setStatsData] = useState({ activeCount: 0, totalCount: 0, unreadCount: 0 })

  useEffect(() => {
    async function loadRealStats() {
      try {
        const { data: clients, error } = await supabase
          .from('clients')
          .select('status')

        if (error) throw error

        if (clients) {
          const total = clients.length
          const active = clients.filter((c: any) => c.status === 'actif').length
          setStatsData({ totalCount: total, activeCount: active, unreadCount: 0 })
        }
      } catch (err) {
        console.error('Erreur lors du calcul des stats:', err)
      }
    }
    loadRealStats()
  }, [])

  const stats = [
    { label: 'Clients actifs', value: statsData.activeCount, hint: statsData.totalCount + ' au total' },
    { label: 'Messages non lus', value: statsData.unreadCount, hint: 'a traiter' },
    { label: 'Annonces publiees', value: 0, hint: 'ce mois-ci' },
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
                  title="Repondre aux messages"
                  onClick={() => onNavigate('messages')}
                />
                <QuickAction
                  icon={UsersRound}
                  title="Gerer les clients"
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
