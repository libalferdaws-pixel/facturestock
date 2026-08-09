#!/usr/bin/env node
/**
 * bundle-node.js
 *
 * Télécharge node.exe Windows x64 (version correspondant à Electron 43 = Node 24)
 * et le place dans .next/standalone/node.exe
 *
 * Pourquoi ? process.execPath dans Electron = electron.exe (pas node.exe).
 * On ne peut PAS spawner server.js avec electron.exe car il refuse d'exécuter
 * des scripts arbitraires en mode production packagé.
 *
 * Solution : bundler un vrai node.exe séparé → main.js l'utilise pour spawn server.js.
 */

const https = require('https')
const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const root = path.join(__dirname, '..')
const standaloneDir = path.join(root, '.next', 'standalone')
const nodeExeDest = path.join(standaloneDir, 'node.exe')

// Electron 43 = Node 24.18.1
const NODE_VERSION = '24.18.1'
const NODE_URL = `https://nodejs.org/dist/v${NODE_VERSION}/win-x64/node.exe`

// Si node.exe déjà là, skip
if (fs.existsSync(nodeExeDest)) {
  const stat = fs.statSync(nodeExeDest)
  if (stat.size > 1024 * 1024) {
    console.log(`[bundle-node] node.exe déjà présent (${Math.round(stat.size/1024/1024)} MB) — skip`)
    process.exit(0)
  }
}

console.log(`[bundle-node] Téléchargement node ${NODE_VERSION} Windows x64...`)
console.log(`[bundle-node] URL: ${NODE_URL}`)

function download(url, dest, redirects = 5) {
  return new Promise((resolve, reject) => {
    if (redirects <= 0) return reject(new Error('Too many redirects'))
    const file = fs.createWriteStream(dest)
    https.get(url, { headers: { 'User-Agent': 'curl/7.68' } }, res => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close()
        fs.unlinkSync(dest)
        return download(res.headers.location, dest, redirects - 1).then(resolve).catch(reject)
      }
      if (res.statusCode !== 200) {
        file.close()
        return reject(new Error(`HTTP ${res.statusCode} for ${url}`))
      }
      let downloaded = 0
      res.on('data', chunk => {
        downloaded += chunk.length
        if (downloaded % (5 * 1024 * 1024) < chunk.length) {
          process.stdout.write(`\r[bundle-node] ${Math.round(downloaded/1024/1024)} MB...`)
        }
      })
      res.pipe(file)
      file.on('finish', () => { file.close(); console.log(''); resolve() })
      file.on('error', reject)
    }).on('error', reject)
  })
}

download(NODE_URL, nodeExeDest)
  .then(() => {
    const stat = fs.statSync(nodeExeDest)
    console.log(`[bundle-node] ✅ node.exe téléchargé (${Math.round(stat.size/1024/1024)} MB)`)
    console.log(`[bundle-node] Destination: ${nodeExeDest}`)
  })
  .catch(err => {
    console.error('[bundle-node] ❌ Erreur:', err.message)
    // Non fatal — main.js a un fallback
    process.exit(0)
  })
