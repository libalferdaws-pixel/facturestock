#!/usr/bin/env node
/**
 * post-build.js — run after `next build`
 *
 * 1. Copie .next/static → .next/standalone/.next/static  (assets CSS/JS)
 * 2. Copie public/ → .next/standalone/public/             (images, fonts)
 * 3. Copie better-sqlite3 de node_modules → standalone/node_modules
 *    (electron-builder reconstruit le .node pour Electron dans node_modules/
 *     via @electron/rebuild — on s'assure que standalone en a une copie)
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

// 4. Copier better-sqlite3 complet de node_modules vers standalone/node_modules
//    electron-builder reconstruira le .node via @electron/rebuild pour l'ABI Electron
//    La copie garantit que standalone a bien le module avec son .node
const sqliteSrc  = path.join(root, 'node_modules', 'better-sqlite3')
const sqliteDest = path.join(root, '.next', 'standalone', 'node_modules', 'better-sqlite3')
const bindingsSrc  = path.join(root, 'node_modules', 'bindings')
const bindingsDest = path.join(root, '.next', 'standalone', 'node_modules', 'bindings')
const furiSrc  = path.join(root, 'node_modules', 'file-uri-to-path')
const furiDest = path.join(root, '.next', 'standalone', 'node_modules', 'file-uri-to-path')

if (fs.existsSync(sqliteSrc)) {
  copyDir(sqliteSrc, sqliteDest)
  console.log('  ✓ better-sqlite3 copied to standalone/node_modules')
}
if (fs.existsSync(bindingsSrc)) {
  copyDir(bindingsSrc, bindingsDest)
  console.log('  ✓ bindings copied to standalone/node_modules')
}
if (fs.existsSync(furiSrc)) {
  copyDir(furiSrc, furiDest)
  console.log('  ✓ file-uri-to-path copied to standalone/node_modules')
}

// 5. Afficher contenu de standalone/node_modules
const standaloneNM = path.join(root, '.next', 'standalone', 'node_modules')
if (fs.existsSync(standaloneNM)) {
  const count = fs.readdirSync(standaloneNM).length
  console.log(`  ✓ standalone/node_modules: ${count} packages`)
}

console.log('[post-build] ✓ Done. Ready for electron-builder.')
