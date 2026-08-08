'use client'
import { useState, useEffect, useRef } from 'react'
import { Search, Plus, Minus, Trash2, CreditCard, Banknote, Printer, ShoppingCart, X, RotateCcw } from 'lucide-react'
import { formatMontant } from '@/lib/format'

interface Produit {
  id: number; reference: string; designation: string; prixVente: number;
  tva: number; stockActuel: number; codeBarres?: string; unite: string;
}
interface LignePanier { produit: Produit; qte: number; prixUnitaire: number }

export default function CaissePage() {
  const [recherche, setRecherche] = useState('')
  const [produits, setProduits] = useState<Produit[]>([])
  const [filtres, setFiltres] = useState<Produit[]>([])
  const [panier, setPanier] = useState<LignePanier[]>([])
  const [remise, setRemise] = useState(0)
  const [showPaiement, setShowPaiement] = useState(false)
  const [modePaiement, setModePaiement] = useState<'especes' | 'cheque' | 'virement' | 'carte'>('especes')
  const [montantRecu, setMontantRecu] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastTicket, setLastTicket] = useState<Record<string, unknown> | null>(null)
  const [message, setMessage] = useState('')
  const searchRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetch('/api/produits?limit=500').then(r => r.json()).then(r => {
      if (r.success) setProduits(r.data)
    })
    searchRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!recherche) { setFiltres([]); return }
    const q = recherche.toLowerCase()
    setFiltres(produits.filter(p =>
      p.designation.toLowerCase().includes(q) ||
      p.reference.toLowerCase().includes(q) ||
      (p.codeBarres && p.codeBarres.includes(q))
    ).slice(0, 8))
  }, [recherche, produits])

  function ajouterAuPanier(p: Produit) {
    setPanier(prev => {
      const idx = prev.findIndex(l => l.produit.id === p.id)
      if (idx >= 0) {
        const next = [...prev]
        next[idx] = { ...next[idx], qte: next[idx].qte + 1 }
        return next
      }
      return [...prev, { produit: p, qte: 1, prixUnitaire: p.prixVente }]
    })
    setRecherche('')
    setFiltres([])
    searchRef.current?.focus()
  }

  function modifierQte(id: number, delta: number) {
    setPanier(prev => prev.map(l => l.produit.id === id
      ? { ...l, qte: Math.max(1, l.qte + delta) } : l))
  }

  function supprimerLigne(id: number) {
    setPanier(prev => prev.filter(l => l.produit.id !== id))
  }

  function modifierPrix(id: number, prix: string) {
    setPanier(prev => prev.map(l => l.produit.id === id
      ? { ...l, prixUnitaire: parseFloat(prix) || 0 } : l))
  }

  const sousTotal = panier.reduce((s, l) => s + l.qte * l.prixUnitaire, 0)
  const totalTva = panier.reduce((s, l) => s + l.qte * l.prixUnitaire * (l.produit.tva / 100), 0)
  const totalTTC = sousTotal + totalTva - remise
  const rendu = parseFloat(montantRecu || '0') - totalTTC

  async function validerVente() {
    if (panier.length === 0) return
    setLoading(true)
    try {
      const clientNom = 'Client Comptoir'
      const items = panier.map(l => ({
        produitId: l.produit.id, produitRef: l.produit.reference,
        designation: l.produit.designation, qte: l.qte,
        prixUnitaire: l.prixUnitaire, tva: l.produit.tva,
        total: l.qte * l.prixUnitaire * (1 + l.produit.tva / 100),
      }))
      const res = await fetch('/api/caisse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'entree', description: 'Vente caisse', clientNom,
          items, remise, modePaiement, montantRecu: parseFloat(montantRecu || '0'),
          sousTotal, totalTva, total: totalTTC,
        }),
      })
      const r = await res.json()
      if (r.success) {
        setLastTicket(r.data)
        setPanier([])
        setRemise(0)
        setMontantRecu('')
        setShowPaiement(false)
        setMessage(`Vente enregistrée — Ticket ${r.data.numero}`)
        setTimeout(() => setMessage(''), 4000)
      } else {
        setMessage('Erreur : ' + r.error)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-full bg-muted/30">
      {/* Colonne gauche : recherche + produits récents */}
      <div className="flex flex-col w-full md:w-1/2 lg:w-3/5 p-4 gap-3 border-r border-border">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              ref={searchRef}
              value={recherche} onChange={e => setRecherche(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
              placeholder="Rechercher produit, référence ou code-barres..."
            />
            {filtres.length > 0 && (
              <div className="absolute top-full mt-1 left-0 right-0 bg-popover border border-border rounded-lg shadow-lg z-20 overflow-hidden">
                {filtres.map(p => (
                  <button key={p.id} onClick={() => ajouterAuPanier(p)}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-muted text-sm text-left gap-2">
                    <div>
                      <span className="font-medium text-foreground">{p.designation}</span>
                      <span className="text-muted-foreground ml-2 text-xs">{p.reference}</span>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <span className="text-primary font-semibold">{formatMontant(p.prixVente)}</span>
                      <span className="text-muted-foreground text-xs ml-2">Stock: {p.stockActuel}</span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Raccourcis produits populaires */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto max-h-[calc(100vh-220px)]">
          {produits.slice(0, 24).map(p => (
            <button key={p.id} onClick={() => ajouterAuPanier(p)}
              className="bg-background border border-border rounded-lg p-2.5 text-left hover:border-primary hover:shadow-sm transition-all">
              <p className="text-xs font-semibold text-foreground line-clamp-2 leading-tight">{p.designation}</p>
              <p className="text-xs text-muted-foreground mt-1">{p.reference}</p>
              <div className="flex items-center justify-between mt-2">
                <p className="text-sm font-bold text-primary">{formatMontant(p.prixVente)}</p>
                <span className={`text-xs px-1.5 rounded ${p.stockActuel > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                  {p.stockActuel} {p.unite}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Colonne droite : panier */}
      <div className="hidden md:flex flex-col w-1/2 lg:w-2/5 bg-background">
        {/* Header panier */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <span className="font-semibold text-foreground">Panier</span>
            {panier.length > 0 && (
              <span className="bg-primary text-white text-xs rounded-full px-1.5 py-0.5">{panier.length}</span>
            )}
          </div>
          {panier.length > 0 && (
            <button onClick={() => setPanier([])} className="text-muted-foreground hover:text-red-500 transition-colors" title="Vider">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {message && (
          <div className="mx-3 mt-2 px-3 py-2 bg-green-50 border border-green-200 text-green-700 rounded-lg text-sm">
            {message}
          </div>
        )}

        {/* Lignes panier */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {panier.length === 0 && (
            <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
              <ShoppingCart className="w-12 h-12 opacity-20 mb-2" />
              <p className="text-sm">Panier vide</p>
            </div>
          )}
          {panier.map(l => (
            <div key={l.produit.id} className="bg-muted/40 rounded-lg p-2.5">
              <div className="flex items-start justify-between gap-2 mb-2">
                <p className="text-sm font-medium text-foreground leading-tight flex-1">{l.produit.designation}</p>
                <button onClick={() => supprimerLigne(l.produit.id)} className="text-muted-foreground hover:text-red-500 flex-shrink-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-background rounded-md border border-border">
                  <button onClick={() => modifierQte(l.produit.id, -1)} className="p-1 hover:bg-muted"><Minus className="w-3 h-3" /></button>
                  <span className="text-sm font-semibold w-6 text-center">{l.qte}</span>
                  <button onClick={() => modifierQte(l.produit.id, 1)} className="p-1 hover:bg-muted"><Plus className="w-3 h-3" /></button>
                </div>
                <input
                  type="number" value={l.prixUnitaire} onChange={e => modifierPrix(l.produit.id, e.target.value)}
                  className="w-20 px-2 py-1 text-sm border border-border rounded bg-background text-right"
                />
                <span className="text-xs text-muted-foreground">DH</span>
                <span className="ml-auto font-semibold text-sm text-foreground">
                  {formatMontant(l.qte * l.prixUnitaire * (1 + l.produit.tva / 100))}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Total + paiement */}
        {panier.length > 0 && (
          <div className="border-t border-border p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <label className="text-sm text-muted-foreground">Remise (DH)</label>
              <input type="number" min="0" value={remise} onChange={e => setRemise(Number(e.target.value))}
                className="w-24 ml-auto px-2 py-1 text-sm border border-border rounded text-right bg-background" />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Sous-total HT</span><span>{formatMontant(sousTotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>TVA</span><span>{formatMontant(totalTva)}</span>
            </div>
            {remise > 0 && (
              <div className="flex justify-between text-sm text-red-600">
                <span>Remise</span><span>-{formatMontant(remise)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-foreground border-t border-border pt-2">
              <span>Total TTC</span><span className="text-primary">{formatMontant(totalTTC)}</span>
            </div>

            {!showPaiement ? (
              <button onClick={() => setShowPaiement(true)}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-white font-bold rounded-lg text-sm transition-colors">
                Encaisser
              </button>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-4 gap-1.5">
                  {(['especes', 'cheque', 'carte', 'virement'] as const).map(m => (
                    <button key={m} onClick={() => setModePaiement(m)}
                      className={`py-2 rounded text-xs font-medium capitalize transition-colors ${modePaiement === m ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
                      {m === 'especes' ? '💵 Espèces' : m === 'cheque' ? '📄 Chèque' : m === 'carte' ? '💳 Carte' : '🏦 Virement'}
                    </button>
                  ))}
                </div>
                {modePaiement === 'especes' && (
                  <div>
                    <label className="text-xs text-muted-foreground">Montant reçu</label>
                    <input type="number" value={montantRecu} onChange={e => setMontantRecu(e.target.value)}
                      className="w-full mt-1 px-3 py-2 border border-border rounded-lg text-right font-bold text-lg bg-background"
                      placeholder="0.00" />
                    {parseFloat(montantRecu || '0') > 0 && (
                      <p className="text-sm mt-1 text-center font-semibold text-green-600">
                        Rendu : {formatMontant(Math.max(0, rendu))}
                      </p>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={() => setShowPaiement(false)} className="flex-1 py-2 bg-muted text-muted-foreground rounded-lg text-sm">
                    Annuler
                  </button>
                  <button onClick={validerVente} disabled={loading}
                    className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg text-sm disabled:opacity-60">
                    {loading ? '...' : 'Valider ✓'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
