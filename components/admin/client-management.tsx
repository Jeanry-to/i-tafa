'use client'

import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, PauseCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getClients, isClientSuspended, reactivateClient, suspendClient, type Client } from '@/lib/services/api'

function formatDate(value?: string) {
  return value ? new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(new Date(value)) : null
}

export function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Client | null>(null)
  const [reason, setReason] = useState('')
  const [until, setUntil] = useState('')
  const [saving, setSaving] = useState(false)

  async function reload() {
    setLoading(true)
    try { setClients(await getClients()) }
    catch (error) { toast.error('Impossible de charger les clients', { description: error instanceof Error ? error.message : undefined }) }
    finally { setLoading(false) }
  }

  useEffect(() => { reload() }, [])

  function openSuspension(client: Client) {
    setSelected(client)
    setReason(client.suspensionReason ?? '')
    setUntil(client.suspendedUntil ? client.suspendedUntil.slice(0, 10) : '')
  }

  async function saveSuspension(event: React.FormEvent) {
    event.preventDefault()
    if (!selected || !reason.trim()) return
    setSaving(true)
    try {
      await suspendClient(selected.id, { reason, until: until ? new Date(`${until}T23:59:59`).toISOString() : null })
      toast.success('Client suspendu', { description: 'Le motif est visible uniquement par ce client.' })
      setSelected(null)
      await reload()
    } catch (error) {
      toast.error('Suspension impossible', { description: error instanceof Error ? error.message : undefined })
    } finally { setSaving(false) }
  }

  async function reactivate(client: Client) {
    setSaving(true)
    try {
      await reactivateClient(client.id)
      toast.success('Client réactivé')
      await reload()
    } catch (error) {
      toast.error('Réactivation impossible', { description: error instanceof Error ? error.message : undefined })
    } finally { setSaving(false) }
  }

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin" /></div>

  return (
    <div className="flex max-w-5xl flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-bold">Gestion des clients</h2>
        <p className="mt-1 text-sm text-muted-foreground">Suspendez temporairement un compte, avec un motif visible seulement par le client concerné.</p>
      </div>

      {selected && (
        <Card className="border-amber-500/40"><CardContent className="p-5">
          <form onSubmit={saveSuspension} className="flex flex-col gap-4">
            <div><h3 className="font-semibold">Suspendre {selected.name}</h3><p className="text-sm text-muted-foreground">Le client ne pourra plus accéder à son espace tant que la suspension est active.</p></div>
            <div className="flex flex-col gap-2"><Label htmlFor="suspension-reason">Motif de suspension</Label><Textarea id="suspension-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Ex. : Paiement en attente de vérification" required /></div>
            <div className="flex flex-col gap-2"><Label htmlFor="suspension-until">Fin prévue (facultatif)</Label><Input id="suspension-until" type="date" value={until} onChange={(event) => setUntil(event.target.value)} min={new Date().toISOString().slice(0, 10)} /><p className="text-xs text-muted-foreground">Sans date, la suspension reste active jusqu’à une réactivation manuelle.</p></div>
            <div className="flex gap-2"><Button type="submit" disabled={saving}>{saving && <Loader2 className="size-4 animate-spin" />} Confirmer la suspension</Button><Button type="button" variant="outline" onClick={() => setSelected(null)}>Annuler</Button></div>
          </form>
        </CardContent></Card>
      )}

      {clients.length === 0 ? <p className="py-10 text-center text-sm text-muted-foreground">Aucun client enregistré.</p> : (
        <div className="grid gap-4 md:grid-cols-2">
          {clients.map((client) => {
            const suspended = isClientSuspended(client)
            const endsAt = formatDate(client.suspendedUntil)
            return <Card key={client.id} className={suspended ? 'border-amber-500/50' : undefined}><CardContent className="p-5">
              <div className="flex items-start justify-between gap-3"><div><p className="font-semibold">{client.name}</p><p className="text-sm text-muted-foreground">{client.email}</p></div><span className={suspended ? 'rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800' : 'rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800'}>{suspended ? 'Suspendu' : 'Actif'}</span></div>
              <div className="mt-4 space-y-1 text-sm text-muted-foreground">{client.phone && <p>Téléphone : {client.phone}</p>}{suspended && client.suspensionReason && <p>Motif : {client.suspensionReason}</p>}{suspended && <p>{endsAt ? `Fin prévue : ${endsAt}` : 'Sans date de fin'}</p>}</div>
              <div className="mt-4">{suspended ? <Button size="sm" variant="outline" disabled={saving} onClick={() => reactivate(client)} className="gap-1.5"><CheckCircle2 className="size-4" /> Réactiver</Button> : <Button size="sm" variant="outline" disabled={saving} onClick={() => openSuspension(client)} className="gap-1.5 text-amber-700 hover:text-amber-800"><PauseCircle className="size-4" /> Suspendre</Button>}</div>
            </CardContent></Card>
          })}
        </div>
      )}
    </div>
  )
}
