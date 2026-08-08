import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db/sqlite'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const SECRET = process.env.JWT_SECRET || 'facturestock-secret-2025'

export async function POST(req: NextRequest) {
  try {
    const db = getDb()
    const { email, motDePasse } = await req.json()
    if (!email || !motDePasse) return NextResponse.json({ success: false, error: 'Email et mot de passe requis' }, { status: 400 })

    const { utilisateurs } = await import('@/db/schemas')
    const allUsers = await db.select().from(utilisateurs)
    const user = allUsers.find(u => u.email === email && u.actif === 1)
    if (!user) return NextResponse.json({ success: false, error: 'Identifiants incorrects' }, { status: 401 })

    const valid = await bcrypt.compare(motDePasse, user.motDePasse)
    if (!valid) return NextResponse.json({ success: false, error: 'Identifiants incorrects' }, { status: 401 })

    const token = jwt.sign({ id: user.id, nom: user.nom, email: user.email, role: user.role }, SECRET, { expiresIn: '7d' })

    const res = NextResponse.json({ success: true, data: { token, user: { id: user.id, nom: user.nom, email: user.email, role: user.role } } })
    res.cookies.set('fs_token', token, { httpOnly: true, maxAge: 7 * 24 * 3600, path: '/' })
    return res
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.delete('fs_token')
  return res
}
