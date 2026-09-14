'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { getBusinessInfo, saveBusinessInfo, type BusinessInfo } from '@/lib/services/api'

const empty: Omit<BusinessInfo, 'id'> = {
  name: '',
  description: '',
  sector: '',
  address: '',
  serviceArea: '',
  phone: '',
  email: '',
  website: '',
  openingHours: '',
  closedDays: '',
  preferredContact: '',
}

export function AdminBusinessInfo() {
  const [values, setValues] = useState(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getBusinessInfo()
      .then((data) => {
        if (data) setValues(data)
      })
      .catch((err) => console.error('Erreur chargement infos entreprise:', err))
      .finally(() => setLoading(false))
  }, [])

  function set<K extends keyof typeof values>(key: K, value: string) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await saveBusinessInfo(values)
      toast.success('Informations enregistrees')
    } catch (err) {
      toast.error('Enregistrement impossible', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    )
  }

  return (
    <form onSubmit={save} className="flex max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Informations generales</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ces informations seront utilisees par votre Agent IA pour repondre a vos clients.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="biz-name">Nom de l&apos;entreprise ou de l&apos;activite</Label>
            <Input id="biz-name" value={values.name} onChange={(e) => set('name', e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="biz-desc">Description de l&apos;activite</Label>
            <Textarea
              id="biz-desc"
              rows={3}
              value={values.description}
              onChange={(e) => set('description', e.target.value)}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-sector">Secteur d&apos;activite</Label>
              <Input id="biz-sector" value={values.sector} onChange={(e) => set('sector', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-zone">Zone geographique desservie</Label>
              <Input id="biz-zone" value={values.serviceArea} onChange={(e) => set('serviceArea', e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="biz-address">Adresse</Label>
            <Input id="biz-address" value={values.address} onChange={(e) => set('address', e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-phone">Telephone</Label>
              <Input id="biz-phone" value={values.phone} onChange={(e) => set('phone', e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-email">Adresse e-mail</Label>
              <Input id="biz-email" type="email" value={values.email} onChange={(e) => set('email', e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="biz-website">Site internet (si disponible)</Label>
            <Input id="biz-website" value={values.website} onChange={(e) => set('website', e.target.value)} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-hours">Horaires d&apos;ouverture</Label>
              <Input
                id="biz-hours"
                placeholder="Ex. Lun-Ven 8h-18h"
                value={values.openingHours}
                onChange={(e) => set('openingHours', e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="biz-closed">Jours de fermeture</Label>
              <Input
                id="biz-closed"
                placeholder="Ex. Dimanche"
                value={values.closedDays}
                onChange={(e) => set('closedDays', e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="biz-contact">Moyens de contact privilegies</Label>
            <Input
              id="biz-contact"
              placeholder="Ex. WhatsApp, e-mail, messagerie i-tafa"
              value={values.preferredContact}
              onChange={(e) => set('preferredContact', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={saving} className="w-fit">
        {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Enregistrer
      </Button>
    </form>
  )
}
