'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, Trash2, Pencil, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  createPaymentMethod,
  deletePaymentMethod,
  getAllPaymentMethods,
  updatePaymentMethod,
  type PaymentMethod,
  type PaymentMethodType,
} from '@/lib/services/api'

const TYPE_LABELS: Record<PaymentMethodType, string> = {
  mobile_money_mg: 'Mobile Money Madagascar',
  mobile_money_intl: 'Mobile Money international',
  crypto: 'Cryptomonnaie',
  bank: 'Virement bancaire',
}

export function AdminPaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)

  function reload() {
    setLoading(true)
    getAllPaymentMethods()
      .then(setMethods)
      .catch((err) => {
        console.error(err)
        toast.error('Erreur de chargement des moyens de paiement')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  async function toggleActive(method: PaymentMethod) {
    try {
      await updatePaymentMethod(method.id, { active: !method.active })
      reload()
    } catch (err) {
      toast.error('Impossible de mettre a jour', {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce moyen de paiement ?')) return
    try {
      await deletePaymentMethod(id)
      toast.success('Moyen de paiement supprime')
      reload()
    } catch (err) {
      toast.error('Suppression impossible', {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Gerez les moyens de paiement proposes a vos clients a l&apos;inscription.
        </p>
        <Button size="sm" onClick={() => setShowNewForm(true)} className="gap-1.5">
          <Plus className="size-4" aria-hidden="true" />
          Ajouter
        </Button>
      </div>

      {showNewForm && (
        <MethodForm
          onCancel={() => setShowNewForm(false)}
          onSaved={() => {
            setShowNewForm(false)
            reload()
          }}
        />
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : methods.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Aucun moyen de paiement configure.
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          {methods.map((m) =>
            editingId === m.id ? (
              <MethodForm
                key={m.id}
                method={m}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null)
                  reload()
                }}
              />
            ) : (
              <Card key={m.id}>
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{m.label}</p>
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        {TYPE_LABELS[m.type]}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          m.active
                            ? 'bg-primary/10 text-primary'
                            : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {m.active ? 'Actif' : 'Inactif'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">{m.accountDetails}</p>
                    {m.instructions && (
                      <p className="mt-1 text-xs text-muted-foreground">{m.instructions}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => toggleActive(m)}>
                      {m.active ? 'Desactiver' : 'Activer'}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(m.id)} aria-label="Modifier">
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(m.id)} aria-label="Supprimer">
                      <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      )}
    </div>
  )
}

function MethodForm({
  method,
  onCancel,
  onSaved,
}: {
  method?: PaymentMethod
  onCancel: () => void
  onSaved: () => void
}) {
  const [type, setType] = useState<PaymentMethodType>(method?.type ?? 'mobile_money_mg')
  const [label, setLabel] = useState(method?.label ?? '')
  const [accountDetails, setAccountDetails] = useState(method?.accountDetails ?? '')
  const [instructions, setInstructions] = useState(method?.instructions ?? '')
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (method) {
        await updatePaymentMethod(method.id, { type, label, accountDetails, instructions })
      } else {
        await createPaymentMethod({ type, label, accountDetails, instructions })
      }
      toast.success('Moyen de paiement enregistre')
      onSaved()
    } catch (err) {
      toast.error('Enregistrement impossible', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-primary/30">
      <CardContent className="p-4">
        <form onSubmit={save} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">
              {method ? 'Modifier le moyen de paiement' : 'Nouveau moyen de paiement'}
            </p>
            <Button type="button" size="icon" variant="ghost" onClick={onCancel} aria-label="Fermer">
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pm-type">Type</Label>
            <select
              id="pm-type"
              value={type}
              onChange={(e) => setType(e.target.value as PaymentMethodType)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              {Object.entries(TYPE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pm-label">Nom affiche (ex. Mvola, Orange Money, USDT TRC20)</Label>
            <Input id="pm-label" value={label} onChange={(e) => setLabel(e.target.value)} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pm-account">Numero / adresse / IBAN</Label>
            <Input
              id="pm-account"
              value={accountDetails}
              onChange={(e) => setAccountDetails(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="pm-instructions">Instructions (optionnel)</Label>
            <Input
              id="pm-instructions"
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              placeholder="Ex. Envoyez le montant exact puis indiquez la reference"
            />
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Enregistrer
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
