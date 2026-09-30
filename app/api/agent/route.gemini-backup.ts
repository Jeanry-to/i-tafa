import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import {
  GoogleGenAI,
  createPartFromUri,
  createUserContent,
} from '@google/genai'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

const serviceRoleKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const geminiApiKey = process.env.GEMINI_API_KEY

const geminiModel =
  process.env.GEMINI_MODEL ||
  'gemini-3.1-flash-lite'

if (!supabaseUrl) {
  throw new Error(
    'NEXT_PUBLIC_SUPABASE_URL est manquante.',
  )
}

if (!serviceRoleKey) {
  throw new Error(
    'SUPABASE_SERVICE_ROLE_KEY est manquante.',
  )
}

if (!geminiApiKey) {
  throw new Error(
    'GEMINI_API_KEY est manquante.',
  )
}

const supabaseAdmin = createClient(
  supabaseUrl,
  serviceRoleKey,
)

const ai = new GoogleGenAI({
  apiKey: geminiApiKey,
})

const MAX_FILES = 5
const MAX_FILE_SIZE = 50 * 1024 * 1024

const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',

  'text/plain',
  'text/markdown',
  'text/csv',
  'text/html',
  'text/css',

  'text/javascript',
  'application/javascript',

  'application/json',
  'application/xml',
  'text/xml',
])

const ALLOWED_EXTENSIONS = new Set([
  '.txt',
  '.md',
  '.csv',
  '.json',
  '.xml',

  '.html',
  '.htm',
  '.css',

  '.js',
  '.jsx',
  '.ts',
  '.tsx',

  '.py',
  '.java',
  '.php',
  '.sql',
  '.c',
  '.cpp',
  '.h',
  '.cs',

  '.doc',
  '.docx',

  '.xls',
  '.xlsx',
])

function getExtension(fileName: string): string {
  const lastDot = fileName.lastIndexOf('.')

  if (lastDot === -1) {
    return ''
  }

  return fileName
    .slice(lastDot)
    .toLowerCase()
}

function isAllowedFile(file: File): boolean {
  const mimeType = file.type.toLowerCase()
  const extension = getExtension(file.name)

  if (mimeType.startsWith('image/')) {
    return true
  }

  if (mimeType.startsWith('audio/')) {
    return true
  }

  if (mimeType.startsWith('video/')) {
    return true
  }

  if (ALLOWED_MIME_TYPES.has(mimeType)) {
    return true
  }

  if (ALLOWED_EXTENSIONS.has(extension)) {
    return true
  }

  return false
}

