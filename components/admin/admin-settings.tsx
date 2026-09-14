'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { getCurrentProfile, updateProfile } from '@/lib/services/api'
import { supabase } from '@/lib/supabase'
import { ThemeToggle } from '@/components/theme-toggle'
import { AccentColorPicker } from '@/components/accent-color-picker'
import { LanguageSwitcher } from '@/components/language-switcher'

export function AdminSettings() {
  const [profileId, setProfileId] = useState<string | null>(null)
  const [email, setEmail] = useState('')
  const [fullName, setFullName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    getCurrentProfile()
      .then((profile: any) => {
        if (profile) {
          setProfileId(profile.id)
          setEmail(profile.email ?? '')
          setFullName(profile.full_name ?? '')
          setPhone(profile.phone ?? '')
          setAddress(profile.address ?? '')
        }
      })
      .catch((err) => console.error('Erreur chargement profil admin:', err))
      .finally(() => setLoading(false))
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    if (!profileId) return
    setSavingProfile(true)
    try {
      await updateProfile(profileId, { full_name: fullName, phone, address })
      toast.success('Profil mis a jour')
    } catch (err) {
      toast.error('Enregistrement impossible', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSavingProfile(false)
    }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault()
    if (!newPassword) return
    setSavingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword })
      if (error) throw new Error(error.message)
      toast.success('Mot de passe mis a jour')
      setNewPassword('')
    } catch (err) {
      toast.error('Changement impossible', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSavingPassword(false)
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
    <div className="flex max-w-3xl flex-col gap-6">
      <form onSubmit={saveProfile}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Profil administrateur</CardTitle>
            <p className="text-sm text-muted-foreground">
              Vos informations personnelles en tant qu&apos;administrateur.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-email">Adresse e-mail</Label>
              <Input id="admin-email" value={email} disabled />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-name">Nom complet</Label>
              <Input id="admin-name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="admin-phone">Telephone</Label>
                <Input id="admin-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="admin-address">Adresse</Label>
                <Input id="admin-address" value={address} onChange={(e) => setAddress(e.target.value)} />
              </div>
            </div>
          </CardContent>
        </Card>
        <Button type="submit" disabled={savingProfile} className="mt-4 w-fit">
          {savingProfile && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Enregistrer
        </Button>
      </form>

      <form onSubmit={changePassword}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Mot de passe</CardTitle>
            <p className="text-sm text-muted-foreground">
              Changez le mot de passe de votre compte administrateur.
            </p>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-new-password">Nouveau mot de passe</Label>
              <Input
                id="admin-new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 6 caracteres"
              />
            </div>
          </CardContent>
        </Card>
        <Button type="submit" disabled={savingPassword || !newPassword} className="mt-4 w-fit">
          {savingPassword && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Changer le mot de passe
        </Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Apparence et langue</CardTitle>
          <p className="text-sm text-muted-foreground">
            Personnalisez le theme, la couleur et la langue de votre espace.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ThemeToggle />
          <AccentColorPicker />
          <LanguageSwitcher />
        </CardContent>
      </Card>
    </div>
  )
}
