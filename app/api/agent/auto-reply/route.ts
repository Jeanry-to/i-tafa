import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

import {
  buildSystemPrompt,
  callGroq,
  getShopData,
  isClientSuspended,
  saveAIMessage,
} from '../route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

type WebhookRecord = {
  id?: string
  client_id?: string
  sender_id?: string
  shop_id?: string
  body?: string | null
  is_ai?: boolean
}

type WebhookPayload = {
  type?: string
  table?: string
  schema?: string
  record?: WebhookRecord | null
}

function skipped(reason: string) {
  return NextResponse.json({
    success: true,
    skipped: true,
    reason,
  })
}

function unauthorized() {
  return NextResponse.json(
    {
      success: false,
      error: 'Acces non autorise.',
    },
    {
      status: 401,
    },
  )
}

export async function POST(
  request: Request,
) {
  try {
    const expectedSecret =
      process.env.ITAFA_AUTO_REPLY_SECRET

    if (!expectedSecret) {
      console.error(
        'ITAFA_AUTO_REPLY_SECRET est manquant.',
      )

      return NextResponse.json(
        {
          success: false,
          error:
            'Configuration du repondeur automatique manquante.',
        },
        {
          status: 500,
        },
      )
    }

    const receivedSecret =
      request.headers.get(
        'x-itafa-auto-reply-secret',
      )

    if (
      !receivedSecret ||
      receivedSecret !== expectedSecret
    ) {
      return unauthorized()
    }

    const payload =
      (await request.json()) as WebhookPayload

    if (
      payload.type &&
      payload.type !== 'INSERT'
    ) {
      return skipped('Evenement ignore.')
    }

    if (
      payload.schema &&
      payload.schema !== 'public'
    ) {
      return skipped('Schema ignore.')
    }

    if (
      payload.table &&
      payload.table !== 'messages'
    ) {
      return skipped('Table ignoree.')
    }

    const record = payload.record

    if (!record) {
      return skipped('Aucun message recu.')
    }

    const messageId = record.id
    const clientId = record.client_id
    const senderId = record.sender_id
    const shopId = record.shop_id

    const body =
      typeof record.body === 'string'
        ? record.body.trim()
        : ''

    if (
      !messageId ||
      !clientId ||
      !senderId ||
      !shopId
    ) {
      return skipped('Message incomplet.')
    }

    if (record.is_ai === true) {
      return skipped('Message IA ignore.')
    }

    if (!body) {
      return skipped('Message vide.')
    }

    /*
     * Client Supabase serveur (cle service role).
     * Cree une seule fois pour toute la requete.
     */
    const supabaseUrl =
      process.env.NEXT_PUBLIC_SUPABASE_URL

    const serviceRoleKey =
      process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'Configuration Supabase serveur manquante.',
      )
    }

    const admin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
      },
    )

    /*
     * Protection contre les doublons :
     * si ce message a deja une reponse IA,
     * on ne repond pas une deuxieme fois.
     */
    const {
      data: existingReply,
      error: existingReplyError,
    } = await admin
      .from('messages')
      .select('id')
      .eq('reply_to_id', messageId)
      .eq('is_ai', true)
      .limit(1)
      .maybeSingle()

    if (existingReplyError) {
      throw new Error(
        existingReplyError.message,
      )
    }

    if (existingReply) {
      return skipped(
        'Reponse IA deja envoyee pour ce message.',
      )
    }

    /*
     * Verifie que le message appartient bien
     * au client et a sa boutique.
     */
    const shopData =
      await getShopData(clientId)

    if (shopData.shopId !== shopId) {
      return skipped('Boutique incorrecte.')
    }

    /*
     * Verifie que sender_id correspond bien
     * au profil du client.
     */
    const {
      data: client,
      error: clientError,
    } = await admin
      .from('clients')
      .select(
        'id, profile_id, shop_id, status',
      )
      .eq('id', clientId)
      .maybeSingle()

    if (clientError) {
      throw new Error(clientError.message)
    }

    if (!client) {
      return skipped('Client introuvable.')
    }

    if (client.shop_id !== shopId) {
      return skipped(
        'Client et boutique incompatibles.',
      )
    }

    if (client.profile_id !== senderId) {
      return skipped(
        'Le message ne provient pas du client.',
      )
    }

    if (await isClientSuspended(clientId)) {
      return skipped('Client suspendu.')
    }

    if (!shopData.settings?.auto_reply_enabled) {
      return skipped(
        'Reponse automatique desactivee.',
      )
    }

    /*
     * Recupere les derniers messages pour donner
     * a Groq le contexte de la conversation.
     */
    const {
      data: historyRows,
      error: historyError,
    } = await admin
      .from('messages')
      .select(
        `
        id,
        sender_id,
        body,
        is_ai,
        sent_at
        `,
      )
      .eq('client_id', clientId)
      .eq('shop_id', shopId)
      .order('sent_at', {
        ascending: false,
      })
      .limit(6)

    if (historyError) {
      throw new Error(historyError.message)
    }

    const history = (historyRows ?? [])
      .reverse()
      .map((item) => ({
        role:
          item.id === messageId ||
          item.sender_id ===
            client.profile_id
            ? ('user' as const)
            : ('assistant' as const),

        content:
          typeof item.body === 'string'
            ? item.body
            : '',
      }))
      .filter(
        (item) =>
          item.content.trim().length > 0,
      )

    const systemPrompt =
      buildSystemPrompt(shopData, [])

    const answer = await callGroq(
      [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...history,
      ],
      450,
    )

    if (!answer || !answer.trim()) {
      throw new Error(
        'Groq a retourne une reponse vide.',
      )
    }

    /*
     * La reponse est liee au message client
     * grace a reply_to_id (messageId).
     */
    const savedMessage =
      await saveAIMessage(
        shopData,
        clientId,
        answer.trim(),
        messageId,
      )

    return NextResponse.json({
      success: true,
      skipped: false,
      messageId,
      aiMessageId:
        savedMessage?.id ?? null,
    })
  } catch (error) {
    console.error(
      'Erreur auto-reply:',
      error,
    )

    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Erreur interne du repondeur automatique.',
      },
      {
        status: 500,
      },
    )
  }
}
