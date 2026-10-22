'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'

import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import { getCurrentProfile, signOut } from '@/lib/services/api'

export default function MarketplacePage() {
  const [loading, setLoading] = useState(true)
  const [signedIn, setSignedIn] = useState(false)

  useEffect(() => {
    let cancelled = false

    async function check() {
      try {
        const profile = await getCurrentProfile()

        if (!cancelled) {
          setSignedIn(!!profile)
        }
      } catch {
        if (!cancelled) {
          setSignedIn(false)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void check()

    return () => {
      cancelled = true
    }
  }, [])

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
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center gap-6 px-6 text-center">
      <BrandLogo />

      <div>
        <h1 className="font-display text-2xl font-bold">
          La marketplace arrive bientôt
        </h1>

        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Vous pourrez bientôt découvrir les boutiques et leurs produits,
          puis contacter les vendeurs.
        </p>
      </div>

      {signedIn ? (
        <Button variant="outline" onClick={handleSignOut}>
          Se déconnecter
        </Button>
      ) : (
        <Button onClick={() => (window.location.href = '/')}>
          Retour à la connexion
        </Button>
      )}
    </main>
  )
}
