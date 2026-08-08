import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db/sqlite'
import { factures, factureItems, paiements, produits, clients, caisse, achats } from '@/db/schemas'
import { sql, desc, gte, and, like } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const db = getDb()
    const periode = req.nextUrl.searchParams.get('periode') || 'mois'

    const today = new Date().toISOString().split('T')[0]
    const year = today.slice(0, 4)
    const month = today.slice(0, 7)

    // CA jour
    const facturesJour = await db.select().from(factures)
    const caJour = facturesJour.filter(f => f.date === today && f.statut !== 'annulee').reduce((s, f) => s + (f.total || 0), 0)

    // CA mois
    const caMois = facturesJour.filter(f => f.date?.startsWith(month) && f.statut !== 'annulee').reduce((s, f) => s + (f.total || 0), 0)

    // CA année
    const caAnnee = facturesJour.filter(f => f.date?.startsWith(year) && f.statut !== 'annulee').reduce((s, f) => s + (f.total || 0), 0)

    // Achats ce mois
    const toutes = await db.select().from(achats)
    const achatsMois = toutes.filter(a => a.date?.startsWith(month)).reduce((s, a) => s + (a.total || 0), 0)

    // Stock
    const allProduits = await db.select().from(produits)
    const stockValeur = allProduits.reduce((s, p) => s + p.stockActuel * p.prixAchat, 0)
    const stockAlertes = allProduits.filter(p => p.stockActuel <= p.stockMinimum).length

    // Caisse solde du jour
    const caisseRows = await db.select().from(caisse)
    const caisseSolde = caisseRows.filter(c => c.date?.startsWith(today)).reduce((s, c) => s + c.total, 0)

    // Factures impayées
    const facturesImpayees = facturesJour
      .filter(f => f.statut !== 'payee' && f.statut !== 'annulee')
      .reduce((s, f) => s + (f.total - (f.montantPaye || 0)), 0)

    // Top produits (from facture items using items stored in JSON or from factureItems table)
    let topProduits: Array<{ designation: string; totalQte: number; totalCA: number }> = []
    try {
      const items = await db.select().from(factureItems)
      const prodMap: Record<string, { totalQte: number; totalCA: number }> = {}
      for (const item of items) {
        const key = item.designation || item.reference || 'Produit'
        if (!prodMap[key]) prodMap[key] = { totalQte: 0, totalCA: 0 }
        prodMap[key].totalQte += item.quantite || 0
        prodMap[key].totalCA += item.total || 0
      }
      topProduits = Object.entries(prodMap)
        .map(([designation, v]) => ({ designation, ...v }))
        .sort((a, b) => b.totalCA - a.totalCA)
        .slice(0, 10)
    } catch { topProduits = [] }

    // Top clients
    const clientMap: Record<string, { totalCA: number; nbFactures: number }> = {}
    for (const f of facturesJour.filter(f => f.statut !== 'annulee')) {
      const key = f.clientNom || 'Client'
      if (!clientMap[key]) clientMap[key] = { totalCA: 0, nbFactures: 0 }
      clientMap[key].totalCA += f.total || 0
      clientMap[key].nbFactures++
    }
    const topClients = Object.entries(clientMap)
      .map(([clientNom, v]) => ({ clientNom, ...v }))
      .sort((a, b) => b.totalCA - a.totalCA)
      .slice(0, 10)

    // Évolution CA 6 derniers mois
    const now = new Date()
    const evolutionCA = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1)
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
      const ca = facturesJour.filter(f => f.date?.startsWith(key) && f.statut !== 'annulee').reduce((s, f) => s + (f.total || 0), 0)
      const ach = toutes.filter(a => a.date?.startsWith(key)).reduce((s, a) => s + (a.total || 0), 0)
      return { mois: d.toLocaleString('fr-MA', { month: 'short' }), ca, achats: ach }
    })

    return NextResponse.json({
      success: true,
      data: {
        caJour, caMois, caAnnee,
        achatsMois, stockValeur, stockAlertes,
        caisseSolde, facturesImpayees,
        topProduits, topClients, evolutionCA,
      }
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
