import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db/sqlite'
import { factures, factureItems } from '@/db/schemas'
import { like, or, desc, eq, sql } from 'drizzle-orm'
import { nowISO, genNumeroFacture, calcItems } from '@/lib/format'

export async function GET(req: NextRequest) {
  try {
    const db = getDb()
    const q = req.nextUrl.searchParams.get('q') || ''
    const list = q
      ? await db.select().from(factures).where(
          or(like(factures.numero, `%${q}%`), like(factures.clientNom, `%${q}%`))
        ).orderBy(desc(factures.id))
      : await db.select().from(factures).orderBy(desc(factures.id))
    return NextResponse.json({ success: true, data: list })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb()
    const body = await req.json()
    const { items, ...factureData } = body

    // Generate numero
    const count = await db.select({ count: sql<number>`count(*)` }).from(factures)
    const numero = genNumeroFacture(count[0].count)

    // Calc totals
    const { sousTotal, totalTva, total } = calcItems(items || [])

    const result = await db.insert(factures).values({
      ...factureData,
      numero,
      sousTotal,
      totalTva,
      total,
      createdAt: nowISO(),
    }).returning()

    const facture = result[0]

    // Insert items
    if (items && items.length > 0) {
      for (const item of items) {
        const ht = item.quantite * item.prixUnitaire
        await db.insert(factureItems).values({
          factureId: facture.id,
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

    return NextResponse.json({ success: true, data: facture })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
