import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db/sqlite'
import { bonsLivraison, bonLivraisonItems } from '@/db/schemas'
import { eq } from 'drizzle-orm'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb()
    const { id } = await params
    const bon = await db.select().from(bonsLivraison).where(eq(bonsLivraison.id, Number(id)))
    if (!bon[0]) return NextResponse.json({ success: false, error: 'Introuvable' }, { status: 404 })
    const items = await db.select().from(bonLivraisonItems).where(eq(bonLivraisonItems.bonId, Number(id)))
    return NextResponse.json({ success: true, data: { ...bon[0], items } })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb()
    const { id } = await params
    await db.delete(bonsLivraison).where(eq(bonsLivraison.id, Number(id)))
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
