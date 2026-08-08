import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db/sqlite'
import { devis, devisItems } from '@/db/schemas'
import { like, or, desc, sql } from 'drizzle-orm'
import { nowISO, genNumeroDevis, calcItems } from '@/lib/format'

export async function GET(req: NextRequest) {
  try {
    const db = getDb()
    const q = req.nextUrl.searchParams.get('q') || ''
    const list = q
      ? await db.select().from(devis).where(
          or(like(devis.numero, `%${q}%`), like(devis.clientNom, `%${q}%`))
        ).orderBy(desc(devis.id))
      : await db.select().from(devis).orderBy(desc(devis.id))
    return NextResponse.json({ success: true, data: list })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb()
    const body = await req.json()
    const { items, ...devisData } = body

    const count = await db.select({ count: sql<number>`count(*)` }).from(devis)
    const numero = genNumeroDevis(count[0].count)
    const { sousTotal, totalTva, total } = calcItems(items || [])

    const result = await db.insert(devis).values({
      ...devisData, numero, sousTotal, totalTva, total, createdAt: nowISO(),
    }).returning()

    const d = result[0]
    if (items && items.length > 0) {
      for (const item of items) {
        const ht = item.quantite * item.prixUnitaire
        await db.insert(devisItems).values({
          devisId: d.id,
          produitId: item.produitId || null,
          reference: item.reference || null,
          designation: item.designation,
          quantite: item.quantite,
          prixUnitaire: item.prixUnitaire,
          tva: item.tva,
          total: ht + ht * (item.tva / 100),
        })
      }
    }

    return NextResponse.json({ success: true, data: d })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
