import Link from 'next/link'

export default function PolitiqueConfidentialitePage() {
  return (
    <main className="mx-auto max-w-4xl px-5 py-12 text-gray-800">
      <header className="mb-10 border-b pb-6">
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-purple-700">
          i-tafa · Protection des données
        </p>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Politique de confidentialité
        </h1>
        <p className="mt-3 text-sm text-gray-500">
          Version 1.0 · 22 octobre 2026
        </p>
        <p className="mt-4">
          Cette politique explique comment i-tafa collecte, utilise, protège et
          conserve les données personnelles des vendeurs et des clients qui
          utilisent sa plateforme.
        </p>
      </header>

      <div className="space-y-8 leading-7">
        <section>
          <h2 className="mb-2 text-xl font-semibold">1. Responsable du traitement</h2>
          <p>
            Le responsable du traitement est l’exploitant de la plateforme
            i-tafa. Son identité légale, son adresse et ses coordonnées de
            contact doivent être complétées ici avant la publication définitive
            de cette politique.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">2. Données susceptibles d’être collectées</h2>
          <p>Selon les fonctionnalités utilisées, i-tafa peut traiter :</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>les données de compte, comme le nom, le pseudo et l’adresse e-mail ;</li>
            <li>les coordonnées fournies, notamment le numéro de téléphone et l’adresse ;</li>
            <li>les informations relatives à la boutique, aux produits, aux services et aux abonnements ;</li>
            <li>les messages échangés avec les vendeurs, les clients ou l’assistant IA ;</li>
            <li>les informations nécessaires au suivi des paiements et des demandes de support ;</li>
            <li>les données techniques et de sécurité nécessaires au fonctionnement du service.</li>
          </ul>
          <p className="mt-2">
            Les données bancaires ou de paiement détaillées ne doivent pas être
            collectées au-delà de ce qui est nécessaire aux moyens de paiement
            effectivement proposés.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">3. Finalités de l’utilisation</h2>
          <p>Les données peuvent être utilisées pour :</p>
          <ul className="mt-2 list-disc space-y-1 pl-6">
            <li>créer et gérer les comptes utilisateurs et les boutiques ;</li>
            <li>fournir les fonctions de marketplace, de messagerie et de gestion ;</li>
            <li>permettre le traitement et la vérification des abonnements et paiements ;</li>
            <li>faire fonctionner l’assistant IA et générer des réponses à partir des informations disponibles ;</li>
            <li>assurer la sécurité, prévenir les abus et résoudre les incidents ;</li>
            <li>répondre aux demandes d’assistance et respecter les obligations légales ;</li>
            <li>envoyer des communications commerciales uniquement selon les choix et les règles applicables.</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">4. Messages et assistant IA</h2>
          <p>
            Les messages et les informations fournis dans une boutique peuvent
            être traités afin de permettre la communication entre vendeurs et
            clients, ainsi que le fonctionnement des réponses automatiques.
            L’assistant peut utiliser les informations de la plateforme
            explicitement publiées et les informations rendues disponibles
            pour la boutique concernée.
          </p>
          <p className="mt-2">
            Les utilisateurs ne doivent pas transmettre de données sensibles
            ou de renseignements personnels inutiles dans les messages. Les
            accès aux conversations et aux données doivent être limités aux
            personnes et fonctions autorisées.
          </p>
          <p className="mt-2">
            Si des services tiers d’intelligence artificielle ou d’hébergement
            traitent des données, leurs rôles, les catégories de données
            transmises et les garanties applicables doivent être précisés avant
            la publication définitive de cette politique.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">5. Partage des données</h2>
          <p>
            Les données peuvent être accessibles aux personnes autorisées au
            sein de la plateforme, au vendeur concerné pour la gestion de sa
            boutique et aux prestataires techniques nécessaires au service,
            dans la limite de leurs fonctions.
          </p>
          <p className="mt-2">
            Les données ne doivent pas être vendues à des tiers à des fins
            publicitaires. Tout partage supplémentaire doit reposer sur une
            base légale appropriée et être expliqué aux personnes concernées.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">6. Hébergement et transferts</h2>
          <p>
            Les données peuvent être hébergées ou traitées par les fournisseurs
            techniques utilisés par i-tafa. Les pays d’hébergement, les éventuels
            transferts internationaux et les garanties associées doivent être
            identifiés et vérifiés avant publication.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">7. Conservation des données</h2>
          <p>
            Les données sont conservées pendant la durée nécessaire aux finalités
            annoncées, à la gestion du compte, à la sécurité et au respect des
            obligations légales applicables. Les durées précises de conservation
            doivent être définies pour chaque catégorie de données.
          </p>
          <p className="mt-2">
            Les preuves d’acceptation des documents juridiques peuvent être
            conservées pendant la durée nécessaire pour démontrer l’acceptation
            et satisfaire aux obligations applicables, avec un accès restreint.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">8. Sécurité</h2>
          <p>
            i-tafa doit mettre en place des mesures techniques et organisationnelles
            proportionnées pour protéger les données contre les accès non
            autorisés, la perte, la modification et la divulgation. Aucun système
            ne peut toutefois garantir une sécurité absolue.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">9. Droits des utilisateurs</h2>
          <p>
            Selon la législation applicable, les personnes concernées peuvent
            disposer de droits d’accès, de rectification, d’opposition, de
            suppression, de limitation ou d’autres droits concernant leurs
            données. Elles peuvent adresser une demande au contact officiel
            d’i-tafa, qui doit être indiqué ci-dessous.
          </p>
          <p className="mt-2">
            Certaines données peuvent devoir être conservées lorsqu’une
            obligation légale ou un motif légitime le justifie. Toute demande
            sera examinée selon les règles applicables.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">10. Cookies et technologies similaires</h2>
          <p>
            La plateforme peut utiliser des cookies ou des technologies
            similaires nécessaires à l’authentification, à la sécurité et au
            maintien de la session. Si des outils de mesure d’audience ou de
            publicité sont utilisés, ils devront être décrits ici, avec les
            choix proposés aux utilisateurs lorsque la loi l’exige.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">11. Communications marketing</h2>
          <p>
            Les communications commerciales facultatives doivent être séparées
            de l’acceptation des conditions d’utilisation et de la politique de
            confidentialité. Lorsqu’un consentement est requis, il doit être
            libre, spécifique et révocable. Le refus du marketing ne doit pas
            empêcher l’inscription au service.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">12. Protection des mineurs</h2>
          <p>
            La plateforme est destinée aux personnes autorisées à conclure les
            actes nécessaires à l’utilisation du service. Les règles applicables
            aux mineurs et les mesures requises doivent être précisées avant
            la publication définitive.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">13. Modifications de la politique</h2>
          <p>
            Cette politique peut être mise à jour. La version et la date de
            révision doivent être indiquées. Lorsque les changements nécessitent
            une nouvelle information ou un nouveau consentement, les utilisateurs
            seront invités à effectuer l’action requise.
          </p>
        </section>

        <section>
          <h2 className="mb-2 text-xl font-semibold">14. Contact</h2>
          <p>
            Pour toute question ou demande concernant les données personnelles,
            contactez l’exploitant d’i-tafa à l’adresse officielle suivante :
            <a
  href="mailto:jeanrinaht@gmail.com"
  className="text-purple-700 underline"
>
  jeanrinaht@gmail.com
</a>.
          </p>
        </section>
      </div>

      <footer className="mt-12 border-t pt-6 text-sm text-gray-500">
        <Link className="text-purple-700 underline" href="/conditions-utilisation">
          Lire les Conditions d’utilisation
        </Link>
        <p className="mt-3">
          Ce document est un projet à compléter et à faire vérifier juridiquement
          avant sa publication définitive.
        </p>
      </footer>
    </main>
  )
}
