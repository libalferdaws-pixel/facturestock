'use client'
import { useState, useEffect } from 'react'
import { Save, Building, Phone, Globe, Upload, Database, AlertCircle, CheckCircle } from 'lucide-react'

interface Parametres {
  id?: number; nomSociete: string; adresse?: string; ville?: string; codePostal?: string;
  telephone?: string; fax?: string; email?: string; siteWeb?: string;
  ice?: string; rc?: string; tp?: string; if?: string; cnss?: string;
  devise: string; tvaDefaut: number; logoPath?: string;
  factureFooter?: string; devisFooter?: string;
  rib?: string; banque?: string;
}

export default function ParametresPage() {
  const [params, setParams] = useState<Parametres>({
    nomSociete: '', devise: 'MAD', tvaDefaut: 20,
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [backupLoading, setBackupLoading] = useState(false)
  const [backupMsg, setBackupMsg] = useState('')
  const [activeTab, setActiveTab] = useState<'societe' | 'fiscal' | 'facturation' | 'sauvegarde'>('societe')

  useEffect(() => {
    fetch('/api/parametres').then(r => r.json()).then(r => {
      if (r.success && r.data) setParams(r.data)
      setLoading(false)
    })
  }, [])

  function set(key: keyof Parametres, val: string | number) {
    setParams(p => ({ ...p, [key]: val }))
  }

  async function sauvegarder() {
    setSaving(true)
    const res = await fetch('/api/parametres', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    const r = await res.json()
    setMessage(r.success ? '✓ Paramètres sauvegardés avec succès' : '✗ Erreur : ' + r.error)
    setTimeout(() => setMessage(''), 4000)
    setSaving(false)
  }

  async function faireBackup() {
    setBackupLoading(true)
    const res = await fetch('/api/backup', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
    const r = await res.json()
    setBackupMsg(r.success ? `✓ Sauvegarde créée : ${r.data.path}` : '✗ ' + r.error)
    setTimeout(() => setBackupMsg(''), 8000)
    setBackupLoading(false)
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  )

  const tabs = [
    { key: 'societe', label: 'Société' },
    { key: 'fiscal', label: 'Infos fiscales' },
    { key: 'facturation', label: 'Facturation' },
    { key: 'sauvegarde', label: 'Sauvegarde' },
  ] as const

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Paramètres</h1>
          <p className="text-muted-foreground text-sm mt-1">Configuration de votre entreprise</p>
        </div>
        {activeTab !== 'sauvegarde' && (
          <button onClick={sauvegarder} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90 disabled:opacity-60">
            <Save className="w-4 h-4" /> {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        )}
      </div>

      {message && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm mb-4 ${message.startsWith('✓') ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {message.startsWith('✓') ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {message}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-border mb-6 gap-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)}
            className={`px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors ${activeTab === t.key ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}>
            {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'societe' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Nom de la société *" value={params.nomSociete} onChange={v => set('nomSociete', v)} required />
            <Field label="Téléphone" value={params.telephone} onChange={v => set('telephone', v)} />
          </div>
          <Field label="Adresse" value={params.adresse} onChange={v => set('adresse', v)} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Ville" value={params.ville} onChange={v => set('ville', v)} />
            <Field label="Code postal" value={params.codePostal} onChange={v => set('codePostal', v)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Email" type="email" value={params.email} onChange={v => set('email', v)} />
            <Field label="Site web" value={params.siteWeb} onChange={v => set('siteWeb', v)} placeholder="https://..." />
          </div>
          <Field label="Fax" value={params.fax} onChange={v => set('fax', v)} />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Devise</label>
              <select value={params.devise} onChange={e => set('devise', e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                <option value="MAD">MAD (Dirham Marocain)</option>
                <option value="EUR">EUR (Euro)</option>
                <option value="USD">USD (Dollar)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">TVA par défaut (%)</label>
              <select value={params.tvaDefaut} onChange={e => set('tvaDefaut', Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                {[0, 7, 10, 14, 20].map(t => <option key={t} value={t}>{t}%</option>)}
              </select>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'fiscal' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="ICE" value={params.ice} onChange={v => set('ice', v)} placeholder="Identifiant Commun de l'Entreprise" />
            <Field label="RC" value={params.rc} onChange={v => set('rc', v)} placeholder="Registre du Commerce" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="TP (Taxe Professionnelle)" value={params.tp} onChange={v => set('tp', v)} />
            <Field label="IF (Identifiant Fiscal)" value={params['if']} onChange={v => set('if', v)} />
          </div>
          <Field label="CNSS" value={params.cnss} onChange={v => set('cnss', v)} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="RIB bancaire" value={params.rib} onChange={v => set('rib', v)} />
            <Field label="Banque" value={params.banque} onChange={v => set('banque', v)} />
          </div>
        </div>
      )}

      {activeTab === 'facturation' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">Pied de page — Factures</label>
            <textarea value={params.factureFooter || ''} onChange={e => set('factureFooter', e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background resize-none"
              placeholder="Texte affiché en bas des factures..." />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Pied de page — Devis</label>
            <textarea value={params.devisFooter || ''} onChange={e => set('devisFooter', e.target.value)} rows={3}
              className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background resize-none"
              placeholder="Texte affiché en bas des devis..." />
          </div>
          <div className="bg-muted/40 rounded-xl p-4 text-sm text-muted-foreground">
            <p className="font-medium text-foreground mb-2 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-primary" /> Informations affichées sur les documents
            </p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Nom société, adresse, ville — en-tête</li>
              <li>ICE, RC, TP, IF — informations légales</li>
              <li>RIB, Banque — règlement</li>
              <li>Pied de page personnalisé</li>
            </ul>
          </div>
        </div>
      )}

      {activeTab === 'sauvegarde' && (
        <div className="space-y-4">
          <div className="bg-background rounded-xl border border-border p-5">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <Database className="w-5 h-5 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Sauvegarde de la base de données</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Crée une copie du fichier SQLite dans le même dossier que la base principale.
                  Nommé <code className="bg-muted px-1 rounded">backup-DATE.db</code>.
                </p>
                {backupMsg && (
                  <p className={`mt-2 text-sm ${backupMsg.startsWith('✓') ? 'text-green-600' : 'text-red-600'}`}>{backupMsg}</p>
                )}
                <button onClick={faireBackup} disabled={backupLoading}
                  className="mt-3 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold disabled:opacity-60">
                  <Database className="w-4 h-4" /> {backupLoading ? 'En cours...' : 'Lancer la sauvegarde'}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
            <p className="font-medium mb-1">💡 Conseil</p>
            <p>Sous Windows avec Electron, la base de données se trouve dans :</p>
            <code className="block mt-1 text-xs bg-yellow-100 px-2 py-1 rounded">%APPDATA%\FactureStock\facturestock.db</code>
          </div>
        </div>
      )}
    </div>
  )
}

function Field({ label, value, onChange, type = 'text', required, placeholder }: {
  label: string; value?: string | null; onChange: (v: string) => void;
  type?: string; required?: boolean; placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium mb-1.5">{label}</label>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
        required={required} placeholder={placeholder}
        className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none" />
    </div>
  )
}
