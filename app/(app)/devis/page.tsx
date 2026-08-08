'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Eye, Trash2, FileCheck } from 'lucide-react'
import { formatMontant, formatDate } from '@/lib/format'

interface Devis { id: number; numero: string; clientNom: string; date: string; statut: string; total: number }

const statutColor: Record<string, string> = {
  en_attente: 'bg-yellow-100 text-yellow-700',
  accepte: 'bg-green-100 text-green-700',
  refuse: 'bg-red-100 text-red-700',
  converti: 'bg-blue-100 text-blue-700',
}

export default function DevisPage() {
  const [list, setList] = useState<Devis[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const load = (search = '') => {
    setLoading(true)
    fetch(`/api/devis?q=${encodeURIComponent(search)}`)
      .then(r => r.json()).then(r => { if (r.success) setList(r.data) }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  async function del(id: number) {
    if (!confirm('Supprimer ce devis ?')) return
    await fetch(`/api/devis/${id}`, { method: 'DELETE' })
    setList(prev => prev.filter(d => d.id !== id))
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Devis</h1>
          <p className="text-muted-foreground text-sm" dir="rtl">عروض الأسعار</p>
        </div>
        <Link href="/devis/nouveau" className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Nouveau devis
        </Link>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={q} onChange={e => { setQ(e.target.value); load(e.target.value) }}
          placeholder="Chercher devis..."
          className="w-full pl-9 pr-3 py-2 border border-input rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center">
            <FileCheck className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">Aucun devis</p>
            <Link href="/devis/nouveau" className="text-primary hover:underline text-sm mt-1 block">Créer un devis</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Numéro</th>
                <th className="px-4 py-3 text-left">Client</th>
                <th className="px-4 py-3 text-left">Date</th>
                <th className="px-4 py-3 text-right">Total</th>
                <th className="px-4 py-3 text-center">Statut</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map(d => (
                <tr key={d.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-mono font-medium text-primary">{d.numero}</td>
                  <td className="px-4 py-3">{d.clientNom}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(d.date)}</td>
                  <td className="px-4 py-3 text-right font-semibold">{formatMontant(d.total)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statutColor[d.statut] || 'bg-slate-100 text-slate-600'}`}>
                      {d.statut}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Link href={`/devis/${d.id}`} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary">
                        <Eye className="w-4 h-4" />
                      </Link>
                      <button onClick={() => del(d.id)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-destructive">
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
