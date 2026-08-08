import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db/sqlite'
import { utilisateurs } from '@/db/schemas'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb()
    const { id } = await params
    const body = await req.json()
    const update: Record<string, unknown> = { nom: body.nom, email: body.email, role: body.role, actif: body.actif ?? 1 }
    if (body.motDePasse) update.motDePasse = await bcrypt.hash(body.motDePasse, 10)
    const result = await db.update(utilisateurs).set(update).where(eq(utilisateurs.id, Number(id))).returning()
    const { motDePasse: _, ...safe } = result[0]
    return NextResponse.json({ success: true, data: safe })
  } catch (e) { return NextResponse.json({ success: false, error: String(e) }, { status: 500 }) }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const db = getDb()
    const { id } = await params
    await db.update(utilisateurs).set({ actif: 0 }).where(eq(utilisateurs.id, Number(id)))
    return NextResponse.json({ success: true })
  } catch (e) { return NextResponse.json({ success: false, error: String(e) }, { status: 500 }) }
}