function buildSystemPrompt(
  shopData: {
    businessInfo: unknown
    products: unknown
    knowledgeBase: unknown
    faqs: unknown
    agentSettings: unknown
  },
) {
  return `
Tu es l'Agent IA d'une boutique utilisant i-tafa.

Tu dois répondre de manière claire, utile,
naturelle et professionnelle.

========================================
REGLES GENERALES
========================================

- Réponds uniquement à partir des informations
  disponibles.
- Ne fabrique jamais une information.
- Ne devine jamais une information manquante.
- Si une information n'est pas connue, dis-le.
- Si un fichier est fourni, analyse réellement
  son contenu.
- Ne prétends jamais avoir lu une information
  qui n'est pas clairement visible.
- Si une information est illisible, indique-le.
- Si une information est partiellement visible,
  indique qu'elle est partiellement lisible.
- Adapte ton analyse au contenu réellement fourni.
- Ne suppose jamais à l'avance qu'un document
  est un CIN, une facture ou un autre type précis.

========================================
INFORMATIONS DE LA BOUTIQUE
========================================

Informations générales :

${JSON.stringify(
  shopData.businessInfo ?? {},
  null,
  2,
)}

Produits et services :

${JSON.stringify(
  shopData.products ?? [],
  null,
  2,
)}

Base de connaissances :

${JSON.stringify(
  shopData.knowledgeBase ?? [],
  null,
  2,
)}

FAQ :

${JSON.stringify(
  shopData.faqs ?? [],
  null,
  2,
)}

Configuration de l'agent :

${JSON.stringify(
  shopData.agentSettings ?? {},
  null,
  2,
)}

========================================
ANALYSE GENERALE DES FICHIERS
========================================

Lorsqu'un fichier, une image ou un document
est fourni, analyse son contenu en fonction
de ce qui est réellement présent.

L'analyse doit être GENERIQUE.

Ne suppose jamais à l'avance qu'il s'agit :

- d'un CIN ;
- d'une facture ;
- d'un contrat ;
- d'un reçu ;
- d'un CV ;
- d'un tableau ;
- d'une capture d'écran ;
- ou d'un autre type particulier.

Commence par identifier, lorsque cela est possible,
la nature ou le type du contenu.

Ensuite, extrais les informations importantes
qui correspondent réellement au contenu observé.

========================================
EXEMPLES D'ANALYSE
========================================

Si c'est une pièce d'identité :

Extraire uniquement les informations réellement
visibles et lisibles, par exemple :

- nom ;
- prénom ;
- date de naissance ;
- lieu de naissance ;
- numéro du document ;
- nationalité ;
- sexe ;
- dates ;
- photo ;
- signature ;
- empreinte ;
- autres informations visibles.

Si c'est une facture :

Extraire si disponible :

- vendeur ;
- client ;
- numéro de facture ;
- date ;
- produits ;
- services ;
- quantités ;
- prix ;
- taxes ;
- sous-total ;
- total ;
- mode de paiement ;
- autres informations pertinentes.

Si c'est un reçu :

Extraire si disponible :

- date ;
- montant ;
- référence ;
- bénéficiaire ;
- moyen de paiement ;
- description ;
- autres informations pertinentes.

Si c'est un contrat :

Extraire si disponible :

- parties ;
- dates ;
- objet ;
- montants ;
- durée ;
- obligations ;
- conditions ;
- clauses importantes ;
- autres informations pertinentes.

Si c'est un CV :

Extraire si disponible :

- nom ;
- coordonnées ;
- profil ;
- expériences ;
- formations ;
- compétences ;
- langues ;
- certifications ;
- autres informations pertinentes.

Si c'est un tableau :

Analyser si pertinent :

- colonnes ;
- lignes ;
- valeurs ;
- totaux ;
- moyennes ;
- tendances ;
- valeurs importantes ;
- anomalies visibles.

Si c'est une capture d'écran :

Analyser :

- texte ;
- messages ;
- boutons ;
- menus ;
- tableaux ;
- erreurs ;
- éléments visuels ;
- informations importantes.

Si c'est une photographie :

Décrire uniquement les éléments réellement
visibles et pertinents pour la demande.

========================================
FORMAT D'ANALYSE
========================================

Adapte automatiquement la structure à chaque
type de contenu.

Lorsque c'est pertinent, utilise :

Type de contenu :
[Type identifié]

Informations détectées :
- [champ] : [valeur]
- [champ] : [valeur]
- [champ] : [valeur]

Éléments visuels :
- [élément]
- [élément]

Informations partiellement lisibles :
- [information]

Informations non lisibles :
- [information]

N'utilise pas une section lorsqu'elle n'est
pas pertinente.

Ne force jamais un document dans un modèle
prédéfini.

========================================
REGLES DE FIABILITE
========================================

IMPORTANT :

- Ne devine jamais.
- Ne complète jamais une donnée manquante.
- Ne transforme jamais une supposition en fait.
- Ne modifie jamais une valeur lue.
- Respecte exactement les chiffres visibles.
- Respecte exactement les dates visibles.
- Respecte exactement les noms visibles.
- Si un caractère est incertain, indique-le.
- Si un champ est impossible à lire, indique
  "Non lisible".
- Si seule une partie est visible, indique
  "Partiellement lisible".

Si l'utilisateur demande une information précise,
réponds principalement à cette demande.

Si l'utilisateur demande une analyse complète,
analyse l'ensemble du contenu disponible.

========================================
STYLE
========================================

Respecte les paramètres de l'agent configurés
pour la boutique.

Utilise un langage clair.

N'invente aucune information concernant
la boutique, les produits ou les documents.
`
}

async function callGemini(
  prompt: string,
  files: File[],
) {
  const uploadedFiles: Array<{
    name?: string
  }> = []

  try {
    const parts: any[] = []

    for (const file of files) {
      const mimeType =
        file.type || 'application/octet-stream'

      const blob = new Blob(
        [await file.arrayBuffer()],
        {
          type: mimeType,
        },
      )

      const uploaded = await ai.files.upload({
        file: blob,
        config: {
          mimeType,
          displayName: file.name,
        },
      })

      uploadedFiles.push(uploaded)

      if (!uploaded.uri) {
        throw new Error(
          `Impossible de récupérer le fichier ${file.name}.`,
        )
      }

      parts.push(
        createPartFromUri(
          uploaded.uri,
          uploaded.mimeType || mimeType,
        ),
      )
    }

    parts.push({
      text: prompt,
    })

    const response = await ai.models.generateContent({
      model: geminiModel,
      contents: createUserContent(parts),
    })

    return response.text || ''
  } finally {
    for (const uploaded of uploadedFiles) {
      if (!uploaded.name) {
        continue
      }

      try {
        await ai.files.delete({
          name: uploaded.name,
        })
      } catch (error) {
        console.error(
          'Erreur suppression fichier Gemini:',
          error,
        )
      }
    }
  }
}

