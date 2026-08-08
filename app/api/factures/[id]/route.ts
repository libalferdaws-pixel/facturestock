import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db/sqlite'
import { factures, factureItems } from '@/db/schemas'
import { eq } from 'drizzle-orm'
import { calcItems } from '@/lib/format'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb()
    const { id } = await params
    const facture = await db.select().from(factures).where(eq(factures.id, Number(id)))
    if (!facture[0]) return NextResponse.json({ success: false, error: 'Introuvable' }, { status: 404 })
    const items = await db.select().from(factureItems).where(eq(factureItems.factureId, Number(id)))
    return NextResponse.json({ success: true, data: { ...facture[0], items } })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb()
    const { id } = await params
    const body = await req.json()
    const { items, ...factureData } = body

    if (items) {
      const { sousTotal, totalTva, total } = calcItems(items)
      factureData.sousTotal = sousTotal
      factureData.totalTva = totalTva
      factureData.total = total

      await db.delete(factureItems).where(eq(factureItems.factureId, Number(id)))
      for (const item of items) {
        const ht = item.quantite * item.prixUnitaire
        await db.insert(factureItems).values({
          factureId: Number(id),
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

    const result = await db.update(factures).set(factureData).where(eq(factures.id, Number(id))).returning()
    return NextResponse.json({ success: true, data: result[0] })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb()
    const { id } = await params
    await db.delete(factures).where(eq(factures.id, Number(id)))
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
