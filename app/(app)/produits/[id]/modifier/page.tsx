'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { Save, ArrowLeft } from 'lucide-react'

interface ProduitForm {
  reference: string; designation: string; codeBarres: string; categorie: string
  unite: string; prixAchat: string; prixVente: string; tva: string
  stockActuel: string; stockMinimum: string
}

export default function ModifierProduitPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState<ProduitForm | null>(null)

  useEffect(() => {
    fetch('/api/produits').then(r => r.json()).then(r => {
      const found = r.data?.find((p: { id: number }) => p.id === Number(id))
      if (found) setForm({
        reference: found.reference || '',
        designation: found.designation || '',
        codeBarres: found.codeBarres || '',
        categorie: found.categorie || '',
        unite: found.unite || 'pcs',
        prixAchat: String(found.prixAchat || 0),
        prixVente: String(found.prixVente || 0),
        tva: String(found.tva || 20),
        stockActuel: String(found.stockActuel || 0),
        stockMinimum: String(found.stockMinimum || 0),
      })
    })
  }, [id])

  function set(key: string, value: string) {
    setForm(prev => prev ? { ...prev, [key]: value } : null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    setLoading(true)
    try {
      const res = await fetch(`/api/produits/${id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          prixAchat: Number(form.prixAchat),
          prixVente: Number(form.prixVente),
          tva: Number(form.tva),
          stockActuel: Number(form.stockActuel),
          stockMinimum: Number(form.stockMinimum),
        }),
      })
      const r = await res.json()
      if (r.success) router.push('/produits')
      else alert(r.error)
    } finally { setLoading(false) }
  }

  if (!form) return <div className="p-8 flex justify-center"><div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Modifier produit</h1>
        <p className="text-muted-foreground text-sm">{form.designation}</p>
      </div>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'reference', label: 'Référence', labelAr: 'المرجع', required: true },
            { key: 'designation', label: 'Désignation', labelAr: 'الوصف', required: true },
            { key: 'codeBarres', label: 'Code-barres', labelAr: 'الباركود' },
            { key: 'categorie', label: 'Catégorie', labelAr: 'الفئة' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1.5">
                {f.label} <span className="text-muted-foreground text-xs" dir="rtl">{f.labelAr}</span>
              </label>
              <input value={form[f.key as keyof ProduitForm]}
                onChange={e => set(f.key, e.target.value)}
                required={f.required}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium mb-1.5">Unité</label>
            <select value={form.unite} onChange={e => set('unite', e.target.value)}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="pcs">Pièce (pcs)</option>
              <option value="kg">Kilogramme (kg)</option>
              <option value="m">Mètre (m)</option>
              <option value="L">Litre (L)</option>
              <option value="boite">Boîte</option>
              <option value="carton">Carton</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">TVA (%)</label>
            <select value={form.tva} onChange={e => set('tva', e.target.value)}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="0">0%</option>
              <option value="7">7%</option>
              <option value="10">10%</option>
              <option value="14">14%</option>
              <option value="20">20%</option>
            </select>
          </div>
          {(['prixAchat', 'prixVente', 'stockActuel', 'stockMinimum'] as const).map(k => (
            <div key={k}>
              <label className="block text-sm font-medium mb-1.5">
                {k === 'prixAchat' ? "Prix d'achat HT" : k === 'prixVente' ? 'Prix de vente HT' : k === 'stockActuel' ? 'Stock actuel' : 'Stock minimum'}
              </label>
              <input type="number" min="0" step="0.01" value={form[k]} onChange={e => set(k, e.target.value)}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          ))}
        </div>
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
            <ArrowLeft className="w-4 h-4" /> Retour
          </button>
          <button type="submit" disabled={loading}
            className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 disabled:opacity-60">
            <Save className="w-4 h-4" />
            {loading ? 'Enregistrement...' : 'Mettre à jour'}
          </button>
        </div>
      </form>
    </div>
  )
}
