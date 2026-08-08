'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { DocPrint } from '@/components/facturestock/DocPrint'
import { DocForm } from '@/components/facturestock/DocForm'
import { Edit2, ArrowLeft } from 'lucide-react'
import Link from 'next/link'

interface FactureDetail {
  id: number; numero: string; clientNom: string; clientId: number | null
  date: string; echeance: string | null; statut: string
  sousTotal: number; totalTva: number; total: number; notes: string | null
  items: Array<{ designation: string; reference?: string | null; quantite: number; prixUnitaire: number; tva: number; total: number }>
}

export default function FactureDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [data, setData] = useState<FactureDetail | null>(null)
  const [editing, setEditing] = useState(false)

  useEffect(() => {
    fetch(`/api/factures/${id}`).then(r => r.json()).then(r => { if (r.success) setData(r.data) })
  }, [id])

  async function handleUpdate(body: Record<string, unknown>) {
    const res = await fetch(`/api/factures/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const r = await res.json()
    if (r.success) {
      const full = await fetch(`/api/factures/${id}`).then(x => x.json())
      if (full.success) setData(full.data)
      setEditing(false)
    } else throw new Error(r.error)
  }

  if (!data) return (
    <div className="p-8 flex justify-center"><div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
  )

  if (editing) return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-bold mb-6">Modifier {data.numero}</h1>
      <DocForm type="facture" isEdit defaultData={{
        clientId: data.clientId, clientNom: data.clientNom,
        date: data.date, echeance: data.echeance ?? '', statut: data.statut,
        notes: data.notes ?? '', items: data.items,
      }} onSubmit={handleUpdate} />
    </div>
  )

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6 no-print">
        <Link href="/factures" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
        <button onClick={() => setEditing(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm hover:bg-muted ml-auto">
          <Edit2 className="w-3.5 h-3.5" /> Modifier
        </button>
      </div>
      <DocPrint
        type="Facture"
        numero={data.numero}
        date={data.date}
        clientNom={data.clientNom}
        echeance={data.echeance}
        items={data.items}
        sousTotal={data.sousTotal}
        totalTva={data.totalTva}
        total={data.total}
        notes={data.notes}
        statut={data.statut}
      />
    </div>
  )
}
