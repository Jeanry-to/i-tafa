'use client'

import { useEffect, useState } from 'react'
import { Loader2, Pencil, Plus, Trash2, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  createProduct,
  deleteProduct,
  getProducts,
  updateProduct,
  type Product,
} from '@/lib/services/api'

export function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [showNewForm, setShowNewForm] = useState(false)

  function reload() {
    setLoading(true)
    getProducts()
      .then(setProducts)
      .catch((err) => console.error('Erreur chargement produits:', err))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    reload()
  }, [])

  async function toggleAvailable(product: Product) {
    try {
      await updateProduct(product.id, { available: !product.available })
      reload()
    } catch (err) {
      toast.error('Mise a jour impossible', { description: err instanceof Error ? err.message : undefined })
    }
  }

  async function remove(id: string) {
    if (!confirm('Supprimer ce produit ou service ?')) return
    try {
      await deleteProduct(id)
      toast.success('Supprime')
      reload()
    } catch (err) {
      toast.error('Suppression impossible', { description: err instanceof Error ? err.message : undefined })
    }
  }

  return (
    <div className="flex max-w-3xl flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Ces informations seront utilisees par votre Agent IA pour repondre a vos clients.
        </p>
        <Button size="sm" onClick={() => setShowNewForm(true)} className="gap-1.5">
          <Plus className="size-4" aria-hidden="true" />
          Ajouter
        </Button>
      </div>

      {showNewForm && (
        <ProductForm onCancel={() => setShowNewForm(false)} onSaved={() => { setShowNewForm(false); reload() }} />
      )}

      {loading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
        </div>
      ) : products.length === 0 ? (
        <p className="py-10 text-center text-sm text-muted-foreground">Aucun produit ou service pour le moment.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {products.map((p) =>
            editingId === p.id ? (
              <ProductForm
                key={p.id}
                product={p}
                onCancel={() => setEditingId(null)}
                onSaved={() => { setEditingId(null); reload() }}
              />
            ) : (
              <Card key={p.id}>
                <CardContent className="flex items-start justify-between gap-4 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">{p.name}</p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          p.available ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                        }`}
                      >
                        {p.available ? 'Disponible' : 'Indisponible'}
                      </span>
                    </div>
                    {p.price !== null && (
                      <p className="mt-0.5 text-sm font-medium">
                        {p.price.toLocaleString('fr-FR')} {p.currency}
                      </p>
                    )}
                    {p.description && <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>}
                    {p.promotion && (
                      <p className="mt-1 text-xs text-primary">Promotion : {p.promotion}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <Button size="sm" variant="outline" onClick={() => toggleAvailable(p)}>
                      {p.available ? 'Marquer indisponible' : 'Marquer disponible'}
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(p.id)} aria-label="Modifier">
                      <Pencil className="size-4" aria-hidden="true" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(p.id)} aria-label="Supprimer">
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

function ProductForm({
  product,
  onCancel,
  onSaved,
}: {
  product?: Product
  onCancel: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [price, setPrice] = useState(product?.price?.toString() ?? '')
  const [currency, setCurrency] = useState(product?.currency ?? 'MGA')
  const [features, setFeatures] = useState(product?.features ?? '')
  const [conditions, setConditions] = useState(product?.conditions ?? '')
  const [promotion, setPromotion] = useState(product?.promotion ?? '')
  const [discount, setDiscount] = useState(product?.discount ?? '')
  const [orderConditions, setOrderConditions] = useState(product?.orderConditions ?? '')
  const [deliveryConditions, setDeliveryConditions] = useState(product?.deliveryConditions ?? '')
  const [saving, setSaving] = useState(false)

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        name,
        description,
        price: price ? Number(price) : null,
        currency,
        available: product?.available ?? true,
        features,
        conditions,
        promotion,
        discount,
        orderConditions,
        deliveryConditions,
      }
      if (product) {
        await updateProduct(product.id, payload)
      } else {
        await createProduct(payload)
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
            <p className="text-sm font-semibold">{product ? 'Modifier' : 'Nouveau produit / service'}</p>
            <Button type="button" size="icon" variant="ghost" onClick={onCancel} aria-label="Fermer">
              <X className="size-4" aria-hidden="true" />
            </Button>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Nom</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Description</Label>
            <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Prix</Label>
              <Input type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Devise</Label>
              <Input value={currency} onChange={(e) => setCurrency(e.target.value)} placeholder="MGA, USD, EUR..." />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Caracteristiques</Label>
            <Textarea rows={2} value={features} onChange={(e) => setFeatures(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Conditions particulieres</Label>
            <Textarea rows={2} value={conditions} onChange={(e) => setConditions(e.target.value)} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>Promotion</Label>
              <Input value={promotion} onChange={(e) => setPromotion(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>Reduction</Label>
              <Input value={discount} onChange={(e) => setDiscount(e.target.value)} />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Conditions de commande</Label>
            <Textarea rows={2} value={orderConditions} onChange={(e) => setOrderConditions(e.target.value)} />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Conditions de livraison</Label>
            <Textarea rows={2} value={deliveryConditions} onChange={(e) => setDeliveryConditions(e.target.value)} />
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
