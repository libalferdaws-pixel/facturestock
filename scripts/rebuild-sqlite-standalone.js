#!/usr/bin/env node
/**
 * rebuild-sqlite-standalone.js
 *
 * Recompile better-sqlite3 spécifiquement pour la version ABI d'Electron
 * dans le dossier .next/standalone/node_modules/better-sqlite3/
 *
 * Electron embarque son propre Node.js avec un ABI différent de Node.js système.
 * Si better-sqlite3 est compilé pour Node.js 20, il crashe dans Electron 43.
 * Ce script le recompile avec le bon target.
 */

const { execSync } = require('child_process')
const path = require('path')
const fs = require('fs')

const root = path.join(__dirname, '..')

// Lire la version d'Electron depuis package.json
const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'))
const electronPkg = JSON.parse(
  fs.readFileSync(path.join(root, 'node_modules', 'electron', 'package.json'), 'utf8')
)
const electronVersion = electronPkg.version
console.log(`[rebuild-sqlite] Electron version: ${electronVersion}`)

const standaloneNM = path.join(root, '.next', 'standalone', 'node_modules')
const sqliteInStandalone = path.join(standaloneNM, 'better-sqlite3')

if (!fs.existsSync(sqliteInStandalone)) {
  console.log('[rebuild-sqlite] better-sqlite3 not found in standalone/node_modules — skipping')
  process.exit(0)
}

console.log(`[rebuild-sqlite] Rebuilding better-sqlite3 for Electron ${electronVersion} ABI...`)

try {
  // Utiliser @electron/rebuild pour recompiler dans standalone/node_modules
  execSync(
    `npx @electron/rebuild@latest --version=${electronVersion} --arch=x64 --module-dir="${standaloneNM}" --which-module=better-sqlite3`,
    {
      cwd: root,
      stdio: 'inherit',
      env: { ...process.env, npm_config_msvs_version: '2022' }
    }
  )
  console.log('[rebuild-sqlite] ✅ better-sqlite3 recompilé pour Electron')
} catch (err) {
  console.warn('[rebuild-sqlite] ⚠️ @electron/rebuild a échoué, on continue quand même')
  console.warn('[rebuild-sqlite] electron-builder va recompiler via @electron/rebuild intégré')
  // Pas fatal — electron-builder fait aussi son propre rebuild au moment du packaging
}

// Vérifier que le .node existe
const nodeFile = path.join(sqliteInStandalone, 'build', 'Release', 'better_sqlite3.node')
if (fs.existsSync(nodeFile)) {
  const stat = fs.statSync(nodeFile)
  console.log(`[rebuild-sqlite] ✅ better_sqlite3.node trouvé (${Math.round(stat.size/1024)} KB)`)
} else {
  console.log('[rebuild-sqlite] ⚠️ better_sqlite3.node absent dans standalone — sera copié au runtime')
}
