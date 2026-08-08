import { NextResponse } from 'next/server'
import { getDb } from '@/db/sqlite'
import { factures, devis, produits, clients, bonsLivraison } from '@/db/schemas'
import { sql, lte, desc } from 'drizzle-orm'

export async function GET() {
  try {
    const db = getDb()

    const [totalFactures] = await db.select({ total: sql<number>`sum(total)`, count: sql<number>`count(*)` }).from(factures)
    const [totalClients] = await db.select({ count: sql<number>`count(*)` }).from(clients)
    const [totalProduits] = await db.select({ count: sql<number>`count(*)` }).from(produits)
    const [totalDevis] = await db.select({ count: sql<number>`count(*)` }).from(devis)

    const stockBas = await db.select().from(produits).where(
      sql`${produits.stockActuel} <= ${produits.stockMinimum}`
    ).limit(5)

    const dernieresFactures = await db.select().from(factures).orderBy(desc(factures.id)).limit(5)
    const derniersBons = await db.select().from(bonsLivraison).orderBy(desc(bonsLivraison.id)).limit(5)

    return NextResponse.json({
      success: true,
      data: {
        totalCA: totalFactures.total || 0,
        nbFactures: totalFactures.count || 0,
        nbClients: totalClients.count || 0,
        nbProduits: totalProduits.count || 0,
        nbDevis: totalDevis.count || 0,
        stockBas,
        dernieresFactures,
        derniersBons,
      }
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
