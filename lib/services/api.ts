import * as tus from 'tus-js-client'
import { supabase } from '@/lib/supabase'

export type ClientStatus = 'actif' | 'suspendu'
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
  attachment_type: AttachmentType | null
  attachment_name: string | null
  attachment_url: string | null
  attachments?: Attachment[] | null
  deleted_for_everyone?: boolean
  deleted_for?: string[]
}

function throwIfError<T>(result: { data: T; error: { message: string } | null }): T {
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

  return { type, name, url }
}

function normalizeAttachments(
  attachments: Attachment[] | null | undefined,
  fallback: Attachment | null,
): Attachment[] {
  if (Array.isArray(attachments) && attachments.length > 0) return attachments
  return fallback ? [fallback] : []
}

function mapClient(row: ClientRow): Client {
  const messages = [...(row.messages ?? [])].sort(
    (left, right) => new Date(right.sent_at).getTime() - new Date(left.sent_at).getTime(),
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
    unread: messages.filter((message) => !message.read_at && message.sender_id !== profile?.id).length,
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
  const attachments = normalizeAttachments(row.attachments, oldAttachment)
  const attachment = attachments.find(
    (item): item is MediaAttachment => item.type === 'image' || item.type === 'video',
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
  const deletedForEveryone = row.deleted_for_everyone ?? false
  const deletedForMe = (row.deleted_for ?? []).includes(currentUserId)

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
    from:
      row.sender_id === currentUserId
        ? perspective
        : perspective === 'client'
          ? 'admin'
          : 'client',
    text: deletedForEveryone ? undefined : row.body ?? undefined,
    attachments,
    ...(attachments[0] ? { attachment: attachments[0] } : {}),
    time: new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(row.sent_at)),
    sentAt: row.sent_at,
    deletedForEveryone,
    deletedForMe,
  }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data
}

export async function signUp(email: string, password: string, fullName: string, pseudo: string) {
  const result = throwIfError(
    await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName, pseudo } },
    }),
  )

  const userId = result.user?.id

  if (userId) {
    await supabase.from('profiles').update({ pseudo, full_name: fullName }).eq('id', userId)

    const { data: existingClient } = await supabase
      .from('clients')
      .select('id')
      .eq('profile_id', userId)
      .maybeSingle()

    if (!existingClient) {
      await supabase.from('clients').insert({ profile_id: userId, status: 'actif' })
    }
  }

  return result
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

