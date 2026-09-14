'use client'

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getMyShop, createRenewalRequest, type Shop, type ShopPlan } from '@/lib/services/api'

const MVOLA_NUMBER = '034 00 202 00'
const MVOLA_BENEFICIARY = 'i-tafa'

const PLANS: { value: ShopPlan; label: string; price: string; duration: string }[] = [
  { value: 'starter', label: 'Starter', price: '20 000 Ar', duration: '30 jours' },
  { value: 'pro', label: 'Pro', price: '50 000 Ar', duration: '90 jours' },
  { value: 'business', label: 'Business', price: '150 000 Ar', duration: '365 jours' },
]

export function AbonnementExpire() {
  const [shop, setShop] = useState<Shop | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPlan, setSelectedPlan] = useState<ShopPlan>('starter')
  const [mvolaReference, setMvolaReference] = useState('')
  const [amount, setAmount] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    getMyShop()
      .then(setShop)
      .catch((err) => console.error('Erreur chargement boutique:', err))
      .finally(() => setLoading(false))
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!shop || !mvolaReference.trim()) return

    setSubmitting(true)
    try {
      await createRenewalRequest({
        shopId: shop.id,
        requestedPlan: selectedPlan,
        mvolaReference: mvolaReference.trim(),
        amount: amount ? Number(amount) : undefined,
      })
      setSubmitted(true)
      toast.success('Demande envoyee')
    } catch (err) {
      toast.error('Envoi impossible', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    )
  }

  if (submitted) {
    return (
      <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-16 text-center">
        <CheckCircle2 className="size-12 text-emerald-600" aria-hidden="true" />
        <h1 className="text-xl font-bold">Demande envoyee avec succes</h1>
        <p className="text-sm text-muted-foreground">
          Votre demande de renouvellement a bien ete transmise. Notre equipe va verifier votre
          paiement et activer votre compte sous peu.
        </p>
      </div>
    )
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-6 px-4 py-10">
      <div>
        <h1 className="text-xl font-bold">Votre abonnement a expire</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {shop
            ? `Boutique : ${shop.name}`
            : 'Renouvelez votre abonnement pour continuer a utiliser i-tafa.'}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">1. Choisissez votre forfait</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {PLANS.map((plan) => (
            <button
              key={plan.value}
              type="button"
              onClick={() => setSelectedPlan(plan.value)}
              className={`flex items-center justify-between rounded-lg border p-3 text-left transition-colors ${
                selectedPlan === plan.value
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:bg-muted/50'
              }`}
            >
              <div>
                <p className="font-medium">{plan.label}</p>
                <p className="text-xs text-muted-foreground">{plan.duration}</p>
              </div>
              <p className="font-semibold">{plan.price}</p>
            </button>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">2. Effectuez le paiement via MVola</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <p>Composez <strong>#111#</strong> sur votre telephone.</p>
          <p>Choisissez <strong>« Envoyer de l&apos;argent »</strong>.</p>
          <p>
            Numero : <strong>{MVOLA_NUMBER}</strong> ({MVOLA_BENEFICIARY})
          </p>
          <p>
            Montant : <strong>{PLANS.find((p) => p.value === selectedPlan)?.price}</strong>
          </p>
          <p className="text-muted-foreground">
            Conservez la reference de transaction envoyee par MVola, vous en aurez besoin a
            l&apos;etape suivante.
          </p>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">3. Confirmez votre paiement</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="mvola-ref">Reference de transaction MVola</Label>
              <Input
                id="mvola-ref"
                value={mvolaReference}
                onChange={(e) => setMvolaReference(e.target.value)}
                placeholder="Ex. MV1234567890"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="amount">Montant envoye (optionnel)</Label>
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex. 20000"
              />
            </div>
          </CardContent>
        </Card>
        <Button type="submit" disabled={submitting || !mvolaReference.trim()} className="mt-4 w-full">
          {submitting && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Envoyer ma demande de renouvellement
        </Button>
      </form>
    </div>
  )
}
