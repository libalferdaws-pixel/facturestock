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

export default function ModifierClientPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const router = useRouter()
  const [client, setClient] = useState<Record<string, string> | null>(null)

  useEffect(() => {
    fetch(`/api/clients/${id}`).then(r => r.json()).then(r => {
      if (r.success) setClient(r.data)
    })
  }, [id])

  async function handleSubmit(data: Record<string, string>) {
    const res = await fetch(`/api/clients/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    const r = await res.json()
    if (r.success) router.push('/clients')
    else throw new Error(r.error)
  }

  if (!client) return <div className="p-8 flex justify-center"><div className="w-6 h-6 border-4 border-primary border-t-transparent rounded-full animate-spin" /></div>

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Modifier client</h1>
        <p className="text-muted-foreground text-sm">{client.nom}</p>
      </div>
      <EntityForm fields={fields} defaultValues={client} onSubmit={handleSubmit} isEdit />
    </div>
  )
}
