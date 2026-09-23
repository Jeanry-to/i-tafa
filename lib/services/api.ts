import * as tus from 'tus-js-client'
import { supabase } from '@/lib/supabase'

export type ClientStatus = 'actif' | 'suspendu' | 'en_attente'
export type AttachmentType = 'image' | 'video' | 'file'

export type Attachment = {
  type: AttachmentType
  name: string
  url: string
  size?: number
  mimeType?: string
}

type MediaAttachment = Attachment & {
  type: 'image' | 'video'
}

export type Client = {
  id: string
  profileId: string
  name: string
  email: string
  phone: string
  address: string
  status: ClientStatus
  joinedAt: string
  lastMessage: string
  unread: number
  suspensionReason?: string
  suspendedAt?: string
  suspendedUntil?: string
  socials: {
    facebook?: string
    whatsapp?: string
    instagram?: string
  }
}

export type Announcement = {
  id: string
  title: string
  body: string
  date: string
  attachment?: MediaAttachment
  attachments: Attachment[]
}

export type ChatMessage = {
  id: string
  clientId: string
  senderId: string
  from: 'client' | 'admin'
  text?: string
  attachment?: Attachment
  attachments: Attachment[]
  time: string
  sentAt: string
  readAt: string | null
  deletedForEveryone: boolean
  deletedForMe: boolean
}

type ClientRow = {
  id: string
  profile_id: string
  status: ClientStatus
  joined_at: string
  facebook_url: string | null
  whatsapp_url: string | null
  instagram_url: string | null
  suspension_reason: string | null
  suspended_at: string | null
  suspended_until: string | null
  profiles: {
    id: string
    full_name: string
    email: string
    phone: string | null
    address: string | null
  } | null
  messages: Array<{
    body: string | null
    sent_at: string
    sender_id: string
    read_at: string | null
  }>
}

type AnnouncementRow = {
  id: string
  title: string
  body: string
  published_at: string
  attachment_type: AttachmentType | null
  attachment_name: string | null
  attachment_url: string | null
  attachments?: Attachment[] | null
}

export type RealtimeMessage = {
  id: string
  client_id: string
  sender_id: string
  body: string | null
  sent_at: string
  read_at?: string | null
  attachment_type: AttachmentType | null
  attachment_name: string | null
  attachment_url: string | null
  attachments?: Attachment[] | null
  deleted_for_everyone?: boolean
  deleted_for?: string[]
}

function throwIfError<T>(
  result: { data: T; error: { message: string } | null },
): T {
  if (result.error) throw new Error(result.error.message)
  return result.data
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value))
}

function legacyAttachment(
  type: AttachmentType | null,
  name: string | null,
  url: string | null,
): Attachment | null {
  if (!type || !name || !url) return null

  return {
    type,
    name,
    url,
  }
}

function normalizeAttachments(
  attachments: Attachment[] | null | undefined,
  fallback: Attachment | null,
): Attachment[] {
  if (Array.isArray(attachments) && attachments.length > 0) {
    return attachments
  }

  return fallback ? [fallback] : []
}

function mapClient(row: ClientRow): Client {
  const messages = [...(row.messages ?? [])].sort(
    (left, right) =>
      new Date(right.sent_at).getTime() -
      new Date(left.sent_at).getTime(),
  )

  const profile = row.profiles

  return {
    id: row.id,
    profileId: row.profile_id,
    name: profile?.full_name ?? 'Client sans nom',
    email: profile?.email ?? '',
    phone: profile?.phone ?? '',
    address: profile?.address ?? '',
    status: row.status,
    joinedAt: formatDate(row.joined_at),
    lastMessage: messages[0]?.body ?? '',
    unread: messages.filter(
      (message) =>
        !message.read_at &&
        message.sender_id !== profile?.id,
    ).length,
    suspensionReason: row.suspension_reason ?? undefined,
    suspendedAt: row.suspended_at ?? undefined,
    suspendedUntil: row.suspended_until ?? undefined,
    socials: {
      facebook: row.facebook_url ?? undefined,
      whatsapp: row.whatsapp_url ?? undefined,
      instagram: row.instagram_url ?? undefined,
    },
  }
}

function mapAnnouncement(row: AnnouncementRow): Announcement {
  const oldAttachment = legacyAttachment(
    row.attachment_type,
    row.attachment_name,
    row.attachment_url,
  )

  const attachments = normalizeAttachments(
    row.attachments,
    oldAttachment,
  )

  const attachment = attachments.find(
    (item): item is MediaAttachment =>
      item.type === 'image' || item.type === 'video',
  )

  return {
    id: row.id,
    title: row.title,
    body: row.body,
    date: formatDate(row.published_at),
    attachments,
    ...(attachment ? { attachment } : {}),
  }
}

export function mapMessage(
  row: RealtimeMessage,
  currentUserId: string,
  perspective: 'client' | 'admin' = 'client',
): ChatMessage {
  const deletedForEveryone =
    row.deleted_for_everyone ?? false

  const deletedForMe =
    (row.deleted_for ?? []).includes(currentUserId)

  const oldAttachment = legacyAttachment(
    row.attachment_type,
    row.attachment_name,
    row.attachment_url,
  )

  const attachments = deletedForEveryone
    ? []
    : normalizeAttachments(row.attachments, oldAttachment)

  return {
    id: row.id,
    clientId: row.client_id,
    senderId: row.sender_id,
    readAt: row.read_at ?? null,
    from:
      row.sender_id === currentUserId
        ? perspective
        : perspective === 'client'
          ? 'admin'
          : 'client',
    text: deletedForEveryone
      ? undefined
      : row.body ?? undefined,
    attachments,
    ...(attachments[0]
      ? { attachment: attachments[0] }
      : {}),
    time: new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(row.sent_at)),
    sentAt: row.sent_at,
    deletedForEveryone,
    deletedForMe,
  }
}

export async function signIn(
  email: string,
  password: string,
) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password,
    })

  if (error) throw new Error(error.message)

  return data
}

/**
 * Inscription d'un nouveau client.
 *
 * IMPORTANT :
 * Tout nouveau client est créé avec le statut
 * "en_attente".
 *
 * L'administrateur doit ensuite le valider.
 */
