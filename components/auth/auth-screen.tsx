'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import {
  ArrowLeft,
  BellRing,
  Check,
  Copy,
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
import { ADMIN, BRAND, isAdminLogin } from '@/lib/mock-data'
import { playBip } from '@/lib/beep'

type Mode = 'auth' | 'forgot'

const features = [
  {
    icon: ShieldCheck,
    title: 'Connexion sécurisée',
    text: 'Compte Google ou identifiant, session limitée à un seul appareil.',
  },
  {
    icon: MessagesSquare,
    title: 'Messagerie directe',
    text: 'Discussion privée avec Sarobidy et annonces officielles.',
  },
  {
    icon: Smartphone,
    title: 'Paiement Mvola',
    text: 'Payez, entrez la référence, accédez immédiatement au service.',
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
            Restez connecté à votre service, en toute confiance.
          </h1>
          <p className="mt-4 max-w-md text-pretty leading-relaxed text-sidebar-foreground/70">
            i-tafa réunit paiement Mvola, messagerie privée et annonces dans un
            espace simple et sécurisé, géré par {BRAND.owner}.
          </p>
          <ul className="mt-10 flex flex-col gap-6">
            {features.map((f) => (
              <li key={f.title} className="flex gap-4">
                <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-sidebar-accent">
                  <f.icon className="size-5 text-sidebar-primary" aria-hidden="true" />
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
          © 2026 i-tafa · Titulaire du compte : {BRAND.owner}
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
}: {
  onForgot: () => void
  onEnterClient: () => void
  onEnterAdmin: () => void
}) {
  return (
    <>
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold">Bienvenue</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Connectez-vous ou créez votre compte pour accéder à i-tafa.
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
          <RegisterFlow onSuccess={onEnterClient} />
        </TabsContent>
      </Tabs>

      <div className="mt-8 rounded-xl border border-dashed border-border bg-muted/50 p-4">
        <p className="text-xs font-medium text-muted-foreground">
          Accès démo (prototype)
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          Connexion administrateur :{' '}
          <span className="font-medium text-foreground">{ADMIN.email}</span> ·
          mot de passe{' '}
          <span className="font-medium text-foreground">{ADMIN.password}</span>
        </p>
        <div className="mt-2 flex gap-2">
          <Button size="sm" variant="secondary" className="flex-1" onClick={onEnterClient}>
            Espace client
          </Button>
          <Button size="sm" variant="secondary" className="flex-1" onClick={onEnterAdmin}>
            Espace admin
          </Button>
        </div>
      </div>
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

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const asAdmin = isAdminLogin(identifier, password)
    setTimeout(() => {
      if (asAdmin) {
        toast.success('Connexion administrateur', {
          description: `Bienvenue ${ADMIN.name}, accès à l'espace de gestion.`,
        })
        onEnterAdmin()
      } else {
        toast.success('Connexion réussie', {
          description: 'Toute session sur un autre appareil a été fermée.',
        })
        onEnterClient()
      }
    }, 700)
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <GoogleButton label="Continuer avec Google" onClick={onEnterClient} />
      <Divider />
      <div className="flex flex-col gap-2">
        <Label htmlFor="login-id">Identifiant ou e-mail</Label>
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
          <Label htmlFor="login-pw">Mot de passe</Label>
          <button
            type="button"
            onClick={onForgot}
            className="text-xs font-medium text-primary hover:underline"
          >
            Mot de passe oublié ?
          </button>
        </div>
        <Input
          id="login-pw"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
        />
      </div>
      <div className="flex items-start gap-2 rounded-lg bg-secondary/60 p-3 text-xs text-secondary-foreground">
        <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        <span>
          Accès limité à 1 appareil : une nouvelle connexion déconnecte
          automatiquement l&apos;ancien appareil.
        </span>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Se connecter
      </Button>
    </form>
  )
}

function RegisterFlow({ onSuccess }: { onSuccess: () => void }) {
  const [step, setStep] = useState<'info' | 'pay' | 'done'>('info')

  return (
    <div>
      <StepIndicator step={step} />
      {step === 'info' && <RegisterInfo onNext={() => setStep('pay')} />}
      {step === 'pay' && <MvolaPayment onValidated={() => setStep('done')} />}
      {step === 'done' && <RegisterDone onEnter={onSuccess} />}
    </div>
  )
}

function StepIndicator({ step }: { step: 'info' | 'pay' | 'done' }) {
  const order = ['info', 'pay', 'done']
  const idx = order.indexOf(step)
  const labels = ['Compte', 'Paiement', 'Accès']
  return (
    <div className="mb-6 flex items-center gap-2">
      {labels.map((label, i) => (
        <div key={label} className="flex flex-1 items-center gap-2">
          <div className="flex items-center gap-2">
            <span
              className={`flex size-6 items-center justify-center rounded-full text-xs font-bold ${
                i <= idx
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              {i < idx ? <Check className="size-3.5" aria-hidden="true" /> : i + 1}
            </span>
            <span
              className={`text-xs font-medium ${i <= idx ? 'text-foreground' : 'text-muted-foreground'}`}
            >
              {label}
            </span>
          </div>
          {i < labels.length - 1 && (
            <span
              className={`h-px flex-1 ${i < idx ? 'bg-primary' : 'bg-border'}`}
            />
          )}
        </div>
      ))}
    </div>
  )
}

function RegisterInfo({ onNext }: { onNext: () => void }) {
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onNext()
      }}
      className="flex flex-col gap-4"
    >
      <GoogleButton label="S'inscrire avec Google" onClick={onNext} />
      <Divider />
      <div className="flex flex-col gap-2">
        <Label htmlFor="reg-name">Nom complet</Label>
        <Input id="reg-name" placeholder="Miora Rakoto" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="reg-email">Adresse e-mail</Label>
        <Input id="reg-email" type="email" placeholder="vous@email.mg" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="reg-pw">Mot de passe</Label>
        <Input id="reg-pw" type="password" placeholder="Choisissez un mot de passe" required />
      </div>
      <Button type="submit" className="w-full">
        Continuer vers le paiement
      </Button>
    </form>
  )
}

function MvolaPayment({ onValidated }: { onValidated: () => void }) {
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)

  function copyNumber() {
    navigator.clipboard?.writeText(BRAND.mvolaNumber.replace(/\s/g, ''))
    toast.success('Numéro copié')
  }

  function validate(e: React.FormEvent) {
    e.preventDefault()
    if (!reference.trim()) return
    setLoading(true)
    setTimeout(() => {
      playBip()
      toast.success('Paiement validé', {
        description: 'Votre accès à i-tafa a été activé.',
      })
      onValidated()
    }, 900)
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex flex-col gap-3 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Smartphone className="size-4" aria-hidden="true" />
            Paiement Mvola
          </div>
          <div className="flex items-center justify-between rounded-lg bg-card p-3">
            <div>
              <p className="text-xs text-muted-foreground">Numéro Mvola</p>
              <p className="font-display text-lg font-bold tracking-wide">
                {BRAND.mvolaNumber}
              </p>
            </div>
            <Button type="button" size="sm" variant="outline" onClick={copyNumber} className="gap-1.5">
              <Copy className="size-3.5" aria-hidden="true" />
              Copier
            </Button>
          </div>
          <div className="rounded-lg bg-card p-3">
            <p className="text-xs text-muted-foreground">Titulaire du compte</p>
            <p className="font-semibold">{BRAND.owner}</p>
          </div>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Effectuez votre paiement Mvola au numéro ci-dessus, puis saisissez la
            référence de la transaction pour activer votre accès.
          </p>
        </CardContent>
      </Card>

      <form onSubmit={validate} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="ref">Référence de la transaction</Label>
          <Input
            id="ref"
            value={reference}
            onChange={(e) => setReference(e.target.value)}
            placeholder="Ex. : MVL7X4K29B"
            required
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
          Valider le paiement
        </Button>
      </form>
    </div>
  )
}

function RegisterDone({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="flex flex-col items-center gap-4 py-4 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-primary/10 text-primary">
        <BellRing className="size-8" aria-hidden="true" />
      </span>
      <div>
        <h3 className="font-display text-xl font-bold">Accès activé !</h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          Un bip de confirmation a été émis et votre accès à i-tafa est prêt.
          Vous pouvez maintenant compléter votre profil.
        </p>
      </div>
      <Button className="w-full" onClick={onEnter}>
        Accéder à mon espace
      </Button>
    </div>
  )
}

function ForgotPassword({ onBack }: { onBack: () => void }) {
  const [sent, setSent] = useState(false)
  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Retour à la connexion
      </button>
      <h2 className="font-display text-2xl font-bold">Mot de passe oublié</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Saisissez votre e-mail pour recevoir un lien de réinitialisation.
      </p>
      {sent ? (
        <div className="mt-6 flex items-start gap-3 rounded-xl border border-primary/20 bg-primary/5 p-4">
          <Check className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
          <p className="text-sm leading-relaxed">
            Si un compte existe pour cette adresse, un lien de réinitialisation
            vient d&apos;être envoyé.
          </p>
        </div>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            setSent(true)
          }}
          className="mt-6 flex flex-col gap-4"
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="forgot-email">Adresse e-mail</Label>
            <Input id="forgot-email" type="email" placeholder="vous@email.mg" required />
          </div>
          <Button type="submit" className="w-full">
            Envoyer le lien
          </Button>
        </form>
      )}
    </div>
  )
}

function Divider() {
  return (
    <div className="flex items-center gap-3">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs text-muted-foreground">ou</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
