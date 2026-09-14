'use client'

import { useEffect, useState } from 'react'
import { Loader2, Pencil, Plus, Search, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  createFaq,
  createKnowledgeItem,
  deleteFaq,
  deleteKnowledgeItem,
  getFaqs,
  getKnowledgeBase,
  updateFaq,
  updateKnowledgeItem,
  type Faq,
  type KnowledgeItem,
} from '@/lib/services/api'

export function AdminKnowledgeBase() {
  const [tab, setTab] = useState<'infos' | 'faq'>('infos')

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div>
        <h2 className="font-display text-xl font-bold">Base de connaissances de mon Agent IA</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Ces informations seront utilisees par votre Agent IA pour repondre a vos clients. Il ne repondra
          jamais avec des informations qui ne figurent pas ici.
        </p>
      </div>

      <div className="flex gap-2 border-b border-border">
        <button
          type="button"
          onClick={() => setTab('infos')}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${
            tab === 'infos' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          Informations
        </button>
        <button
          type="button"
          onClick={() => setTab('faq')}
          className={`border-b-2 px-3 py-2 text-sm font-medium ${
            tab === 'faq' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
          }`}
        >
          Questions frequentes
        </button>
      </div>

      {tab === 'infos' ? <KnowledgeInfos /> : <KnowledgeFaqs />}
    </div>
  )
}

function KnowledgeInfos() {
  const [items, setItems] = useState<KnowledgeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)

  function reload() {
    setLoading(true)
    getKnowledgeBase()
      .then(setItems)
      .catch((err) => console.error('Erreur chargement base de connaissances:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  async function remove(id: string) {
    if (!confirm('Supprimer cette information ?')) return
    try {
      await deleteKnowledgeItem(id)
      toast.success('Supprime')
      reload()
    } catch (err) {
      toast.error('Suppression impossible', { description: err instanceof Error ? err.message : undefined })
    }
  }

  const filtered = items.filter((item) => {
    const q = query.trim().toLowerCase()
    if (!q) return true
    return (
      item.title.toLowerCase().includes(q) ||
      item.content.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    )
  })

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="flex h-10 flex-1 items-center gap-2 rounded-lg border border-input bg-background px-3">
          <Search className="size-4 text-muted-foreground" aria-hidden="true" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une information..."
            className="flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <Button size="sm" onClick={() => setShowNewForm(true)} className="gap-1.5 shrink-0">
          <Plus className="size-4" aria-hidden="true" />
          Ajouter
        </Button>
      </div>

      {showNewForm && (
        <KnowledgeForm onCancel={() => setShowNewForm(false)} onSaved={() => { setShowNewForm(false); reload() }} />
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Aucune information pour le moment.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((item) =>
            editingId === item.id ? (
              <KnowledgeForm
                key={item.id}
                item={item}
                onCancel={() => setEditingId(null)}
                onSaved={() => { setEditingId(null); reload() }}
              />
            ) : (
              <Card key={item.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                          {item.category}
                        </span>
                      </div>
                      <p className="mt-1.5 font-semibold">{item.title}</p>
                      <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{item.content}</p>
                      <p className="mt-2 text-[11px] text-muted-foreground">
                        Derniere mise a jour :{' '}
                        {new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(
                          new Date(item.updatedAt),
                        )}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      <Button size="icon" variant="ghost" onClick={() => setEditingId(item.id)} aria-label="Modifier">
                        <Pencil className="size-4" aria-hidden="true" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(item.id)} aria-label="Supprimer">
                        <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      )}
    </div>
  )
}

const CATEGORY_SUGGESTIONS = [
  'Informations commerciales',
  'Moyens de paiement',
  'Livraison',
  'Retours et remboursements',
  'Horaires',
  'Contacts',
  'Zones desservies',
  'Delais',
]

function KnowledgeForm({
  item,
  onCancel,
  onSaved,
}: {
  item?: KnowledgeItem
  onCancel: () => void
  onSaved: () => void
}) {
  const [category, setCategory] = useState(item?.category ?? '')
  const [title, setTitle] = useState(item?.title ?? '')
  const [content, setContent] = useState(item?.content ?? '')
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (item) {
        await updateKnowledgeItem(item.id, { category, title, content })
      } else {
        await createKnowledgeItem({ category, title, content })
      }
      toast.success('Enregistre')
      onSaved()
    } catch (err) {
      toast.error('Enregistrement impossible', { description: err instanceof Error ? err.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-primary/30">
      <CardContent className="p-4">
        <form onSubmit={save} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{item ? 'Modifier' : 'Nouvelle information'}</p>
            <Button type="button" size="icon" variant="ghost" onClick={onCancel} aria-label="Fermer">
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Categorie</Label>
            <Input
              list="kb-categories"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex. Moyens de paiement"
              required
            />
            <datalist id="kb-categories">
              {CATEGORY_SUGGESTIONS.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Titre</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Contenu</Label>
            <Textarea rows={4} value={content} onChange={(e) => setContent(e.target.value)} required />
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Enregistrer
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

function KnowledgeFaqs() {
  const [faqs, setFaqs] = useState<Faq[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)

  function reload() {
    setLoading(true)
    getFaqs()
      .then(setFaqs)
      .catch((err) => console.error('Erreur chargement FAQ:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  async function remove(id: string) {
    if (!confirm('Supprimer cette question ?')) return
    try {
      await deleteFaq(id)
      toast.success('Supprime')
      reload()
    } catch (err) {
      toast.error('Suppression impossible', { description: err instanceof Error ? err.message : undefined })
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowNewForm(true)} className="gap-1.5">
          <Plus className="size-4" aria-hidden="true" />
          Ajouter une question
        </Button>
      </div>

      {showNewForm && (
        <FaqForm onCancel={() => setShowNewForm(false)} onSaved={() => { setShowNewForm(false); reload() }} />
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : faqs.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Aucune question frequente pour le moment.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {faqs.map((f) =>
            editingId === f.id ? (
              <FaqForm
                key={f.id}
                faq={f}
                onCancel={() => setEditingId(null)}
                onSaved={() => { setEditingId(null); reload() }}
              />
            ) : (
              <Card key={f.id}>
                <CardContent className="flex items-start justify-between gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold">{f.question}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{f.answer}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(f.id)} aria-label="Modifier">
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(f.id)} aria-label="Supprimer">
                      <Trash2 className="size-4 text-destructive" aria-hidden="true" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ),
          )}
        </div>
      )}
    </div>
  )
}

function FaqForm({
  faq,
  onCancel,
  onSaved,
}: {
  faq?: Faq
  onCancel: () => void
  onSaved: () => void
}) {
  const [question, setQuestion] = useState(faq?.question ?? '')
  const [answer, setAnswer] = useState(faq?.answer ?? '')
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      if (faq) {
        await updateFaq(faq.id, { question, answer })
      } else {
        await createFaq({ question, answer })
      }
      toast.success('Enregistre')
      onSaved()
    } catch (err) {
      toast.error('Enregistrement impossible', { description: err instanceof Error ? err.message : undefined })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card className="border-primary/30">
      <CardContent className="p-4">
        <form onSubmit={save} className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold">{faq ? 'Modifier' : 'Nouvelle question'}</p>
            <Button type="button" size="icon" variant="ghost" onClick={onCancel} aria-label="Fermer">
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Question</Label>
            <Input
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="Ex. Quels sont vos moyens de paiement ?"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Reponse</Label>
            <Textarea rows={3} value={answer} onChange={(e) => setAnswer(e.target.value)} required />
          </div>

          <Button type="submit" disabled={saving} className="w-full">
            {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
            Enregistrer
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
