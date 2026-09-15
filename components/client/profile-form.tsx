'use client'

import { useEffect, useState } from 'react'
import { Eye, EyeOff, Loader2, MapPin, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/theme-toggle'
 import { AccentColorPicker } from '@/components/accent-color-picker'
import { supabase } from '@/lib/supabase'
import { getCurrentProfile, updateProfile } from '@/lib/services/api'

type ProfileData = {
  id: string
  full_name: string
  email: string
  phone: string | null
  address: string | null
  pseudo?: string | null
}

export function ProfileForm() {
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loading, setLoading] = useState(true)

  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  useEffect(() => {
    getCurrentProfile()
      .then((data) => {
        if (data) {
          setProfile(data)
          setFullName(data.full_name ?? '')
          setPhone(data.phone ?? '')
          setAddress(data.address ?? '')
        }
      })
      .catch((err) => console.error('Erreur chargement profil:', err))
      .finally(() => setLoading(false))
  }, [])

  const complete = fullName.trim().length > 0 && address.trim().length > 0

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!profile) return
    setSavingProfile(true)
    try {
      await updateProfile(profile.id, {
        full_name: fullName.trim(),
        phone: phone.trim(),
        address: address.trim(),
      })
      toast.success('Profil enregistre')
    } catch (err) {
      toast.error('Enregistrement impossible', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSavingProfile(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    )
  }

  if (!profile) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Impossible de charger votre profil. Reconnectez-vous.
      </p>
    )
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <form onSubmit={saveProfile} className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informations du profil</CardTitle>
            <p className="text-sm text-muted-foreground">
              Le nom complet et l&apos;adresse physique sont recommandes.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Nom complet</Label>
              <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <Input id="email" type="email" value={profile.email} disabled />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="phone">Telephone</Label>
                <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
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
              />
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4">
              <span
                className={`text-xs font-medium ${complete ? 'text-primary' : 'text-muted-foreground'}`}
              >
                {complete ? 'Profil complet' : 'Champs recommandes manquants'}
              </span>
              <Button type="submit" disabled={savingProfile}>
                {savingProfile && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
                Enregistrer
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>

      <div className="flex flex-col gap-6">
        <PasswordSection />

                <Card>
          <CardHeader>
            <CardTitle className="text-base">Apparence</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <ThemeToggle />
            <AccentColorPicker />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-start gap-2 rounded-lg bg-primary/5 p-3 text-xs leading-relaxed text-primary">
            <ShieldCheck className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>Connexion securisee active sur ce compte.</span>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function PasswordSection() {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [saving, setSaving] = useState(false)

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPassword.length < 6) {
      toast.error('Le mot de passe doit contenir au moins 6 caracteres')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Les mots de passe ne correspondent pas')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw new Error(error.message)
      toast.success('Mot de passe mis a jour')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error('Mise a jour impossible', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Securite</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={changePassword} className="flex flex-col gap-3">
          <Label htmlFor="new-pw">Nouveau mot de passe</Label>
          <PasswordField id="new-pw" value={newPassword} onChange={setNewPassword} placeholder="Nouveau mot de passe" />
          <PasswordField
            id="confirm-pw"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Confirmer le mot de passe"
          />
          <Button type="submit" variant="secondary" size="sm" className="mt-1 w-full" disabled={saving}>
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Mettre a jour le mot de passe
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function PasswordField({
  id,
  value,
  onChange,
  placeholder,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  const [visible, setVisible] = useState(false)
  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pr-10"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
        className="absolute right-2 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        {visible ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
      </button>
    </div>
  )
}
