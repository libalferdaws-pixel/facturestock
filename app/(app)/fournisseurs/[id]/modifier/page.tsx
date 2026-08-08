'use client'
import { useEffect, useState, use } from 'react'
import { useRouter } from 'next/navigation'
import { EntityForm } from '@/components/facturestock/EntityForm'

const fields = [
  { key: 'nom', label: 'Nom / Raison sociale', labelAr: 'الاسم', required: true },
  { key: 'ice', label: 'ICE', labelAr: 'رقم التعريف الضريبي' },
  { key: 'rc', label: 'RC', labelAr: 'السجل التجاري' },
  { key: 'telephone', label: 'Téléphone', labelAr: 'الهاتف' },
  { key: 'email', label: 'Email', labelAr: 'البريد الإلكتروني', type: 'email' },
  { key: 'ville', label: 'Ville', labelAr: 'المدينة' },
  { key: 'adresse', label: 'Adresse', labelAr: 'العنوان' },
]

export default function ModifierFournisseurPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [fournisseur, setFournisseur] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    fetch(`/api/fournisseurs/${id}`).then(r => r.json()).then(r => {
      // GET not implemented, use list
      fetch('/api/fournisseurs').then(x => x.json()).then(x => {
        const found = x.data?.find((f: { id: number }) => f.id === Number(id))
        if (found) setFournisseur(found)
      })
    })
  }, [id])

  async function handleSubmit(data: Record<string, string>) {
    const res = await fetch(`/api/fournisseurs/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    const r = await res.json()
    if (r.success) router.push('/fournisseurs')
    else throw new Error(r.error)
  }

  if (!fournisseur) return <div className="p-8 flex justify-center"><div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Modifier fournisseur</h1>
        <p className="text-muted-foreground text-sm">{fournisseur.nom}</p>
      </div>
      <EntityForm fields={fields} defaultValues={fournisseur} onSubmit={handleSubmit} isEdit />
    </div>
  )
}
