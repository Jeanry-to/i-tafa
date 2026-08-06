import { ScrollText, ShieldCheck } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { rules } from '@/lib/mock-data'

export function RulesCard({ editable = false }: { editable?: boolean }) {
  return (
    <Card>
      <CardHeader className="flex-row items-center gap-2 space-y-0">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <ScrollText className="size-4.5" aria-hidden="true" />
        </span>
        <div>
          <CardTitle className="text-base">Règlement général</CardTitle>
          <p className="text-xs text-muted-foreground">
            {editable
              ? 'Visible par tous les clients dès leur connexion.'
              : 'À respecter pour conserver votre accès.'}
          </p>
        </div>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col gap-3">
          {rules.map((rule, i) => (
            <li key={i} className="flex gap-3 text-sm leading-relaxed">
              <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-secondary-foreground">
                {i + 1}
              </span>
              <span className="text-foreground/90">{rule}</span>
            </li>
          ))}
        </ol>
        {editable && (
          <p className="mt-4 flex items-center gap-2 rounded-lg bg-muted p-3 text-xs text-muted-foreground">
            <ShieldCheck className="size-3.5 shrink-0" aria-hidden="true" />
            Ce règlement est épinglé en haut de chaque tableau de bord client.
          </p>
        )}
      </CardContent>
    </Card>
  )
}
