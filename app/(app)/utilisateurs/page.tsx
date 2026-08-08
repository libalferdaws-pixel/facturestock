'use client'
import { useState, useEffect } from 'react'
import { Plus, X, Edit2, Trash2, Shield, User, Eye, EyeOff } from 'lucide-react'

interface Utilisateur {
  id: number; nom: string; email: string; role: string; actif: number; createdAt: string
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-100 text-red-700',
  manager: 'bg-blue-100 text-blue-700',
  vendeur: 'bg-green-100 text-green-700',
  comptable: 'bg-purple-100 text-purple-700',
}

const roleLabels: Record<string, string> = {
  admin: 'Administrateur', manager: 'Manager', vendeur: 'Vendeur', comptable: 'Comptable',
}

export default function UtilisateursPage() {
  const [users, setUsers] = useState<Utilisateur[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editUser, setEditUser] = useState<Utilisateur | null>(null)
  const [loading, setLoading] = useState(true)
  const [showPwd, setShowPwd] = useState(false)
  const [form, setForm] = useState({ nom: '', email: '', role: 'vendeur', motDePasse: '', actif: true })

  async function fetchUsers() {
    const r = await fetch('/api/utilisateurs').then(r => r.json())
    if (r.success) setUsers(r.data)
    setLoading(false)
  }
  useEffect(() => { fetchUsers() }, [])

  function ouvrirModal(u?: Utilisateur) {
    if (u) {
      setEditUser(u)
      setForm({ nom: u.nom, email: u.email, role: u.role, motDePasse: '', actif: u.actif === 1 })
    } else {
      setEditUser(null)
      setForm({ nom: '', email: '', role: 'vendeur', motDePasse: '', actif: true })
    }
    setShowModal(true)
  }

  async function sauvegarder() {
    setLoading(true)
    const payload = { ...form }
    let res
    if (editUser) {
      res = await fetch(`/api/utilisateurs/${editUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    } else {
      res = await fetch('/api/utilisateurs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
    }
    const r = await res.json()
    if (r.success) {
      setShowModal(false)
      fetchUsers()
    } else alert(r.error)
    setLoading(false)
  }

  async function supprimer(id: number) {
    if (!confirm('Supprimer cet utilisateur ?')) return
    await fetch(`/api/utilisateurs/${id}`, { method: 'DELETE' })
    fetchUsers()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Utilisateurs</h1>
          <p className="text-muted-foreground text-sm mt-1">Gérez les accès et les rôles</p>
        </div>
        <button onClick={() => ouvrirModal()}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg text-sm font-semibold hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Nouvel utilisateur
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading && <p className="text-muted-foreground col-span-full text-center py-8">Chargement...</p>}
        {users.map(u => (
          <div key={u.id} className="bg-background rounded-xl border border-border p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-primary font-bold text-lg">{u.nom.charAt(0).toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => ouvrirModal(u)} className="p-1.5 text-muted-foreground hover:text-foreground rounded">
                  <Edit2 className="w-4 h-4" />
                </button>
                {u.role !== 'admin' && (
                  <button onClick={() => supprimer(u.id)} className="p-1.5 text-muted-foreground hover:text-red-500 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            <p className="font-semibold text-foreground">{u.nom}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{u.email}</p>
            <div className="flex items-center gap-2 mt-3">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${roleColors[u.role] || 'bg-muted text-muted-foreground'}`}>
                {roleLabels[u.role] || u.role}
              </span>
              <span className={`px-2 py-0.5 rounded-full text-xs ${u.actif ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                {u.actif ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-background rounded-2xl shadow-xl w-full max-w-md border border-border">
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">
                {editUser ? 'Modifier utilisateur' : 'Nouvel utilisateur'}
              </h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-muted-foreground" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Nom complet</label>
                <input value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Email</label>
                <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Mot de passe {editUser && '(laisser vide = inchangé)'}</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} value={form.motDePasse}
                    onChange={e => setForm(p => ({ ...p, motDePasse: e.target.value }))}
                    className="w-full px-3 py-2 pr-10 border border-border rounded-lg text-sm bg-background" />
                  <button type="button" onClick={() => setShowPwd(!showPwd)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Rôle</label>
                <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background">
                  <option value="admin">Administrateur</option>
                  <option value="manager">Manager</option>
                  <option value="vendeur">Vendeur</option>
                  <option value="comptable">Comptable</option>
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.actif} onChange={e => setForm(p => ({ ...p, actif: e.target.checked }))}
                  className="w-4 h-4 rounded" />
                <span className="text-sm">Utilisateur actif</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowModal(false)} className="flex-1 py-2 border border-border rounded-lg text-sm">Annuler</button>
                <button onClick={sauvegarder} disabled={!form.nom || !form.email || loading}
                  className="flex-1 py-2 bg-primary text-white rounded-lg text-sm font-semibold disabled:opacity-60">
                  {editUser ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
