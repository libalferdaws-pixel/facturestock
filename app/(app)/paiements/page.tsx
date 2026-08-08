'use client'
import { useState, useEffect } from 'react'
import { Plus, Search, X, Check, Clock, AlertCircle } from 'lucide-react'
import { formatMontant, formatDate } from '@/lib/format'

interface Paiement {
  id: number; reference: string; date: string; montant: number;
  mode: string; factureId?: number; factureNumero?: string;
  clientNom?: string; notes?: string; statut: string; createdAt: string;
}
interface Facture {
  id: number; numero: string; clientNom: string; total: number;
  montantPaye: number; statut: string; date: string;
}

const modeColors: Record<string, string> = {
  especes: 'bg-green-100 text-green-700',
  cheque: 'bg-blue-100 text-blue-700',
  virement: 'bg-purple-100 text-purple-700',
  carte: 'bg-orange-100 text-orange-700',
}

export default function PaiementsPage() {
  const [paiements, setPaiements] = useState<Paiement[]>([])
  const [factures, setFactures] = useState<Facture[]>([])
  const [recherche, setRecherche] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState({
    factureId: '', montant: '', mode: 'especes', date: new Date().toISOString().split('T')[0], notes: '',
  })

  async function fetchPaiements() {
    const r = await fetch('/api/paiements').then(r => r.json())
    if (r.success) setPaiements(r.data)
    setLoading(false)
  }

  async function fetchFactures() {
    const r = await fetch('/api/factures?statut=impayee,partielle').then(r => r.json())
    if (r.success) setFactures(r.data)
  }

  useEffect(() => { fetchPaiements(); fetchFactures() }, [])

  async function sauvegarder() {
    setLoading(true)
    const res = await fetch('/api/paiements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, factureId: form.factureId ? parseInt(form.factureId) : null, montant: parseFloat(form.montant) }),
    })
    const r = await res.json()
    if (r.success) {
      setShowModal(false)
      setForm({ factureId: '', montant: '', mode: 'especes', date: new Date().toISOString().split('T')[0], notes: '' })
      fetchPaiements(); fetchFactures()
    } else alert(r.error)
    setLoading(false)
  }

  const filtres = paiements.filter(p =>
    (p.reference + p.clientNom + p.factureNumero + p.mode).toLowerCase().includes(recherche.toLowerCase())
  )
  const totalMois = paiements.filter(p => p.date.startsWith(new Date().toISOString().slice(0, 7)))
    .reduce((s, p) => s + p.montant, 0)

  const selectedFacture = factures.find(f => f.id === parseInt(form.factureId))

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Paiements reçus</h1>
          <p className="text-muted-foreground text-sm mt-1">Total ce mois : <span className="font-semibold text-green-600">{formatMontant(totalMois)}</span></p>
        </div>
        <button onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Nouveau paiement
        </button>
      </div>

      {/* Recherche */}
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={recherche} onChange={e => setRecherche(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 outline-none bg-background"
          placeholder="Rechercher..." />
      </div>

      {/* Table */}
      <div className="bg-background rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="text-left px-4 py-3 font-medium">Référence</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-left px-4 py-3 font-medium">Facture</th>
                <th className="text-left px-4 py-3 font-medium">Client</th>
                <th className="text-left px-4 py-3 font-medium">Mode</th>
                <th className="text-right px-4 py-3 font-medium">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Chargement...</td></tr>
              )}
              {!loading && filtres.length === 0 && (
                <tr><td colSpan={6} className="text-center py-8 text-muted-foreground">Aucun paiement</td></tr>
              )}
              {filtres.map(p => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs text-primary">{p.reference}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(p.date)}</td>
                  <td className="px-4 py-3 text-xs">{p.factureNumero || '—'}</td>
                  <td className="px-4 py-3">{p.clientNom || '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${modeColors[p.mode] || 'bg-muted text-muted-foreground'}`}>
                      {p.mode}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">{formatMontant(p.montant)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">Nouveau paiement</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Facture liée</label>
                <select value={form.factureId} onChange={e => {
                  const f = factures.find(f => f.id === parseInt(e.target.value))
                  setForm(prev => ({
                    ...prev, factureId: e.target.value,
                    montant: f ? String((f.total - (f.montantPaye || 0)).toFixed(2)) : prev.montant,
                  }))
                }}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                  <option value="">— Paiement libre —</option>
                  {factures.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.numero} — {f.clientNom} — Reste: {formatMontant(f.total - (f.montantPaye || 0))}
                    </option>
                  ))}
                </select>
                {selectedFacture && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Total: {formatMontant(selectedFacture.total)} | Payé: {formatMontant(selectedFacture.montantPaye || 0)}
                  </p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Montant (DH)</label>
                  <input type="number" step="0.01" value={form.montant} onChange={e => setForm(p => ({ ...p, montant: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Date</label>
                  <input type="date" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Mode de paiement</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['especes', 'cheque', 'carte', 'virement'] as const).map(m => (
                    <button key={m} type="button" onClick={() => setForm(p => ({ ...p, mode: m }))}
                      className={`py-2 rounded-lg text-xs font-medium capitalize ${form.mode === m ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-border rounded-lg text-sm">Annuler</button>
                <button onClick={sauvegarder} disabled={!form.montant || loading}
                  className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-60">
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
