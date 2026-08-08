'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit2, Trash2, Package, AlertTriangle } from 'lucide-react'
import { formatMontant } from '@/lib/format'

interface Produit {
  id: number; reference: string; designation: string; codeBarres: string | null
  categorie: string | null; unite: string; prixVente: number; prixAchat: number
  tva: number; stockActuel: number; stockMinimum: number
}

export default function ProduitsPage() {
  const [list, setList] = useState<Produit[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const load = (search = '') => {
    setLoading(true)
    fetch(`/api/produits?q=${encodeURIComponent(search)}`)
      .then(r => r.json()).then(r => { if (r.success) setList(r.data) }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  async function del(id: number) {
    if (!confirm('Supprimer ce produit ?')) return
    await fetch(`/api/produits/${id}`, { method: 'DELETE' })
    setList(prev => prev.filter(p => p.id !== id))
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Produits & Stock</h1>
          <p className="text-muted-foreground text-sm" dir="rtl">المنتجات والمخزون</p>
        </div>
        <Link href="/produits/nouveau" className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Nouveau produit
        </Link>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={q} onChange={e => { setQ(e.target.value); load(e.target.value) }}
          placeholder="Référence, désignation, code-barres..."
          className="w-full pl-9 pr-3 py-2 border border-input rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center">
            <Package className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">Aucun produit</p>
            <Link href="/produits/nouveau" className="text-primary hover:underline text-sm mt-1 block">Ajouter un produit</Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground text-xs">
                <tr>
                  <th className="px-4 py-3 text-left">Référence</th>
                  <th className="px-4 py-3 text-left">Désignation</th>
                  <th className="px-4 py-3 text-left">Code-barres</th>
                  <th className="px-4 py-3 text-right">P. Achat</th>
                  <th className="px-4 py-3 text-right">P. Vente</th>
                  <th className="px-4 py-3 text-right">TVA</th>
                  <th className="px-4 py-3 text-right">Stock</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {list.map(p => (
                  <tr key={p.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs font-medium">{p.reference}</td>
                    <td className="px-4 py-3 font-medium">{p.designation}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.codeBarres || '—'}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{formatMontant(p.prixAchat)}</td>
                    <td className="px-4 py-3 text-right font-medium">{formatMontant(p.prixVente)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{p.tva}%</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {p.stockActuel <= p.stockMinimum && (
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <span className={p.stockActuel <= p.stockMinimum ? 'text-amber-600 font-medium' : ''}>
                          {p.stockActuel} {p.unite}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/produits/${p.id}/modifier`} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary">
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button onClick={() => del(p.id)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
