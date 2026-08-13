#!/usr/bin/env node
/**
 * post-build.js — run after `next build`
 *
 * 1. Copie .next/static → .next/standalone/.next/static  (assets CSS/JS)
 * 2. Copie public/ → .next/standalone/public/             (images, fonts)
 * 3. Copie better-sqlite3 + bindings + file-uri-to-path → standalone/node_modules
 * 4. Copie next/ complet → standalone/node_modules/next   (requis par server.js standalone)
 */

const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')

function copyDir(src, dest) {
  if (!fs.existsSync(src)) { console.log(`  [skip] ${src} not found`); return }
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) copyDir(srcPath, destPath)
    else fs.copyFileSync(srcPath, destPath)
  }
}

console.log('[post-build] Copying static assets into standalone...')

// 1. .next/static → .next/standalone/.next/static
copyDir(path.join(root, '.next', 'static'), path.join(root, '.next', 'standalone', '.next', 'static'))
console.log('  ✓ .next/static copied')

// 2. public/ → .next/standalone/public/
copyDir(path.join(root, 'public'), path.join(root, '.next', 'standalone', 'public'))
console.log('  ✓ public/ copied')

// 3. Vérifier server.js
const serverJs = path.join(root, '.next', 'standalone', 'server.js')
if (!fs.existsSync(serverJs)) {
  console.error('  ✗ server.js NOT found! Check next.config.ts output: standalone')
  process.exit(1)
}
console.log('  ✓ server.js found')

// 4. Dépendances natives vers standalone/node_modules
const deps = [
  ['better-sqlite3',   'better-sqlite3'],
  ['bindings',         'bindings'],
  ['file-uri-to-path', 'file-uri-to-path'],
]
for (const [name, dir] of deps) {
  const src  = path.join(root, 'node_modules', dir)
  const dest = path.join(root, '.next', 'standalone', 'node_modules', dir)
  if (fs.existsSync(src)) {
    copyDir(src, dest)
    console.log(`  ✓ ${name} copied to standalone/node_modules`)
  } else {
    console.log(`  [skip] ${name} not in node_modules`)
  }
}

// 5. Copier 'next' dans standalone/node_modules
// server.js standalone fait require('next/...') — il faut que next soit résolvable
// depuis standalone/node_modules pour que node.exe (avec cwd=standalone) le trouve
const nextSrc  = path.join(root, 'node_modules', 'next')
const nextDest = path.join(root, '.next', 'standalone', 'node_modules', 'next')
if (fs.existsSync(nextSrc)) {
  if (!fs.existsSync(nextDest)) {
    copyDir(nextSrc, nextDest)
    console.log('  ✓ next copied to standalone/node_modules')
  } else {
    console.log('  ✓ next already in standalone/node_modules (skip)')
  }
} else {
  console.warn('  ⚠ next not found in node_modules!')
}

// 6. Afficher contenu de standalone/node_modules
const standaloneNM = path.join(root, '.next', 'standalone', 'node_modules')
if (fs.existsSync(standaloneNM)) {
  const pkgs = fs.readdirSync(standaloneNM)
  console.log(`  ✓ standalone/node_modules: ${pkgs.length} packages`)
  if (pkgs.includes('next')) console.log('  ✓ next présent dans standalone/node_modules')
  else console.error('  ✗ next ABSENT de standalone/node_modules !')
}

console.log('[post-build] ✓ Done. Ready for electron-builder.')
