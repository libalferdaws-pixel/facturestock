'use client'
import { useState, useEffect } from 'react'
import { Plus, Search, X, RotateCcw } from 'lucide-react'
import { formatMontant, formatDate } from '@/lib/format'

interface Avoir {
  id: number; numero: string; date: string; factureId?: number; factureNumero?: string;
  clientNom: string; motif: string; total: number; statut: string;
  items?: Array<{ designation: string; qte: number; prixUnitaire: number }>
}
interface Facture { id: number; numero: string; clientNom: string; clientId?: number; total: number }

const statutColors: Record<string, string> = {
  brouillon: 'bg-gray-100 text-gray-600',
  valide: 'bg-green-100 text-green-700',
  annule: 'bg-red-100 text-red-600',
}

export default function AvoirsPage() {
  const [avoirs, setAvoirs] = useState<Avoir[]>([])
  const [factures, setFactures] = useState<Facture[]>([])
  const [recherche, setRecherche] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    factureId: '', clientNom: '', motif: '', date: new Date().toISOString().split('T')[0], statut: 'valide',
    items: [{ designation: '', qte: 1, prixUnitaire: 0 }],
  })

  async function fetchAll() {
    const [av, f] = await Promise.all([
      fetch('/api/avoirs').then(r => r.json()),
      fetch('/api/factures?limit=200').then(r => r.json()),
    ])
    if (av.success) setAvoirs(av.data)
    if (f.success) setFactures(f.data)
    setLoading(false)
  }
  useEffect(() => { fetchAll() }, [])

  function ajouterLigne() {
    setForm(p => ({ ...p, items: [...p.items, { designation: '', qte: 1, prixUnitaire: 0 }] }))
  }
  function supprimerLigne(i: number) {
    setForm(p => ({ ...p, items: p.items.filter((_, idx) => idx !== i) }))
  }
  function modifierItem(i: number, key: string, val: string | number) {
    setForm(p => { const items = [...p.items]; items[i] = { ...items[i], [key]: val }; return { ...p, items } })
  }

  const total = form.items.reduce((s, l) => s + (l.qte || 0) * (l.prixUnitaire || 0), 0)

  async function sauvegarder() {
    setLoading(true)
    const res = await fetch('/api/avoirs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        factureId: form.factureId ? parseInt(form.factureId) : null,
        items: form.items.filter(l => l.designation && l.qte > 0),
        total,
      }),
    })
    const r = await res.json()
    if (r.success) {
      setShowModal(false)
      setForm({ factureId: '', clientNom: '', motif: '', date: new Date().toISOString().split('T')[0], statut: 'valide', items: [{ designation: '', qte: 1, prixUnitaire: 0 }] })
      fetchAll()
    } else alert(r.error)
    setLoading(false)
  }

  const filtres = avoirs.filter(a =>
    (a.numero + a.clientNom + a.motif).toLowerCase().includes(recherche.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Avoirs / Retours</h1>
          <p className="text-muted-foreground text-sm mt-1">{avoirs.length} avoirs — Total: {formatMontant(avoirs.reduce((s, a) => s + a.total, 0))}</p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Nouvel avoir
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={recherche} onChange={e => setRecherche(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm outline-none bg-background"
          placeholder="Rechercher..." />
      </div>

      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Numéro</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Client</th>
                <th className="text-left px-4 py-3 font-medium">Facture liée</th>
                <th className="text-left px-4 py-3 font-medium">Motif</th>
                <th className="text-left px-4 py-3 font-medium">Statut</th>
                <th className="text-right px-4 py-3 font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Chargement...</td></tr>}
              {!loading && filtres.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">Aucun avoir</td></tr>}
              {filtres.map(a => (
                <tr key={a.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs text-primary">{a.numero}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(a.date)}</td>
                  <td className="px-4 py-3">{a.clientNom}</td>
                  <td className="px-4 py-3 text-xs">{a.factureNumero || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-sm truncate max-w-[150px]">{a.motif}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${statutColors[a.statut] || 'bg-muted text-muted-foreground'}`}>
                      {a.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-orange-600">{formatMontant(a.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border sticky top-0 bg-background">
              <h2 className="font-semibold text-foreground">Nouvel avoir / retour</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Facture liée (optionnel)</label>
                  <select value={form.factureId} onChange={e => {
                    const f = factures.find(f => f.id === parseInt(e.target.value))
                    setForm(p => ({ ...p, factureId: e.target.value, clientNom: f ? f.clientNom : p.clientNom }))
                  }}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                    <option value="">— Aucune —</option>
                    {factures.map(f => <option key={f.id} value={f.id}>{f.numero} — {f.clientNom}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Client</label>
                  <input value={form.clientNom} onChange={e => setForm(p => ({ ...p, clientNom: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Statut</label>
                  <select value={form.statut} onChange={e => setForm(p => ({ ...p, statut: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                    <option value="brouillon">Brouillon</option>
                    <option value="valide">Validé</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Motif / Description</label>
                <input value={form.motif} onChange={e => setForm(p => ({ ...p, motif: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background"
                  placeholder="Produit défectueux, erreur de facturation..." />
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium">Lignes retournées</label>
                  <button onClick={ajouterLigne} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Ajouter
                  </button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input value={item.designation} onChange={e => modifierItem(i, 'designation', e.target.value)}
                        className="col-span-5 px-2 py-1.5 border border-border rounded text-sm bg-background" placeholder="Désignation" />
                      <input type="number" min="1" value={item.qte} onChange={e => modifierItem(i, 'qte', parseInt(e.target.value))}
                        className="col-span-2 px-2 py-1.5 border border-border rounded text-sm bg-background text-center" placeholder="Qté" />
                      <input type="number" step="0.01" value={item.prixUnitaire} onChange={e => modifierItem(i, 'prixUnitaire', parseFloat(e.target.value))}
                        className="col-span-3 px-2 py-1.5 border border-border rounded text-sm bg-background text-right" placeholder="Prix" />
                      <span className="col-span-1 text-xs text-right text-muted-foreground">
                        {formatMontant((item.qte || 0) * (item.prixUnitaire || 0))}
                      </span>
                      <button onClick={() => supprimerLigne(i)} className="col-span-1 flex justify-center text-muted-foreground hover:text-red-500">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between font-bold text-lg border-t border-border pt-3">
                <span>Total avoir</span>
                <span className="text-orange-600">{formatMontant(total)}</span>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-border rounded-lg text-sm">Annuler</button>
                <button onClick={sauvegarder} disabled={!form.clientNom || loading}
                  className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-60">
                  Créer l'avoir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
