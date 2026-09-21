'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  BellRing,
  Check,
  Copy,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  MessagesSquare,
  ShieldCheck,
  Smartphone,
} from 'lucide-react'
import { toast } from 'sonner'

import { BrandLogo } from '@/components/brand-logo'
import { GoogleButton } from '@/components/auth/google-button'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { BRAND } from '@/lib/mock-data'
import {
  signIn,
  signUp,
  signOut,
  getCurrentProfile,
  getClientForProfile,
  isClientSuspended,
  getActivePaymentMethods,
  isClientPending,
  submitPaymentReference,
  type PaymentMethod,
} from '@/lib/services/api'
import { playBip } from '@/lib/beep'

type Mode = 'auth' | 'forgot'

const features = [
  {
    icon: ShieldCheck,
    title: 'Connexion securisee',
    text: 'Compte Google ou identifiant, session limitee a un seul appareil.',
  },
  {
    icon: MessagesSquare,
    title: 'Messagerie directe',
    text: 'Discussion privee avec Sarobidy et annonces officielles.',
  },
  {
    icon: Smartphone,
    title: 'Paiement Mvola',
    text: 'Payez, entrez la reference, accedez immediatement au service.',
  },
]

export function AuthScreen() {
  const router = useRouter()
  const [mode, setMode] = useState<Mode>('auth')

  return (
    <main className="flex min-h-screen flex-col lg:flex-row">
      {/* Brand panel */}
      <section className="relative flex flex-col justify-between gap-10 bg-sidebar px-6 py-8 text-sidebar-foreground lg:w-[44%] lg:px-12 lg:py-12">
        <BrandLogo variant="light" />

        <div className="hidden lg:block">
          <h1 className="text-balance font-display text-4xl font-bold leading-tight">
            Restez connecte a votre service, en toute confiance.
          </h1>

          <p className="mt-4 max-w-md text-pretty leading-relaxed text-sidebar-foreground/70">
            i-tafa reunit paiement Mvola, messagerie privee et annonces dans un
            espace simple et securise, gere par {BRAND.owner}.
          </p>

          <ul className="mt-10 flex flex-col gap-6">
            {features.map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sidebar-accent">
                  <f.icon
                    className="size-5 text-sidebar-primary"
                    aria-hidden="true"
                  />
                </span>

                <div>
                  <p className="font-semibold">{f.title}</p>

                  <p className="text-sm leading-relaxed text-sidebar-foreground/70">
                    {f.text}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <p className="hidden text-xs text-sidebar-foreground/50 lg:block">
          (c) 2026 i-tafa - Titulaire du compte : {BRAND.owner}
        </p>
      </section>

      {/* Form panel */}
      <section className="flex flex-1 items-center justify-center px-6 py-10 lg:px-12">
        <div className="w-full max-w-md">
          {mode === 'forgot' ? (
            <ForgotPassword onBack={() => setMode('auth')} />
          ) : (
            <AuthTabs
              onForgot={() => setMode('forgot')}
              onEnterClient={() => router.push('/client')}
              onEnterAdmin={() => router.push('/admin')}
              onRegisterComplete={async () => {
                await signOut()
                window.location.href = '/'
              }}
            />
          )}
        </div>
      </section>
    </main>
  )
}

function AuthTabs({
  onForgot,
  onEnterClient,
  onEnterAdmin,
  onRegisterComplete,
}: {
  onForgot: () => void
  onEnterClient: () => void
  onEnterAdmin: () => void
  onRegisterComplete: () => void
}) {
  return (
    <>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Bienvenue</h2>

        <p className="mt-1 text-sm text-muted-foreground">
          Connectez-vous ou creez votre compte pour acceder a i-tafa.
        </p>
      </div>

      <Tabs defaultValue="login">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Connexion</TabsTrigger>
          <TabsTrigger value="register">Inscription</TabsTrigger>
        </TabsList>

        <TabsContent value="login" className="mt-6">
          <LoginForm
            onForgot={onForgot}
            onEnterClient={onEnterClient}
            onEnterAdmin={onEnterAdmin}
          />
        </TabsContent>

        <TabsContent value="register" className="mt-6">
          <RegisterFlow onSuccess={onRegisterComplete} />
        </TabsContent>
      </Tabs>
    </>
  )
}

function LoginForm({
  onForgot,
  onEnterClient,
  onEnterAdmin,
}: {
  onForgot: () => void
  onEnterClient: () => void
  onEnterAdmin: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      await signIn(identifier, password)

      const profile = await getCurrentProfile()

      if (profile?.role === 'admin') {
        toast.success('Connexion administrateur', {
          description: `Bienvenue ${profile.full_name}, acces a l'espace de gestion.`,
        })

        onEnterAdmin()
      } else {
        const client = profile
          ? await getClientForProfile(profile.id)
          : null

        if (client && isClientPending(client)) {
          await signOut()

          toast.error('Compte en attente de validation', {
            description:
              'Votre paiement est en cours de verification par un administrateur.',
          })

          return
        }

        if (client && isClientSuspended(client)) {
          await signOut()

          const until = client.suspendedUntil
            ? new Intl.DateTimeFormat('fr-FR', {
                dateStyle: 'long',
              }).format(new Date(client.suspendedUntil))
            : null

          toast.error('Compte suspendu', {
            description: [
              client.suspensionReason
                ? `Motif : ${client.suspensionReason}`
                : 'Votre acces est suspendu.',
              until
                ? `Fin prevue : ${until}`
                : 'Sans date de fin.',
            ].join(' — '),
          })

          return
        }

        toast.success('Connexion reussie', {
          description:
            'Toute session sur un autre appareil a ete fermee.',
        })

        onEnterClient()
      }
    } catch (error) {
      toast.error('Connexion impossible', {
        description:
          error instanceof Error
            ? error.message
            : 'Identifiants incorrects.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <GoogleButton
        label="Continuer avec Google"
        onClick={onEnterClient}
      />

      <Divider />

      <div className="flex flex-col gap-2">
        <Label htmlFor="login-id">
          Identifiant ou e-mail
        </Label>

        <Input
          id="login-id"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          placeholder="miora.rakoto@email.mg"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label htmlFor="login-pw">
            Mot de passe
          </Label>

          <button
            type="button"
            onClick={onForgot}
            className="text-xs font-medium text-primary hover:underline"
          >
            Mot de passe oublie ?
          </button>
        </div>

        <PasswordInput
          id="login-pw"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="********"
          required
        />
      </div>

      <div className="flex items-start gap-2 rounded-lg bg-secondary/60 p-3 text-xs text-secondary-foreground">
        <Lock
          className="mt-0.5 size-3.5 shrink-0"
          aria-hidden="true"
        />

        <span>
          Acces limite a 1 appareil : une nouvelle connexion deconnecte
          automatiquement l&apos;ancien appareil.
        </span>
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

        Se connecter
      </Button>
    </form>
  )
}

function RegisterFlow({
  onSuccess,
}: {
  onSuccess: () => void
}) {
  const [step, setStep] = useState<'info' | 'pay' | 'done'>('info')

  return (
    <div>
      <StepIndicator step={step} />

      {step === 'info' && (
        <RegisterInfo onNext={() => setStep('pay')} />
      )}

      {step === 'pay' && (
        <PaymentStep onValidated={() => setStep('done')} />
      )}

      {step === 'done' && (
        <RegisterDone onEnter={onSuccess} />
      )}
    </div>
  )
}

function StepIndicator({
  step,
}: {
  step: 'info' | 'pay' | 'done'
}) {
  const order = ['info', 'pay', 'done']
  const idx = order.indexOf(step)
  const labels = ['Compte', 'Paiement', 'Acces']

  return (
    <div className="mb-6 flex items-center gap-2">
      {labels.map((label, i) => (
        <div
          key={label}
          className="flex flex-1 items-center gap-2"
        >
          <div className="flex items-center gap-2">
            <span
              className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                i <= idx
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < idx ? (
                <Check
                  className="size-3.5"
                  aria-hidden="true"
                />
              ) : (
                i + 1
              )}
            </span>

            <span
              className={`text-xs font-medium ${
                i <= idx
                  ? 'text-foreground'
                  : 'text-muted-foreground'
              }`}
            >
              {label}
            </span>
          </div>

          {i < labels.length - 1 && (
            <span
              className={`h-px flex-1 ${
                i < idx ? 'bg-primary' : 'bg-border'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function RegisterInfo({
  onNext,
}: {
  onNext: () => void
}) {
  const [loading, setLoading] = useState(false)
  const [fullName, setFullName] = useState('')
  const [pseudo, setPseudo] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  async function submit(e: React.FormEvent) {
    e.preventDefault()

    if (password !== confirmPassword) {
      toast.error(
        'Les mots de passe ne correspondent pas',
      )
      return
    }

    if (password.length < 6) {
      toast.error(
        'Le mot de passe doit contenir au moins 6 caracteres',
      )
      return
    }

    setLoading(true)

    try {
      await signUp(
        email,
        password,
        fullName,
        pseudo,
      )

      toast.success('Compte cree', {
        description: 'Passons maintenant au paiement.',
      })

      onNext()
    } catch (error) {
      toast.error('Inscription impossible', {
        description:
          error instanceof Error
            ? error.message
            : 'Reessayez.',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-4"
    >
      <GoogleButton
        label="S'inscrire avec Google"
        onClick={onNext}
      />

      <Divider />

      <div className="flex flex-col gap-2">
        <Label htmlFor="reg-name">
          Nom complet
        </Label>

        <Input
          id="reg-name"
          value={fullName}
          onChange={(e) =>
            setFullName(e.target.value)
          }
          placeholder="Miora Rakoto"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reg-pseudo">
          Pseudo
        </Label>

        <Input
          id="reg-pseudo"
          value={pseudo}
          onChange={(e) =>
            setPseudo(e.target.value)
          }
          placeholder="miora_r"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reg-email">
          Adresse e-mail
        </Label>

        <Input
          id="reg-email"
          type="email"
          value={email}
          onChange={(e) =>
            setEmail(e.target.value)
          }
          placeholder="vous@email.mg"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reg-pw">
          Mot de passe
        </Label>

        <PasswordInput
          id="reg-pw"
          value={password}
          onChange={(e) =>
            setPassword(e.target.value)
          }
          placeholder="Choisissez un mot de passe"
          required
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="reg-pw-confirm">
          Confirmer le mot de passe
        </Label>

        <PasswordInput
          id="reg-pw-confirm"
          value={confirmPassword}
          onChange={(e) =>
            setConfirmPassword(e.target.value)
          }
          placeholder="Confirmez le mot de passe"
          required
        />
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

        Continuer vers le paiement
      </Button>
    </form>
  )
}

function PaymentStep({
  onValidated,
}: {
  onValidated: () => void
}) {
  const [methods, setMethods] = useState<PaymentMethod[]>([])
  const [loadingMethods, setLoadingMethods] = useState(true)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getActivePaymentMethods()
      .then((data) => {
        setMethods(data)
        setSelectedId(data[0]?.id ?? null)
      })
      .catch((err) =>
        console.error(
          'Erreur chargement moyens de paiement:',
          err,
        ),
      )
      .finally(() => setLoadingMethods(false))
  }, [])

  const selected = methods.find(
    (m) => m.id === selectedId,
  )

  function copyDetails() {
    if (!selected) return

    navigator.clipboard?.writeText(
      selected.accountDetails,
    )

    toast.success('Copie')
  }

  async function validate(
    e: React.FormEvent,
  ) {
    e.preventDefault()

    if (!reference.trim() || !selected) {
      return
    }

    setLoading(true)

    try {
      const profile = await getCurrentProfile()

      const client = profile
        ? await getClientForProfile(profile.id)
        : null

      if (!client) {
        throw new Error(
          'Client introuvable, reessayez de vous inscrire.',
        )
      }

      await submitPaymentReference(client.id, {
        method: selected.label,
        reference,
      })

      playBip()

      toast.success('Reference enregistree', {
        description:
          'Un administrateur va verifier votre paiement et activer votre compte.',
      })

      onValidated()
    } catch (error) {
      toast.error('Enregistrement impossible', {
        description:
          error instanceof Error
            ? error.message
            : 'Reessayez.',
      })
    } finally {
      setLoading(false)
    }
  }

  if (loadingMethods) {
    return (
      <div className="flex justify-center py-10">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    )
  }

  if (methods.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        Aucun moyen de paiement disponible pour le moment.
        Contactez {BRAND.owner}.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label>
          Choisissez un moyen de paiement
        </Label>

        <div className="flex flex-wrap gap-2">
          {methods.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() =>
                setSelectedId(m.id)
              }
              className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                selectedId === m.id
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {selected && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="flex flex-col gap-3 p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Smartphone
                className="size-4"
                aria-hidden="true"
              />

              {selected.label}
            </div>

            <div className="flex items-center justify-between rounded-lg bg-card p-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  Coordonnees
                </p>

                <p className="font-display text-base font-bold tracking-wide">
                  {selected.accountDetails}
                </p>
              </div>

              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={copyDetails}
                className="gap-1.5"
              >
                <Copy
                  className="size-3.5"
                  aria-hidden="true"
                />
                Copier
              </Button>
            </div>

            {selected.instructions && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {selected.instructions}
              </p>
            )}
          </CardContent>
        </Card>
      )}

      <form
        onSubmit={validate}
        className="flex flex-col gap-4"
      >
        <div className="flex flex-col gap-2">
          <Label htmlFor="ref">
            Reference de la transaction
          </Label>

          <Input
            id="ref"
            value={reference}
            onChange={(e) =>
              setReference(e.target.value)
            }
            placeholder="Ex. : MVL7X4K29B"
            required
          />
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

          Valider le paiement
        </Button>
      </form>
    </div>
  )
}

function RegisterDone({
  onEnter,
}: {
  onEnter: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <BellRing
          className="size-8"
          aria-hidden="true"
        />
      </span>

      <div>
        <h3 className="font-display text-xl font-bold">
          Paiement enregistre - en attente de validation
        </h3>

        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Un bip de confirmation a ete emis et votre acces
          a i-tafa est pret. Vous pouvez maintenant completer
          votre profil.
        </p>
      </div>

      <Button
        className="w-full"
        onClick={onEnter}
      >
        Retour a la connexion
      </Button>
    </div>
  )
}

function ForgotPassword({
  onBack,
}: {
  onBack: () => void
}) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function submit(
    e: React.FormEvent,
  ) {
    e.preventDefault()

    if (!email.trim()) {
      toast.error(
        'Veuillez saisir votre adresse e-mail.',
      )
      return
    }

    setLoading(true)

    try {
      const { supabase } =
        await import('@/lib/supabase')

      const redirectTo =
        `${window.location.origin}/auth/callback?next=/reset-password`

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          email.trim(),
          {
            redirectTo,
          },
        )

      if (error) {
        throw error
      }

      setSent(true)

      toast.success('E-mail envoyé', {
        description:
          'Si un compte existe avec cette adresse, vous recevrez un lien de réinitialisation.',
      })
    } catch (error) {
      console.error(
        'Erreur mot de passe oublié :',
        error,
      )

      toast.error(
        'Impossible d’envoyer le lien',
        {
          description:
            error instanceof Error
              ? error.message
              : 'Veuillez réessayer.',
        },
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft
          className="size-4"
          aria-hidden="true"
        />

        Retour à la connexion
      </button>

      <h2 className="font-display text-2xl font-bold">
        Mot de passe oublié
      </h2>

      <p className="mt-1 text-sm text-muted-foreground">
        Saisissez votre e-mail pour recevoir un lien de
        réinitialisation.
      </p>

      {sent ? (
        <div className="mt-6 flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
            <Check
              className="mt-0.5 size-5 shrink-0 text-primary"
              aria-hidden="true"
            />

            <div className="text-sm leading-relaxed">
              <p>
                Si un compte existe pour cette adresse, un lien de
                réinitialisation vient d’être envoyé.
              </p>

              <p className="mt-2 text-muted-foreground">
                Vérifiez également votre dossier spam ou courrier
                indésirable.
              </p>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setSent(false)
              setEmail('')
            }}
          >
            Renvoyer avec une autre adresse
          </Button>
        </div>
      ) : (
        <form
          onSubmit={submit}
          className="mt-6 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="forgot-email">
              Adresse e-mail
            </Label>

            <Input
              id="forgot-email"
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="vous@email.mg"
              autoComplete="email"
              required
            />
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
              ? 'Envoi en cours...'
              : 'Envoyer le lien'}
          </Button>
        </form>
      )}
    </div>
  )
}

function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  required,
}: {
  id: string
  value: string
  onChange: (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => void
  placeholder?: string
  required?: boolean
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="relative">
      <Input
        id={id}
        type={visible ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className="pr-10"
      />

      <button
        type="button"
        onClick={() =>
          setVisible((v) => !v)
        }
        aria-label={
          visible
            ? 'Masquer le mot de passe'
            : 'Afficher le mot de passe'
        }
        className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
      >
        {visible ? (
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
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />

      <span className="text-xs text-muted-foreground">
        ou
      </span>

      <span className="h-px flex-1 bg-border" />
    </div>
  )
}