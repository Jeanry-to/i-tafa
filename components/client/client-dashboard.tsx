'use client'

import { useEffect, useState } from 'react'
import {
  LayoutDashboard,
  Loader2,
  Megaphone,
  MessageCircle,
  Package,
  UserRound,
  Bot,
  Send,
  BarChart3,
  Target,
  Sparkles,
  UsersRound,
  BrainCircuit,
  CreditCard,
  Building2,
  Settings,
  BookOpen,
} from 'lucide-react'

import { AdminProducts } from '@/components/admin/admin-products'
import { AdminBusinessInfo } from '@/components/admin/admin-business-info'
import { AdminKnowledgeBase } from '@/components/admin/admin-knowledge-base'
import { AdminPaymentMethods } from '@/components/admin/admin-payment-methods'
import { AdminSettings } from '@/components/admin/admin-settings'
import { AdminTutorial } from '@/components/admin/admin-tutorial'
import { ClientManagement } from '@/components/admin/client-management'
import { AnnouncementsFeed } from '@/components/announcements-feed'
import { ChatView } from '@/components/chat/chat-view'
import { ProfileForm } from '@/components/client/profile-form'

import {
  DashboardShell,
  type NavItem,
} from '@/components/dashboard/dashboard-shell'

import { RulesCard } from '@/components/rules-card'
import { ClientOverview } from '@/components/client/client-overview'

import { Card, CardContent } from '@/components/ui/card'

import { supabase } from '@/lib/supabase'

import { applyTheme, getStoredTheme } from '@/lib/theme'

import {
  getAnnouncements,
  getClientForProfile,
  getCurrentProfile,
  getUnreadCountForClient,
  isClientSuspended,
  ownsShop,
  signOut,
  generateAutoReply,
  type Announcement,
  type Client,
} from '@/lib/services/api'

// ======================================================
// NAVIGATION (12 menus)
// ======================================================

const baseNav: Omit<NavItem, 'badge'>[] = [
  { id: 'overview', label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'annonces', label: 'Annonces', icon: Megaphone },
  { id: 'clients', label: 'Clients', icon: UsersRound },
  { id: 'produits', label: 'Produits & Services', icon: Package },
  { id: 'connaissances', label: 'Base de connaissances', icon: BrainCircuit },
  { id: 'assistant', label: 'Assistant IA', icon: Bot },
  { id: 'messages', label: 'Messages', icon: MessageCircle },
  { id: 'paiement', label: 'Paiement', icon: CreditCard },
  { id: 'boutique', label: 'Ma boutique', icon: Building2 },
  { id: 'parametres', label: 'Paramètres', icon: Settings },
  { id: 'tutoriel', label: 'Tutoriel', icon: BookOpen },
  { id: 'profil', label: 'Mon profil', icon: UserRound },
]

// Menus de gestion de boutique : visibles seulement pour un compte
// qui possède une boutique (sinon les données ne sont pas les siennes).
const shopOnlyIds = [
  'clients',
  'produits',
  'connaissances',
  'paiement',
  'boutique',
  'parametres',
]

// ======================================================
// UTILITAIRE
// ======================================================

function formatSuspensionDate(value?: string) {
  return value
    ? new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'long',
      }).format(new Date(value))
    : null
}

// ======================================================
// DASHBOARD CLIENT
// ======================================================

