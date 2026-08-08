import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db/sqlite'
import { devis, devisItems } from '@/db/schemas'
import { eq } from 'drizzle-orm'
import { calcItems } from '@/lib/format'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb()
    const { id } = await params
    const d = await db.select().from(devis).where(eq(devis.id, Number(id)))
    if (!d[0]) return NextResponse.json({ success: false, error: 'Introuvable' }, { status: 404 })
    const items = await db.select().from(devisItems).where(eq(devisItems.devisId, Number(id)))
    return NextResponse.json({ success: true, data: { ...d[0], items } })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb()
    const { id } = await params
    const body = await req.json()
    const { items, ...devisData } = body

    if (items) {
      const { sousTotal, totalTva, total } = calcItems(items)
      devisData.sousTotal = sousTotal
      devisData.totalTva = totalTva
      devisData.total = total
      await db.delete(devisItems).where(eq(devisItems.devisId, Number(id)))
      for (const item of items) {
        const ht = item.quantite * item.prixUnitaire
        await db.insert(devisItems).values({
          devisId: Number(id),
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

    const result = await db.update(devis).set(devisData).where(eq(devis.id, Number(id))).returning()
    return NextResponse.json({ success: true, data: result[0] })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb()
    const { id } = await params
    await db.delete(devis).where(eq(devis.id, Number(id)))
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
