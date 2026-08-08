'use client'
import { useEffect, useState, use } from 'react'
import { DocPrint } from '@/components/facturestock/DocPrint'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { formatDate } from '@/lib/format'

interface BonDetail {
  id: number; numero: string; fournisseurNom: string; date: string; statut: string; notes: string | null
  items: Array<{ designation: string; reference?: string | null; quantite: number; prixUnitaire: number; tva: number; total: number }>
}

export default function BonDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [data, setData] = useState<BonDetail | null>(null)

  useEffect(() => {
    fetch(`/api/bons-livraison/${id}`).then(r => r.json()).then(r => { if (r.success) setData(r.data) })
  }, [id])

  if (!data) return (
    <div className="p-8 flex justify-center"><div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>
  )

  const sousTotal = data.items.reduce((s, i) => s + i.quantite * i.prixUnitaire, 0)

  return (
    <div className="p-6 max-w-4xl">
      <div className="flex items-center gap-3 mb-6 no-print">
        <Link href="/bons-livraison" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="w-4 h-4" /> Retour
        </Link>
      </div>
      <DocPrint
        type="Bon de livraison fournisseur"
        numero={data.numero}
        date={data.date}
        fournisseurNom={data.fournisseurNom}
        items={data.items}
        sousTotal={sousTotal}
        totalTva={0}
        total={sousTotal}
        notes={data.notes}
        statut={data.statut}
      />
    </div>
  )
}
