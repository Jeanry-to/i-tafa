'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  Lock,
} from 'lucide-react'
import { toast } from 'sonner'

import { BrandLogo } from '@/components/brand-logo'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { supabase } from '@/lib/supabase'

export default function ResetPasswordPage() {
  const router = useRouter()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] =
    useState('')

  const [showPassword, setShowPassword] =
    useState(false)
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false)

  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] =
    useState(true)
  const [success, setSuccess] = useState(false)
  const [validSession, setValidSession] =
    useState(false)

  useEffect(() => {
    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (session) {
          setValidSession(true)
        } else {
          setValidSession(false)
        }
      } catch (error) {
        console.error(
          'Erreur vérification session reset password:',
          error,
        )

        setValidSession(false)
      } finally {
        setCheckingSession(false)
      }
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (
          event === 'PASSWORD_RECOVERY' ||
          event === 'SIGNED_IN'
        ) {
          setValidSession(Boolean(session))
        }
      },
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(
    e: React.FormEvent,
  ) {
    e.preventDefault()

    if (password.length < 6) {
      toast.error(
        'Le mot de passe doit contenir au moins 6 caractères.',
      )
      return
    }

    if (password !== confirmPassword) {
      toast.error(
        'Les mots de passe ne correspondent pas.',
      )
      return
    }

    setLoading(true)

    try {
      const { error } =
        await supabase.auth.updateUser({
          password,
        })

      if (error) {
        throw error
      }

      setSuccess(true)

      toast.success('Mot de passe modifié', {
        description:
          'Votre nouveau mot de passe a été enregistré.',
      })
    } catch (error) {
      console.error(
        'Erreur changement mot de passe:',
        error,
      )

      toast.error(
        'Impossible de modifier le mot de passe',
        {
          description:
            error instanceof Error
              ? error.message
              : 'Le lien est peut-être expiré. Demandez un nouveau lien.',
        },
      )
    } finally {
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2
            className="size-8 animate-spin text-primary"
            aria-hidden="true"
          />

          <p className="text-sm text-muted-foreground">
            Vérification du lien de réinitialisation...
          </p>
        </div>
      </main>
    )
  }

  if (!validSession && !success) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
              <Lock
                className="size-7 text-destructive"
                aria-hidden="true"
              />
            </span>

            <div>
              <h1 className="font-display text-2xl font-bold">
                Lien invalide ou expiré
              </h1>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Ce lien de réinitialisation n’est plus valide.
                Demandez un nouveau lien depuis la page de connexion.
              </p>
            </div>

            <Button
              className="w-full"
              onClick={() => router.push('/')}
            >
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  if (success) {
    return (
      <main className="flex min-h-screen items-center justify-center px-6">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-5 p-8 text-center">
            <span className="flex size-16 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle2
                className="size-8 text-primary"
                aria-hidden="true"
              />
            </span>

            <div>
              <h1 className="font-display text-2xl font-bold">
                Mot de passe modifié
              </h1>

              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Votre nouveau mot de passe a bien été enregistré.
                Vous pouvez maintenant vous connecter avec celui-ci.
              </p>
            </div>

            <Button
              className="w-full"
              onClick={() => router.push('/')}
            >
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      <section className="relative flex flex-col justify-center bg-sidebar px-6 py-10 text-sidebar-foreground lg:w-[44%] lg:px-12">
        <BrandLogo variant="light" />

        <div className="mt-12 hidden lg:block">
          <h1 className="font-display text-4xl font-bold leading-tight">
            Sécurisez votre compte i-tafa.
          </h1>

          <p className="mt-4 max-w-md leading-relaxed text-sidebar-foreground/70">
            Choisissez un nouveau mot de passe pour retrouver
            l’accès à votre compte.
          </p>
        </div>
      </section>

      <section className="flex flex-1 items-center justify-center px-6 py-10 lg:px-12">
        <div className="w-full max-w-md">
          <Card>
            <CardContent className="p-6 sm:p-8">
              <div className="mb-6">
                <h2 className="font-display text-2xl font-bold">
                  Nouveau mot de passe
                </h2>

                <p className="mt-1 text-sm text-muted-foreground">
                  Entrez votre nouveau mot de passe ci-dessous.
                </p>
              </div>

              <form
                onSubmit={handleSubmit}
                className="flex flex-col gap-5"
              >
                <div className="flex flex-col gap-2">
                  <Label htmlFor="new-password">
                    Nouveau mot de passe
                  </Label>

                  <div className="relative">
                    <Input
                      id="new-password"
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      value={password}
                      onChange={(e) =>
                        setPassword(e.target.value)
                      }
                      placeholder="Votre nouveau mot de passe"
                      autoComplete="new-password"
                      required
                      minLength={6}
                      className="pr-10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (value) => !value,
                        )
                      }
                      aria-label={
                        showPassword
                          ? 'Masquer le mot de passe'
                          : 'Afficher le mot de passe'
                      }
                      className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {showPassword ? (
                        <EyeOff
                          className="size-4"
                          aria-hidden="true"
                        />
                      ) : (
                        <Eye
                          className="size-4"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </div>

                  <p className="text-xs text-muted-foreground">
                    Minimum 6 caractères.
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="confirm-password">
                    Confirmer le mot de passe
                  </Label>

                  <div className="relative">
                    <Input
                      id="confirm-password"
                      type={
                        showConfirmPassword
                          ? 'text'
                          : 'password'
                      }
                      value={confirmPassword}
                      onChange={(e) =>
                        setConfirmPassword(
                          e.target.value,
                        )
                      }
                      placeholder="Confirmez votre mot de passe"
                      autoComplete="new-password"
                      required
                      minLength={6}
                      className="pr-10"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(
                          (value) => !value,
                        )
                      }
                      aria-label={
                        showConfirmPassword
                          ? 'Masquer le mot de passe'
                          : 'Afficher le mot de passe'
                      }
                      className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
                    >
                      {showConfirmPassword ? (
                        <EyeOff
                          className="size-4"
                          aria-hidden="true"
                        />
                      ) : (
                        <Eye
                          className="size-4"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading && (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  )}

                  {loading
                    ? 'Modification...'
                    : 'Modifier mon mot de passe'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    </main>
  )
}