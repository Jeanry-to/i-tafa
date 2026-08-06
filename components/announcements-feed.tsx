import { ImageIcon, Megaphone } from 'lucide-react'
import { InitialsAvatar } from '@/components/initials-avatar'
import { Card, CardContent } from '@/components/ui/card'
import { announcements, BRAND } from '@/lib/mock-data'

export function AnnouncementsFeed() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start gap-3 rounded-xl border border-border bg-muted/50 p-4">
        <Megaphone className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" />
        <p className="text-sm leading-relaxed text-muted-foreground">
          Canal d&apos;annonces officiel. Seul {BRAND.owner} publie ici ; la
          lecture seule est activée pour les clients.
        </p>
      </div>

      {announcements.map((a) => (
        <Card key={a.id}>
          <CardContent className="p-5">
            <div className="flex items-center gap-3">
              <InitialsAvatar name={BRAND.owner} className="size-9" />
              <div>
                <p className="text-sm font-semibold">
                  {BRAND.owner}{' '}
                  <span className="font-normal text-muted-foreground">· Admin</span>
                </p>
                <p className="text-xs text-muted-foreground">{a.date}</p>
              </div>
            </div>
            <h3 className="mt-4 font-display text-lg font-bold">{a.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">
              {a.body}
            </p>
            {a.attachment && (
              <div className="mt-4 flex items-center gap-2 rounded-lg border border-border bg-muted/60 p-3 text-sm text-muted-foreground">
                <ImageIcon className="size-4" aria-hidden="true" />
                {a.attachment.name}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
