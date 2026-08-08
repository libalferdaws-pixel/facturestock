import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db/sqlite'
import { utilisateurs } from '@/db/schemas'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { nowISO } from '@/lib/format'

export async function GET() {
  try {
    const db = getDb()
    const list = await db.select({
      id: utilisateurs.id, nom: utilisateurs.nom, email: utilisateurs.email,
      role: utilisateurs.role, actif: utilisateurs.actif, createdAt: utilisateurs.createdAt
    }).from(utilisateurs)
    return NextResponse.json({ success: true, data: list })
  } catch (e) { return NextResponse.json({ success: false, error: String(e) }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb()
    const body = await req.json()
    const hash = await bcrypt.hash(body.motDePasse || 'changeme123', 10)
    const result = await db.insert(utilisateurs).values({
      nom: body.nom, email: body.email, motDePasse: hash,
      role: body.role || 'vendeur', actif: 1, createdAt: nowISO()
    }).returning()
    const { motDePasse: _, ...safe } = result[0]
    return NextResponse.json({ success: true, data: safe })
  } catch (e) { return NextResponse.json({ success: false, error: String(e) }, { status: 500 }) }
}
