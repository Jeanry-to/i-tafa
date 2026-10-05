'use client'

import { useEffect, useState } from 'react'
import { Bot, Megaphone, MessageCircle, Package, UsersRound } from 'lucide-react'

import { RulesCard } from '@/components/rules-card'
import { Card, CardContent } from '@/components/ui/card'
import {
  getClients,
  getProducts,
  type Announcement,
  type Product,
} from '@/lib/services/api'

type Props = {
  announcements: Announcement[]
  hasShop: boolean
  profileId: string
  onGo: (id: string) => void
}

function formatPrice(product: Product) {
  if (product.price === null || product.price === undefined) {
    return 'Prix sur demande'
  }

  return `${new Intl.NumberFormat('fr-FR').format(product.price)} ${product.currency}`
}

export function ClientOverview({ announcements, hasShop, profileId, onGo }: Props) {
  const [loading, setLoading] = useState(false)
  const [clientsTotal, setClientsTotal] = useState(0)
  const [clientsActive, setClientsActive] = useState(0)
  const [products, setProducts] = useState<Product[]>([])

  useEffect(() => {
    if (!hasShop) return

    let cancelled = false

    async function load() {
      setLoading(true)

      try {
        const [clientRows, productRows] = await Promise.all([
          getClients(),
          getProducts(),
        ])

        if (cancelled) return

        const others = clientRows.filter((c) => c.profileId !== profileId)

        setClientsTotal(others.length)
        setClientsActive(others.filter((c) => c.status === 'actif').length)
        setProducts(productRows)
      } catch (err) {
        console.error('Erreur chargement tableau de bord:', err)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [hasShop, profileId])

  const kpis = [
    { id: 'clients', label: 'Clients', value: clientsTotal, icon: UsersRound },
    { id: 'clients', label: 'Clients actifs', value: clientsActive, icon: UsersRound },
    { id: 'produits', label: 'Produits & Services', value: products.length, icon: Package },
    {
      id: 'produits',
      label: 'Disponibles',
      value: products.filter((p) => p.available).length,
      icon: Package,
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      {hasShop && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {kpis.map((k) => (
            <button
              key={k.label}
              type="button"
              onClick={() => onGo(k.id)}
              className="text-left"
            >
              <Card className="h-full transition hover:border-primary/40 hover:shadow-sm">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium text-muted-foreground">
                      {k.label}
                    </p>

                    <k.icon className="size-4 text-primary" aria-hidden="true" />
                  </div>

                  <p className="mt-2 font-display text-2xl font-bold">
                    {loading ? '...' : k.value}
                  </p>
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          {hasShop ? (
            <Card>
              <CardContent className="p-5">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="font-display text-lg font-bold">
                    Produits &amp; Services
                  </h2>

                  <button
                    type="button"
                    onClick={() => onGo('produits')}
                    className="text-sm font-medium text-primary"
                  >
                    Gérer
                  </button>
                </div>

                {loading ? (
                  <p className="text-sm text-muted-foreground">Chargement...</p>
                ) : products.length === 0 ? (
                  <div className="flex flex-col items-start gap-3">
                    <p className="text-sm text-muted-foreground">
                      Aucun produit ou service pour le moment.
                    </p>

                    <button
                      type="button"
                      onClick={() => onGo('produits')}
                      className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
                    >
                      Ajouter un produit
                    </button>
                  </div>
                ) : (
                  <ul className="divide-y">
                    {products.slice(0, 5).map((p) => (
                      <li
                        key={p.id}
                        className="flex items-center justify-between gap-3 py-3 text-sm"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-semibold">{p.name}</p>
                          <p className="text-muted-foreground">{formatPrice(p)}</p>
                        </div>

                        <span
                          className={
                            p.available
                              ? 'rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary'
                              : 'rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground'
                          }
                        >
                          {p.available ? 'Disponible' : 'Indisponible'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          ) : (
            <RulesCard />
          )}

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold">Dernières annonces</h2>
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
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Bot className="size-5" />
                </div>

                <div>
                  <h3 className="font-display font-bold">Assistant IA</h3>
                  <p className="text-xs text-muted-foreground">Propulsé par Groq</p>
                </div>
              </div>

              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Analysez vos ventes, votre marketing et votre prospection avec
                votre assistant IA.
              </p>

              <button
                type="button"
                onClick={() => onGo('assistant')}
                className="mt-4 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                <Bot className="size-4" />
                Ouvrir l&apos;Assistant
              </button>
            </CardContent>
          </Card>

          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-5">
              <h3 className="font-display font-bold">Besoin d&apos;aide ?</h3>

              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Contactez Admin directement dans votre discussion privée.
              </p>

              <button
                type="button"
                onClick={() => onGo('messages')}
                className="mt-3 inline-flex h-9 items-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
              >
                <MessageCircle className="size-4" />
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
                <span className="flex items-center gap-1 text-muted-foreground">
                  <Megaphone className="size-3.5" aria-hidden="true" />
                  Annonces
                </span>

                <span className="font-semibold">{announcements.length}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}