export async function signUp(
  email: string,
  password: string,
  fullName: string,
  pseudo: string,
) {
  const result = throwIfError(
    await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          pseudo,
        },
      },
    }),
  )

  const userId = result.user?.id

  if (userId) {
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        pseudo,
        full_name: fullName,
      })
      .eq('id', userId)

    if (profileError) {
      throw new Error(
        `Erreur lors de la mise à jour du profil : ${profileError.message}`,
      )
    }

    const { data: existingClient, error: clientCheckError } = await supabase
      .from('clients')
      .select('id')
      .eq('profile_id', userId)
      .maybeSingle()

    if (clientCheckError) {
      throw new Error(
        `Erreur lors de la vérification du client : ${clientCheckError.message}`,
      )
    }

      if (!existingClient) {
        const shopSlug = `${pseudo}-${Date.now().toString(36)}`

        const { data: newShop, error: shopInsertError } = await supabase
          .from('shops')
          .insert({
            owner_id: userId,
            slug: shopSlug,
            name: `Boutique de ${fullName}`,
          })
          .select('id')
          .single()

        if (shopInsertError) {
          throw new Error(
            `Erreur lors de la creation de la boutique : ${shopInsertError.message}`,
          )
        }

        const { error: clientInsertError } = await supabase
          .from('clients')
          .insert({
            profile_id: userId,
            status: 'en_attente',
            shop_id: newShop.id,
        })

      if (clientInsertError) {
        throw new Error(
          `Erreur lors de la création du client en attente : ${clientInsertError.message}`,
        )
      }
    }
  }

  return result
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()

  if (error) throw new Error(error.message)
}

export async function signInWithGoogle(
  next: string = '/client',
  mode: 'login' | 'register' = 'login',
) {
  const callbackUrl = new URL(
    `${window.location.origin}/auth/callback`,
  )

  callbackUrl.searchParams.set('next', next)

  if (mode === 'register') {
    callbackUrl.searchParams.set('mode', 'register')
  }

  const { error } =
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl.toString(),
      },
    })

  if (error) throw new Error(error.message)
}/**
 * Vérifie si un pseudo est disponible.
 *
 * La vérification est faite directement dans Supabase.
 * L'index unique protège également contre deux inscriptions
 * simultanées avec le même pseudo.
 */
export async function isPseudoAvailable(
  pseudo: string,
): Promise<boolean> {
  const normalizedPseudo = pseudo.trim()

  if (!normalizedPseudo) {
    return false
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .ilike('pseudo', normalizedPseudo)
    .limit(1)

  if (error) {
    throw new Error(
      `Erreur lors de la vérification du pseudo : ${error.message}`,
    )
  }

  return data.length === 0
}

/**
 * Prépare le compte client après une inscription Google.
 *
 * Le compte reste en_attente jusqu'à la validation du paiement
 * par l'administrateur.
 */
export async function prepareGoogleRegistration(
  pseudo: string,
) {
  const normalizedPseudo = pseudo.trim()

  if (!normalizedPseudo) {
    throw new Error('Le pseudo est obligatoire.')
  }

  const available = await isPseudoAvailable(
    normalizedPseudo,
  )

  if (!available) {
    throw new Error('Pseudo déjà utilisé.')
  }

  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw new Error(userError.message)
  }

  const user = userData.user

  if (!user) {
    throw new Error(
      'Session Google introuvable. Veuillez recommencer.',
    )
  }

  const googleName =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    user.email?.split('@')[0] ??
    'Client'

  const { error: profileError } = await supabase
    .from('profiles')
    .update({
      pseudo: normalizedPseudo,
      full_name: googleName,
    })
    .eq('id', user.id)

  if (profileError) {
    if (profileError.code === '23505') {
      throw new Error('Pseudo déjà utilisé.')
    }

    throw new Error(
      `Erreur lors de la création du profil : ${profileError.message}`,
    )
  }

  const { data: existingClient, error: clientCheckError } =
    await supabase
      .from('clients')
      .select('id')
      .eq('profile_id', user.id)
      .maybeSingle()

  if (clientCheckError) {
    throw new Error(
      `Erreur lors de la vérification du client : ${clientCheckError.message}`,
    )
  }

  if (existingClient) {
    return existingClient
  }

  const shopSlug = `${normalizedPseudo}-${Date.now().toString(36)}`

  const { data: newShop, error: shopError } =
    await supabase
      .from('shops')
      .insert({
        owner_id: user.id,
        slug: shopSlug,
        name: `Boutique de ${googleName}`,
      })
      .select('id')
      .single()

  if (shopError) {
    throw new Error(
      `Erreur lors de la création de la boutique : ${shopError.message}`,
    )
  }

  const { data: client, error: clientError } =
    await supabase
      .from('clients')
      .insert({
        profile_id: user.id,
        status: 'en_attente',
        shop_id: newShop.id,
      })
      .select('id, profile_id, status')
      .single()

  if (clientError) {
    throw new Error(
      `Erreur lors de la création du client : ${clientError.message}`,
    )
  }

  return client
}

export async function sendPasswordReset(email: string) {
  return throwIfError(
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    }),
  )
}

export async function getCurrentProfile() {
  const { data, error } =
    await supabase.auth.getUser()

  if (error) throw new Error(error.message)

  const user = data.user

  if (!user) return null

  return throwIfError(
    await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single(),
  )
}

/**
 * Récupère la boutique de l'utilisateur actuellement connecté.
 */
export async function getCurrentShopId(): Promise<string> {
  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw new Error(userError.message)
  }

  if (!userData.user) {
    throw new Error(
      'Vous devez être connecté pour effectuer cette action.',
    )
  }

  const {
    data: shop,
    error: shopError,
  } = await supabase
    .from('shops')
    .select('id')
    .eq('owner_id', userData.user.id)
    .maybeSingle()

  if (shopError) {
    throw new Error(shopError.message)
  }

  if (!shop?.id) {
    throw new Error(
      'Aucune boutique n’est associée à votre compte.',
    )
  }

  return shop.id
}

export async function getClients() {
  const data = throwIfError(
    await supabase
      .from('clients')
      .select(
        'id, profile_id, status, joined_at, facebook_url, whatsapp_url, instagram_url, suspension_reason, suspended_at, suspended_until, profiles!inner(id, full_name, email, phone, address), messages(body, sent_at, sender_id, read_at)',
      )
      .order('joined_at', { ascending: false }),
  ) as unknown as ClientRow[]

  return data.map(mapClient)
}

