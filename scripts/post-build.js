#!/usr/bin/env node
/**
 * post-build.js — run after `next build`
 *
 * 1. Copie .next/static → .next/standalone/.next/static
 * 2. Copie public/ → .next/standalone/public/
 * 3. Copie better-sqlite3 + bindings + file-uri-to-path → standalone/node_modules
 * 4. Copie next/ → standalone/node_modules/next  (requis par server.js standalone)
 * 5. Cherche et copie better_sqlite3.node (binaire natif) dans standalone
 */

const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')
const standaloneDir = path.join(root, '.next', 'standalone')
const standaloneNM  = path.join(standaloneDir, 'node_modules')

// ── helpers ────────────────────────────────────────────────────────────────
function copyDir(src, dest) {
  if (!fs.existsSync(src)) { console.log(`  [skip] ${src} not found`); return }
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name)
    const d = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(s, d)
    else fs.copyFileSync(s, d)
  }
}

// Chercher better_sqlite3.node en tenant compte de pnpm symlinks
function findSqliteNode() {
  // 1. Chemin direct (npm / lien symbolique résolu)
  const direct = path.join(root, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node')
  if (fs.existsSync(direct)) return direct

  // 2. Chemin pnpm réel (node_modules/.pnpm/better-sqlite3@X/...)
  const pnpmBase = path.join(root, 'node_modules', '.pnpm')
  if (fs.existsSync(pnpmBase)) {
    for (const entry of fs.readdirSync(pnpmBase)) {
      if (entry.startsWith('better-sqlite3')) {
        const p = path.join(pnpmBase, entry, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node')
        if (fs.existsSync(p)) return p
      }
    }
  }

  // 3. Recherche récursive limitée (fallback)
  function walk(dir, depth) {
    if (depth > 5) return null
    try {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        if (e.name === 'better_sqlite3.node') return path.join(dir, e.name)
        if (e.isDirectory() && !e.name.startsWith('.')) {
          const found = walk(path.join(dir, e.name), depth + 1)
          if (found) return found
        }
      }
    } catch (_) {}
    return null
  }
  return walk(path.join(root, 'node_modules'), 0)
}

// ── 1. Static assets ───────────────────────────────────────────────────────
console.log('[post-build] Copying static assets...')
copyDir(path.join(root, '.next', 'static'), path.join(standaloneDir, '.next', 'static'))
console.log('  ✓ .next/static copied')

// ── 2. public/ ─────────────────────────────────────────────────────────────
copyDir(path.join(root, 'public'), path.join(standaloneDir, 'public'))
console.log('  ✓ public/ copied')

// ── 3. Vérifier server.js ──────────────────────────────────────────────────
const serverJs = path.join(standaloneDir, 'server.js')
if (!fs.existsSync(serverJs)) {
  console.error('  ✗ server.js NOT found! Check next.config.ts output: standalone')
  process.exit(1)
}
console.log('  ✓ server.js found')

// ── 4. Dépendances natives → standalone/node_modules ───────────────────────
for (const pkg of ['better-sqlite3', 'bindings', 'file-uri-to-path']) {
  const src  = path.join(root, 'node_modules', pkg)
  const dest = path.join(standaloneNM, pkg)
  if (fs.existsSync(src)) {
    copyDir(src, dest)
    console.log(`  ✓ ${pkg} → standalone/node_modules`)
  }
}

// ── 5. next → standalone/node_modules/next ─────────────────────────────────
// server.js standalone fait require('next/dist/...') → next doit être résolvable
const nextSrc  = path.join(root, 'node_modules', 'next')
const nextDest = path.join(standaloneNM, 'next')
if (!fs.existsSync(nextDest)) {
  if (fs.existsSync(nextSrc)) {
    copyDir(nextSrc, nextDest)
    console.log('  ✓ next → standalone/node_modules/next')
  } else {
    console.warn('  ⚠ next/ absent de node_modules !')
  }
} else {
  console.log('  ✓ next déjà dans standalone/node_modules (skip)')
}

// ── 6. better_sqlite3.node (binaire natif) ────────────────────────────────
const sqliteNode = findSqliteNode()
if (sqliteNode) {
  const sqliteDest = path.join(standaloneNM, 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node')
  fs.mkdirSync(path.dirname(sqliteDest), { recursive: true })
  fs.copyFileSync(sqliteNode, sqliteDest)
  const sz = Math.round(fs.statSync(sqliteDest).size / 1024)
  console.log(`  ✓ better_sqlite3.node copié (${sz} KB) depuis: ${sqliteNode}`)
} else {
  console.warn('  ⚠ better_sqlite3.node introuvable — sera copié depuis asar.unpacked au runtime')
}

// ── 7. Résumé ──────────────────────────────────────────────────────────────
if (fs.existsSync(standaloneNM)) {
  const pkgs = fs.readdirSync(standaloneNM)
  console.log(`  ✓ standalone/node_modules: ${pkgs.length} packages`)
  const checks = { next: false, 'better-sqlite3': false }
  for (const k of Object.keys(checks)) {
    checks[k] = pkgs.includes(k)
    const sym = checks[k] ? '✓' : '✗'
    console.log(`  ${sym} ${k} ${checks[k] ? 'présent' : 'ABSENT !'} dans standalone/node_modules`)
  }
}

console.log('[post-build] ✓ Done.')
