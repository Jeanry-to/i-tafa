'use client'

import { useState } from 'react'
import {
  Ban,
  Camera,
  MapPin,
  MessageCircleMore,
  Phone,
  RotateCcw,
  ThumbsUp,
  Trash2,
} from 'lucide-react'
import { toast } from 'sonner'
import { InitialsAvatar } from '@/components/initials-avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { clients as seed, type Client } from '@/lib/mock-data'
import { cn } from '@/lib/utils'

export function ClientManagement() {
  const [list, setList] = useState<Client[]>(seed)
  const [toDelete, setToDelete] = useState<Client | null>(null)

  function toggleSuspend(c: Client) {
    setList((l) =>
      l.map((x) =>
        x.id === c.id
          ? { ...x, status: x.status === 'actif' ? 'suspendu' : 'actif' }
          : x,
      ),
    )
    toast.success(
      c.status === 'actif'
        ? `${c.name} a été suspendu`
        : `${c.name} a été réactivé`,
    )
  }

  function confirmDelete() {
    if (!toDelete) return
    setList((l) => l.filter((x) => x.id !== toDelete.id))
    toast.success(`${toDelete.name} a été supprimé`)
    setToDelete(null)
  }

  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        {list.map((c) => (
          <Card key={c.id}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <InitialsAvatar name={c.name} className="size-12" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate font-semibold">{c.name}</p>
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-[10px] font-semibold',
                        c.status === 'actif'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-destructive/10 text-destructive',
                      )}
                    >
                      {c.status === 'actif' ? 'Actif' : 'Suspendu'}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{c.phone}</p>
                  <p className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                    <MapPin className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                    {c.address}
                  </p>
                </div>
              </div>

              {/* Contact actions */}
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Button asChild size="sm" className="gap-1.5">
                  <a href={`tel:${c.phone.replace(/\s/g, '')}`}>
                    <Phone className="size-3.5" aria-hidden="true" />
                    Appeler
                  </a>
                </Button>
                {c.socials.whatsapp && (
                  <SocialLink href={c.socials.whatsapp} label="WhatsApp">
                    <MessageCircleMore className="size-4" aria-hidden="true" />
                  </SocialLink>
                )}
                {c.socials.facebook && (
                  <SocialLink href={c.socials.facebook} label="Facebook">
                    <ThumbsUp className="size-4" aria-hidden="true" />
                  </SocialLink>
                )}
                {c.socials.instagram && (
                  <SocialLink href={c.socials.instagram} label="Instagram">
                    <Camera className="size-4" aria-hidden="true" />
                  </SocialLink>
                )}
              </div>

              {/* Moderation */}
              <div className="mt-3 flex items-center gap-2 border-t border-border pt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => toggleSuspend(c)}
                >
                  {c.status === 'actif' ? (
                    <>
                      <Ban className="size-3.5" aria-hidden="true" />
                      Suspendre
                    </>
                  ) : (
                    <>
                      <RotateCcw className="size-3.5" aria-hidden="true" />
                      Réactiver
                    </>
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1.5 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setToDelete(c)}
                >
                  <Trash2 className="size-3.5" aria-hidden="true" />
                  Supprimer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={Boolean(toDelete)} onOpenChange={(o) => !o && setToDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Supprimer ce client ?</DialogTitle>
            <DialogDescription>
              {toDelete?.name} sera immédiatement éjecté et perdra tout accès à
              i-tafa. Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button variant="destructive" onClick={confirmDelete}>
              Supprimer définitivement
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string
  label: string
  children: React.ReactNode
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      title={label}
      className="flex size-9 items-center justify-center rounded-md border border-input bg-card text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
    >
      {children}
    </a>
  )
}