export async function getClientForProfile(
  profileId: string,
) {
  const data = throwIfError(
    await supabase
      .from('clients')
      .select(
        'id, profile_id, status, joined_at, facebook_url, whatsapp_url, instagram_url, suspension_reason, suspended_at, suspended_until, profiles!inner(id, full_name, email, phone, address), messages(body, sent_at, sender_id, read_at)',
      )
      .eq('profile_id', profileId)
      .maybeSingle(),
  ) as ClientRow | null

  return data ? mapClient(data) : null
}

export async function updateClientStatus(
  id: string,
  status: ClientStatus,
) {
  return throwIfError(
    await supabase
      .from('clients')
      .update({ status })
      .eq('id', id)
      .select()
      .single(),
  )
}

export async function deleteClient(id: string) {
  return throwIfError(
    await supabase
      .from('clients')
      .delete()
      .eq('id', id),
  )
}

export async function updateProfile(
  id: string,
  values: {
    full_name: string
    phone: string
    address: string
    avatar_url?: string
  },
) {
  return throwIfError(
    await supabase
      .from('profiles')
      .update(values)
      .eq('id', id)
      .select()
      .single(),
  )
}

export async function getAnnouncements() {
  const data = throwIfError(
    await supabase
      .from('announcements')
      .select(
        'id, title, body, published_at, attachment_type, attachment_name, attachment_url, attachments',
      )
      .order('published_at', { ascending: false }),
  ) as AnnouncementRow[]

  return data.map(mapAnnouncement)
}

export async function createAnnouncement(values: {
  authorId: string
  title: string
  body: string
  attachments?: Attachment[]
  attachmentType?: AttachmentType
  attachmentName?: string
  attachmentUrl?: string
}) {
  const legacy = legacyAttachment(
    values.attachmentType ?? null,
    values.attachmentName ?? null,
    values.attachmentUrl ?? null,
  )

  const attachments =
    values.attachments ??
    (legacy ? [legacy] : [])

  const firstAttachment =
    attachments[0] ?? null

  const row = throwIfError(
    await supabase
      .from('announcements')
      .insert({
        shop_id: await getCurrentShopId(),
        author_id: values.authorId,
        title: values.title,
        body: values.body,
        attachments,
        attachment_type:
          firstAttachment?.type ?? null,
        attachment_name:
          firstAttachment?.name ?? null,
        attachment_url:
          firstAttachment?.url ?? null,
      })
      .select(
        'id, title, body, published_at, attachment_type, attachment_name, attachment_url, attachments',
      )
      .single(),
  ) as AnnouncementRow

  return mapAnnouncement(row)
}

export async function updateAnnouncement(
  id: string,
  values: Partial<{
    title: string
    body: string
    attachments: Attachment[]
    attachmentType: AttachmentType | null
    attachmentName: string | null
    attachmentUrl: string | null
  }>,
) {
  const payload: Record<string, unknown> = {}

  if (values.title !== undefined) {
    payload.title = values.title
  }

  if (values.body !== undefined) {
    payload.body = values.body
  }

  const hasLegacyAttachment =
    values.attachmentType !== undefined ||
    values.attachmentName !== undefined ||
    values.attachmentUrl !== undefined

  if (
    values.attachments !== undefined ||
    hasLegacyAttachment
  ) {
    const legacy = legacyAttachment(
      values.attachmentType ?? null,
      values.attachmentName ?? null,
      values.attachmentUrl ?? null,
    )

    const attachments =
      values.attachments ??
      (legacy ? [legacy] : [])

    const firstAttachment =
      attachments[0] ?? null

    payload.attachments = attachments
    payload.attachment_type =
      firstAttachment?.type ?? null
    payload.attachment_name =
      firstAttachment?.name ?? null
    payload.attachment_url =
      firstAttachment?.url ?? null
  }

  const row = throwIfError(
    await supabase
      .from('announcements')
      .update(payload)
      .eq('id', id)
      .select(
        'id, title, body, published_at, attachment_type, attachment_name, attachment_url, attachments',
      )
      .single(),
  ) as AnnouncementRow

  return mapAnnouncement(row)
}

export async function deleteAnnouncement(
  id: string,
) {
  return throwIfError(
    await supabase
      .from('announcements')
      .delete()
      .eq('id', id),
  )
}

export async function getMessages(
  clientId: string,
  currentUserId: string,
  perspective: 'client' | 'admin' = 'client',
) {
  const data = throwIfError(
    await supabase
      .from('messages')
      .select(
        'id, client_id, sender_id, body, sent_at, read_at, attachment_type, attachment_name, attachment_url, attachments',
      )
      .eq('client_id', clientId)
      .order('sent_at', { ascending: true }),
  ) as RealtimeMessage[]

  return data.map((row) =>
    mapMessage(
      row,
      currentUserId,
      perspective,
    ),
  )
}

export async function sendMessage(values: {
  clientId: string
  senderId: string
  body?: string
  attachments?: Attachment[]
  attachmentType?: AttachmentType
  attachmentName?: string
  attachmentUrl?: string
}) {
  // 1. Récupérer l'utilisateur réellement connecté
  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw new Error(userError.message)
  }

  const user = userData.user

  if (!user) {
    throw new Error(
      'Vous devez être connecté pour envoyer un message.',
    )
  }

  // 2. Récupérer le client et surtout son shop_id
  const {
    data: client,
    error: clientError,
  } = await supabase
    .from('clients')
    .select('id, profile_id, shop_id')
    .eq('id', values.clientId)
    .single()

  if (clientError) {
    throw new Error(
      `Impossible de récupérer le client : ${clientError.message}`,
    )
  }

  if (!client) {
    throw new Error('Client introuvable.')
  }

  // 3. Construire les pièces jointes
  const legacy = legacyAttachment(
    values.attachmentType ?? null,
    values.attachmentName ?? null,
    values.attachmentUrl ?? null,
  )

  const attachments =
    values.attachments ??
    (legacy ? [legacy] : [])

  const firstAttachment =
    attachments[0] ?? null

  // 4. Insérer le message
  // sender_id vient maintenant de auth.getUser()
  // et non de la valeur envoyée par le composant.
  const row = throwIfError(
    await supabase
      .from('messages')
      .insert({
        shop_id: client.shop_id,
        client_id: client.id,
        sender_id: user.id,
        body: values.body ?? null,
        attachments,
        attachment_type:
          firstAttachment?.type ?? null,
        attachment_name:
          firstAttachment?.name ?? null,
        attachment_url:
          firstAttachment?.url ?? null,
      })
      .select(
        'id, client_id, sender_id, body, sent_at, read_at, attachment_type, attachment_name, attachment_url, attachments',
      )
      .single(),
  ) as RealtimeMessage

  return mapMessage(
    row,
    user.id,
  )
}
// Retire le message uniquement de la vue de currentUserId.
export async function deleteMessageForMe(
  messageId: string,
  currentUserId: string,
) {
  const {
    data: current,
    error: fetchError,
  } = await supabase
    .from('messages')
    .select('deleted_for')
    .eq('id', messageId)
    .single()

  if (fetchError) {
    throw new Error(fetchError.message)
  }

  const existing: string[] =
    current?.deleted_for ?? []

  if (existing.includes(currentUserId)) {
    return
  }

  return throwIfError(
    await supabase
      .from('messages')
      .update({
        deleted_for: [
          ...existing,
          currentUserId,
        ],
      })
      .eq('id', messageId)
      .select(),
  )
}

