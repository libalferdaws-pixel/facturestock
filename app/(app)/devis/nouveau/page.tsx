'use client'
import { useRouter } from 'next/navigation'
import { DocForm } from '@/components/facturestock/DocForm'

export default function NouveauDevisPage() {
  const router = useRouter()

  async function handleSubmit(data: Record<string, unknown>) {
    const res = await fetch('/api/devis', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    const r = await res.json()
    if (r.success) router.push(`/devis/${r.data.id}`)
    else throw new Error(r.error)
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nouveau devis</h1>
        <p className="text-muted-foreground text-sm" dir="rtl">عرض سعر جديد</p>
      </div>
      <DocForm type="devis" onSubmit={handleSubmit} />
    </div>
  )
}
