import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db/sqlite'
import { parametres } from '@/db/schemas'
import { eq } from 'drizzle-orm'

export async function GET() {
  try {
    const db = getDb()
    const list = await db.select().from(parametres)
    const obj: Record<string, string> = {}
    for (const p of list) obj[p.cle] = p.valeur
    return NextResponse.json({ success: true, data: obj })
  } catch (e) { return NextResponse.json({ success: false, error: String(e) }, { status: 500 }) }
}

export async function PUT(req: NextRequest) {
  try {
    const db = getDb()
    const body = await req.json() as Record<string, string>
    for (const [cle, valeur] of Object.entries(body)) {
      await db.update(parametres).set({ valeur: String(valeur) }).where(eq(parametres.cle, cle))
    }
    return NextResponse.json({ success: true })
  } catch (e) { return NextResponse.json({ success: false, error: String(e) }, { status: 500 }) }
}
