import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db/sqlite'
import { bonsLivraison, bonLivraisonItems, produits } from '@/db/schemas'
import { like, or, desc, sql, eq } from 'drizzle-orm'
import { nowISO, genNumeroBon } from '@/lib/format'

export async function GET(req: NextRequest) {
  try {
    const db = getDb()
    const q = req.nextUrl.searchParams.get('q') || ''
    const list = q
      ? await db.select().from(bonsLivraison).where(
          or(like(bonsLivraison.numero, `%${q}%`), like(bonsLivraison.fournisseurNom, `%${q}%`))
        ).orderBy(desc(bonsLivraison.id))
      : await db.select().from(bonsLivraison).orderBy(desc(bonsLivraison.id))
    return NextResponse.json({ success: true, data: list })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb()
    const body = await req.json()
    const { items, ...bonData } = body

    const count = await db.select({ count: sql<number>`count(*)` }).from(bonsLivraison)
    const numero = genNumeroBon(count[0].count)

    const result = await db.insert(bonsLivraison).values({
      ...bonData, numero, createdAt: nowISO(),
    }).returning()

    const bon = result[0]
    if (items && items.length > 0) {
      for (const item of items) {
        await db.insert(bonLivraisonItems).values({
          bonId: bon.id,
          produitId: item.produitId || null,
          reference: item.reference || null,
          designation: item.designation,
          quantite: item.quantite,
          prixUnitaire: item.prixUnitaire || 0,
          total: (item.quantite || 0) * (item.prixUnitaire || 0),
        })
        // Update stock
        if (item.produitId) {
          const prod = await db.select().from(produits).where(eq(produits.id, item.produitId))
          if (prod[0]) {
            await db.update(produits).set({
              stockActuel: prod[0].stockActuel + item.quantite,
            }).where(eq(produits.id, item.produitId))
          }
        }
      }
    }

    return NextResponse.json({ success: true, data: bon })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