// Supprime le message pour tout le monde.
export async function deleteMessageForEveryone(
  messageId: string,
) {
  return throwIfError(
    await supabase
      .from('messages')
      .update({
        deleted_for_everyone: true,
        body: null,
        attachments: [],
        attachment_type: null,
        attachment_name: null,
        attachment_url: null,
      })
      .eq('id', messageId)
      .select(),
  )
}

function attachmentTypeFromFile(
  file: File,
): AttachmentType {
  if (file.type.startsWith('image/')) {
    return 'image'
  }

  if (file.type.startsWith('video/')) {
    return 'video'
  }

  return 'file'
}

function createStoragePath(file: File) {
  const extension = file.name.includes('.')
    ? file.name.split('.').pop()
    : ''

  return `${crypto.randomUUID()}${
    extension ? `.${extension}` : ''
  }`
}

function getPublicAttachment(
  path: string,
  file: File,
): Attachment {
  const { data } = supabase.storage
    .from('attachments')
    .getPublicUrl(path)

  return {
    url: data.publicUrl,
    name: file.name,
    type: attachmentTypeFromFile(file),
    size: file.size,
    mimeType: file.type || undefined,
  }
}

async function uploadSmallAttachment(
  file: File,
  path: string,
) {
  const { error } = await supabase.storage
    .from('attachments')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType:
        file.type || undefined,
    })

  if (error) {
    throw new Error(error.message)
  }
}

async function uploadLargeAttachment(
  file: File,
  path: string,
  onProgress?: (progress: number) => void,
) {
  const {
    data,
    error,
  } = await supabase.auth.getSession()

  if (error) {
    throw new Error(error.message)
  }

  if (!data.session) {
    throw new Error(
      'Vous devez être connecté pour envoyer un fichier.',
    )
  }

  const projectUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!projectUrl) {
    throw new Error(
      'NEXT_PUBLIC_SUPABASE_URL est manquant.',
    )
  }

  const projectRef =
    new URL(projectUrl).hostname.split('.')[0]

  const endpoint =
    `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`

  await new Promise<void>(
    (resolve, reject) => {
      const upload = new tus.Upload(file, {
        endpoint,
        retryDelays: [
          0,
          3000,
          5000,
          10000,
          20000,
        ],
        chunkSize: 6 * 1024 * 1024,
        removeFingerprintOnSuccess: true,
        headers: {
          authorization:
            `Bearer ${data.session!.access_token}`,
          'x-upsert': 'false',
        },
        metadata: {
          bucketName: 'attachments',
          objectName: path,
          contentType:
            file.type ||
            'application/octet-stream',
          cacheControl: '3600',
        },
        onError: (uploadError) => {
          reject(uploadError)
        },
        onProgress: (
          uploaded,
          total,
        ) => {
          onProgress?.(
            total > 0
              ? Math.round(
                  (uploaded / total) * 100,
                )
              : 0,
          )
        },
        onSuccess: () => {
          onProgress?.(100)
          resolve()
        },
      })

      upload
        .findPreviousUploads()
        .then((previousUploads) => {
          if (previousUploads.length > 0) {
            upload.resumeFromPreviousUpload(
              previousUploads[0],
            )
          }

          upload.start()
        })
        .catch(reject)
    },
  )
}

/**
 * Upload d'une image, vidéo, PDF, Word, Excel
 * ou autre document.
 */
