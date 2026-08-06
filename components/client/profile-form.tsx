'use client'

import { useState } from 'react'
import { Camera, Loader2, MapPin, ShieldCheck, Smartphone } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { currentClient } from '@/lib/mock-data'

export function ProfileForm() {
  const [loading, setLoading] = useState(false)
  const [photoName, setPhotoName] = useState<string | null>(null)
  const [address, setAddress] = useState(currentClient.address)

  const complete = Boolean(photoName) && address.trim().length > 0

  function save(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      toast.success('Profil enregistré')
    }, 700)
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={save} className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations du profil</CardTitle>
            <p className="text-sm text-muted-foreground">
              La photo de profil et l&apos;adresse physique sont obligatoires.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {/* Photo */}
            <div className="flex flex-col gap-2">
              <Label>Photo de profil</Label>
              <div className="flex items-center gap-4">
                <div className="flex size-20 items-center justify-center overflow-hidden rounded-full border border-dashed border-border bg-muted text-muted-foreground">
                  {photoName ? (
                    <span className="px-2 text-center text-[10px] font-medium leading-tight">
                      {photoName}
                    </span>
                  ) : (
                    <Camera className="size-6" aria-hidden="true" />
                  )}
                </div>
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) =>
                      setPhotoName(e.target.files?.[0]?.name ?? 'photo-profil.jpg')
                    }
                  />
                  <span className="inline-flex h-9 items-center rounded-md border border-input bg-card px-3 text-sm font-medium">
                    Choisir une photo
                  </span>
                </label>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" defaultValue={currentClient.name} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input id="email" type="email" defaultValue={currentClient.email} />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Téléphone</Label>
                <Input id="phone" defaultValue={currentClient.phone} />
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="address" className="flex items-center gap-1.5">
                <MapPin className="size-3.5" aria-hidden="true" />
                Adresse physique
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Lot, quartier, ville"
                required
              />
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <span
                className={`text-xs font-medium ${complete ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {complete ? 'Profil complet' : 'Champs obligatoires manquants'}
              </span>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Sécurité</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="new-pw">Modifier le mot de passe</Label>
              <Input id="new-pw" type="password" placeholder="Nouveau mot de passe" />
              <Input type="password" placeholder="Confirmer le mot de passe" />
              <Button variant="secondary" size="sm" className="mt-1 w-full">
                Mettre à jour le mot de passe
              </Button>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-secondary/60 p-3 text-xs leading-relaxed text-secondary-foreground">
              <Smartphone className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>
                Appareil actuel : {currentClient.device}. Une connexion sur un
                autre appareil fermera automatiquement celui-ci.
              </span>
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3 text-xs leading-relaxed text-primary">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              <span>Connexion sécurisée active sur un seul appareil.</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
