import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db/sqlite'
import { paiements, factures } from '@/db/schemas'
import { eq, desc } from 'drizzle-orm'
import { nowISO } from '@/lib/format'

export async function GET() {
  try {
    const db = getDb()
    const list = await db.select().from(paiements).orderBy(desc(paiements.id))
    return NextResponse.json({ success: true, data: list })
  } catch (e) { return NextResponse.json({ success: false, error: String(e) }, { status: 500 }) }
}

export async function POST(req: NextRequest) {
  try {
    const db = getDb()
    const body = await req.json()
    const { sql: sqlFn } = await import('drizzle-orm')
    const count = await db.select({ count: sqlFn<number>`count(*)` }).from(paiements)
    const annee = new Date().getFullYear()
    const reference = `PAY-${annee}-${String(count[0].count + 1).padStart(4, '0')}`
    const result = await db.insert(paiements).values({ ...body, reference, createdAt: nowISO() }).returning()

    // Update facture montant_paye + statut
    if (body.factureId) {
      const fact = await db.select().from(factures).where(eq(factures.id, body.factureId))
      if (fact[0]) {
        const totalPaye = (fact[0].montantPaye || 0) + Number(body.montant)
        const statut = totalPaye >= fact[0].total ? 'payee' : 'envoyee'
        await db.update(factures).set({ montantPaye: totalPaye, statut }).where(eq(factures.id, body.factureId))
      }
    }

    return NextResponse.json({ success: true, data: result[0] })
  } catch (e) { return NextResponse.json({ success: false, error: String(e) }, { status: 500 }) }
}
