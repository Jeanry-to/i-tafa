'use client'

import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  getAgentSettings,
  saveAgentSettings,
  type AgentSettings,
  type AgentTone,
  type AgentFormality,
  type AgentResponseLength,
  type AgentLanguage,
} from '@/lib/services/api'

const empty: Omit<AgentSettings, 'id'> = {
  tone: 'amical',
  formality: 'vouvoiement',
  responseLength: 'moyenne',
  language: 'fr',
  pricePresentation: '',
  productPresentation: '',
  priorityInfo: '',
  forbiddenInfo: '',
  customInstructions: '',
}

const TONE_OPTIONS: { value: AgentTone; label: string }[] = [
  { value: 'amical', label: 'Amical' },
  { value: 'professionnel', label: 'Professionnel' },
  { value: 'chaleureux', label: 'Chaleureux' },
  { value: 'commercial', label: 'Commercial' },
  { value: 'simple', label: 'Simple et direct' },
]

const FORMALITY_OPTIONS: { value: AgentFormality; label: string }[] = [
  { value: 'vouvoiement', label: 'Vouvoiement' },
  { value: 'tutoiement', label: 'Tutoiement' },
]

const LENGTH_OPTIONS: { value: AgentResponseLength; label: string }[] = [
  { value: 'courte', label: 'Courte (1 à 3 phrases)' },
  { value: 'moyenne', label: 'Moyenne' },
  { value: 'detaillee', label: 'Détaillée' },
]

const LANGUAGE_OPTIONS: { value: AgentLanguage; label: string }[] = [
  { value: 'fr', label: 'Français' },
  { value: 'mg', label: 'Malagasy' },
  { value: 'en', label: 'Anglais' },
  { value: 'auto', label: 'Automatique (langue du client)' },
]

const selectClassName =
  'h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50'

export function AdminAgentSettings() {
  const [values, setValues] = useState(empty)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    getAgentSettings()
      .then((data) => {
        if (data) setValues(data)
      })
      .catch((err) => console.error("Erreur chargement reglages de l'Agent IA:", err))
      .finally(() => setLoading(false))
  }, [])

  function set<K extends keyof typeof values>(key: K, value: (typeof values)[K]) {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      await saveAgentSettings(values)
      toast.success('Comportement de l\u2019Agent IA enregistré')
    } catch (err) {
      toast.error('Enregistrement impossible', {
        description: err instanceof Error ? err.message : undefined,
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="size-6 animate-spin text-muted-foreground" aria-hidden="true" />
      </div>
    )
  }

  return (
    <form onSubmit={save} className="flex max-w-3xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comportement de l&apos;Agent IA</CardTitle>
          <p className="text-sm text-muted-foreground">
            Definissez comment votre Agent IA doit s&apos;exprimer face a vos clients.
          </p>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="agent-tone">Ton</Label>
              <select
                id="agent-tone"
                className={selectClassName}
                value={values.tone}
                onChange={(e) => set('tone', e.target.value as AgentTone)}
              >
                {TONE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="agent-formality">Formalité</Label>
              <select
                id="agent-formality"
                className={selectClassName}
                value={values.formality}
                onChange={(e) => set('formality', e.target.value as AgentFormality)}
              >
                {FORMALITY_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="agent-length">Longueur des réponses</Label>
              <select
                id="agent-length"
                className={selectClassName}
                value={values.responseLength}
                onChange={(e) => set('responseLength', e.target.value as AgentResponseLength)}
              >
                {LENGTH_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="agent-language">Langue</Label>
              <select
                id="agent-language"
                className={selectClassName}
                value={values.language}
                onChange={(e) => set('language', e.target.value as AgentLanguage)}
              >
                {LANGUAGE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-price">Manière de présenter les prix</Label>
            <Textarea
              id="agent-price"
              rows={2}
              placeholder="Ex. Toujours indiquer le prix en Ariary (Ar), jamais en devise étrangère."
              value={values.pricePresentation}
              onChange={(e) => set('pricePresentation', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-product">Manière de présenter les produits</Label>
            <Textarea
              id="agent-product"
              rows={2}
              placeholder="Ex. Toujours mentionner les promotions en premier."
              value={values.productPresentation}
              onChange={(e) => set('productPresentation', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-priority">Informations à privilégier</Label>
            <Textarea
              id="agent-priority"
              rows={2}
              placeholder="Ex. Toujours proposer le paiement via MVola en premier."
              value={values.priorityInfo}
              onChange={(e) => set('priorityInfo', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-forbidden">Informations à ne jamais communiquer</Label>
            <Textarea
              id="agent-forbidden"
              rows={2}
              placeholder="Ex. Ne jamais donner le numéro de téléphone personnel de l'admin."
              value={values.forbiddenInfo}
              onChange={(e) => set('forbiddenInfo', e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="agent-custom">Instructions personnalisées additionnelles</Label>
            <Textarea
              id="agent-custom"
              rows={3}
              placeholder="Toute autre consigne pour votre Agent IA."
              value={values.customInstructions}
              onChange={(e) => set('customInstructions', e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Button type="submit" disabled={saving} className="w-fit">
        {saving && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
        Enregistrer
      </Button>
    </form>
  )
}