export async function sendPasswordReset(email: string) {
  return throwIfError(
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback`,
    }),
  )
}

export async function getCurrentProfile() {
  const { data, error } = await supabase.auth.getUser()
  if (error) throw new Error(error.message)
  const user = data.user
  if (!user) return null

  return throwIfError(
    await supabase.from('profiles').select('*').eq('id', user.id).single(),
  )
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

export async function getClientForProfile(profileId: string) {
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

export async function updateClientStatus(id: string, status: ClientStatus) {
  return throwIfError(
    await supabase.from('clients').update({ status }).eq('id', id).select().single(),
  )
}

export async function deleteClient(id: string) {
  return throwIfError(await supabase.from('clients').delete().eq('id', id))
}

export async function updateProfile(
  id: string,
  values: { full_name: string; phone: string; address: string; avatar_url?: string },
) {
  return throwIfError(
    await supabase.from('profiles').update(values).eq('id', id).select().single(),
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
  const attachments = values.attachments ?? (legacy ? [legacy] : [])
  const firstAttachment = attachments[0] ?? null

  const row = throwIfError(
    await supabase
      .from('announcements')
      .insert({
        author_id: values.authorId,
        title: values.title,
        body: values.body,
        attachments,
        attachment_type: firstAttachment?.type ?? null,
        attachment_name: firstAttachment?.name ?? null,
        attachment_url: firstAttachment?.url ?? null,
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

  if (values.title !== undefined) payload.title = values.title
  if (values.body !== undefined) payload.body = values.body

  const hasLegacyAttachment =
    values.attachmentType !== undefined ||
    values.attachmentName !== undefined ||
    values.attachmentUrl !== undefined

  if (values.attachments !== undefined || hasLegacyAttachment) {
    const legacy = legacyAttachment(
      values.attachmentType ?? null,
      values.attachmentName ?? null,
      values.attachmentUrl ?? null,
    )
    const attachments = values.attachments ?? (legacy ? [legacy] : [])
    const firstAttachment = attachments[0] ?? null

    payload.attachments = attachments
    payload.attachment_type = firstAttachment?.type ?? null
    payload.attachment_name = firstAttachment?.name ?? null
    payload.attachment_url = firstAttachment?.url ?? null
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

export async function deleteAnnouncement(id: string) {
  return throwIfError(await supabase.from('announcements').delete().eq('id', id))
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
        'id, client_id, sender_id, body, sent_at, attachment_type, attachment_name, attachment_url, attachments',
      )
      .eq('client_id', clientId)
      .order('sent_at', { ascending: true }),
  ) as RealtimeMessage[]

  return data.map((row) => mapMessage(row, currentUserId, perspective))
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
  const legacy = legacyAttachment(
    values.attachmentType ?? null,
    values.attachmentName ?? null,
    values.attachmentUrl ?? null,
  )
  const attachments = values.attachments ?? (legacy ? [legacy] : [])
  const firstAttachment = attachments[0] ?? null

  const row = throwIfError(
    await supabase
      .from('messages')
      .insert({
        client_id: values.clientId,
        sender_id: values.senderId,
        body: values.body ?? null,
        attachments,
        attachment_type: firstAttachment?.type ?? null,
        attachment_name: firstAttachment?.name ?? null,
        attachment_url: firstAttachment?.url ?? null,
      })
      .select(
        'id, client_id, sender_id, body, sent_at, attachment_type, attachment_name, attachment_url, attachments',
      )
      .single(),
  ) as RealtimeMessage

  return mapMessage(row, values.senderId)
}

// Retire le message uniquement de la vue de currentUserId (l'autre partie le voit toujours).
export async function deleteMessageForMe(messageId: string, currentUserId: string) {
  const { data: current, error: fetchError } = await supabase
    .from('messages')
    .select('deleted_for')
    .eq('id', messageId)
    .single()

  if (fetchError) throw new Error(fetchError.message)

  const existing: string[] = current?.deleted_for ?? []
  if (existing.includes(currentUserId)) return

  return throwIfError(
    await supabase
      .from('messages')
      .update({ deleted_for: [...existing, currentUserId] })
      .eq('id', messageId)
      .select(),
  )
}

// Supprime le message pour tout le monde (seul l'auteur du message peut le faire).
export async function deleteMessageForEveryone(messageId: string) {
  return throwIfError(
    await supabase
      .from('messages')
      .update({ deleted_for_everyone: true, body: null, attachments: [], attachment_type: null, attachment_name: null, attachment_url: null })
      .eq('id', messageId)
      .select(),
  )
}

function attachmentTypeFromFile(file: File): AttachmentType {
  if (file.type.startsWith('image/')) return 'image'
  if (file.type.startsWith('video/')) return 'video'
  return 'file'
}

function createStoragePath(file: File) {
  const extension = file.name.includes('.') ? file.name.split('.').pop() : ''
  return `${crypto.randomUUID()}${extension ? `.${extension}` : ''}`
}

function getPublicAttachment(path: string, file: File): Attachment {
  const { data } = supabase.storage.from('attachments').getPublicUrl(path)

  return {
    url: data.publicUrl,
    name: file.name,
    type: attachmentTypeFromFile(file),
    size: file.size,
    mimeType: file.type || undefined,
  }
}

async function uploadSmallAttachment(file: File, path: string) {
  const { error } = await supabase.storage
    .from('attachments')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || undefined,
    })

  if (error) throw new Error(error.message)
}

async function uploadLargeAttachment(
  file: File,
  path: string,
  onProgress?: (progress: number) => void,
) {
  const { data, error } = await supabase.auth.getSession()

  if (error) throw new Error(error.message)
  if (!data.session) throw new Error('Vous devez être connecté pour envoyer un fichier.')

  const projectUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!projectUrl) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL est manquant.')
  }

  const projectRef = new URL(projectUrl).hostname.split('.')[0]
  const endpoint = `https://${projectRef}.storage.supabase.co/storage/v1/upload/resumable`

  await new Promise<void>((resolve, reject) => {
    const upload = new tus.Upload(file, {
      endpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000],
      chunkSize: 6 * 1024 * 1024,
      removeFingerprintOnSuccess: true,
      headers: {
        authorization: `Bearer ${data.session.access_token}`,
        'x-upsert': 'false',
      },
      metadata: {
        bucketName: 'attachments',
        objectName: path,
        contentType: file.type || 'application/octet-stream',
        cacheControl: '3600',
      },
      onError: (uploadError) => reject(uploadError),
      onProgress: (uploaded, total) => {
        onProgress?.(total > 0 ? Math.round((uploaded / total) * 100) : 0)
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
          upload.resumeFromPreviousUpload(previousUploads[0])
        }

        upload.start()
      })
      .catch(reject)
  })
}

/**
 * Upload d'une image, vidéo, PDF, Word, Excel ou autre document.
 * Les fichiers de plus de 6 Mo utilisent un transfert reprenable.
 */
export async function uploadAttachment(
  file: File,
  onProgress?: (progress: number) => void,
): Promise<Attachment> {
  const path = createStoragePath(file)
  const largeFileThreshold = 6 * 1024 * 1024

  if (file.size > largeFileThreshold) {
    await uploadLargeAttachment(file, path, onProgress)
  } else {
    onProgress?.(0)
    await uploadSmallAttachment(file, path)
    onProgress?.(100)
  }

  return getPublicAttachment(path, file)
}

/**
 * Téléverse plusieurs fichiers, avec au maximum trois envois simultanés.
 */