export function ClientDashboard() {
  const [active, setActive] = useState('overview')

  const [profile, setProfile] = useState<{
    id: string
    full_name: string
    email: string
  } | null>(null)

  const [client, setClient] = useState<Client | null>(null)

  const [announcements, setAnnouncements] = useState<Announcement[]>([])

  const [loading, setLoading] = useState(true)

  const [suspendedClient, setSuspendedClient] = useState<Client | null>(null)

  const [unreadCount, setUnreadCount] = useState(0)

  const [hasShop, setHasShop] = useState(false)

  // ====================================================
  // THEME
  // ====================================================

  useEffect(() => {
    applyTheme(getStoredTheme())
  }, [])

  // ====================================================
  // CHARGEMENT
  // ====================================================

  useEffect(() => {
    async function load() {
      try {
        const currentProfile = await getCurrentProfile()

        if (!currentProfile) {
          setLoading(false)
          return
        }

        const [clientRow, announcementRows, shopOwner] = await Promise.all([
          getClientForProfile(currentProfile.id),
          getAnnouncements(),
          ownsShop(),
        ])

        if (clientRow && isClientSuspended(clientRow)) {
          setSuspendedClient(clientRow)

          await signOut()

          setLoading(false)
          return
        }

        setProfile(currentProfile)
        setClient(clientRow)
        setHasShop(shopOwner)
        setAnnouncements(announcementRows)

        if (clientRow) {
          getUnreadCountForClient(clientRow.id, currentProfile.id)
            .then(setUnreadCount)
            .catch((err) =>
              console.error('Erreur comptage non lus:', err),
            )
        }
      } catch (err) {
        console.error('Erreur chargement espace client:', err)
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [])

  // ====================================================
  // SURVEILLANCE SUSPENSION
  // ====================================================

  useEffect(() => {
    if (!client) return

    const channel = supabase
      .channel(`client-status:${client.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'clients',
          filter: `id=eq.${client.id}`,
        },
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

  // ====================================================
  // MESSAGES NON LUS
  // ====================================================

  useEffect(() => {
    if (!client || !profile) {
      return
    }

    const channel = supabase
      .channel(`client-unread:${client.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `client_id=eq.${client.id}`,
        },
        (payload) => {
          const row = payload.new as {
            sender_id: string
          }

          if (row.sender_id === profile.id) {
            return
          }

          if (active === 'messages') {
            return
          }

          setUnreadCount((prev) => prev + 1)
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [client, profile, active])

  // ====================================================
  // NAVIGATION AVEC BADGE
  // ====================================================

  const nav: NavItem[] = baseNav
    .filter((item) => hasShop || !shopOnlyIds.includes(item.id))
    .map((item) =>
      item.id === 'messages' && unreadCount > 0
        ? { ...item, badge: unreadCount }
        : item,
    )

  // ====================================================
  // CHARGEMENT
  // ====================================================

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2
          className="size-8 animate-spin text-primary"
          aria-hidden="true"
        />
      </div>
    )
  }

  // ====================================================
  // COMPTE SUSPENDU
  // ====================================================

  if (suspendedClient) {
    const until = formatSuspensionDate(suspendedClient.suspendedUntil)

    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <div className="max-w-md">
          <h1 className="font-display text-xl font-bold text-destructive">
            Compte suspendu
          </h1>

          <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
            {suspendedClient.suspensionReason ||
              'Votre accès à i-tafa est actuellement suspendu.'}
          </p>

          <p className="mt-2 text-sm text-muted-foreground">
            {until
              ? `Fin prévue : ${until}`
              : 'Aucune date de fin définie.'}
          </p>

          <p className="mt-4 text-sm text-muted-foreground">
            Contactez Admin si vous pensez qu&apos;il s&apos;agit d&apos;une
            erreur.
          </p>
        </div>
      </div>
    )
  }

  // ====================================================
  // PROFIL MANQUANT
  // ====================================================

  if (!profile || !client) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4 text-center">
        <p className="text-sm text-muted-foreground">
          Impossible de charger votre profil. Reconnectez-vous ou contactez
          Admin.
        </p>
      </div>
    )
  }

  // ====================================================
  // TITRES
  // ====================================================

  // Sécurité : un compte sans boutique ne peut pas ouvrir un menu de gestion
  const view = !hasShop && shopOnlyIds.includes(active) ? 'overview' : active

  const titles: Record<string, { title: string; subtitle: string }> = {
    overview: {
      title: `Bonjour, ${profile.full_name?.split(' ')[0] ?? 'vous'}`,
      subtitle: 'Voici votre espace i-tafa.',
    },
    annonces: {
      title: 'Annonces',
      subtitle: 'Publications officielles de Admin.',
    },
    clients: {
      title: 'Clients',
      subtitle: 'Gérez les clients de votre boutique.',
    },
    produits: {
      title: 'Produits & Services',
      subtitle: 'Gérez les produits et services proposés par votre boutique.',
    },
    connaissances: {
      title: 'Base de connaissances',
      subtitle: 'Gérez les informations que votre Agent IA doit connaître.',
    },
    assistant: {
      title: 'Assistant IA',
      subtitle:
        'Analysez vos données, ventes, marketing et prospection avec votre assistant IA Groq.',
    },
    messages: {
      title: 'Messages',
      subtitle: 'Discussion privée avec Admin.',
    },
    paiement: {
      title: 'Paiement',
      subtitle: 'Gérez vos moyens de paiement.',
    },
    boutique: {
      title: 'Ma boutique',
      subtitle: 'Gérez les informations générales de votre entreprise.',
    },
    parametres: {
      title: 'Paramètres',
      subtitle: 'Gérez les paramètres de votre espace entreprise.',
    },
    tutoriel: {
      title: 'Tutoriel',
      subtitle: 'Découvrez comment utiliser i-tafa.',
    },
    profil: {
      title: 'Mon profil',
      subtitle: 'Gérez vos informations et votre sécurité.',
    },
  }

  const head = titles[view] ?? titles.overview

  // ====================================================
  // AFFICHAGE
  // ====================================================

  return (
    <DashboardShell
      navItems={nav}
      activeId={view}
      onNavigate={setActive}
      roleLabel="Espace client"
      userName={profile.full_name || profile.email}
      userMeta={profile.email}
    >
      <div className="mx-auto w-full max-w-5xl px-4 py-6 lg:px-8 lg:py-8">
        <header className="mb-6">
          <h1 className="font-display text-2xl font-bold text-balance">
            {head.title}
          </h1>

          <p className="mt-1 text-sm text-muted-foreground">
            {head.subtitle}
          </p>
        </header>

        {/* TABLEAU DE BORD */}
        {view === 'overview' && (
          <ClientOverview
            hasShop={hasShop}
            profileId={profile.id}
            onGo={setActive}
            announcements={announcements}
          />
        )}

        {/* ANNONCES */}
        {view === 'annonces' && <AnnouncementsFeed />}

        {/* CLIENTS */}
        {view === 'clients' && <ClientManagement />}

        {/* PRODUITS & SERVICES */}
        {view === 'produits' && <AdminProducts />}

        {/* BASE DE CONNAISSANCES */}
        {view === 'connaissances' && <AdminKnowledgeBase />}

        {/* ASSISTANT IA */}
        {view === 'assistant' && <BusinessAssistant clientId={client.id} />}

        {/* MESSAGES */}
        {view === 'messages' && (
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

        {/* PAIEMENT */}
        {view === 'paiement' && <AdminPaymentMethods />}

        {/* MA BOUTIQUE */}
        {view === 'boutique' && <AdminBusinessInfo />}

        {/* PARAMETRES */}
        {view === 'parametres' && <AdminSettings />}

        {/* TUTORIEL */}
        {view === 'tutoriel' && <AdminTutorial />}

        {/* PROFIL */}
        {view === 'profil' && <ProfileForm />}
      </div>
    </DashboardShell>
  )
}

// ======================================================
// ASSISTANT IA ENTREPRISE
// ======================================================

function BusinessAssistant({ clientId }: { clientId: string }) {
  const [message, setMessage] = useState('')

  const [answer, setAnswer] = useState('')

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState('')

  async function askAssistant(question?: string) {
    const text = (question ?? message).trim()

    if (!text) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const result = await generateAutoReply(text, clientId)

      setAnswer(result)
      setMessage('')
    } catch (err) {
      console.error('Erreur Assistant IA:', err)

      setError(
        err instanceof Error
          ? err.message
          : "Impossible de contacter l'assistant IA.",
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* INTRODUCTION */}

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Bot className="size-6" />
            </div>

            <div>
              <h2 className="font-display text-xl font-bold">
                Votre Assistant IA i-tafa
              </h2>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Utilisez votre assistant IA pour analyser vos données, vos
                ventes, votre marketing et votre prospection.
              </p>

              <p className="mt-2 text-xs font-medium text-primary">
                Moteur IA : Groq
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ACTIONS RAPIDES */}

      <div className="grid gap-4 md:grid-cols-3">
        <button
          type="button"
          onClick={() =>
            askAssistant(
              'Analyse mes ventes et identifie les produits qui semblent les plus performants à partir des données disponibles.',
            )
          }
          disabled={loading}
          className="text-left"
        >
          <Card className="h-full transition hover:border-primary/40 hover:shadow-sm">
            <CardContent className="p-5">
              <BarChart3 className="size-7 text-primary" />

              <h3 className="mt-3 font-display font-bold">
                Analyser les ventes
              </h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Analysez vos données commerciales disponibles.
              </p>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() =>
            askAssistant(
              'Propose-moi une stratégie de prospection adaptée à mon activité et aux informations disponibles dans ma boutique.',
            )
          }
          disabled={loading}
          className="text-left"
        >
          <Card className="h-full transition hover:border-primary/40 hover:shadow-sm">
            <CardContent className="p-5">
              <Target className="size-7 text-primary" />

              <h3 className="mt-3 font-display font-bold">Prospection</h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Développez votre prospection commerciale.
              </p>
            </CardContent>
          </Card>
        </button>

        <button
          type="button"
          onClick={() =>
            askAssistant(
              'Donne-moi des idées concrètes de marketing pour développer mon activité et attirer davantage de clients.',
            )
          }
          disabled={loading}
          className="text-left"
        >
          <Card className="h-full transition hover:border-primary/40 hover:shadow-sm">
            <CardContent className="p-5">
              <Sparkles className="size-7 text-primary" />

              <h3 className="mt-3 font-display font-bold">Marketing</h3>

              <p className="mt-1 text-sm text-muted-foreground">
                Obtenez des idées pour développer votre activité.
              </p>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* ZONE DE QUESTION */}

      <Card>
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <Bot className="size-5 text-primary" />

            <h2 className="font-display font-bold">
              Poser une question à l&apos;IA
            </h2>
          </div>

          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault()

                if (!loading) {
                  askAssistant()
                }
              }
            }}
            placeholder="Exemple : analyse mes ventes, aide-moi à préparer une campagne marketing..."
            disabled={loading}
            className="mt-4 min-h-32 w-full resize-y rounded-lg border bg-background p-3 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary"
          />

          <div className="mt-3 flex justify-end">
            <button
              type="button"
              onClick={() => askAssistant()}
              disabled={loading || !message.trim()}
              className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground disabled:pointer-events-none disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Analyse...
                </>
              ) : (
                <>
                  <Send className="size-4" />
                  Envoyer à Groq
                </>
              )}
            </button>
          </div>

          {/* ERREUR */}

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* REPONSE */}

          {answer && (
            <div className="mt-6 rounded-xl border bg-muted/30 p-5">
              <div className="flex items-center gap-2">
                <Bot className="size-5 text-primary" />

                <h3 className="font-display font-bold">
                  Réponse de l&apos;Assistant IA
                </h3>
              </div>

              <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">
                {answer}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ======================================================
// OVERVIEW
// ======================================================

function Overview({
  announcements,
  onOpenMessages,
  onOpenAssistant,
}: {
  announcements: Announcement[]
  onOpenMessages: () => void
  onOpenAssistant: () => void
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-6 lg:col-span-2">
        <RulesCard />

        <div>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold">
              Dernières annonces
            </h2>
          </div>

          <div className="flex flex-col gap-3">
            {announcements.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Aucune annonce pour le moment.
              </p>
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
        {/* ASSISTANT IA */}

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Bot className="size-5" />
              </div>

              <div>
                <h3 className="font-display font-bold">Assistant IA</h3>

                <p className="text-xs text-muted-foreground">
                  Propulsé par Groq
                </p>
              </div>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Analysez vos ventes, votre marketing et votre prospection avec
              votre assistant IA.
            </p>

            <button
              type="button"
              onClick={onOpenAssistant}
              className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              <Bot className="size-4" />
              Ouvrir l&apos;Assistant
            </button>
          </CardContent>
        </Card>

        {/* AIDE */}

        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-5">
            <h3 className="font-display font-bold">Besoin d&apos;aide ?</h3>

            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Contactez Admin directement dans votre discussion privée.
            </p>

            <button
              type="button"
              onClick={onOpenMessages}
              className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            >
              <MessageCircle className="size-4" />
              Ouvrir la discussion
            </button>
          </CardContent>
        </Card>

        {/* STATUT */}

        <Card>
          <CardContent className="flex flex-col gap-3 p-5 text-sm">
            <p className="font-semibold">Statut du compte</p>

            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Accès</span>

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
