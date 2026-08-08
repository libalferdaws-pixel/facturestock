import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db/sqlite'
import { produits } from '@/db/schemas'
import { like, or, desc } from 'drizzle-orm'
import { nowISO } from '@/lib/format'

export async function GET(req: NextRequest) {
  try {
    const db = getDb()
    const q = req.nextUrl.searchParams.get('q') || ''
    const list = q
      ? await db.select().from(produits).where(
          or(
            like(produits.designation, `%${q}%`),
            like(produits.reference, `%${q}%`),
            like(produits.codeBarres, `%${q}%`)
          )
        ).orderBy(desc(produits.id))
      : await db.select().from(produits).orderBy(desc(produits.id))
    return NextResponse.json({ success: true, data: list })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb()
    const body = await req.json()
    const result = await db.insert(produits).values({ ...body, createdAt: nowISO() }).returning()
    return NextResponse.json({ success: true, data: result[0] })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