export async function POST(
  request: Request,
) {
  try {
    const formData = await request.formData()

    const messageValue =
      formData.get('message')

    const clientIdValue =
      formData.get('clientId')

    const historyValue =
      formData.get('history')

    const message =
      typeof messageValue === 'string'
        ? messageValue.trim()
        : ''

    const clientId =
      typeof clientIdValue === 'string'
        ? clientIdValue
        : ''

    const history =
      typeof historyValue === 'string'
        ? historyValue
        : '[]'

    const files = formData
      .getAll('files')
      .filter(
        (value): value is File =>
          value instanceof File,
      )

    if (!message && files.length === 0) {
      return NextResponse.json(
        {
          error:
            'Veuillez écrire un message ou joindre un fichier.',
        },
        {
          status: 400,
        },
      )
    }

    if (files.length > MAX_FILES) {
      return NextResponse.json(
        {
          error:
            `Vous pouvez envoyer au maximum ${MAX_FILES} fichiers.`,
        },
        {
          status: 400,
        },
      )
    }

    for (const file of files) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json(
          {
            error:
              `Le fichier ${file.name} dépasse la taille maximale de 50 Mo.`,
          },
          {
            status: 400,
          },
        )
      }

      if (!isAllowedFile(file)) {
        return NextResponse.json(
          {
            error:
              `Le type de fichier ${file.name} n'est pas encore pris en charge.`,
          },
          {
            status: 400,
          },
        )
      }
    }

    if (!clientId) {
      return NextResponse.json(
        {
          error: 'clientId manquant.',
        },
        {
          status: 400,
        },
      )
    }

    const {
      data: client,
      error: clientError,
    } = await supabaseAdmin
      .from('clients')
      .select(
        'id, profile_id, shop_id',
      )
      .eq('id', clientId)
      .single()

    if (clientError || !client) {
      return NextResponse.json(
        {
          error: 'Client introuvable.',
        },
        {
          status: 404,
        },
      )
    }

    if (!client.shop_id) {
      return NextResponse.json(
        {
          error:
            'Aucune boutique associée à ce client.',
        },
        {
          status: 400,
        },
      )
    }

    const shopId = client.shop_id

    const [
      businessInfoResult,
      productsResult,
      knowledgeBaseResult,
      faqsResult,
      agentSettingsResult,
    ] = await Promise.all([
      supabaseAdmin
        .from('business_info')
        .select('*')
        .eq('shop_id', shopId)
        .maybeSingle(),

      supabaseAdmin
        .from('products')
        .select('*')
        .eq('shop_id', shopId),

      supabaseAdmin
        .from('knowledge_base')
        .select('*')
        .eq('shop_id', shopId),

      supabaseAdmin
        .from('faqs')
        .select('*')
        .eq('shop_id', shopId),

      supabaseAdmin
        .from('agent_settings')
        .select('*')
        .eq('shop_id', shopId)
        .maybeSingle(),
    ])

    const systemPrompt =
      buildSystemPrompt({
        businessInfo:
          businessInfoResult.data ?? {},

        products:
          productsResult.data ?? [],

        knowledgeBase:
          knowledgeBaseResult.data ?? [],

        faqs:
          faqsResult.data ?? [],

        agentSettings:
          agentSettingsResult.data ?? {},
      })

    let parsedHistory: unknown = []

    try {
      parsedHistory =
        JSON.parse(history)
    } catch {
      parsedHistory = []
    }

    const prompt = `
${systemPrompt}

========================================
HISTORIQUE DE CONVERSATION
========================================

${JSON.stringify(
  parsedHistory,
  null,
  2,
)}

========================================
MESSAGE DE L'UTILISATEUR
========================================

${
  message ||
  '(Aucun texte. Analyse uniquement les fichiers fournis.)'
}

========================================
INSTRUCTION
========================================

Réponds maintenant à l'utilisateur.

Si des fichiers sont joints :

1. Analyse-les attentivement.
2. Identifie leur contenu.
3. Adapte l'analyse au type de contenu.
4. Extrais uniquement les informations réellement
   visibles ou lisibles.
5. Indique les informations non lisibles.
6. N'invente aucune information.

Si plusieurs fichiers sont fournis,
analyse-les individuellement puis donne
une synthèse si cela est utile.
`

    const reply = await callGemini(
      prompt,
      files,
    )

    if (!reply.trim()) {
      return NextResponse.json(
        {
          error:
            "L'IA n'a pas généré de réponse.",
        },
        {
          status: 500,
        },
      )
    }

    const {
      data: adminProfile,
    } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .limit(1)
      .maybeSingle()

    if (adminProfile?.id) {
      const {
        error: messageInsertError,
      } = await supabaseAdmin
        .from('messages')
        .insert({
          client_id: clientId,
          sender_id: adminProfile.id,
          body: reply,
        })

      if (messageInsertError) {
        console.error(
          'Erreur sauvegarde réponse IA:',
          messageInsertError,
        )
      }
    }

    return NextResponse.json({
      success: true,
      reply,
    })
  } catch (error) {
    console.error(
      'Erreur API Agent IA:',
      error,
    )

    const errorMessage =
      error instanceof Error
        ? error.message
        : "Une erreur est survenue avec l'Agent IA."

    return NextResponse.json(
      {
        error: errorMessage,
      },
      {
        status: 500,
      },
    )
  }
}