export async function uploadAttachment(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<Attachment> {
  const path = createStoragePath(file)
  const largeFileThreshold =
    6 * 1024 * 1024

  if (file.size > largeFileThreshold) {
    await uploadLargeAttachment(
      file,
      path,
      onProgress,
    )
  } else {
    onProgress?.(0)

    await uploadSmallAttachment(
      file,
      path,
    )

    onProgress?.(100)
  }

  return getPublicAttachment(
    path,
    file,
  )
}

/**
 * Téléverse plusieurs fichiers,
 * avec au maximum trois envois simultanés.
 */
export async function uploadAttachments(
  files: File[],
  onProgress?: (
    fileIndex: number,
    progress: number,
  ) => void,
): Promise<Attachment[]> {
  const results: Attachment[] =
    new Array(files.length)

  let nextIndex = 0

  const workerCount = Math.min(
    3,
    files.length,
  )

  async function worker() {
    while (nextIndex < files.length) {
      const currentIndex = nextIndex
      nextIndex += 1

      results[currentIndex] =
        await uploadAttachment(
          files[currentIndex],
          (progress) =>
            onProgress?.(
              currentIndex,
              progress,
            ),
        )
    }
  }

  await Promise.all(
    Array.from(
      { length: workerCount },
      worker,
    ),
  )

  return results
}

export type PaymentMethodType =
  | 'mobile_money_mg'
  | 'mobile_money_intl'
  | 'crypto'
  | 'bank'

export type PaymentMethod = {
  id: string
  type: PaymentMethodType
  label: string
  accountDetails: string
  instructions: string | null
  active: boolean
  sortOrder: number
}

type PaymentMethodRow = {
  id: string
  type: PaymentMethodType
  label: string
  account_details: string
  instructions: string | null
  active: boolean
  sort_order: number
}

function mapPaymentMethod(
  row: PaymentMethodRow,
): PaymentMethod {
  return {
    id: row.id,
    type: row.type,
    label: row.label,
    accountDetails:
      row.account_details,
    instructions:
      row.instructions,
    active: row.active,
    sortOrder: row.sort_order,
  }
}

export async function getActivePaymentMethods() {
  const data = throwIfError(
    await supabase
      .from('payment_methods')
      .select(
        'id, type, label, account_details, instructions, active, sort_order',
      )
      .eq('active', true)
      .order('sort_order', {
        ascending: true,
      }),
  ) as PaymentMethodRow[]

  return data.map(mapPaymentMethod)
}

export async function getAllPaymentMethods() {
  const data = throwIfError(
    await supabase
      .from('payment_methods')
      .select(
        'id, type, label, account_details, instructions, active, sort_order',
      )
      .order('sort_order', {
        ascending: true,
      }),
  ) as PaymentMethodRow[]

  return data.map(mapPaymentMethod)
}

export async function createPaymentMethod(
  values: {
    type: PaymentMethodType
    label: string
    accountDetails: string
    instructions?: string
    sortOrder?: number
  },
) {
  const row = throwIfError(
    await supabase
      .from('payment_methods')
      .insert({
        shop_id:
          await getCurrentShopId(),
        type: values.type,
        label: values.label,
        account_details:
          values.accountDetails,
        instructions:
          values.instructions ?? null,
        sort_order:
          values.sortOrder ?? 0,
      })
      .select(
        'id, type, label, account_details, instructions, active, sort_order',
      )
      .single(),
  ) as PaymentMethodRow

  return mapPaymentMethod(row)
}

export async function updatePaymentMethod(
  id: string,
  values: Partial<{
    type: PaymentMethodType
    label: string
    accountDetails: string
    instructions: string | null
    active: boolean
    sortOrder: number
  }>,
) {
  const payload: Record<
    string,
    unknown
  > = {}

  if (values.type !== undefined) {
    payload.type = values.type
  }

  if (values.label !== undefined) {
    payload.label = values.label
  }

  if (
    values.accountDetails !==
    undefined
  ) {
    payload.account_details =
      values.accountDetails
  }

  if (
    values.instructions !==
    undefined
  ) {
    payload.instructions =
      values.instructions
  }

  if (values.active !== undefined) {
    payload.active = values.active
  }

  if (
    values.sortOrder !== undefined
  ) {
    payload.sort_order =
      values.sortOrder
  }

  const row = throwIfError(
    await supabase
      .from('payment_methods')
      .update(payload)
      .eq('id', id)
      .select(
        'id, type, label, account_details, instructions, active, sort_order',
      )
      .single(),
  ) as PaymentMethodRow

  return mapPaymentMethod(row)
}

export async function deletePaymentMethod(
  id: string,
) {
  return throwIfError(
    await supabase
      .from('payment_methods')
      .delete()
      .eq('id', id),
  )
}

// Nombre de messages non lus.
export async function getUnreadCounts(
  currentUserId: string,
) {
  const data = throwIfError(
    await supabase
      .from('messages')
      .select('client_id')
      .neq(
        'sender_id',
        currentUserId,
      )
      .is('read_at', null),
  ) as { client_id: string }[]

  const counts: Record<
    string,
    number
  > = {}

  for (const row of data) {
    counts[row.client_id] =
      (counts[row.client_id] ?? 0) + 1
  }

  return counts
}

export async function getUnreadCountForClient(
  clientId: string,
  currentUserId: string,
) {
  const {
    count,
    error,
  } = await supabase
    .from('messages')
    .select('id', {
      count: 'exact',
      head: true,
    })
    .eq('client_id', clientId)
    .neq(
      'sender_id',
      currentUserId,
    )
    .is('read_at', null)

  if (error) {
    throw new Error(error.message)
  }

  return count ?? 0
}

export async function markMessagesRead(
  clientId: string,
  currentUserId: string,
) {
  return throwIfError(
    await supabase
      .from('messages')
      .update({
        read_at:
          new Date().toISOString(),
      })
      .eq('client_id', clientId)
      .neq(
        'sender_id',
        currentUserId,
      )
      .is('read_at', null)
      .select(),
  )
}

export type BusinessInfo = {
  id: string
  name: string
  description: string
  sector: string
  address: string
  serviceArea: string
  phone: string
  email: string
  website: string
  openingHours: string
  closedDays: string
  preferredContact: string
}

type BusinessInfoRow = {
  id: string
  name: string | null
  description: string | null
  sector: string | null
  address: string | null
  service_area: string | null
  phone: string | null
  email: string | null
  website: string | null
  opening_hours: string | null
  closed_days: string | null
  preferred_contact: string | null
}

function mapBusinessInfo(
  row: BusinessInfoRow,
): BusinessInfo {
  return {
    id: row.id,
    name: row.name ?? '',
    description:
      row.description ?? '',
    sector: row.sector ?? '',
    address: row.address ?? '',
    serviceArea:
      row.service_area ?? '',
    phone: row.phone ?? '',
    email: row.email ?? '',
    website:
      row.website ?? '',
    openingHours:
      row.opening_hours ?? '',
    closedDays:
      row.closed_days ?? '',
    preferredContact:
      row.preferred_contact ?? '',
  }
}

export async function getBusinessInfo(): Promise<
  BusinessInfo | null
> {
  const {
    data,
    error,
  } = await supabase
    .from('business_info')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
    ? mapBusinessInfo(
        data as BusinessInfoRow,
      )
    : null
}

export async function saveBusinessInfo(
  values: Omit<BusinessInfo, 'id'>,
) {
  const existing =
    await getBusinessInfo()

  const payload = {
    name: values.name,
    description:
      values.description,
    sector: values.sector,
    address: values.address,
    service_area:
      values.serviceArea,
    phone: values.phone,
    email: values.email,
    website: values.website,
    opening_hours:
      values.openingHours,
    closed_days:
      values.closedDays,
    preferred_contact:
      values.preferredContact,
    updated_at:
      new Date().toISOString(),
  }

  if (existing) {
    return throwIfError(
      await supabase
        .from('business_info')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single(),
    )
  }

  return throwIfError(
    await supabase
      .from('business_info')
      .insert({
        shop_id:
          await getCurrentShopId(),
        ...payload,
      })
      .select()
      .single(),
  )
}

export type Product = {
  id: string
  name: string
  description: string
  price: number | null
  currency: string
  available: boolean
  features: string
  conditions: string
  promotion: string
  discount: string
  orderConditions: string
  deliveryConditions: string
}

type ProductRow = {
  id: string
  name: string
  description: string | null
  price: number | null
  currency: string | null
  available: boolean
  features: string | null
  conditions: string | null
  promotion: string | null
  discount: string | null
  order_conditions: string | null
  delivery_conditions: string | null
}

function mapProduct(
  row: ProductRow,
): Product {
  return {
    id: row.id,
    name: row.name,
    description:
      row.description ?? '',
    price: row.price,
    currency:
      row.currency ?? 'MGA',
    available: row.available,
    features:
      row.features ?? '',
    conditions:
      row.conditions ?? '',
    promotion:
      row.promotion ?? '',
    discount:
      row.discount ?? '',
    orderConditions:
      row.order_conditions ?? '',
    deliveryConditions:
      row.delivery_conditions ?? '',
  }
}

export async function getProducts() {
  const data = throwIfError(
    await supabase
      .from('products')
      .select('*')
      .order('sort_order', {
        ascending: true,
      }),
  ) as ProductRow[]

  return data.map(mapProduct)
}

export async function createProduct(
  values: Omit<Product, 'id'>,
) {
  const row = throwIfError(
    await supabase
      .from('products')
      .insert({
        shop_id:
          await getCurrentShopId(),
        name: values.name,
        description:
          values.description,
        price: values.price,
        currency:
          values.currency,
        available:
          values.available,
        features:
          values.features,
        conditions:
          values.conditions,
        promotion:
          values.promotion,
        discount:
          values.discount,
        order_conditions:
          values.orderConditions,
        delivery_conditions:
          values.deliveryConditions,
      })
      .select()
      .single(),
  ) as ProductRow

  return mapProduct(row)
}

export async function updateProduct(
  id: string,
  values: Partial<
    Omit<Product, 'id'>
  >,
) {
  const payload: Record<
    string,
    unknown
  > = {}

  if (values.name !== undefined) {
    payload.name = values.name
  }

  if (
    values.description !==
    undefined
  ) {
    payload.description =
      values.description
  }

  if (values.price !== undefined) {
    payload.price = values.price
  }

  if (
    values.currency !== undefined
  ) {
    payload.currency =
      values.currency
  }

  if (
    values.available !== undefined
  ) {
    payload.available =
      values.available
  }

  if (
    values.features !== undefined
  ) {
    payload.features =
      values.features
  }

  if (
    values.conditions !== undefined
  ) {
    payload.conditions =
      values.conditions
  }

  if (
    values.promotion !== undefined
  ) {
    payload.promotion =
      values.promotion
  }

  if (
    values.discount !== undefined
  ) {
    payload.discount =
      values.discount
  }

  if (
    values.orderConditions !==
    undefined
  ) {
    payload.order_conditions =
      values.orderConditions
  }

  if (
    values.deliveryConditions !==
    undefined
  ) {
    payload.delivery_conditions =
      values.deliveryConditions
  }

  const row = throwIfError(
    await supabase
      .from('products')
      .update(payload)
      .eq('id', id)
      .select()
      .single(),
  ) as ProductRow

  return mapProduct(row)
}

export async function deleteProduct(
  id: string,
) {
  return throwIfError(
    await supabase
      .from('products')
      .delete()
      .eq('id', id),
  )
}

export type KnowledgeItem = {
  id: string
  category: string
  title: string
  content: string
  updatedAt: string
}

type KnowledgeRow = {
  id: string
  category: string
  title: string
  content: string
  updated_at: string
}

function mapKnowledge(
  row: KnowledgeRow,
): KnowledgeItem {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    content: row.content,
    updatedAt:
      row.updated_at,
  }
}

