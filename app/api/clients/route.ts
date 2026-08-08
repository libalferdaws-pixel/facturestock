import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db/sqlite'
import { clients } from '@/db/schemas'
import { eq, like, or, desc } from 'drizzle-orm'
import { nowISO } from '@/lib/format'

export async function GET(req: NextRequest) {
  try {
    const db = getDb()
    const q = req.nextUrl.searchParams.get('q') || ''
    const list = q
      ? await db.select().from(clients).where(
          or(like(clients.nom, `%${q}%`), like(clients.ville, `%${q}%`))
        ).orderBy(desc(clients.id))
      : await db.select().from(clients).orderBy(desc(clients.id))
    return NextResponse.json({ success: true, data: list })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb()
    const body = await req.json()
    const result = await db.insert(clients).values({ ...body, createdAt: nowISO() }).returning()
    return NextResponse.json({ success: true, data: result[0] })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
