import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db/sqlite'
import { fournisseurs } from '@/db/schemas'
import { eq } from 'drizzle-orm'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb()
    const { id } = await params
    const body = await req.json()
    const result = await db.update(fournisseurs).set(body).where(eq(fournisseurs.id, Number(id))).returning()
    return NextResponse.json({ success: true, data: result[0] })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb()
    const { id } = await params
    await db.delete(fournisseurs).where(eq(fournisseurs.id, Number(id)))
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
