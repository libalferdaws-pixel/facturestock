'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Trash2, Search, Save, ArrowLeft } from 'lucide-react'
import { formatMontant, today, calcItems } from '@/lib/format'
import { cn } from '@/utils/cn'

interface LineItem {
  id?: number
  produitId?: number | null
  reference?: string | null
  designation: string
  quantite: number
  prixUnitaire: number
  tva: number
  total: number
}

interface Client { id: number; nom: string }
interface Fournisseur { id: number; nom: string }
interface Produit { id: number; reference: string; designation: string; prixVente: number; prixAchat: number; tva: number }

interface DocFormProps {
  type: 'facture' | 'devis' | 'bon'
  defaultData?: {
    clientId?: number | null
    clientNom?: string
    fournisseurId?: number | null
    fournisseurNom?: string
    date?: string
    echeance?: string
    validite?: string
    notes?: string
    statut?: string
    items?: LineItem[]
  }
  onSubmit: (data: Record<string, unknown>) => Promise<void>
  isEdit?: boolean
}

export function DocForm({ type, defaultData, onSubmit, isEdit }: DocFormProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [clients, setClients] = useState<Client[]>([])
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const [searchProd, setSearchProd] = useState('')
  const [showProdSearch, setShowProdSearch] = useState<number | null>(null)

  const [formData, setFormData] = useState({
    clientId: defaultData?.clientId ?? null as number | null,
    clientNom: defaultData?.clientNom ?? '',
    fournisseurId: defaultData?.fournisseurId ?? null as number | null,
    fournisseurNom: defaultData?.fournisseurNom ?? '',
    date: defaultData?.date ?? today(),
    echeance: defaultData?.echeance ?? '',
    validite: defaultData?.validite ?? '',
    notes: defaultData?.notes ?? '',
    statut: defaultData?.statut ?? (type === 'bon' ? 'recu' : type === 'facture' ? 'brouillon' : 'en_attente'),
  })

  const [items, setItems] = useState<LineItem[]>(
    defaultData?.items?.length
      ? defaultData.items.map(i => ({ ...i }))
      : [{ reference: '', designation: '', quantite: 1, prixUnitaire: 0, tva: 20, total: 0 }]
  )

  useEffect(() => {
    if (type !== 'bon') fetch('/api/clients').then(r => r.json()).then(r => { if (r.success) setClients(r.data) })
    if (type === 'bon') fetch('/api/fournisseurs').then(r => r.json()).then(r => { if (r.success) setFournisseurs(r.data) })
    fetch('/api/produits').then(r => r.json()).then(r => { if (r.success) setProduits(r.data) })
  }, [type])

  const filteredProduits = produits.filter(p =>
    !searchProd || p.designation.toLowerCase().includes(searchProd.toLowerCase()) || p.reference.toLowerCase().includes(searchProd.toLowerCase())
  )

  function recalcItem(item: LineItem): LineItem {
    const ht = item.quantite * item.prixUnitaire
    return { ...item, total: ht + ht * (item.tva / 100) }
  }

  function updateItem(idx: number, field: keyof LineItem, value: string | number) {
    setItems(prev => {
      const next = [...prev]
      next[idx] = recalcItem({ ...next[idx], [field]: value })
      return next
    })
  }

  function addItem() {
    setItems(prev => [...prev, { reference: '', designation: '', quantite: 1, prixUnitaire: 0, tva: 20, total: 0 }])
  }

  function removeItem(idx: number) {
    setItems(prev => prev.filter((_, i) => i !== idx))
  }

  function selectProduit(idx: number, prod: Produit) {
    setItems(prev => {
      const next = [...prev]
      const prix = type === 'bon' ? prod.prixAchat : prod.prixVente
      next[idx] = recalcItem({
        ...next[idx],
        produitId: prod.id,
        reference: prod.reference,
        designation: prod.designation,
        prixUnitaire: prix,
        tva: prod.tva,
      })
      return next
    })
    setShowProdSearch(null)
    setSearchProd('')
  }

  const totals = calcItems(items)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const payload: Record<string, unknown> = {
        ...formData,
        items: items.map(i => ({
          ...i,
          quantite: Number(i.quantite),
          prixUnitaire: Number(i.prixUnitaire),
          tva: Number(i.tva),
        })),
      }
      await onSubmit(payload)
    } finally {
      setLoading(false)
    }
  }

  const statutOptions =
    type === 'facture' ? ['brouillon', 'envoyee', 'payee', 'annulee']
    : type === 'devis' ? ['en_attente', 'accepte', 'refuse', 'converti']
    : ['recu', 'partiel', 'annule']

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {type !== 'bon' ? (
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Client <span className="text-muted-foreground" dir="rtl">الزبون</span>
            </label>
            <select
              value={formData.clientId ?? ''}
              onChange={e => {
                const id = Number(e.target.value)
                const client = clients.find(c => c.id === id)
                setFormData(prev => ({ ...prev, clientId: id || null, clientNom: client?.nom ?? '' }))
              }}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Sélectionner un client</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.nom}</option>)}
            </select>
            {!formData.clientId && (
              <input
                type="text"
                placeholder="Ou saisir le nom du client"
                value={formData.clientNom}
                onChange={e => setFormData(prev => ({ ...prev, clientNom: e.target.value }))}
                className="mt-2 w-full border border-input rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>
        ) : (
          <div>
            <label className="block text-sm font-medium mb-1.5">
              Fournisseur <span className="text-muted-foreground" dir="rtl">المورد</span>
            </label>
            <select
              value={formData.fournisseurId ?? ''}
              onChange={e => {
                const id = Number(e.target.value)
                const f = fournisseurs.find(x => x.id === id)
                setFormData(prev => ({ ...prev, fournisseurId: id || null, fournisseurNom: f?.nom ?? '' }))
              }}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">— Sélectionner un fournisseur</option>
              {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
            </select>
            {!formData.fournisseurId && (
              <input
                type="text"
                placeholder="Ou saisir le nom du fournisseur"
                value={formData.fournisseurNom}
                onChange={e => setFormData(prev => ({ ...prev, fournisseurNom: e.target.value }))}
                className="mt-2 w-full border border-input rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1.5">Date</label>
            <input type="date" value={formData.date}
              onChange={e => setFormData(prev => ({ ...prev, date: e.target.value }))}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">
              {type === 'facture' ? 'Échéance' : type === 'devis' ? 'Validité' : 'Statut'}
            </label>
            {type === 'bon' ? (
              <select value={formData.statut}
                onChange={e => setFormData(prev => ({ ...prev, statut: e.target.value }))}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {statutOptions.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            ) : (
              <input type="date"
                value={type === 'facture' ? formData.echeance : formData.validite}
                onChange={e => setFormData(prev =>
                  type === 'facture'
                    ? { ...prev, echeance: e.target.value }
                    : { ...prev, validite: e.target.value }
                )}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>
        </div>
      </div>

      {type !== 'bon' && (
        <div>
          <label className="block text-sm font-medium mb-1.5">Statut</label>
          <div className="flex gap-2 flex-wrap">
            {statutOptions.map(s => (
              <button key={s} type="button"
                onClick={() => setFormData(prev => ({ ...prev, statut: s }))}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium border transition-colors',
                  formData.statut === s
                    ? 'bg-primary text-white border-primary'
                    : 'border-border text-muted-foreground hover:border-primary hover:text-primary'
                )}>
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Lines table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-sm">
            Lignes <span className="text-muted-foreground" dir="rtl">البنود</span>
          </h3>
          <button type="button" onClick={addItem}
            className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium">
            <Plus className="w-3.5 h-3.5" />
            Ajouter une ligne
          </button>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground text-xs">
                <tr>
                  <th className="px-3 py-2 text-left w-8">#</th>
                  <th className="px-3 py-2 text-left">Référence</th>
                  <th className="px-3 py-2 text-left min-w-40">Désignation</th>
                  <th className="px-3 py-2 text-right w-20">Qté</th>
                  <th className="px-3 py-2 text-right w-28">P.U. HT</th>
                  {type !== 'bon' && <th className="px-3 py-2 text-right w-20">TVA%</th>}
                  <th className="px-3 py-2 text-right w-28">Total TTC</th>
                  <th className="px-3 py-2 w-8"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {items.map((item, idx) => (
                  <tr key={idx} className="bg-card hover:bg-muted/30">
                    <td className="px-3 py-2 text-muted-foreground text-xs">{idx + 1}</td>
                    <td className="px-3 py-2 relative">
                      <div className="flex gap-1">
                        <input
                          value={item.reference ?? ''}
                          onChange={e => updateItem(idx, 'reference', e.target.value)}
                          placeholder="REF"
                          className="w-20 border border-input rounded px-2 py-1 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring"
                        />
                        <button type="button"
                          onClick={() => { setShowProdSearch(idx); setSearchProd('') }}
                          className="p-1 rounded border border-input hover:bg-muted text-muted-foreground hover:text-foreground">
                          <Search className="w-3 h-3" />
                        </button>
                      </div>
                      {showProdSearch === idx && (
                        <div className="absolute z-20 top-full left-0 mt-1 w-72 bg-card border border-border rounded-lg shadow-lg">
                          <div className="p-2">
                            <input autoFocus
                              value={searchProd}
                              onChange={e => setSearchProd(e.target.value)}
                              placeholder="Chercher produit..."
                              className="w-full border border-input rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                          </div>
                          <div className="max-h-48 overflow-y-auto divide-y divide-border">
                            {filteredProduits.slice(0, 20).map(p => (
                              <button key={p.id} type="button"
                                onClick={() => selectProduit(idx, p)}
                                className="w-full text-left px-3 py-2 hover:bg-muted text-xs">
                                <p className="font-medium">{p.designation}</p>
                                <p className="text-muted-foreground">{p.reference} · {formatMontant(type === 'bon' ? p.prixAchat : p.prixVente)}</p>
                              </button>
                            ))}
                            {filteredProduits.length === 0 && <p className="px-3 py-2 text-xs text-muted-foreground">Aucun résultat</p>}
                          </div>
                          <div className="p-2 border-t border-border">
                            <button type="button" onClick={() => setShowProdSearch(null)} className="text-xs text-muted-foreground hover:text-foreground">Fermer</button>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={item.designation}
                        onChange={e => updateItem(idx, 'designation', e.target.value)}
                        placeholder="Description du produit / service"
                        required
                        className="w-full border border-input rounded px-2 py-1 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min="0" step="0.01"
                        value={item.quantite}
                        onChange={e => updateItem(idx, 'quantite', Number(e.target.value))}
                        className="w-16 border border-input rounded px-2 py-1 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring text-right"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input type="number" min="0" step="0.01"
                        value={item.prixUnitaire}
                        onChange={e => updateItem(idx, 'prixUnitaire', Number(e.target.value))}
                        className="w-24 border border-input rounded px-2 py-1 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring text-right"
                      />
                    </td>
                    {type !== 'bon' && (
                      <td className="px-3 py-2">
                        <input type="number" min="0" max="100" step="1"
                          value={item.tva}
                          onChange={e => updateItem(idx, 'tva', Number(e.target.value))}
                          className="w-16 border border-input rounded px-2 py-1 text-xs bg-card focus:outline-none focus:ring-1 focus:ring-ring text-right"
                        />
                      </td>
                    )}
                    <td className="px-3 py-2 text-right font-medium text-xs">
                      {formatMontant(item.total)}
                    </td>
                    <td className="px-3 py-2">
                      <button type="button" onClick={() => removeItem(idx)}
                        className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Totals */}
      <div className="flex justify-end">
        <div className="w-72 space-y-2 bg-muted/50 rounded-xl p-4">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Sous-total HT</span>
            <span className="font-medium">{formatMontant(totals.sousTotal)}</span>
          </div>
          {type !== 'bon' && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">TVA</span>
              <span className="font-medium">{formatMontant(totals.totalTva)}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold border-t border-border pt-2">
            <span>Total TTC</span>
            <span className="text-primary">{formatMontant(totals.total)}</span>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium mb-1.5">Notes</label>
        <textarea value={formData.notes}
          onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          rows={2}
          placeholder="Notes ou observations..."
          className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60">
          <Save className="w-4 h-4" />
          {loading ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
