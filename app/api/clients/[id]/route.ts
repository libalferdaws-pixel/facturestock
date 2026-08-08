import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db/sqlite'
import { clients } from '@/db/schemas'
import { eq } from 'drizzle-orm'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb()
    const { id } = await params
    const result = await db.select().from(clients).where(eq(clients.id, Number(id)))
    if (!result[0]) return NextResponse.json({ success: false, error: 'Introuvable' }, { status: 404 })
    return NextResponse.json({ success: true, data: result[0] })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb()
    const { id } = await params
    const body = await req.json()
    const result = await db.update(clients).set(body).where(eq(clients.id, Number(id))).returning()
    return NextResponse.json({ success: true, data: result[0] })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb()
    const { id } = await params
    await db.delete(clients).where(eq(clients.id, Number(id)))
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
