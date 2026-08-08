'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Save, ArrowLeft } from 'lucide-react'

interface Field {
  key: string
  label: string
  labelAr: string
  type?: string
  required?: boolean
  placeholder?: string
}

interface EntityFormProps {
  fields: Field[]
  defaultValues?: Record<string, string>
  onSubmit: (data: Record<string, string>) => Promise<void>
  isEdit?: boolean
}

export function EntityForm({ fields, defaultValues = {}, onSubmit, isEdit }: EntityFormProps) {
  const router = useRouter()
  const [values, setValues] = useState<Record<string, string>>(() => {
    const init: Record<string, string> = {}
    for (const f of fields) init[f.key] = defaultValues[f.key] ?? ''
    return init
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      await onSubmit(values)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map(f => (
          <div key={f.key} className={f.key === 'adresse' || f.key === 'notes' ? 'md:col-span-2' : ''}>
            <label className="block text-sm font-medium mb-1.5">
              {f.label}
              <span className="text-muted-foreground ml-2 text-xs" dir="rtl">{f.labelAr}</span>
            </label>
            {f.key === 'adresse' || f.key === 'notes' ? (
              <textarea
                value={values[f.key]}
                onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                required={f.required}
                placeholder={f.placeholder}
                rows={2}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            ) : (
              <input
                type={f.type || 'text'}
                value={values[f.key]}
                onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                required={f.required}
                placeholder={f.placeholder}
                className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-ring"
              />
            )}
          </div>
        ))}
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex gap-3 pt-2">
        <button type="button" onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Retour
        </button>
        <button type="submit" disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-60">
          <Save className="w-4 h-4" />
          {loading ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Enregistrer'}
        </button>
      </div>
    </form>
  )
}
