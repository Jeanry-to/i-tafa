'use client'

import { useEffect, useState } from 'react'
import {
  CheckCircle2,
  Clock3,
  Loader2,
  MessageCircle,
  PauseCircle,
  Phone,
  UserRound,
  X,
} from 'lucide-react'
import { toast } from 'sonner'

import {
  getClients,
  isClientSuspended,
  reactivateClient,
  suspendClient,
  updateClientStatus,
  validateClient,
  type Client,
} from '@/lib/services/api'

function formatDate(value: string | null | undefined) {
  if (!value) return '—'

  try {
    return new Intl.DateTimeFormat('fr-FR', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value))
  } catch {
    return value
  }
}

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

function getWhatsAppNumber(phone: string) {
  const cleaned = phone.replace(/[^\d+]/g, '')

  if (cleaned.startsWith('+261')) {
    return cleaned.replace('+', '')
  }

  if (cleaned.startsWith('261')) {
    return cleaned
  }

  if (cleaned.startsWith('0')) {
    return `261${cleaned.slice(1)}`
  }

  return cleaned
}

export function ClientManagement({
  onOpenMessage,
}: {
  onOpenMessage?: (clientId: string) => void
}) {
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)

  const [selected, setSelected] = useState<Client | null>(null)
  const [profileClient, setProfileClient] = useState<Client | null>(null)

  const [reason, setReason] = useState('')
  const [until, setUntil] = useState('')

  const [saving, setSaving] = useState(false)

  const [confirmation, setConfirmation] = useState<{
    type: 'validate' | 'refuse'
    client: Client
  } | null>(null)

  async function reload() {
    try {
      setLoading(true)

      const data = await getClients()

      const clientsWithStatus = await Promise.all(
        data.map(async (client) => {
          try {
            const suspended = await isClientSuspended(client.id)

            return {
              ...client,
              status: suspended ? 'suspendu' : client.status,
            } as Client
          } catch {
            return client
          }
        }),
      )

      setClients(clientsWithStatus)
    } catch (error) {
      console.error(error)

      toast.error('Erreur', {
        description: 'Impossible de charger les clients.',
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    reload()
  }, [])

  function openProfile(client: Client) {
    setProfileClient(client)
  }

  function closeProfile() {
    setProfileClient(null)
  }

  function openSuspension(client: Client) {
    setSelected(client)
    setReason('')
    setUntil('')
  }

  function openSuspensionFromProfile() {
    if (!profileClient) return

    setSelected(profileClient)
    setReason('')
    setUntil('')
  }

  function sendMessage(client: Client) {
    closeProfile()

    if (onOpenMessage) {
      onOpenMessage(client.id)
      return
    }

    toast.info('Messagerie', {
      description: `Ouverture de la conversation avec ${client.name}.`,
    })
  }

  function callClient(client: Client) {
    if (!client.phone) {
      toast.error('Numéro indisponible', {
        description:
          'Ce client n’a pas de numéro de téléphone enregistré.',
      })
      return
    }

    window.location.href = `tel:${client.phone}`
  }

  function openWhatsApp(client: Client) {
    if (!client.phone) {
      toast.error('Numéro indisponible', {
        description:
          'Ce client n’a pas de numéro de téléphone enregistré.',
      })
      return
    }

    const number = getWhatsAppNumber(client.phone)

    if (!number) {
      toast.error('Numéro invalide', {
        description:
          'Le numéro de téléphone du client est invalide.',
      })
      return
    }

    window.open(
      `https://wa.me/${number}`,
      '_blank',
      'noopener,noreferrer',
    )
  }

  async function saveSuspension(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    if (!selected) return

    try {
      setSaving(true)

      await suspendClient(selected.id, {
        reason: reason.trim() || null,
        until: until || null,
      })

      toast.success('Client suspendu', {
        description: `${selected.name} a été suspendu.`,
      })

      setSelected(null)
      setProfileClient(null)

      await reload()
    } catch (error) {
      console.error(error)

      toast.error('Erreur', {
        description: 'Impossible de suspendre ce client.',
      })
    } finally {
      setSaving(false)
    }
  }

  async function reactivate(client: Client) {
    try {
      setSaving(true)

      await reactivateClient(client.id)

      toast.success('Client réactivé', {
        description:
          `${client.name} peut de nouveau utiliser son compte.`,
      })

      setProfileClient(null)

      await reload()
    } catch (error) {
      console.error(error)

      toast.error('Erreur', {
        description: 'Impossible de réactiver ce client.',
      })
    } finally {
      setSaving(false)
    }
  }

  function validate(client: Client) {
    setConfirmation({
      type: 'validate',
      client,
    })
  }

  function refuse(client: Client) {
    setConfirmation({
      type: 'refuse',
      client,
    })
  }

  async function confirmAction() {
    if (!confirmation) return

    const { type, client } = confirmation

    try {
      setSaving(true)

      if (type === 'validate') {
        await validateClient(client.id)

        toast.success('Client validé', {
          description: `${client.name} est maintenant actif.`,
        })
      } else {
        await updateClientStatus(client.id, 'suspendu')

        toast.success('Inscription refusée', {
          description: `${client.name} n'a pas été validé.`,
        })
      }

      setConfirmation(null)
      setProfileClient(null)

      await reload()
    } catch (error) {
      console.error(error)

      toast.error('Erreur', {
        description:
          type === 'validate'
            ? 'Impossible de valider ce client.'
            : "Impossible de refuser l'inscription de ce client.",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative">
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="border-b border-border p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-lg font-bold">
                Gestion des clients
              </h2>

              <p className="mt-1 text-sm text-muted-foreground">
                Consultez et gérez les clients de votre boutique.
              </p>
            </div>

            <button
              type="button"
              onClick={reload}
              disabled={loading}
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                'Actualiser'
              )}
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Chargement des clients...
            </div>
          </div>
        ) : clients.length === 0 ? (
          <div className="flex min-h-64 flex-col items-center justify-center p-6 text-center">
            <UserRound className="size-10 text-muted-foreground" />

            <p className="mt-3 font-semibold">
              Aucun client
            </p>

            <p className="mt-1 text-sm text-muted-foreground">
              Les clients de votre boutique apparaîtront ici.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {clients.map((client) => {
              const isSuspended = client.status === 'suspendu'
              const isPending = client.status === 'en_attente'

              return (
                <div
                  key={client.id}
                  className="flex flex-col gap-4 p-5 transition-colors hover:bg-muted/30 lg:flex-row lg:items-center lg:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <button
                      type="button"
                      onClick={() => openProfile(client)}
                      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary transition-colors hover:bg-primary/20"
                      aria-label={`Voir le profil de ${client.name}`}
                    >
                      {getInitials(client.name) || (
                        <UserRound className="size-5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => openProfile(client)}
                      className="group min-w-0 text-left"
                    >
                      <p className="truncate font-semibold group-hover:text-primary">
                        {client.name}
                      </p>

                      <p className="truncate text-sm text-muted-foreground">
                        {client.email || 'Email non renseigné'}
                      </p>

                      {client.phone && (
                        <p className="truncate text-xs text-muted-foreground">
                          {client.phone}
                        </p>
                      )}
                    </button>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isPending ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
                        <Clock3 className="size-3.5" />
                        En attente
                      </span>
                    ) : isSuspended ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-400">
                        <PauseCircle className="size-3.5" />
                        Suspendu
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <CheckCircle2 className="size-3.5" />
                        Actif
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => sendMessage(client)}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <MessageCircle className="size-4" />
                      Message
                    </button>

                    <button
                      type="button"
                      onClick={() => callClient(client)}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-border px-3 text-sm font-medium transition-colors hover:bg-muted"
                    >
                      <Phone className="size-4" />
                      Appel
                    </button>

                    {isPending ? (
                      <>
                        <button
                          type="button"
                          onClick={() => validate(client)}
                          disabled={saving}
                          className="inline-flex h-9 items-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
                        >
                          <CheckCircle2 className="size-4" />
                          Valider
                        </button>

                        <button
                          type="button"
                          onClick={() => refuse(client)}
                          disabled={saving}
                          className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-500/30 px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
                        >
                          <X className="size-4" />
                          Refuser
                        </button>
                      </>
                    ) : isSuspended ? (
                      <button
                        type="button"
                        onClick={() => reactivate(client)}
                        disabled={saving}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-emerald-500/30 px-3 text-sm font-medium text-emerald-700 transition-colors hover:bg-emerald-500/10 disabled:opacity-50 dark:text-emerald-400"
                      >
                        {saving && (
                          <Loader2 className="size-4 animate-spin" />
                        )}
                        Réactiver
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openSuspension(client)}
                        disabled={saving}
                        className="inline-flex h-9 items-center gap-2 rounded-lg border border-red-500/30 px-3 text-sm font-medium text-red-700 transition-colors hover:bg-red-500/10 disabled:opacity-50 dark:text-red-400"
                      >
                        <PauseCircle className="size-4" />
                        Suspendre
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {profileClient && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30">
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-border bg-background shadow-2xl">
            <div className="sticky top-0 flex items-center justify-between border-b border-border bg-background p-5">
              <div>
                <h3 className="font-display text-lg font-bold">
                  Profil client
                </h3>

                <p className="text-sm text-muted-foreground">
                  Informations et actions
                </p>
              </div>

              <button
                type="button"
                onClick={closeProfile}
                className="flex size-9 items-center justify-center rounded-lg hover:bg-muted"
                aria-label="Fermer"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-5">
              <div className="flex flex-col items-center text-center">
                <div className="flex size-20 items-center justify-center rounded-full bg-primary/10 text-xl font-bold text-primary">
                  {getInitials(profileClient.name) || (
                    <UserRound className="size-8" />
                  )}
                </div>

                <h4 className="mt-4 font-display text-xl font-bold">
                  {profileClient.name}
                </h4>

                <p className="mt-1 text-sm text-muted-foreground">
                  {profileClient.email || 'Email non renseigné'}
                </p>

                {profileClient.phone && (
                  <p className="mt-1 text-sm text-muted-foreground">
                    {profileClient.phone}
                  </p>
                )}
              </div>

              <div className="mt-6 space-y-3">
                <button
                  type="button"
                  onClick={() => sendMessage(profileClient)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <MessageCircle className="size-5" />
                  </span>

                  <span>
                    <span className="block text-sm font-semibold">
                      Message
                    </span>

                    <span className="block text-xs text-muted-foreground">
                      Ouvrir la conversation privée
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => callClient(profileClient)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <Phone className="size-5" />
                  </span>

                  <span>
                    <span className="block text-sm font-semibold">
                      Appel
                    </span>

                    <span className="block text-xs text-muted-foreground">
                      Appeler le client
                    </span>
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => openWhatsApp(profileClient)}
                  className="flex w-full items-center gap-3 rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted"
                >
                  <span className="flex size-10 items-center justify-center rounded-lg bg-muted">
                    <MessageCircle className="size-5" />
                  </span>

                  <span>
                    <span className="block text-sm font-semibold">
                      WhatsApp
                    </span>

                    <span className="block text-xs text-muted-foreground">
                      Contacter sur WhatsApp
                    </span>
                  </span>
                </button>

                {profileClient.status === 'en_attente' ? (
                  <>
                    <button
                      type="button"
                      onClick={() => validate(profileClient)}
                      disabled={saving}
                      className="flex w-full items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 p-4 text-left transition-colors hover:bg-primary/10 disabled:opacity-50"
                    >
                      <span className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <CheckCircle2 className="size-5" />
                      </span>

                      <span>
                        <span className="block text-sm font-semibold">
                          Valider le client
                        </span>

                        <span className="block text-xs text-muted-foreground">
                          Autoriser l’accès au compte
                        </span>
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => refuse(profileClient)}
                      disabled={saving}
                      className="flex w-full items-center gap-3 rounded-xl border border-red-500/30 p-4 text-left transition-colors hover:bg-red-500/10 disabled:opacity-50"
                    >
                      <span className="flex size-10 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
                        <X className="size-5" />
                      </span>

                      <span>
                        <span className="block text-sm font-semibold">
                          Refuser l’inscription
                        </span>

                        <span className="block text-xs text-muted-foreground">
                          Refuser cette nouvelle inscription
                        </span>
                      </span>
                    </button>
                  </>
                ) : profileClient.status === 'suspendu' ? (
                  <button
                    type="button"
                    onClick={() => reactivate(profileClient)}
                    disabled={saving}
                    className="flex w-full items-center gap-3 rounded-xl border border-emerald-500/30 p-4 text-left transition-colors hover:bg-emerald-500/10 disabled:opacity-50"
                  >
                    <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
                      <CheckCircle2 className="size-5" />
                    </span>

                    <span>
                      <span className="block text-sm font-semibold">
                        Réactiver
                      </span>

                      <span className="block text-xs text-muted-foreground">
                        Réactiver le compte du client
                      </span>
                    </span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={openSuspensionFromProfile}
                    disabled={saving}
                    className="flex w-full items-center gap-3 rounded-xl border border-red-500/30 p-4 text-left transition-colors hover:bg-red-500/10 disabled:opacity-50"
                  >
                    <span className="flex size-10 items-center justify-center rounded-lg bg-red-500/10 text-red-600">
                      <PauseCircle className="size-5" />
                    </span>

                    <span>
                      <span className="block text-sm font-semibold">
                        Suspendre
                      </span>

                      <span className="block text-xs text-muted-foreground">
                        Bloquer temporairement le client
                      </span>
                    </span>
                  </button>
                )}
              </div>

              <div className="mt-6 rounded-xl border border-border bg-muted/30 p-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Informations
                </p>

                <dl className="mt-3 space-y-3 text-sm">
                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">
                      Statut
                    </dt>

                    <dd className="font-medium">
                      {profileClient.status === 'actif'
                        ? 'Actif'
                        : profileClient.status === 'suspendu'
                          ? 'Suspendu'
                          : 'En attente'}
                    </dd>
                  </div>

                  <div className="flex justify-between gap-4">
                    <dt className="text-muted-foreground">
                      Inscription
                    </dt>

                    <dd className="text-right font-medium">
                      {formatDate(profileClient.created_at)}
                    </dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl border border-border bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b border-border p-5">
              <div>
                <h3 className="font-display text-lg font-bold">
                  Suspendre {selected.name}
                </h3>

                <p className="mt-1 text-sm text-muted-foreground">
                  Le client ne pourra plus utiliser son compte pendant la
                  suspension.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelected(null)}
                className="flex size-9 items-center justify-center rounded-lg hover:bg-muted"
                aria-label="Fermer"
              >
                <X className="size-5" />
              </button>
            </div>

            <form
              onSubmit={saveSuspension}
              className="space-y-5 p-5"
            >
              <div>
                <label
                  htmlFor="suspension-reason"
                  className="mb-2 block text-sm font-medium"
                >
                  Motif
                </label>

                <textarea
                  id="suspension-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Indiquez la raison de la suspension..."
                  rows={4}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus:ring-2 focus:ring-primary"
                />
              </div>

              <div>
                <label
                  htmlFor="suspension-until"
                  className="mb-2 block text-sm font-medium"
                >
                  Suspension jusqu’au
                </label>

                <input
                  id="suspension-until"
                  type="datetime-local"
                  value={until}
                  onChange={(event) => setUntil(event.target.value)}
                  className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none ring-offset-background focus:ring-2 focus:ring-primary"
                />

                <p className="mt-1 text-xs text-muted-foreground">
                  Laissez vide pour une suspension sans date de fin.
                </p>
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="h-10 rounded-lg border border-border px-4 text-sm font-medium hover:bg-muted"
                >
                  Annuler
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex h-10 items-center gap-2 rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                >
                  {saving && (
                    <Loader2 className="size-4 animate-spin" />
                  )}

                  Suspendre le client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmation && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-2xl border border-border bg-background shadow-2xl">
            <div className="p-6">
              <div className="flex items-center gap-3">
                <div
                  className={`flex size-11 items-center justify-center rounded-full ${
                    confirmation.type === 'validate'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-red-500/10 text-red-600'
                  }`}
                >
                  {confirmation.type === 'validate' ? (
                    <CheckCircle2 className="size-6" />
                  ) : (
                    <X className="size-6" />
                  )}
                </div>

                <div>
                  <h3 className="font-display text-lg font-bold">
                    {confirmation.type === 'validate'
                      ? 'Confirmer la validation'
                      : 'Confirmer le refus'}
                  </h3>

                  <p className="text-sm text-muted-foreground">
                    {confirmation.client.name}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm text-muted-foreground">
                {confirmation.type === 'validate'
                  ? 'Voulez-vous vraiment valider cette inscription et autoriser l’accès au compte ?'
                  : 'Voulez-vous vraiment refuser cette inscription ? Le compte ne sera pas activé.'}
              </p>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setConfirmation(null)}
                  disabled={saving}
                  className="h-10 rounded-lg border border-border px-5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Non
                </button>

                <button
                  type="button"
                  onClick={confirmAction}
                  disabled={saving}
                  className={`inline-flex h-10 items-center gap-2 rounded-lg px-5 text-sm font-medium text-white disabled:opacity-50 ${
                    confirmation.type === 'validate'
                      ? 'bg-primary hover:opacity-90'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {saving && (
                    <Loader2 className="size-4 animate-spin" />
                  )}

                  {confirmation.type === 'validate'
                    ? 'Oui, valider'
                    : 'Oui, refuser'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}