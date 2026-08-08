'use client'
import { useState, useEffect } from 'react'
import { Plus, Search, X, Package, TrendingDown, TrendingUp } from 'lucide-react'
import { formatMontant, formatDate } from '@/lib/format'

interface Achat {
  id: number; numero: string; date: string; fournisseurNom: string;
  statut: string; total: number; notes?: string;
  items?: Array<{ produitId: number; designation: string; qte: number; prixUnitaire: number }>
}
interface Fournisseur { id: number; nom: string }
interface Produit { id: number; reference: string; designation: string; prixAchat: number }

const statutColors: Record<string, string> = {
  brouillon: 'bg-gray-100 text-gray-600',
  confirme: 'bg-blue-100 text-blue-700',
  recu: 'bg-green-100 text-green-700',
  annule: 'bg-red-100 text-red-600',
}

export default function AchatsPage() {
  const [achats, setAchats] = useState<Achat[]>([])
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([])
  const [produits, setProduits] = useState<Produit[]>([])
  const [recherche, setRecherche] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    fournisseurId: '', date: new Date().toISOString().split('T')[0], notes: '', statut: 'brouillon',
    items: [{ produitId: '', designation: '', qte: 1, prixUnitaire: 0 }],
  })

  async function fetchAll() {
    const [a, f, p] = await Promise.all([
      fetch('/api/achats').then(r => r.json()),
      fetch('/api/fournisseurs').then(r => r.json()),
      fetch('/api/produits?limit=500').then(r => r.json()),
    ])
    if (a.success) setAchats(a.data)
    if (f.success) setFournisseurs(f.data)
    if (p.success) setProduits(p.data)
    setLoading(false)
  }
  useEffect(() => { fetchAll() }, [])

  function ajouterLigne() {
    setForm(p => ({ ...p, items: [...p.items, { produitId: '', designation: '', qte: 1, prixUnitaire: 0 }] }))
  }

  function supprimerLigne(i: number) {
    setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))
  }

  function modifierItem(i: number, key: string, val: string | number) {
    setForm(p => {
      const items = [...p.items]
      const updated = { ...items[i], [key]: val }
      if (key === 'produitId') {
        const prod = produits.find(pr => pr.id === parseInt(val as string))
        if (prod) { updated.designation = prod.designation; updated.prixUnitaire = prod.prixAchat }
      }
      items[i] = updated
      return { ...p, items }
    })
  }

  const totalAchat = form.items.reduce((s, l) => s + (l.qte || 0) * (l.prixUnitaire || 0), 0)

  async function sauvegarder() {
    setLoading(true)
    const items = form.items.filter(l => l.produitId && l.qte > 0)
    const res = await fetch('/api/achats', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        fournisseurId: form.fournisseurId ? parseInt(form.fournisseurId) : null,
        items,
        total: totalAchat,
      }),
    })
    const r = await res.json()
    if (r.success) {
      setShowModal(false)
      setForm({ fournisseurId: '', date: new Date().toISOString().split('T')[0], notes: '', statut: 'brouillon', items: [{ produitId: '', designation: '', qte: 1, prixUnitaire: 0 }] })
      fetchAll()
    } else alert(r.error)
    setLoading(false)
  }

  const filtres = achats.filter(a =>
    (a.numero + a.fournisseurNom + a.statut).toLowerCase().includes(recherche.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Commandes Achats</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {achats.length} commandes — Total: {formatMontant(achats.reduce((s, a) => s + a.total, 0))}
          </p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Nouvelle commande
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={recherche} onChange={e => setRecherche(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 outline-none bg-background"
          placeholder="Rechercher..." />
      </div>

      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Numéro</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Fournisseur</th>
                <th className="text-left px-4 py-3 font-medium">Statut</th>
                <th className="text-right px-4 py-3 font-medium">Total HT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Chargement...</td></tr>}
              {!loading && filtres.length === 0 && <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Aucune commande</td></tr>}
              {filtres.map(a => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs text-primary">{a.numero}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(a.date)}</td>
                  <td className="px-4 py-3">{a.fournisseurNom || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${statutColors[a.statut] || 'bg-muted text-muted-foreground'}`}>
                      {a.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold">{formatMontant(a.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal nouvelle commande */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background">
              <h2 className="font-semibold text-foreground">Nouvelle commande achat</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Fournisseur</label>
                  <select value={form.fournisseurId} onChange={e => setForm(p => ({ ...p, fournisseurId: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                    <option value="">— Choisir —</option>
                    {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Statut</label>
                  <select value={form.statut} onChange={e => setForm(p => ({ ...p, statut: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                    <option value="brouillon">Brouillon</option>
                    <option value="confirme">Confirmé</option>
                    <option value="recu">Reçu (met à jour stock)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Notes</label>
                  <input value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
                </div>
              </div>

              {/* Lignes articles */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Articles</label>
                  <button onClick={ajouterLigne} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Ajouter
                  </button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <select value={item.produitId} onChange={e => modifierItem(i, 'produitId', e.target.value)}
                        className="col-span-5 px-2 py-1.5 border border-border rounded text-sm bg-background">
                        <option value="">— Produit —</option>
                        {produits.map(p => <option key={p.id} value={p.id}>{p.designation}</option>)}
                      </select>
                      <input type="number" min="1" value={item.qte} onChange={e => modifierItem(i, 'qte', parseInt(e.target.value))}
                        className="col-span-2 px-2 py-1.5 border border-border rounded text-sm bg-background text-center" placeholder="Qté" />
                      <input type="number" step="0.01" value={item.prixUnitaire} onChange={e => modifierItem(i, 'prixUnitaire', parseFloat(e.target.value))}
                        className="col-span-3 px-2 py-1.5 border border-border rounded text-sm bg-background text-right" placeholder="P.U." />
                      <span className="col-span-1 text-xs text-muted-foreground text-right">
                        {formatMontant((item.qte || 0) * (item.prixUnitaire || 0))}
                      </span>
                      <button onClick={() => supprimerLigne(i)} className="col-span-1 text-muted-foreground hover:text-red-500 flex justify-center">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center font-bold text-lg border-t border-border pt-3">
                <span>Total HT</span>
                <span className="text-primary">{formatMontant(totalAchat)}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-border rounded-lg text-sm">Annuler</button>
                <button onClick={sauvegarder} disabled={loading}
                  className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-60">
                  {form.statut === 'recu' ? 'Recevoir (mise à jour stock)' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
