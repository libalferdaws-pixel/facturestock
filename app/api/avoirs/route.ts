import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db/sqlite'
import { avoirs, avoirItems, factures } from '@/db/schemas'
import { desc, sql, eq } from 'drizzle-orm'
import { nowISO } from '@/lib/format'

export async function GET() {
  try {
    const db = getDb()
    const list = await db.select().from(avoirs).orderBy(desc(avoirs.id))
    return NextResponse.json({ success: true, data: list })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb()
    const body = await req.json()
    const { items, ...avoirData } = body

    const count = await db.select({ count: sql<number>`count(*)` }).from(avoirs)
    const annee = new Date().getFullYear()
    const numero = `AV-${annee}-${String(count[0].count + 1).padStart(4, '0')}`

    // Calc totals from items
    const sousTotal = (items || []).reduce((s: number, l: { qte?: number; quantite?: number; prixUnitaire: number }) =>
      s + (l.qte || l.quantite || 1) * l.prixUnitaire, 0)

    const result = await db.insert(avoirs).values({
      ...avoirData,
      numero,
      sousTotal,
      totalTva: 0,
      total: avoirData.total || sousTotal,
      createdAt: nowISO(),
    }).returning()
    const avoir = result[0]

    if (items?.length) {
      for (const item of items) {
        const qte = item.qte || item.quantite || 1
        await db.insert(avoirItems).values({
          avoirId: avoir.id,
          produitId: item.produitId || null,
          reference: item.reference || null,
          designation: item.designation,
          quantite: qte,
          prixUnitaire: item.prixUnitaire,
          tva: item.tva || 0,
          total: qte * item.prixUnitaire,
        })
      }
    }

    return NextResponse.json({ success: true, data: avoir })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
