import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db/sqlite'
import { caisse, caisseItems, produits } from '@/db/schemas'
import { desc, sql, eq } from 'drizzle-orm'
import { nowISO } from '@/lib/format'

export async function GET() {
  try {
    const db = getDb()
    const list = await db.select().from(caisse).orderBy(desc(caisse.id))
    return NextResponse.json({ success: true, data: list })
  } catch (e) { return NextResponse.json({ success: false, error: String(e) }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb()
    const body = await req.json()
    const { items, ...caisseData } = body

    const count = await db.select({ count: sql<number>`count(*)` }).from(caisse)
    const annee = new Date().getFullYear()
    const numero = `TKT-${annee}-${String(count[0].count + 1).padStart(5, '0')}`

    const total = caisseData.total || (items || []).reduce((s: number, i: Record<string, number>) => {
      const qte = i.qte ?? i.quantite ?? 1
      const ht = qte * i.prixUnitaire
      return s + ht + ht * ((i.tva || 0) / 100)
    }, 0)
    const monnaie = Math.max(0, (caisseData.montantRecu || 0) - total)

    const result = await db.insert(caisse).values({
      ...caisseData, numero, total, monnaie,
      date: caisseData.date || new Date().toISOString().split('T')[0],
      createdAt: nowISO(),
    }).returning()
    const ticket = result[0]

    if (items?.length) {
      for (const item of items) {
        const qte = item.qte ?? item.quantite ?? 1
        const tva = item.tva || 0
        const ht = qte * item.prixUnitaire
        await db.insert(caisseItems).values({
          caisseId: ticket.id, produitId: item.produitId || null,
          reference: item.produitRef || null, designation: item.designation,
          quantite: qte, prixUnitaire: item.prixUnitaire,
          tva, total: ht + ht * (tva / 100),
        })
        // Decrease stock
        if (item.produitId) {
          const prod = await db.select().from(produits).where(eq(produits.id, item.produitId))
          if (prod[0]) await db.update(produits).set({ stockActuel: Math.max(0, prod[0].stockActuel - qte) }).where(eq(produits.id, item.produitId))
        }
      }
    }
    return NextResponse.json({ success: true, data: { ...ticket, monnaie } })
  } catch (e) { return NextResponse.json({ success: false, error: String(e) }, { status: 500 }) }
}
