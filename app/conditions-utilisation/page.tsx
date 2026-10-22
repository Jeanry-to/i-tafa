import Link from 'next/link'

export default function ConditionsUtilisationPage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12 text-gray-800">
      <header className="mb-10 border-b pb-6">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-purple-700">
          i-tafa · Marketplace et services numériques
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Conditions d’utilisation
        </h1>
        <p className="mt-3 text-sm text-gray-500">
          Version 1.0 · 22 octobre 2026
        </p>
        <p className="mt-4">
          Les présentes conditions définissent les règles d’utilisation de la
          plateforme i-tafa par les vendeurs, les entreprises et les clients.
        </p>
      </header>

      <div className="space-y-8 leading-7">
        <section>
          <h2 className="mb-2 text-xl font-semibold">1. Présentation d’i-tafa</h2>
          <p>
            i-tafa est une plateforme numérique permettant notamment aux
            entreprises et aux vendeurs de présenter leurs produits ou services,
            de communiquer avec leurs clients et d’utiliser des outils de gestion
            et d’assistance par intelligence artificielle.
          </p>
          <p className="mt-2">
            Selon les fonctionnalités disponibles, la plateforme peut également
            proposer un espace marketplace permettant de découvrir les offres
            publiées par différents vendeurs.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">2. Acceptation des conditions</h2>
          <p>
            L’utilisation des fonctionnalités nécessitant un compte suppose
            l’acceptation des présentes conditions et de la{' '}
            <Link className="text-purple-700 underline" href="/politique-confidentialite">
              Politique de confidentialité
            </Link>.
            Les documents applicables et leur version doivent être présentés
            à l’utilisateur avant son acceptation.
          </p>
          <p className="mt-2">
            L’utilisateur doit fournir des informations exactes et maintenir
            à jour les informations nécessaires à son compte.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">3. Comptes et sécurité</h2>
          <p>
            Chaque utilisateur est responsable de la confidentialité de ses
            identifiants et des activités réalisées depuis son compte. Il doit
            signaler rapidement tout accès non autorisé et ne doit pas utiliser
            le compte d’une autre personne sans autorisation.
          </p>
          <p className="mt-2">
            L’utilisateur doit respecter les règles applicables et ne pas tenter
            de compromettre la sécurité, la disponibilité ou le fonctionnement
            de la plateforme.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">4. Obligations des vendeurs</h2>
          <p>Le vendeur s’engage à :</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>publier des informations exactes et à jour sur son entreprise ;</li>
            <li>présenter honnêtement ses produits, services et prix ;</li>
            <li>indiquer clairement les conditions de livraison, de paiement, de retour et de garantie applicables ;</li>
            <li>respecter les droits des clients et les lois applicables ;</li>
            <li>ne pas publier de contenu illégal, frauduleux, trompeur ou portant atteinte aux droits d’autrui ;</li>
            <li>traiter les demandes des clients de manière loyale et professionnelle.</li>
          </ul>
          <p className="mt-2">
            Le vendeur reste responsable de ses offres, de leur disponibilité,
            de l’exécution des commandes et des engagements qu’il prend envers
            ses clients, sous réserve des responsabilités imposées par la loi.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">5. Obligations des clients</h2>
          <p>
            Les clients s’engagent à utiliser la plateforme de bonne foi, à
            communiquer des informations exactes et à respecter les vendeurs
            et les autres utilisateurs. Toute commande est soumise aux conditions
            annoncées par le vendeur et aux règles légales applicables.
          </p>
          <p className="mt-2">
            Avant de payer, le client doit vérifier le prix, les caractéristiques
            de l’offre, les modalités de livraison et les éventuelles conditions
            de retour ou de remboursement.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">6. Marketplace et transactions</h2>
          <p>
            Sauf indication explicite contraire, i-tafa fournit des outils
            numériques de présentation, de communication et de mise en relation.
            La présence d’une offre sur la plateforme ne constitue pas, à elle
            seule, une garantie de qualité, de disponibilité ou de conformité
            de cette offre.
          </p>
          <p className="mt-2">
            Les responsabilités exactes d’i-tafa dans chaque transaction
            dépendent des fonctionnalités effectivement proposées et des règles
            légales applicables. Les modalités de paiement, de livraison, de
            réclamation et de remboursement doivent être clairement communiquées
            aux utilisateurs.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">7. Abonnements et paiements i-tafa</h2>
          <p>
            Certaines fonctionnalités destinées aux vendeurs peuvent nécessiter
            un abonnement payant. Le prix, la durée, les fonctionnalités incluses
            et les moyens de paiement disponibles sont ceux affichés au moment
            de la souscription.
          </p>
          <p className="mt-2">
            Lorsqu’un paiement nécessite une vérification ou une confirmation,
            l’activation de l’abonnement peut attendre cette validation.
            Toute condition de renouvellement, d’expiration ou de remboursement
            doit être communiquée avant le paiement.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">8. Assistant d’intelligence artificielle</h2>
          <p>
            Les réponses générées par l’assistant IA sont fournies à titre
            d’assistance à partir des informations accessibles et configurées
            pour la plateforme ou la boutique concernée. Elles peuvent être
            incomplètes ou comporter des erreurs.
          </p>
          <p className="mt-2">
            Les vendeurs doivent vérifier les informations importantes et restent
            responsables des engagements commerciaux communiqués à leurs clients.
            L’assistant ne doit pas être utilisé pour générer des contenus
            frauduleux, illégaux ou portant atteinte aux droits d’autrui.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">9. Propriété intellectuelle</h2>
          <p>
            Les éléments appartenant à i-tafa, notamment son nom, son identité
            visuelle et ses logiciels, restent soumis aux droits de leurs
            titulaires. Le vendeur conserve les droits qu’il détient sur ses
            contenus et doit disposer des autorisations nécessaires pour les
            publier sur la plateforme.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">10. Suspension et résiliation</h2>
          <p>
            En cas de suspicion raisonnable de fraude, de violation des présentes
            conditions, d’atteinte à la sécurité ou d’obligation légale, i-tafa
            peut prendre des mesures proportionnées, notamment limiter ou
            suspendre certaines fonctionnalités, dans le respect des règles
            applicables et des droits de l’utilisateur.
          </p>
          <p className="mt-2">
            Les modalités de résiliation, les conséquences sur un abonnement
            et le traitement des données après fermeture d’un compte doivent
            respecter les engagements contractuels et les obligations légales.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">11. Disponibilité du service</h2>
          <p>
            i-tafa s’efforce de maintenir la plateforme accessible et sécurisée,
            sans garantir une disponibilité ininterrompue. Des opérations de
            maintenance, des incidents techniques ou des interruptions de
            services tiers peuvent survenir.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">12. Données personnelles</h2>
          <p>
            Le traitement des données personnelles est décrit dans la{' '}
            <Link className="text-purple-700 underline" href="/politique-confidentialite">
              Politique de confidentialité
            </Link>,
            qui précise notamment les finalités, les données concernées, leur
            conservation et les modalités d’exercice des droits des utilisateurs.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">13. Modification des conditions</h2>
          <p>
            Les présentes conditions peuvent être mises à jour pour tenir compte
            de l’évolution du service ou des exigences légales. La version et
            la date de mise à jour doivent être indiquées. Lorsqu’une nouvelle
            acceptation est requise, elle sera demandée avant la poursuite de
            l’utilisation des fonctionnalités concernées.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">14. Droit applicable et contact</h2>
          <p>
            Les présentes conditions doivent être interprétées conformément
            aux règles impératives applicables. Le droit applicable, les
            coordonnées de l’exploitant d’i-tafa et les modalités de règlement
            des litiges doivent être complétés et vérifiés avant publication.
          </p>
          <p className="mt-2">
            Contact : ajoutez ici l’adresse officielle de contact d’i-tafa.
          </p>
        </section>
      </div>

      <footer className="mt-12 border-t pt-6 text-sm text-gray-500">
        <Link className="text-purple-700 underline" href="/politique-confidentialite">
          Lire la Politique de confidentialité
        </Link>
        <p className="mt-3">
          Ce document constitue un projet à adapter et à faire vérifier
          juridiquement avant sa publication définitive.
        </p>
      </footer>
    </main>
  )
}
