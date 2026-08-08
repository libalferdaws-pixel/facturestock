import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import path from 'path'
import fs from 'fs'
import * as schema from './schemas'

const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })

const DB_PATH = path.join(DATA_DIR, 'facturestock.db')

let _db: ReturnType<typeof drizzle> | null = null

export function getDb() {
  if (!_db) {
    // BETTER_SQLITE3_BINDING permet de pointer vers le binaire natif exact
    // (utile en mode Electron standalone où le .node est dans app.asar.unpacked)
    const nativeBinding = process.env.BETTER_SQLITE3_BINDING || undefined
    const sqlite = nativeBinding
      ? new Database(DB_PATH, { nativeBinding })
      : new Database(DB_PATH)
    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('foreign_keys = ON')
    _db = drizzle(sqlite, { schema })
  }
  return _db
}

export const db = new Proxy({} as ReturnType<typeof getDb>, {
  get(_target, prop: string | symbol) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop]
  },
})
