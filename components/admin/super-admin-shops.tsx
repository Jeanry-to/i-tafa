'use client'

import { useEffect, useState } from 'react'
import { Loader2, ShieldAlert, Check, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  getAllShops,
  updateShopSubscription,
  getMyCurrentUserIsSuperAdmin,
  getPendingRenewalRequests,
  confirmRenewalRequest,
  rejectRenewalRequest,
  type Shop,
  type ShopPlan,
  type SubscriptionStatus,
  type RenewalRequest,
} from '@/lib/services/api'

const PLAN_OPTIONS: ShopPlan[] = ['starter', 'pro', 'business']
const STATUS_OPTIONS: SubscriptionStatus[] = ['PENDING', 'ACTIVE', 'EXPIRED']

const selectClassName =
  'h-8 rounded-md border border-input bg-transparent px-2 text-xs shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

function statusBadgeClass(status: SubscriptionStatus) {
  if (status === 'ACTIVE') return 'bg-emerald-100 text-emerald-700'
  if (status === 'EXPIRED') return 'bg-red-100 text-red-700'
  return 'bg-amber-100 text-amber-700'
}

export function SuperAdminShops() {
  const [isSuperAdmin, setIsSuperAdmin] = useState<boolean | null>(null)
  const [shops, setShops] = useState<Shop[]>([])
  const [pendingRequests, setPendingRequests] = useState<RenewalRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [drafts, setDrafts] = useState<Record<string, { endDate: string; mvolaReference: string }>>({})

  useEffect(() => {
    getMyCurrentUserIsSuperAdmin()
      .then((value) => setIsSuperAdmin(value))
      .catch(() => setIsSuperAdmin(false))
  }, [])

  async function loadAll() {
    const [shopsData, requestsData] = await Promise.all([
      getAllShops(),
      getPendingRenewalRequests(),
    ])
    setShops(shopsData)
    setPendingRequests(requestsData)
    const initialDrafts: typeof drafts = {}
    shopsData.forEach((shop) => {
      initialDrafts[shop.id] = {
        endDate: shop.subscriptionEndDate ? shop.subscriptionEndDate.slice(0, 10) : '',
        mvolaReference: shop.mvolaReference ?? '',
      }
    })
    setDrafts(initialDrafts)
  }

  useEffect(() => {
    if (isSuperAdmin !== true) return
    loadAll()
      .catch((err) => {
        console.error('Erreur chargement boutiques:', err)
        toast.error('Impossible de charger les boutiques')
      })
      .finally(() => setLoading(false))
  }, [isSuperAdmin])

  async function handleUpdate(
    shop: Shop,
    changes: Partial<{ plan: ShopPlan; subscriptionStatus: SubscriptionStatus }>,
  ) {
    setSavingId(shop.id)
    try {
      const draft = drafts[shop.id]
      const updated = await updateShopSubscription(shop.id, {
        ...changes,
        subscriptionEndDate: draft?.endDate ? new Date(draft.endDate).toISOString() : null,
        mvolaReference: draft?.mvolaReference || null,
      })
      setShops((prev) => prev.map((s) => (s.id === shop.id ? updated : s)))
      toast.success(`Boutique "${shop.name}" mise a jour`)
    } catch (err) {
      toast.error('Mise a jour impossible', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSavingId(null)
    }
  }

  async function handleConfirmRequest(request: RenewalRequest) {
    setReviewingId(request.id)
    try {
      await confirmRenewalRequest(request.id)
      toast.success('Paiement confirme, boutique activee')
      await loadAll()
    } catch (err) {
      toast.error('Confirmation impossible', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setReviewingId(null)
    }
  }

  async function handleRejectRequest(request: RenewalRequest) {
    setReviewingId(request.id)
    try {
      await rejectRenewalRequest(request.id)
      toast.success('Demande rejetee')
      await loadAll()
    } catch (err) {
      toast.error('Action impossible', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setReviewingId(null)
    }
  }

  if (isSuperAdmin === null || loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    )
  }

  if (isSuperAdmin === false) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <ShieldAlert className="size-10 text-muted-foreground" aria-hidden="true" />
          <p className="font-medium">Acces reserve</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            Cette section est reservee au proprietaire de la plateforme i-tafa.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {pendingRequests.length > 0 && (
        <Card className="border-amber-300">
          <CardHeader>
            <CardTitle className="text-base">
              Demandes de renouvellement en attente ({pendingRequests.length})
            </CardTitle>
            <p className="text-xs text-muted-foreground">
              Verifiez que vous avez bien recu le paiement MVola correspondant avant de confirmer.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {pendingRequests.map((request) => (
              <div
                key={request.id}
                className="flex flex-col gap-2 rounded-lg border border-border p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="text-sm">
                  <p className="font-medium">
                    {request.shopName} — plan {request.requestedPlan}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Reference : {request.mvolaReference}
                    {request.amount ? ` — ${request.amount} Ar` : ''}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={reviewingId === request.id}
                    onClick={() => handleRejectRequest(request)}
                  >
                    <X className="size-4" aria-hidden="true" />
                    Rejeter
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={reviewingId === request.id}
                    onClick={() => handleConfirmRequest(request)}
                  >
                    {reviewingId === request.id ? (
                      <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <Check className="size-4" aria-hidden="true" />
                    )}
                    Confirmer le paiement
                  </Button>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {shops.map((shop) => (
        <Card key={shop.id}>
          <CardHeader className="flex flex-row items-center justify-between gap-2">
            <div>
              <CardTitle className="text-base">{shop.name}</CardTitle>
              <p className="text-xs text-muted-foreground">/boutique/{shop.slug}</p>
            </div>
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-medium ${statusBadgeClass(shop.subscriptionStatus)}`}
            >
              {shop.subscriptionStatus}
            </span>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Plan</Label>
                <select
                  className={selectClassName}
                  value={shop.plan}
                  onChange={(e) => handleUpdate(shop, { plan: e.target.value as ShopPlan })}
                >
                  {PLAN_OPTIONS.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Statut d&apos;abonnement</Label>
                <select
                  className={selectClassName}
                  value={shop.subscriptionStatus}
                  onChange={(e) =>
                    handleUpdate(shop, { subscriptionStatus: e.target.value as SubscriptionStatus })
                  }
                >
                  {STATUS_OPTIONS.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>Date de fin d&apos;abonnement</Label>
                <Input
                  type="date"
                  value={drafts[shop.id]?.endDate ?? ''}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [shop.id]: { ...prev[shop.id], endDate: e.target.value },
                    }))
                  }
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Reference de paiement MVola</Label>
                <Input
                  value={drafts[shop.id]?.mvolaReference ?? ''}
                  onChange={(e) =>
                    setDrafts((prev) => ({
                      ...prev,
                      [shop.id]: { ...prev[shop.id], mvolaReference: e.target.value },
                    }))
                  }
                  placeholder="Ex. MV-2026-00123"
                />
              </div>
            </div>

            <Button
              type="button"
              size="sm"
              className="w-fit"
              disabled={savingId === shop.id}
              onClick={() => handleUpdate(shop, {})}
            >
              {savingId === shop.id && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
              Enregistrer la date et la reference
            </Button>
          </CardContent>
        </Card>
      ))}

      {shops.length === 0 && (
        <p className="text-sm text-muted-foreground">Aucune boutique trouvee.</p>
      )}
    </div>
  )
}