export async function getKnowledgeBase() {
  const data = throwIfError(
    await supabase
      .from('knowledge_base')
      .select('*')
      .order('updated_at', {
        ascending: false,
      }),
  ) as KnowledgeRow[]

  return data.map(mapKnowledge)
}

export async function createKnowledgeItem(
  values: {
    category: string
    title: string
    content: string
  },
) {
  const row = throwIfError(
    await supabase
      .from('knowledge_base')
      .insert({
        shop_id:
          await getCurrentShopId(),
        ...values,
      })
      .select()
      .single(),
  ) as KnowledgeRow

  return mapKnowledge(row)
}

export async function updateKnowledgeItem(
  id: string,
  values: Partial<{
    category: string
    title: string
    content: string
  }>,
) {
  const row = throwIfError(
    await supabase
      .from('knowledge_base')
      .update({
        ...values,
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single(),
  ) as KnowledgeRow

  return mapKnowledge(row)
}

export async function deleteKnowledgeItem(
  id: string,
) {
  return throwIfError(
    await supabase
      .from('knowledge_base')
      .delete()
      .eq('id', id),
  )
}

export type Faq = {
  id: string
  question: string
  answer: string
}

export async function getFaqs() {
  const data = throwIfError(
    await supabase
      .from('faqs')
      .select(
        'id, question, answer',
      )
      .order('sort_order', {
        ascending: true,
      }),
  ) as Faq[]

  return data
}

export async function createFaq(
  values: {
    question: string
    answer: string
  },
) {
  return throwIfError(
    await supabase
      .from('faqs')
      .insert({
        shop_id:
          await getCurrentShopId(),
        ...values,
      })
      .select()
      .single(),
  )
}

export async function updateFaq(
  id: string,
  values: Partial<{
    question: string
    answer: string
  }>,
) {
  return throwIfError(
    await supabase
      .from('faqs')
      .update({
        ...values,
        updated_at:
          new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single(),
  )
}

export async function deleteFaq(
  id: string,
) {
  return throwIfError(
    await supabase
      .from('faqs')
      .delete()
      .eq('id', id),
  )
}

export function subscribeToMessages(
  clientId: string,
  onMessage: (
    message: RealtimeMessage,
  ) => void,
  onUpdate?: (
    message: RealtimeMessage,
  ) => void,
) {
  return supabase
    .channel(
      `messages:${clientId}`,
    )
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter:
          `client_id=eq.${clientId}`,
      },
      (payload) =>
        onMessage(
          payload.new as RealtimeMessage,
        ),
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'messages',
        filter:
          `client_id=eq.${clientId}`,
      },
      (payload) =>
        onUpdate?.(
          payload.new as RealtimeMessage,
        ),
    )
    .subscribe()
}

export function unsubscribeFromMessages(
  channel: ReturnType<
    typeof supabase.channel
  >,
) {
  return supabase.removeChannel(
    channel,
  )
}

export function isClientSuspended(
  client: Pick<
    Client,
    'status' | 'suspendedUntil'
  >,
) {
  if (client.status !== 'suspendu') {
    return false
  }

  return (
    !client.suspendedUntil ||
    new Date(
      client.suspendedUntil,
    ).getTime() > Date.now()
  )
}

export async function suspendClient(
  id: string,
  values: {
    reason: string
    until?: string | null
  },
) {
  return throwIfError(
    await supabase
      .from('clients')
      .update({
        status: 'suspendu',
        suspension_reason:
          values.reason.trim() || null,
        suspended_at:
          new Date().toISOString(),
        suspended_until:
          values.until || null,
      })
      .eq('id', id)
      .select()
      .single(),
  )
}

export async function reactivateClient(
  id: string,
) {
  return throwIfError(
    await supabase
      .from('clients')
      .update({
        status: 'actif',
        suspension_reason: null,
        suspended_at: null,
        suspended_until: null,
      })
      .eq('id', id)
      .select()
      .single(),
  )
}

export async function validateClient(
  id: string,
) {
  return throwIfError(
    await supabase
      .from('clients')
      .update({
        status: 'actif',
        suspension_reason: null,
        suspended_at: null,
        suspended_until: null,
      })
      .eq('id', id)
      .select()
      .single(),
  )
}

// ---------------------------------------------------------------------------
// Réglages de comportement de l'Agent IA
// ---------------------------------------------------------------------------

export type AgentTone =
  | 'professionnel'
  | 'amical'
  | 'chaleureux'
  | 'commercial'
  | 'simple'

export type AgentFormality =
  | 'vouvoiement'
  | 'tutoiement'

export type AgentResponseLength =
  | 'courte'
  | 'moyenne'
  | 'detaillee'

export type AgentLanguage =
  | 'fr'
  | 'mg'
  | 'en'
  | 'auto'

export type AgentSettings = {
  id: string
  tone: AgentTone
  formality: AgentFormality
  responseLength: AgentResponseLength
  language: AgentLanguage
  pricePresentation: string
  productPresentation: string
  priorityInfo: string
  forbiddenInfo: string
  customInstructions: string
  autoReplyEnabled: boolean
}

type AgentSettingsRow = {
  id: string
  tone: string | null
  formality: string | null
  response_length: string | null
  language: string | null
  price_presentation: string | null
  product_presentation: string | null
  priority_info: string | null
  forbidden_info: string | null
  custom_instructions: string | null
  auto_reply_enabled: boolean | null
}

function mapAgentSettings(
  row: AgentSettingsRow,
): AgentSettings {
  return {
    id: row.id,
    tone:
      (row.tone ??
        'amical') as AgentTone,
    formality:
      (row.formality ??
        'vouvoiement') as AgentFormality,
    responseLength:
      (row.response_length ??
        'moyenne') as AgentResponseLength,
    language:
      (row.language ??
        'fr') as AgentLanguage,
    pricePresentation:
      row.price_presentation ?? '',
    productPresentation:
      row.product_presentation ?? '',
    priorityInfo:
      row.priority_info ?? '',
    forbiddenInfo:
      row.forbidden_info ?? '',
    customInstructions:
      row.custom_instructions ?? '',
      autoReplyEnabled: row.auto_reply_enabled ?? false,
  }
}

export async function getAgentSettings(): Promise<
  AgentSettings | null
> {
  const {
    data,
    error,
  } = await supabase
    .from('agent_settings')
    .select('*')
    .limit(1)
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
    ? mapAgentSettings(
        data as AgentSettingsRow,
      )
    : null
}

export async function saveAgentSettings(
  values: Omit<
    AgentSettings,
    'id'
  >,
) {
  const existing =
    await getAgentSettings()

  const payload = {
    tone: values.tone,
    formality:
      values.formality,
    response_length:
      values.responseLength,
    language:
      values.language,
    price_presentation:
      values.pricePresentation,
    product_presentation:
      values.productPresentation,
    priority_info:
      values.priorityInfo,
    forbidden_info:
      values.forbiddenInfo,
    custom_instructions:
      values.customInstructions,
    auto_reply_enabled:
      values.autoReplyEnabled,
    updated_at:
      new Date().toISOString(),
  }

  if (existing) {
    return throwIfError(
      await supabase
        .from('agent_settings')
        .update(payload)
        .eq('id', existing.id)
        .select()
        .single(),
    )
  }

  return throwIfError(
    await supabase
      .from('agent_settings')
      .insert({
        shop_id:
          await getCurrentShopId(),
        ...payload,
      })
      .select()
      .single(),
  )
}

export async function updateAgentLanguage(
  language: AgentLanguage,
) {
  const existing =
    await getAgentSettings()

  if (existing) {
    return throwIfError(
      await supabase
        .from('agent_settings')
        .update({
          language,
          updated_at:
            new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select()
        .single(),
    )
  }

  return throwIfError(
    await supabase
      .from('agent_settings')
      .insert({
        shop_id:
          await getCurrentShopId(),
        language,
      })
      .select()
      .single(),
  )
}

// ---------------------------------------------------------------------------
// Super-Admin
// ---------------------------------------------------------------------------

export type ShopPlan =
  | 'starter'
  | 'pro'
  | 'business'

export type SubscriptionStatus =
  | 'ACTIVE'
  | 'EXPIRED'
  | 'PENDING'

export type Shop = {
  id: string
  slug: string
  name: string
  plan: ShopPlan
  subscriptionStatus: SubscriptionStatus
  subscriptionEndDate: string | null
  mvolaReference: string | null
  ownerId: string | null
  createdAt: string
}

type ShopRow = {
  id: string
  slug: string
  name: string
  plan: ShopPlan
  subscription_status: SubscriptionStatus
  subscription_end_date: string | null
  mvola_reference: string | null
  owner_id: string | null
  created_at: string
}

function mapShop(
  row: ShopRow,
): Shop {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    plan: row.plan,
    subscriptionStatus:
      row.subscription_status,
    subscriptionEndDate:
      row.subscription_end_date,
    mvolaReference:
      row.mvola_reference,
    ownerId: row.owner_id,
    createdAt:
      row.created_at,
  }
}

export async function getAllShops() {
  const data = throwIfError(
    await supabase
      .from('shops')
      .select('*')
      .order('created_at', {
        ascending: false,
      }),
  ) as ShopRow[]

  return data.map(mapShop)
}

export async function updateShopSubscription(
  id: string,
  values: Partial<{
    plan: ShopPlan
    subscriptionStatus:
      SubscriptionStatus
    subscriptionEndDate:
      string | null
    mvolaReference:
      string | null
  }>,
) {
  const payload: Record<
    string,
    unknown
  > = {
    updated_at:
      new Date().toISOString(),
  }

  if (values.plan !== undefined) {
    payload.plan = values.plan
  }

  if (
    values.subscriptionStatus !==
    undefined
  ) {
    payload.subscription_status =
      values.subscriptionStatus
  }

  if (
    values.subscriptionEndDate !==
    undefined
  ) {
    payload.subscription_end_date =
      values.subscriptionEndDate
  }

  if (
    values.mvolaReference !==
    undefined
  ) {
    payload.mvola_reference =
      values.mvolaReference
  }

  const row = throwIfError(
    await supabase
      .from('shops')
      .update(payload)
      .eq('id', id)
      .select()
      .single(),
  ) as ShopRow

  return mapShop(row)
}

export async function getMyCurrentUserIsSuperAdmin(): Promise<boolean> {
  const {
    data,
    error,
  } = await supabase.auth.getUser()

  if (error || !data.user) {
    return false
  }

  const { data: profile } =
    await supabase
      .from('profiles')
      .select('is_super_admin')
      .eq('id', data.user.id)
      .maybeSingle()

  return Boolean(
    (profile as any)?.is_super_admin,
  )
}

// ---------------------------------------------------------------------------
// Renouvellement d'abonnement via MVola
// ---------------------------------------------------------------------------

export type RenewalStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'REJECTED'

export type RenewalRequest = {
  id: string
  shopId: string
  requestedPlan: ShopPlan
  mvolaReference: string
  amount: number | null
  status: RenewalStatus
  createdAt: string
  shopName?: string
}

type RenewalRequestRow = {
  id: string
  shop_id: string
  requested_plan: ShopPlan
  mvola_reference: string
  amount: number | null
  status: RenewalStatus
  created_at: string
  shops?: {
    name: string
  } | null
}

function mapRenewalRequest(
  row: RenewalRequestRow,
): RenewalRequest {
  return {
    id: row.id,
    shopId: row.shop_id,
    requestedPlan:
      row.requested_plan,
    mvolaReference:
      row.mvola_reference,
    amount: row.amount,
    status: row.status,
    createdAt:
      row.created_at,
    shopName:
      row.shops?.name,
  }
}

export async function getMyShop(): Promise<
  Shop | null
> {
  const {
    data: userData,
    error: userError,
  } = await supabase.auth.getUser()

  if (userError) {
    throw new Error(
      userError.message,
    )
  }

  if (!userData.user) {
    return null
  }

  const {
    data,
    error,
  } = await supabase
    .from('shops')
    .select('*')
    .eq(
      'owner_id',
      userData.user.id,
    )
    .maybeSingle()

  if (error) {
    throw new Error(error.message)
  }

  return data
    ? mapShop(data as ShopRow)
    : null
}

export async function createRenewalRequest(
  values: {
    shopId: string
    requestedPlan: ShopPlan
    mvolaReference: string
    amount?: number
  },
) {
  const row = throwIfError(
    await supabase
      .from(
        'subscription_renewal_requests',
      )
      .insert({
        shop_id:
          values.shopId,
        requested_plan:
          values.requestedPlan,
        mvola_reference:
          values.mvolaReference,
        amount:
          values.amount ?? null,
      })
      .select()
      .single(),
  ) as RenewalRequestRow

  return mapRenewalRequest(row)
}

export async function getPendingRenewalRequests() {
  const data = throwIfError(
    await supabase
      .from(
        'subscription_renewal_requests',
      )
      .select('*, shops(name)')
      .eq('status', 'PENDING')
      .order('created_at', {
        ascending: true,
      }),
  ) as RenewalRequestRow[]

  return data.map(
    mapRenewalRequest,
  )
}

const PLAN_DURATION_DAYS: Record<
  ShopPlan,
  number
> = {
  starter: 30,
  pro: 90,
  business: 365,
}

export async function confirmRenewalRequest(
  requestId: string,
) {
  const {
    data: userData,
  } = await supabase.auth.getUser()

  const request = throwIfError(
    await supabase
      .from(
        'subscription_renewal_requests',
      )
      .select('*')
      .eq('id', requestId)
      .single(),
  ) as RenewalRequestRow

  const durationDays =
    PLAN_DURATION_DAYS[
      request.requested_plan
    ]

  const newEndDate = new Date()

  newEndDate.setDate(
    newEndDate.getDate() +
      durationDays,
  )

  await updateShopSubscription(
    request.shop_id,
    {
      plan:
        request.requested_plan,
      subscriptionStatus:
        'ACTIVE',
      subscriptionEndDate:
        newEndDate.toISOString(),
      mvolaReference:
        request.mvola_reference,
    },
  )

  return throwIfError(
    await supabase
      .from(
        'subscription_renewal_requests',
      )
      .update({
        status: 'CONFIRMED',
        reviewed_at:
          new Date().toISOString(),
        reviewed_by:
          userData.user?.id ??
          null,
      })
      .eq('id', requestId)
      .select()
      .single(),
  )
}

export async function rejectRenewalRequest(
  requestId: string,
) {
  const {
    data: userData,
  } = await supabase.auth.getUser()

  return throwIfError(
    await supabase
      .from(
        'subscription_renewal_requests',
      )
      .update({
        status: 'REJECTED',
        reviewed_at:
          new Date().toISOString(),
        reviewed_by:
          userData.user?.id ??
          null,
      })
      .eq('id', requestId)
      .select()
      .single(),
  )
}



export function isClientPending(client: { status?: string } | null | undefined) {
  return client?.status === 'en_attente'
}

export async function getAdminProfileId() {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1)
    .maybeSingle()

  return data?.id ?? null
}

export async function generateAutoReply(
  message: string,
  clientId: string,
) {
  const response = await fetch('/api/agent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, clientId }),
  })

  const data = await response.json()

  if (!response.ok || !data?.reply) {
    throw new Error(data?.error ?? 'Reponse IA indisponible.')
  }

  return data.reply
}

export async function submitPaymentReference(
  clientId: string,
  values: {
    method: string
    reference: string
    amount?: number | null
  },
) {
  const { error } = await supabase
    .from('clients')
    .update({
      payment_method: values.method,
      payment_ref: values.reference.trim(),
      amount_paid: values.amount ?? null,
    })
    .eq('id', clientId)

  if (error) {
    throw new Error('Erreur lors de l enregistrement du paiement : ' + error.message)
  }
}


