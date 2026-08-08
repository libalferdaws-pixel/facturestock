'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('admin@facturestock.ma')
  const [motDePasse, setMotDePasse] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, motDePasse }),
      })
      const r = await res.json()
      if (r.success) {
        localStorage.setItem('fs_user', JSON.stringify(r.data.user))
        localStorage.setItem('fs_token', r.data.token)
        router.push('/')
        router.refresh()
      } else {
        setError(r.error || 'Identifiants incorrects')
      }
    } catch {
      setError('Erreur de connexion')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center mb-4 shadow-lg shadow-blue-500/30">
            <span className="text-white font-bold text-3xl">F</span>
          </div>
          <h1 className="text-2xl font-bold text-white">FactureStock</h1>
          <p className="text-slate-400 text-sm mt-1">Gestion commerciale — Maroc</p>
        </div>

        {/* Form */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-6 border border-white/10 shadow-xl">
          <h2 className="text-white font-semibold text-lg mb-5 text-center">Connexion</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Email</label>
              <input
                type="email" value={email} onChange={e => setEmail(e.target.value)}
                required autoFocus
                className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                placeholder="email@exemple.ma"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Mot de passe</label>
              <input
                type="password" value={motDePasse} onChange={e => setMotDePasse(e.target.value)}
                required
                className="w-full px-3 py-2.5 rounded-lg bg-white/10 border border-white/20 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                placeholder="••••••••"
              />
            </div>
            {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}
            <button
              type="submit" disabled={loading}
              className="w-full py-2.5 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg text-sm transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>
          <p className="text-slate-500 text-xs text-center mt-4">
            Par défaut : admin@facturestock.ma / admin123
          </p>
        </div>
      </div>
    </div>
  )
}
