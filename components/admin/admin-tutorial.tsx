import {
  Ban,
  BookOpen,
  Megaphone,
  MessagesSquare,
  Smartphone,
  UsersRound,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const guides = [
  {
    icon: Smartphone,
    title: 'Valider un paiement Mvola',
    steps: [
      'Le client paie sur votre numéro Mvola et saisit sa référence.',
      'L’accès est activé automatiquement dès la saisie de la référence.',
      'Un bip de confirmation est émis côté client.',
    ],
  },
  {
    icon: Megaphone,
    title: 'Publier une annonce',
    steps: [
      'Ouvrez l’onglet « Annonces ».',
      'Rédigez un titre et un message, ajoutez photo ou vidéo si besoin.',
      'Publiez : l’annonce apparaît chez tous les clients en lecture seule.',
    ],
  },
  {
    icon: MessagesSquare,
    title: 'Répondre en privé',
    steps: [
      'Ouvrez « Messages » et sélectionnez un client.',
      'Envoyez texte, photos, vidéos ou documents.',
      'Chaque discussion privée pointe uniquement vers vous.',
    ],
  },
  {
    icon: UsersRound,
    title: 'Contacter un client',
    steps: [
      'Ouvrez « Clients ».',
      'Utilisez « Appeler » pour un appel direct.',
      'Ouvrez ses liens Facebook, WhatsApp ou Instagram.',
    ],
  },
  {
    icon: Ban,
    title: 'Modérer et suspendre',
    steps: [
      'Depuis « Clients », utilisez « Suspendre » pour bloquer temporairement.',
      'Utilisez « Supprimer » pour éjecter immédiatement un client.',
      'Rappelez le règlement général en cas de litige.',
    ],
  },
]

export function AdminTutorial() {
  return (
    <div className="flex flex-col gap-6">
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-start gap-3 p-5">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BookOpen className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold">Guide d&apos;utilisation</h2>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Tout ce qu&apos;il faut savoir pour gérer et modérer i-tafa au
              quotidien.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {guides.map((g) => (
          <Card key={g.title}>
            <CardContent className="p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground">
                  <g.icon className="size-4.5" aria-hidden="true" />
                </span>
                <h3 className="font-semibold">{g.title}</h3>
              </div>
              <ol className="mt-4 flex flex-col gap-2.5">
                {g.steps.map((s, i) => (
                  <li key={i} className="flex gap-2.5 text-sm leading-relaxed">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {i + 1}
                    </span>
                    <span className="text-foreground/90">{s}</span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
