#!/usr/bin/env node
/**
 * copy-sqlite-binding.js
 *
 * Après electron-rebuild, better_sqlite3.node est dans
 *   node_modules/better-sqlite3/build/Release/better_sqlite3.node
 * (compilé pour l'ABI exact d'Electron).
 *
 * On le copie dans standalone/node_modules/better-sqlite3/build/Release/
 * pour que le server.js standalone puisse le charger sans BETTER_SQLITE3_BINDING.
 */

const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')

const src = path.join(root, 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node')
const destDir = path.join(root, '.next', 'standalone', 'node_modules', 'better-sqlite3', 'build', 'Release')
const dest = path.join(destDir, 'better_sqlite3.node')

if (!fs.existsSync(src)) {
  console.error('[copy-sqlite] ✗ Source introuvable:', src)
  process.exit(1)
}

fs.mkdirSync(destDir, { recursive: true })
fs.copyFileSync(src, dest)

const stat = fs.statSync(dest)
console.log(`[copy-sqlite] ✓ better_sqlite3.node copié (Electron ABI) — ${Math.round(stat.size / 1024)} KB`)
console.log(`[copy-sqlite]   src : ${src}`)
console.log(`[copy-sqlite]   dest: ${dest}`)
