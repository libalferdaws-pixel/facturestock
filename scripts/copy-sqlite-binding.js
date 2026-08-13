#!/usr/bin/env node
/**
 * copy-sqlite-binding.js
 *
 * Cherche better_sqlite3.node (compilé pour Node courant) et le copie dans
 * standalone/node_modules/better-sqlite3/build/Release/
 *
 * Cherche dans plusieurs endroits possibles (pnpm/npm/yarn).
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const root = path.join(__dirname, '..')
const destDir = path.join(root, '.next', 'standalone', 'node_modules', 'better-sqlite3', 'build', 'Release')
const dest = path.join(destDir, 'better_sqlite3.node')

// Chercher better_sqlite3.node dans node_modules (pnpm nested + direct)
function findBinding() {
  const candidates = [
    // npm/direct
    path.join(root, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node'),
    // pnpm style
    path.join(root, 'node_modules', '.pnpm'),
  ]

  // Direct path
  if (fs.existsSync(candidates[0])) return candidates[0]

  // Chercher dans pnpm store
  const pnpmDir = candidates[1]
  if (fs.existsSync(pnpmDir)) {
    for (const entry of fs.readdirSync(pnpmDir)) {
      if (entry.startsWith('better-sqlite3')) {
        const p = path.join(pnpmDir, entry, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node')
        if (fs.existsSync(p)) return p
      }
    }
  }

  // find via where command (Windows)
  try {
    const result = execSync('dir /s /b better_sqlite3.node', { cwd: root, encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] })
    const lines = result.trim().split('\n').map(l => l.trim()).filter(l => l.endsWith('.node'))
    if (lines.length > 0) return lines[0]
  } catch (_) {}

  return null
}

const src = findBinding()
if (!src) {
  console.error('[copy-sqlite] ✗ better_sqlite3.node introuvable dans node_modules')
  console.error('[copy-sqlite] Contenu de node_modules/.pnpm :')
  const pnpmDir = path.join(root, 'node_modules', '.pnpm')
  if (fs.existsSync(pnpmDir)) {
    for (const e of fs.readdirSync(pnpmDir)) {
      if (e.includes('sqlite')) console.error('  ', e)
    }
  }
  process.exit(1)
}

fs.mkdirSync(destDir, { recursive: true })
fs.copyFileSync(src, dest)

const stat = fs.statSync(dest)
console.log(`[copy-sqlite] ✓ better_sqlite3.node copié — ${Math.round(stat.size / 1024)} KB`)
console.log(`[copy-sqlite]   src : ${src}`)
console.log(`[copy-sqlite]   dest: ${dest}`)
