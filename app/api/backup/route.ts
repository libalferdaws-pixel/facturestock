import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(req: NextRequest) {
  try {
    const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
    const DB_PATH = path.join(DATA_DIR, 'facturestock.db')
    const { backupPath } = await req.json()

    const dest = backupPath || path.join(DATA_DIR, `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.db`)
    fs.copyFileSync(DB_PATH, dest)

    return NextResponse.json({ success: true, data: { path: dest, size: fs.statSync(dest).size } })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
    const files = fs.readdirSync(DATA_DIR)
      .filter(f => f.startsWith('backup-') && f.endsWith('.db'))
      .map(f => ({
        nom: f,
        taille: fs.statSync(path.join(DATA_DIR, f)).size,
        date: fs.statSync(path.join(DATA_DIR, f)).mtime.toISOString(),
      }))
      .sort((a, b) => b.date.localeCompare(a.date))
    return NextResponse.json({ success: true, data: files })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
