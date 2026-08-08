'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import {
  TrendingUp, FileText, Users, Package, ShoppingBag,
  CreditCard, AlertTriangle, ShoppingCart, ArrowRight,
  BarChart2, RotateCcw
} from 'lucide-react'
import { formatMontant } from '@/lib/format'

interface Stats {
  caJour: number; caMois: number; stockValeur: number; facturesImpayees: number;
  stockAlertes: number; caisseSolde: number; achatsMois: number;
  evolutionCA: Array<{ mois: string; ca: number; achats: number }>
}

function KpiCard({ href, icon: Icon, label, value, sub, color, alert }: {
  href: string; icon: React.ElementType; label: string; value: string;
  sub?: string; color: string; alert?: boolean;
}) {
  return (
    <Link href={href} className={`bg-background rounded-xl border p-5 hover:shadow-md transition-all group ${alert ? 'border-red-200' : 'border-border'}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <p className="text-2xl font-bold text-foreground">{value}</p>
      <p className="text-sm text-muted-foreground mt-1">{label}</p>
      {sub && <p className={`text-xs mt-0.5 ${alert ? 'text-red-500 font-medium' : 'text-muted-foreground opacity-70'}`}>{sub}</p>}
    </Link>
  )
}

function QuickAction({ href, icon: Icon, label, desc }: { href: string; icon: React.ElementType; label: string; desc: string }) {
  return (
    <Link href={href} className="flex items-center gap-3 p-3 bg-background rounded-xl border border-border hover:border-primary hover:shadow-sm transition-all">
      <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{desc}</p>
      </div>
    </Link>
  )
}

export default function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/rapports').then(r => r.json()).then(r => {
      if (r.success) setStats(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const today = new Date().toLocaleDateString('fr-MA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Tableau de bord</h1>
        <p className="text-muted-foreground text-sm mt-1 capitalize">{today}</p>
      </div>

      {/* KPIs */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-background rounded-xl border border-border p-5 animate-pulse">
              <div className="w-10 h-10 bg-muted rounded-lg mb-3" />
              <div className="h-6 bg-muted rounded w-24 mb-2" />
              <div className="h-4 bg-muted rounded w-32" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard href="/rapports" icon={TrendingUp} label="CA aujourd'hui"
            value={formatMontant(stats.caJour)}
            sub={`Ce mois : ${formatMontant(stats.caMois)}`}
            color="bg-blue-100 text-blue-600" />
          <KpiCard href="/caisse" icon={ShoppingCart} label="Caisse du jour"
            value={formatMontant(stats.caisseSolde)}
            sub="Ventes comptoir"
            color="bg-green-100 text-green-600" />
          <KpiCard href="/factures" icon={CreditCard} label="Factures impayées"
            value={formatMontant(stats.facturesImpayees)}
            sub="À encaisser"
            color="bg-yellow-100 text-yellow-700"
            alert={stats.facturesImpayees > 0} />
          <KpiCard href="/produits" icon={Package} label="Valeur stock"
            value={formatMontant(stats.stockValeur)}
            sub={stats.stockAlertes > 0 ? `⚠️ ${stats.stockAlertes} alertes` : 'Stock OK'}
            color={stats.stockAlertes > 0 ? 'bg-red-100 text-red-600' : 'bg-purple-100 text-purple-600'}
            alert={stats.stockAlertes > 0} />
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Impossible de charger les statistiques. La base sera créée au premier usage.
        </div>
      )}

      {/* Mini graphe evolution */}
      {stats && stats.evolutionCA && (
        <div className="bg-background rounded-xl border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-foreground">Évolution CA — 6 derniers mois</h2>
            <Link href="/rapports" className="text-xs text-primary hover:underline flex items-center gap-1">
              Détails <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="flex items-end gap-2 h-20">
            {stats.evolutionCA.map((d, i) => {
              const max = Math.max(...stats.evolutionCA.map(x => x.ca), 1)
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full bg-primary rounded-t transition-all" style={{ height: `${(d.ca / max) * 70}px` }} title={formatMontant(d.ca)} />
                  <span className="text-[10px] text-muted-foreground">{d.mois}</span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Actions rapides */}
      <div>
        <h2 className="font-semibold text-foreground mb-3">Actions rapides</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <QuickAction href="/caisse" icon={ShoppingCart} label="Caisse" desc="Vente rapide" />
          <QuickAction href="/factures/nouveau" icon={FileText} label="Facture" desc="Nouvelle facture" />
          <QuickAction href="/devis/nouveau" icon={FileText} label="Devis" desc="Nouveau devis" />
          <QuickAction href="/paiements" icon={CreditCard} label="Paiement" desc="Enregistrer" />
          <QuickAction href="/achats" icon={ShoppingBag} label="Achat" desc="Commande fournisseur" />
          <QuickAction href="/rapports" icon={BarChart2} label="Rapports" desc="Statistiques" />
        </div>
      </div>
    </div>
  )
}
