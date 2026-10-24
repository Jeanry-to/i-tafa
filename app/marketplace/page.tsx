'use client'

import { useEffect, useMemo, useState } from 'react'
import { Loader2, Search } from 'lucide-react'

import { BrandLogo } from '@/components/brand-logo'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  getCurrentProfile,
  getMarketplaceProducts,
  signOut,
  type MarketplaceProduct,
} from '@/lib/services/api'

function normalize(text: string) {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function formatPrice(product: MarketplaceProduct) {
  if (product.price === null) {
    return 'Prix sur demande'
  }

  return (
    new Intl.NumberFormat('fr-FR').format(product.price) +
    ' ' +
    product.currency
  )
}

export default function MarketplacePage() {
  const [loading, setLoading] = useState(true)
  const [signedIn, setSignedIn] = useState(false)
  const [products, setProducts] = useState<MarketplaceProduct[]>([])
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')

  useEffect(() => {
    let cancelled = false

    async function load() {
      let isSignedIn = false

      try {
        isSignedIn = !!(await getCurrentProfile())
      } catch {
        isSignedIn = false
      }

      if (cancelled) {
        return
      }

      setSignedIn(isSignedIn)

      if (!isSignedIn) {
        setLoading(false)
        return
      }

      try {
        const items = await getMarketplaceProducts()

        if (!cancelled) {
          setProducts(items)
        }
      } catch {
        if (!cancelled) {
          setError('Impossible de charger les produits pour le moment.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void load()

    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    const search = normalize(query.trim())

    if (!search) {
      return products
    }

    return products.filter((product) =>
      normalize(
        product.name +
          ' ' +
          product.description +
          ' ' +
          product.shopName,
      ).includes(search),
    )
  }, [products, query])

  async function handleSignOut() {
    await signOut()
    window.location.href = '/'
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-6">
      <header className="flex items-center justify-between gap-4">
        <BrandLogo />

        {signedIn ? (
          <Button variant="outline" onClick={handleSignOut}>
            Se déconnecter
          </Button>
        ) : (
          <Button onClick={() => (window.location.href = '/')}>
            Se connecter
          </Button>
        )}
      </header>

      <section className="mt-8">
        <h1 className="font-display text-2xl font-bold">Marketplace</h1>

        <p className="mt-1 text-sm text-muted-foreground">
          Découvrez les produits des boutiques i-tafa.
        </p>
      </section>

      {!signedIn ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          Connectez-vous pour découvrir les produits des boutiques.
        </p>
      ) : error ? (
        <p className="mt-10 text-center text-sm text-muted-foreground">
          {error}
        </p>
      ) : (
        <>
          <div className="relative mt-6">
            <Search
              className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />

            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Rechercher un produit ou une boutique"
              className="pl-9"
            />
          </div>

          {filtered.length === 0 ? (
            <p className="mt-10 text-center text-sm text-muted-foreground">
              {products.length === 0
                ? "Aucun produit n'est disponible pour le moment."
                : 'Aucun produit ne correspond à votre recherche.'}
            </p>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((product) => (
                <article
                  key={product.id}
                  className="flex flex-col gap-3 rounded-xl border bg-card p-4 text-card-foreground"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge>{product.shopName}</Badge>

                    {product.promotion ? (
                      <Badge>{product.promotion}</Badge>
                    ) : null}

                    {product.discount ? (
                      <Badge>{product.discount}</Badge>
                    ) : null}
                  </div>

                  <h2 className="font-display text-lg font-semibold">
                    {product.name}
                  </h2>

                  <p className="text-sm font-medium">
                    {formatPrice(product)}
                  </p>

                  {product.description ? (
                    <p className="line-clamp-3 text-sm text-muted-foreground">
                      {product.description}
                    </p>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </main>
  )
}