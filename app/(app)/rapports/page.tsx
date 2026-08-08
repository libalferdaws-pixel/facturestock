'use client'
import { useState, useEffect } from 'react'
import {
  TrendingUp, ShoppingBag, Package, Users, AlertTriangle,
  Download, RefreshCw, Calendar, DollarSign
} from 'lucide-react'
import { formatMontant, formatDate } from '@/lib/format'

interface RapportData {
  caJour: number; caMois: number; caAnnee: number;
  achatsMois: number; stockValeur: number; stockAlertes: number;
  caisseSolde: number; facturesImpayees: number;
  topProduits: Array<{ designation: string; totalQte: number; totalCA: number }>
  topClients: Array<{ clientNom: string; totalCA: number; nbFactures: number }>
  evolutionCA: Array<{ mois: string; ca: number; achats: number }>
}

function Stat({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub?: string; color: string
}) {
  return (
    <div className="bg-background rounded-xl border border-border p-5">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
      {sub && <p className="text-xs text-muted-foreground mt-0.5 opacity-70">{sub}</p>}
    </div>
  )
}

function MiniBar({ data }: { data: Array<{ mois: string; ca: number; achats: number }> }) {
  if (!data || data.length === 0) return null
  const maxVal = Math.max(...data.map(d => Math.max(d.ca, d.achats)), 1)
  return (
    <div className="flex items-end gap-1.5 h-24">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex items-end gap-0.5">
          <div className="w-1/2 bg-primary rounded-t" title={`CA: ${formatMontant(d.ca)}`}
            style={{ height: `${(d.ca / maxVal) * 100}%`, minHeight: d.ca > 0 ? 2 : 0 }} />
          <div className="w-1/2 bg-orange-400 rounded-t opacity-70" title={`Achats: ${formatMontant(d.achats)}`}
            style={{ height: `${(d.achats / maxVal) * 100}%`, minHeight: d.achats > 0 ? 2 : 0 }} />
        </div>
      ))}
    </div>
  )
}

export default function RapportsPage() {
  const [data, setData] = useState<RapportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [periode, setPeriode] = useState('mois')

  async function fetchRapport() {
    setLoading(true)
    const r = await fetch(`/api/rapports?periode=${periode}`).then(r => r.json())
    if (r.success) setData(r.data)
    setLoading(false)
  }

  useEffect(() => { fetchRapport() }, [periode])

  async function exporterExcel(type: string) {
    const a = document.createElement('a')
    a.href = `/api/export?type=${type}`
    a.download = `${type}.xlsx`
    a.click()
  }

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  )

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rapports & Statistiques</h1>
          <p className="text-muted-foreground text-sm mt-1">Vue d'ensemble de votre activité commerciale</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-muted rounded-lg p-1">
            {['jour', 'mois', 'annee'].map(p => (
              <button key={p} onClick={() => setPeriode(p)}
                className={`px-3 py-1 rounded text-sm font-medium capitalize transition-colors ${periode === p ? 'bg-background text-foreground shadow' : 'text-muted-foreground hover:text-foreground'}`}>
                {p === 'jour' ? "Aujourd'hui" : p === 'mois' ? 'Ce mois' : 'Cette année'}
              </button>
            ))}
          </div>
          <button onClick={fetchRapport} className="p-2 rounded-lg border border-border hover:bg-muted">
            <RefreshCw className="w-4 h-4 text-muted-foreground" />
          </button>
        </div>
      </div>

      {/* KPIs */}
      {data && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat icon={TrendingUp} label="Chiffre d'affaires aujourd'hui" value={formatMontant(data.caJour)}
              sub={`Mois: ${formatMontant(data.caMois)}`} color="bg-blue-100 text-blue-600" />
            <Stat icon={ShoppingBag} label="Achats ce mois" value={formatMontant(data.achatsMois)}
              color="bg-orange-100 text-orange-600" />
            <Stat icon={Package} label="Valeur du stock" value={formatMontant(data.stockValeur)}
              sub={data.stockAlertes > 0 ? `⚠️ ${data.stockAlertes} alertes stock` : 'Stock OK'}
              color={data.stockAlertes > 0 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'} />
            <Stat icon={DollarSign} label="Factures impayées" value={formatMontant(data.facturesImpayees)}
              color="bg-yellow-100 text-yellow-700" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Évolution CA */}
            <div className="bg-background rounded-xl border border-border p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-foreground">Évolution CA (6 derniers mois)</h2>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1"><span className="w-3 h-1.5 bg-primary rounded inline-block" />CA ventes</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-1.5 bg-orange-400 rounded inline-block" />Achats</span>
                </div>
              </div>
              <MiniBar data={data.evolutionCA} />
              <div className="flex justify-between mt-2">
                {data.evolutionCA.map((d, i) => (
                  <span key={i} className="text-[10px] text-muted-foreground text-center flex-1">{d.mois}</span>
                ))}
              </div>
            </div>

            {/* Top clients */}
            <div className="bg-background rounded-xl border border-border p-5">
              <h2 className="font-semibold text-foreground mb-4">Top clients</h2>
              <div className="space-y-2">
                {(data.topClients || []).slice(0, 5).map((c, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-muted-foreground w-4">{i + 1}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{c.clientNom}</p>
                      <p className="text-xs text-muted-foreground">{c.nbFactures} factures</p>
                    </div>
                    <span className="font-semibold text-sm text-primary">{formatMontant(c.totalCA)}</span>
                  </div>
                ))}
                {(data.topClients || []).length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">Aucune donnée</p>
                )}
              </div>
            </div>
          </div>

          {/* Top produits */}
          <div className="bg-background rounded-xl border border-border overflow-hidden">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Top produits vendus</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">#</th>
                    <th className="text-left px-4 py-3 text-muted-foreground font-medium">Produit</th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">Qté vendue</th>
                    <th className="text-right px-4 py-3 text-muted-foreground font-medium">CA TTC</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(data.topProduits || []).slice(0, 8).map((p, i) => (
                    <tr key={i} className="hover:bg-muted/30">
                      <td className="px-4 py-3 text-muted-foreground">{i + 1}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{p.designation}</td>
                      <td className="px-4 py-3 text-right">{p.totalQte}</td>
                      <td className="px-4 py-3 text-right font-semibold text-primary">{formatMontant(p.totalCA)}</td>
                    </tr>
                  ))}
                  {(data.topProduits || []).length === 0 && (
                    <tr><td colSpan={4} className="text-center py-8 text-muted-foreground">Aucune donnée</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Alertes stock */}
          {data.stockAlertes > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">
                <span className="font-semibold">{data.stockAlertes} produit(s)</span> ont un stock inférieur au minimum requis.{' '}
                <a href="/produits" className="underline">Voir les produits</a>
              </p>
            </div>
          )}

          {/* Export */}
          <div className="bg-background rounded-xl border border-border p-5">
            <h2 className="font-semibold text-foreground mb-3">Export Excel</h2>
            <div className="flex flex-wrap gap-3">
              {[
                { type: 'factures', label: 'Factures' },
                { type: 'clients', label: 'Clients' },
                { type: 'produits', label: 'Produits / Stock' },
              ].map(({ type, label }) => (
                <button key={type} onClick={() => exporterExcel(type)}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium">
                  <Download className="w-4 h-4" /> {label}
                </button>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