export async function uploadAttachments(
  files: File[],
  onProgress?: (fileIndex: number, progress: number) => void,
): Promise<Attachment[]> {
  const results: Attachment[] = new Array(files.length)
  let nextIndex = 0
  const workerCount = Math.min(3, files.length)

  async function worker() {
    while (nextIndex < files.length) {
      const currentIndex = nextIndex
      nextIndex += 1

      results[currentIndex] = await uploadAttachment(
        files[currentIndex],
        (progress) => onProgress?.(currentIndex, progress),
      )
    }
  }

  await Promise.all(Array.from({ length: workerCount }, worker))
  return results
}

export type PaymentMethodType = 'mobile_money_mg' | 'mobile_money_intl' | 'crypto' | 'bank'

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

function mapPaymentMethod(row: PaymentMethodRow): PaymentMethod {
  return {
    id: row.id,
    type: row.type,
    label: row.label,
    accountDetails: row.account_details,
    instructions: row.instructions,
    active: row.active,
    sortOrder: row.sort_order,
  }
}

export async function getActivePaymentMethods() {
  const data = throwIfError(
    await supabase
      .from('payment_methods')
      .select('id, type, label, account_details, instructions, active, sort_order')
      .eq('active', true)
      .order('sort_order', { ascending: true }),
  ) as PaymentMethodRow[]

  return data.map(mapPaymentMethod)
}

export async function getAllPaymentMethods() {
  const data = throwIfError(
    await supabase
      .from('payment_methods')
      .select('id, type, label, account_details, instructions, active, sort_order')
      .order('sort_order', { ascending: true }),
  ) as PaymentMethodRow[]

  return data.map(mapPaymentMethod)
}

export async function createPaymentMethod(values: {
  type: PaymentMethodType
  label: string
  accountDetails: string
  instructions?: string
  sortOrder?: number
}) {
  const row = throwIfError(
    await supabase
      .from('payment_methods')
      .insert({
        type: values.type,
        label: values.label,
        account_details: values.accountDetails,
        instructions: values.instructions ?? null,
        sort_order: values.sortOrder ?? 0,
      })
      .select('id, type, label, account_details, instructions, active, sort_order')
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
  const payload: Record<string, unknown> = {}

  if (values.type !== undefined) payload.type = values.type
  if (values.label !== undefined) payload.label = values.label
  if (values.accountDetails !== undefined) payload.account_details = values.accountDetails
  if (values.instructions !== undefined) payload.instructions = values.instructions
  if (values.active !== undefined) payload.active = values.active
  if (values.sortOrder !== undefined) payload.sort_order = values.sortOrder

  const row = throwIfError(
    await supabase
      .from('payment_methods')
      .update(payload)
      .eq('id', id)
      .select('id, type, label, account_details, instructions, active, sort_order')
      .single(),
  ) as PaymentMethodRow

  return mapPaymentMethod(row)
}

export async function deletePaymentMethod(id: string) {
  return throwIfError(await supabase.from('payment_methods').delete().eq('id', id))
}

// Nombre de messages non lus, groupes par client_id (usage admin : tous les clients).
export async function getUnreadCounts(currentUserId: string) {
  const data = throwIfError(
    await supabase
      .from('messages')
      .select('client_id')
      .neq('sender_id', currentUserId)
      .is('read_at', null),
  ) as { client_id: string }[]

  const counts: Record<string, number> = {}
  for (const row of data) {
    counts[row.client_id] = (counts[row.client_id] ?? 0) + 1
  }
  return counts
}

// Nombre de messages non lus pour un seul client (usage cote client : messages de l'admin).
export async function getUnreadCountForClient(clientId: string, currentUserId: string) {
  const { count, error } = await supabase
    .from('messages')
    .select('id', { count: 'exact', head: true })
    .eq('client_id', clientId)
    .neq('sender_id', currentUserId)
    .is('read_at', null)

  if (error) throw new Error(error.message)
  return count ?? 0
}

// Marque comme lus tous les messages d'une conversation qui ne viennent pas de currentUserId.
export async function markMessagesRead(clientId: string, currentUserId: string) {
  return throwIfError(
    await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('client_id', clientId)
      .neq('sender_id', currentUserId)
      .is('read_at', null)
      .select(),
  )
}

export function subscribeToMessages(
  clientId: string,
  onMessage: (message: RealtimeMessage) => void,
) {
  return supabase
    .channel(`messages:${clientId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `client_id=eq.${clientId}`,
      },
      (payload) => onMessage(payload.new as RealtimeMessage),
    )
    .subscribe()
}

export function unsubscribeFromMessages(channel: ReturnType<typeof supabase.channel>) {
  return supabase.removeChannel(channel)
}

export function isClientSuspended(client: Pick<Client, 'status' | 'suspendedUntil'>) {
  if (client.status !== 'suspendu') return false
  return !client.suspendedUntil || new Date(client.suspendedUntil).getTime() > Date.now()
}

export async function suspendClient(
  id: string,
  values: { reason: string; until?: string | null },
) {
  return throwIfError(
    await supabase
      .from('clients')
      .update({
        status: 'suspendu',
        suspension_reason: values.reason.trim() || null,
        suspended_at: new Date().toISOString(),
        suspended_until: values.until || null,
      })
      .eq('id', id)
      .select()
      .single(),
  )
}

export async function reactivateClient(id: string) {
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
