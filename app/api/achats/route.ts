import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db/sqlite'
import { achats, achatItems, produits } from '@/db/schemas'
import { desc, sql, eq } from 'drizzle-orm'
import { nowISO, calcItems } from '@/lib/format'

export async function GET() {
  try {
    const db = getDb()
    const list = await db.select().from(achats).orderBy(desc(achats.id))
    return NextResponse.json({ success: true, data: list })
  } catch (e) { return NextResponse.json({ success: false, error: String(e) }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb()
    const body = await req.json()
    const { items, ...achatData } = body

    const count = await db.select({ count: sql<number>`count(*)` }).from(achats)
    const annee = new Date().getFullYear()
    const numero = `ACH-${annee}-${String(count[0].count + 1).padStart(4, '0')}`

    const { sousTotal, totalTva, total } = calcItems(items || [])
    const result = await db.insert(achats).values({ ...achatData, numero, sousTotal, totalTva, total, createdAt: nowISO() }).returning()
    const achat = result[0]

    if (items?.length) {
      for (const item of items) {
        const qte = item.qte || item.quantite || 1
        const tva = item.tva || 0
        const ht = qte * item.prixUnitaire
        await db.insert(achatItems).values({
          achatId: achat.id, produitId: item.produitId ? parseInt(item.produitId) : null,
          reference: item.reference || null, designation: item.designation || '',
          quantite: qte, prixUnitaire: item.prixUnitaire,
          tva, total: ht + ht * (tva / 100),
        })
        // Update stock when statut = recu
        if (item.produitId && achatData.statut === 'recu') {
          const pid = parseInt(item.produitId)
          const prod = await db.select().from(produits).where(eq(produits.id, pid))
          if (prod[0]) await db.update(produits).set({ stockActuel: prod[0].stockActuel + qte }).where(eq(produits.id, pid))
        }
      }
    }
    return NextResponse.json({ success: true, data: achat })
  } catch (e) { return NextResponse.json({ success: false, error: String(e) }, { status: 500 }) }
}
