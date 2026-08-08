import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db/sqlite'
import { fournisseurs } from '@/db/schemas'
import { like, or, desc } from 'drizzle-orm'
import { nowISO } from '@/lib/format'

export async function GET(req: NextRequest) {
  try {
    const db = getDb()
    const q = req.nextUrl.searchParams.get('q') || ''
    const list = q
      ? await db.select().from(fournisseurs).where(
          or(like(fournisseurs.nom, `%${q}%`), like(fournisseurs.ville, `%${q}%`))
        ).orderBy(desc(fournisseurs.id))
      : await db.select().from(fournisseurs).orderBy(desc(fournisseurs.id))
    return NextResponse.json({ success: true, data: list })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb()
    const body = await req.json()
    const result = await db.insert(fournisseurs).values({ ...body, createdAt: nowISO() }).returning()
    return NextResponse.json({ success: true, data: result[0] })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
