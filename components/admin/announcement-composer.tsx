'use client'

import { useEffect, useRef, useState } from 'react'
import { ImageIcon, Loader2, Megaphone, Pencil, Send, Trash2, Video, X } from 'lucide-react'
import { toast } from 'sonner'
import { InitialsAvatar } from '@/components/initials-avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { BRAND } from '@/lib/mock-data'
import { supabase } from '@/lib/supabase'
import {
  createAnnouncement,
  deleteAnnouncement,
  getAnnouncements,
  updateAnnouncement,
  uploadAttachment,
  type Attachment,
  type Announcement,
} from '@/lib/services/api'

export function AnnouncementComposer() {
  const [list, setList] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [publishing, setPublishing] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  function reload() {
    setLoading(true)
    getAnnouncements()
      .then(setList)
      .catch((err) => console.error('Erreur chargement annonces:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  async function publish(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim() || !body.trim()) return
    setPublishing(true)
    try {
      const { data: userData } = await supabase.auth.getUser()
      const authorId = userData.user?.id
      if (!authorId) throw new Error('Session expiree, reconnectez-vous.')

      let attachment: Attachment | undefined
      if (pendingFile) {
        const uploaded = await uploadAttachment(pendingFile)
        if (uploaded.type === 'image' || uploaded.type === 'video') {
          attachment = uploaded
        }
      }

      await createAnnouncement({
        authorId,
        title: title.trim(),
        body: body.trim(),
        attachmentType: attachment?.type,
        attachmentName: attachment?.name,
        attachmentUrl: attachment?.url,
      })

      setTitle('')
      setBody('')
      setPendingFile(null)
      toast.success('Annonce publiee', {
        description: 'Tous les clients la verront sur leur tableau de bord.',
      })
      reload()
    } catch (err) {
      toast.error('Publication impossible', {
        description: err instanceof Error ? err.message : 'Reessayez.',
      })
    } finally {
      setPublishing(false)
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
      toast.error('Seules les photos et videos sont acceptees pour les annonces')
      return
    }
    setPendingFile(file)
  }

  async function remove(id: string) {
    if (!confirm('Supprimer cette annonce ?')) return
    try {
      await deleteAnnouncement(id)
      toast.success('Annonce supprimee')
      reload()
    } catch (err) {
      toast.error('Suppression impossible', {
        description: err instanceof Error ? err.message : undefined,
      })
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-2">
        <Card className="lg:sticky lg:top-6">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Megaphone className="size-4" aria-hidden="true" />
              Nouvelle annonce
            </div>
            <p className="mt-1 text-xs text-muted-foreground">
              Vous etes le seul a publier. Les clients lisent sans repondre.
            </p>
            <form onSubmit={publish} className="mt-4 flex flex-col gap-3">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Titre de l'annonce"
                required
              />
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Votre message..."
                rows={5}
                required
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                className="sr-only"
                onChange={onFileChange}
              />
              {pendingFile ? (
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/60 p-2 text-xs">
                  <span className="truncate">{pendingFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setPendingFile(null)}
                    className="ml-2 shrink-0 text-muted-foreground hover:text-foreground"
                    aria-label="Retirer le fichier"
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <ImageIcon className="size-4" aria-hidden="true" />
                    Photo
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="gap-1.5 text-muted-foreground"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Video className="size-4" aria-hidden="true" />
                    Video
                  </Button>
                </div>
              )}
              <Button type="submit" className="gap-2" disabled={publishing}>
                {publishing ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
                Publier l&apos;annonce
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-3 lg:col-span-3">
        {loading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
          </div>
        ) : list.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Aucune annonce publiee.</p>
        ) : (
          list.map((a) =>
            editingId === a.id ? (
              <EditAnnouncementForm
                key={a.id}
                announcement={a}
                onCancel={() => setEditingId(null)}
                onSaved={() => {
                  setEditingId(null)
                  reload()
                }}
              />
            ) : (
              <Card key={a.id}>
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <InitialsAvatar name={BRAND.owner} className="size-9" />
                      <div>
                        <p className="text-sm font-semibold">{BRAND.owner}</p>
                        <p className="text-xs text-muted-foreground">{a.date}</p>
                      </div>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditingId(a.id)} aria-label="Modifier">
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(a.id)} aria-label="Supprimer">
                        <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                  <h3 className="mt-3 font-display text-lg font-bold">{a.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/90">{a.body}</p>
                  {a.attachment && (
                    <AnnouncementAttachmentPreview
                      type={a.attachment.type}
                      name={a.attachment.name}
                      url={a.attachment.url}
                    />
                  )}
                </CardContent>
              </Card>
            ),
          )
        )}
      </div>
    </div>
  )
}

function AnnouncementAttachmentPreview({
  type,
  name,
  url,
}: {
  type: 'image' | 'video'
  name: string
  url?: string
}) {
  if (type === 'image' && url) {
    return (
      <a href={url} target="_blank" rel="noreferrer" className="mt-3 block overflow-hidden rounded-lg">
        <img src={url} alt={name} className="max-h-64 w-full object-cover" />
      </a>
    )
  }
  if (type === 'video' && url) {
    return <video src={url} controls className="mt-3 max-h-64 w-full rounded-lg" />
  }
  return (
    <div className="mt-3 flex items-center gap-2 rounded-lg border border-border bg-muted/60 p-3 text-sm text-muted-foreground">
      <ImageIcon className="size-4" aria-hidden="true" />
      {name}
    </div>
  )
}

function EditAnnouncementForm({
  announcement,
  onCancel,
  onSaved,
}: {
  announcement: Announcement
  onCancel: () => void
  onSaved: () => void
}) {
  const [title, setTitle] = useState(announcement.title)
  const [body, setBody] = useState(announcement.body)
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await updateAnnouncement(announcement.id, { title: title.trim(), body: body.trim() })
      toast.success('Annonce mise a jour')
      onSaved()
    } catch (err) {
      toast.error('Mise a jour impossible', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-primary/30">
      <CardContent className="p-5">
        <form onSubmit={save} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">Modifier l&apos;annonce</p>
            <Button type="button" size="icon" variant="ghost" onClick={onCancel} aria-label="Annuler">
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} required />
          <Button type="submit" disabled={saving} className="w-full">
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Enregistrer
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
