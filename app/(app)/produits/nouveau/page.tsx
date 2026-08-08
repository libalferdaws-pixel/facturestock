'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, ArrowLeft } from 'lucide-react'

export default function NouveauProduitPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    reference: '', designation: '', codeBarres: '', categorie: '',
    unite: 'pcs', prixAchat: '0', prixVente: '0', tva: '20',
    stockActuel: '0', stockMinimum: '0',
  })

  function set(key: string, value: string) {
    setForm(prev => ({ ...prev, [key]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const res = await fetch('/api/produits', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
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

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nouveau produit</h1>
        <p className="text-muted-foreground text-sm" dir="rtl">منتج جديد</p>
      </div>
      <form onSubmit={handleSubmit} className="max-w-2xl space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { key: 'reference', label: 'Référence', labelAr: 'المرجع', required: true, placeholder: 'PROD-001' },
            { key: 'designation', label: 'Désignation', labelAr: 'الوصف', required: true, placeholder: 'Nom du produit' },
            { key: 'codeBarres', label: 'Code-barres', labelAr: 'الباركود', placeholder: '6001234567890' },
            { key: 'categorie', label: 'Catégorie', labelAr: 'الفئة', placeholder: 'Électronique' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1.5">
                {f.label} <span className="text-muted-foreground text-xs" dir="rtl">{f.labelAr}</span>
              </label>
              <input value={form[f.key as keyof typeof form]}
                onChange={e => set(f.key, e.target.value)}
                required={f.required} placeholder={f.placeholder}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring" />
            </div>
          ))}

          <div>
            <label className="block text-sm font-medium mb-1.5">
              Unité <span className="text-muted-foreground text-xs" dir="rtl">الوحدة</span>
            </label>
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
            <label className="block text-sm font-medium mb-1.5">
              TVA (%) <span className="text-muted-foreground text-xs" dir="rtl">ضريبة</span>
            </label>
            <select value={form.tva} onChange={e => set('tva', e.target.value)}
              className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring">
              <option value="0">0%</option>
              <option value="7">7%</option>
              <option value="10">10%</option>
              <option value="14">14%</option>
              <option value="20">20%</option>
            </select>
          </div>

          {[
            { key: 'prixAchat', label: "Prix d'achat HT (DH)", labelAr: 'سعر الشراء' },
            { key: 'prixVente', label: 'Prix de vente HT (DH)', labelAr: 'سعر البيع' },
            { key: 'stockActuel', label: 'Stock actuel', labelAr: 'المخزون الحالي' },
            { key: 'stockMinimum', label: 'Stock minimum', labelAr: 'الحد الأدنى' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-sm font-medium mb-1.5">
                {f.label} <span className="text-muted-foreground text-xs" dir="rtl">{f.labelAr}</span>
              </label>
              <input type="number" min="0" step="0.01"
                value={form[f.key as keyof typeof form]}
                onChange={e => set(f.key, e.target.value)}
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
            {loading ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  )
}
