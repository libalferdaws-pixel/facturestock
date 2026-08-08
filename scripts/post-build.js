#!/usr/bin/env node
/**
 * post-build.js — run after `next build`
 *
 * next build --output standalone generates:
 *   .next/standalone/           ← minimal server, no full node_modules
 *   .next/standalone/.next/     ← server chunks
 *   .next/static/               ← client assets (CSS, JS, images)
 *
 * For the standalone server to serve static files, they must be at:
 *   .next/standalone/.next/static/
 *   .next/standalone/public/
 *
 * This script does that copy.
 */

const fs = require('fs')
const path = require('path')

const root = path.join(__dirname, '..')

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.log(`  [skip] ${src} not found`)
    return
  }
  fs.mkdirSync(dest, { recursive: true })
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath)
    } else {
      fs.copyFileSync(srcPath, destPath)
    }
  }
}

console.log('[post-build] Copying static assets into standalone...')

// 1. .next/static → .next/standalone/.next/static
const staticSrc  = path.join(root, '.next', 'static')
const staticDest = path.join(root, '.next', 'standalone', '.next', 'static')
copyDir(staticSrc, staticDest)
console.log(`  .next/static → ${staticDest}`)

// 2. public/ → .next/standalone/public/
const publicSrc  = path.join(root, 'public')
const publicDest = path.join(root, '.next', 'standalone', 'public')
copyDir(publicSrc, publicDest)
console.log(`  public/ → ${publicDest}`)

// 3. Verify server.js exists
const serverJs = path.join(root, '.next', 'standalone', 'server.js')
if (fs.existsSync(serverJs)) {
  console.log(`  ✓ server.js found at ${serverJs}`)
} else {
  console.error(`  ✗ server.js NOT found! Check next.config.ts output: 'standalone'`)
  process.exit(1)
}

// 4. Show standalone node_modules size estimate
const standaloneNM = path.join(root, '.next', 'standalone', 'node_modules')
if (fs.existsSync(standaloneNM)) {
  const count = fs.readdirSync(standaloneNM).length
  console.log(`  ✓ standalone/node_modules has ${count} packages (vs full node_modules)`)
}

console.log('[post-build] ✓ Done. Ready for electron-builder.')
