'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Edit2, Trash2, Users } from 'lucide-react'

interface Client { id: number; nom: string; telephone: string | null; email: string | null; ville: string | null; ice: string | null }

export default function ClientsPage() {
  const [list, setList] = useState<Client[]>([])
  const [q, setQ] = useState('')
  const [loading, setLoading] = useState(true)

  const load = (search = '') => {
    setLoading(true)
    fetch(`/api/clients?q=${encodeURIComponent(search)}`)
      .then(r => r.json()).then(r => { if (r.success) setList(r.data) }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  async function del(id: number) {
    if (!confirm('Supprimer ce client ?')) return
    await fetch(`/api/clients/${id}`, { method: 'DELETE' })
    setList(prev => prev.filter(c => c.id !== id))
  }

  return (
    <div className="p-6 space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-muted-foreground text-sm" dir="rtl">الزبائن</p>
        </div>
        <Link href="/clients/nouveau" className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Nouveau client
        </Link>
      </div>

      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input value={q} onChange={e => { setQ(e.target.value); load(e.target.value) }}
          placeholder="Chercher client..."
          className="w-full pl-9 pr-3 py-2 border border-input rounded-lg text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring" />
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center"><div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
        ) : list.length === 0 ? (
          <div className="p-12 text-center">
            <Users className="w-10 h-10 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">Aucun client enregistré</p>
            <Link href="/clients/nouveau" className="text-primary hover:underline text-sm mt-1 block">Ajouter le premier client</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-muted text-muted-foreground text-xs">
              <tr>
                <th className="px-4 py-3 text-left">Nom</th>
                <th className="px-4 py-3 text-left">ICE</th>
                <th className="px-4 py-3 text-left">Téléphone</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Ville</th>
                <th className="px-4 py-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.map(c => (
                <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 font-medium">{c.nom}</td>
                  <td className="px-4 py-3 text-muted-foreground font-mono text-xs">{c.ice || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.telephone || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.email || '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground">{c.ville || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-2">
                      <Link href={`/clients/${c.id}/modifier`} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-primary">
                        <Edit2 className="w-4 h-4" />
                      </Link>
                      <button onClick={() => del(c.id)} className="p-1.5 hover:bg-muted rounded-lg text-muted-foreground hover:text-destructive">
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
