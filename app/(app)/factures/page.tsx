'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Eye, Trash2, FileText } from 'lucide-react'
import { formatMontant, formatDate } from '@/lib/format'

interface Facture {
  id: number; numero: string; clientNom: string; date: string
  echeance: string | null; statut: string; total: number
}

const statutColor: Record<string, string> = {
  brouillon: 'bg-slate-100 text-slate-600',
  envoyee: 'bg-blue-100 text-blue-700',
  payee: 'bg-green-100 text-green-700',
  annulee: 'bg-red-100 text-red-700',
}

export default function FacturesPage() {
  const [list, setList] = useState<Facture[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const load = (search = '') => {
    setLoading(true)
    fetch(`/api/factures?q=${encodeURIComponent(search)}`)
      .then(r => r.json()).then(r => { if (r.success) setList(r.data) }).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function del(id: number) {
    if (!confirm('Supprimer cette facture ?')) return
    await fetch(`/api/factures/${id}`, { method: 'DELETE' })
    setList(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Factures</h1>
          <p className="text-muted-foreground text-sm" dir="rtl">الفواتير</p>
        </div>
        <Link href="/factures/nouvelle"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Nouvelle facture
        </Link>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={q} onChange={e => { setQ(e.target.value); load(e.target.value) }}
            placeholder="Chercher facture..."
            className="w-full pl-9 pr-3 py-2 border border-input rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center">
            <FileText className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">Aucune facture</p>
            <Link href="/factures/nouvelle" className="text-primary hover:underline text-sm mt-1 block">Créer une facture</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Numéro</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-left">Échéance</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map(f => (
                <tr key={f.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-primary">{f.numero}</td>
                  <td className="px-4 py-3">{f.clientNom}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(f.date)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{f.echeance ? formatDate(f.echeance) : '—'}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatMontant(f.total)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statutColor[f.statut] || 'bg-slate-100 text-slate-600'}`}>
                      {f.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Link href={`/factures/${f.id}`} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button onClick={() => del(f.id)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-destructive">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
