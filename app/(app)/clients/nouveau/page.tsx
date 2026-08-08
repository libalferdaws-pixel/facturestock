'use client'
import { useRouter } from 'next/navigation'
import { EntityForm } from '@/components/facturestock/EntityForm'

const fields = [
  { key: 'nom', label: 'Nom / Raison sociale', labelAr: 'الاسم', required: true, placeholder: 'Entreprise SARL' },
  { key: 'ice', label: 'ICE', labelAr: 'رقم التعريف الضريبي', placeholder: '000000000000000' },
  { key: 'rc', label: 'RC', labelAr: 'السجل التجاري', placeholder: '12345' },
  { key: 'telephone', label: 'Téléphone', labelAr: 'الهاتف', placeholder: '06 00 00 00 00' },
  { key: 'email', label: 'Email', labelAr: 'البريد الإلكتروني', type: 'email', placeholder: 'contact@exemple.ma' },
  { key: 'ville', label: 'Ville', labelAr: 'المدينة', placeholder: 'Casablanca' },
  { key: 'adresse', label: 'Adresse', labelAr: 'العنوان', placeholder: '123 Rue Mohammed V' },
]

export default function NouveauClientPage() {
  const router = useRouter()

  async function handleSubmit(data: Record<string, string>) {
    const res = await fetch('/api/clients', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data),
    })
    const r = await res.json()
    if (r.success) router.push('/clients')
    else throw new Error(r.error)
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Nouveau client</h1>
        <p className="text-muted-foreground text-sm" dir="rtl">زبون جديد</p>
      </div>
      <EntityForm fields={fields} onSubmit={handleSubmit} />
    </div>
  )
}
