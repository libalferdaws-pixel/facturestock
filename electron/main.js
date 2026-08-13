const { app, BrowserWindow, dialog, shell, Menu, Tray, nativeImage, clipboard } = require('electron')
const path = require('path')
const http = require('http')
const os = require('os')
const fs = require('fs')
const { spawn } = require('child_process')

const PORT = 13000
const IS_DEV = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow
let tray
let nextProcess = null  // child_process.ChildProcess

// ─── Local IP ─────────────────────────────────────────────────────────────────
function getLocalIP() {
  const ifaces = os.networkInterfaces()
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) return iface.address
    }
  }
  return 'localhost'
}

// ─── Attendre que le serveur réponde ─────────────────────────────────────────
function waitForServer(url, timeout = 60000) {
  return new Promise((resolve, reject) => {
    const start = Date.now()
    function tryOnce() {
      http.get(url, res => {
        if (res.statusCode < 500) return resolve()
        res.resume()
        retry()
      }).on('error', retry)
    }
    function retry() {
      if (Date.now() - start > timeout) return reject(new Error(`Timeout: serveur non disponible après ${timeout/1000}s`))
      setTimeout(tryOnce, 500)
    }
    tryOnce()
  })
}

// ─── Démarrer Next.js via node.exe bundlé ────────────────────────────────────
async function startNextServer() {
  if (IS_DEV) return

  // standalone/ est dans extraResources → resources/standalone/
  const standaloneDir = path.join(process.resourcesPath, 'standalone')

  if (!fs.existsSync(standaloneDir)) {
    const contents = fs.existsSync(process.resourcesPath)
      ? fs.readdirSync(process.resourcesPath).join('\n')
      : '(resourcesPath introuvable)'
    throw new Error(`Dossier standalone introuvable:\n${standaloneDir}\n\nContenu resources/:\n${contents}`)
  }

  // Données persistantes (AppData/Roaming/FactureStock/)
  const dataDir = path.join(app.getPath('userData'), 'FactureStock')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

  const serverJs  = path.join(standaloneDir, 'server.js')
  const nodeExe   = path.join(standaloneDir, 'node.exe')
  const nodeModules = path.join(standaloneDir, 'node_modules')

  // Vérifications
  if (!fs.existsSync(serverJs)) {
    throw new Error(`server.js introuvable:\n${serverJs}`)
  }
  if (!fs.existsSync(nodeExe)) {
    throw new Error(`node.exe introuvable:\n${nodeExe}\n\nLe bundling node.exe dans le CI a-t-il réussi ?`)
  }

  // better_sqlite3.node compilé pour Electron (ABI Electron)
  // electron-rebuild le place dans node_modules/better-sqlite3/build/Release/
  // copy-sqlite-binding.js le copie dans standalone/node_modules/better-sqlite3/build/Release/
  const sqliteBinding = path.join(nodeModules, 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node')
  if (!fs.existsSync(sqliteBinding)) {
    console.warn('[FactureStock] ⚠ better_sqlite3.node absent de standalone/node_modules, tentative copie depuis app.asar.unpacked...')
    // Fallback: copier depuis asarUnpack
    const unpacked = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node')
    if (fs.existsSync(unpacked)) {
      const destDir2 = path.join(nodeModules, 'better-sqlite3', 'build', 'Release')
      fs.mkdirSync(destDir2, { recursive: true })
      fs.copyFileSync(unpacked, sqliteBinding)
      console.log('[FactureStock] ✓ better_sqlite3.node copié depuis asar.unpacked')
    }
  }

  console.log('[FactureStock] standaloneDir:', standaloneDir)
  console.log('[FactureStock] dataDir:', dataDir)
  console.log('[FactureStock] node.exe:', nodeExe)
  console.log('[FactureStock] server.js:', serverJs)

  const env = {
    ...process.env,
    PORT: String(PORT),
    HOSTNAME: '0.0.0.0',
    NODE_ENV: 'production',
    NEXT_TELEMETRY_DISABLED: '1',
    DATA_DIR: dataDir,
    // NODE_PATH force la résolution de 'next' et ses deps depuis standalone/node_modules
    NODE_PATH: nodeModules,
  }

  nextProcess = spawn(nodeExe, [serverJs], {
    cwd: standaloneDir,
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })

  nextProcess.stdout.on('data', d => console.log('[next]', d.toString().trimEnd()))
  nextProcess.stderr.on('data', d => console.error('[next-err]', d.toString().trimEnd()))
  nextProcess.on('error', err => console.error('[FactureStock] spawn erreur:', err))
  nextProcess.on('exit', (code, sig) => {
    console.log(`[FactureStock] next process exit — code=${code} signal=${sig}`)
    nextProcess = null
  })

  // Attendre que le serveur HTTP réponde (max 60s)
  await waitForServer(`http://localhost:${PORT}/api/health`)
  console.log(`[FactureStock] ✓ Serveur prêt sur port ${PORT}`)
}

// ─── System Tray ──────────────────────────────────────────────────────────────
function createTray(localIP) {
  let icon
  try {
    const p = app.isPackaged
      ? path.join(process.resourcesPath, 'standalone', 'public', 'icon.ico')
      : path.join(__dirname, '..', 'public', 'icon.ico')
    icon = fs.existsSync(p) ? nativeImage.createFromPath(p) : nativeImage.createEmpty()
  } catch { icon = nativeImage.createEmpty() }

  tray = new Tray(icon)
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'FactureStock — Actif ✓', enabled: false },
    { type: 'separator' },
    { label: `📍 http://localhost:${PORT}`, enabled: false },
    { label: `🌐 http://${localIP}:${PORT}`, enabled: false },
    { type: 'separator' },
    { label: 'Ouvrir', click: () => mainWindow ? (mainWindow.show(), mainWindow.focus()) : createWindow(localIP) },
    { label: 'Copier adresse réseau', click: () => {
      clipboard.writeText(`http://${localIP}:${PORT}`)
      dialog.showMessageBox({ message: `Copié !\nhttp://${localIP}:${PORT}`, type: 'info', title: 'FactureStock' })
    }},
    { type: 'separator' },
    { label: 'Quitter', click: () => { if (nextProcess) nextProcess.kill(); app.quit() } },
  ]))
  tray.setToolTip(`FactureStock — http://${localIP}:${PORT}`)
  tray.on('double-click', () => mainWindow ? (mainWindow.show(), mainWindow.focus()) : createWindow(localIP))
}

// ─── Fenêtre principale ───────────────────────────────────────────────────────
function createWindow(localIP) {
  const ip = localIP || getLocalIP()
  mainWindow = new BrowserWindow({
    width: 1300, height: 860, minWidth: 960, minHeight: 640,
    title: 'FactureStock',
    webPreferences: { nodeIntegration: false, contextIsolation: true, preload: path.join(__dirname, 'preload.js') },
    show: false, backgroundColor: '#f8fafc', autoHideMenuBar: true,
  })
  mainWindow.removeMenu()
  mainWindow.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' } })
  mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
    console.error('[window] did-fail-load', code, desc)
    setTimeout(() => { if (mainWindow && !mainWindow.isDestroyed()) mainWindow.loadURL(`http://localhost:${PORT}`) }, 2000)
  })
  mainWindow.loadURL(`http://localhost:${PORT}`)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show(); mainWindow.focus()
    if (!IS_DEV) {
      setTimeout(() => {
        if (!mainWindow || mainWindow.isDestroyed()) return
        mainWindow.webContents.executeJavaScript(`
          (() => {
            if (document.getElementById('fs-net')) return
            const b = document.createElement('div')
            b.id = 'fs-net'
            b.style.cssText='position:fixed;bottom:16px;right:16px;background:#0f172a;color:#fff;padding:10px 16px;border-radius:10px;font-size:12px;z-index:9999;font-family:sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.35);cursor:pointer;max-width:280px'
            b.innerHTML='<div style="font-weight:700;margin-bottom:4px">🌐 Serveur actif</div><div style="color:#94a3b8">Autres PC : <span style="color:#60a5fa;font-weight:600">http://${ip}:${PORT}</span></div><div style="color:#475569;font-size:10px;margin-top:4px">Clic pour fermer</div>'
            b.onclick=()=>b.remove(); document.body.appendChild(b)
            setTimeout(()=>{if(b.parentNode)b.remove()},12000)
          })()
        `).catch(()=>{})
      }, 2500)
    }
  })
  mainWindow.on('closed', () => { mainWindow = null })
}

// ─── Splash ───────────────────────────────────────────────────────────────────
function createSplash() {
  const w = new BrowserWindow({ width: 440, height: 300, frame: false, alwaysOnTop: true,
    backgroundColor: '#0f172a', resizable: false, center: true, skipTaskbar: true })
  w.loadURL(`data:text/html;charset=utf-8,<!DOCTYPE html><html><head><meta charset="utf-8">
<style>*{margin:0;padding:0;box-sizing:border-box}body{background:#0f172a;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:#fff;padding:30px}.logo{width:70px;height:70px;background:#1a56db;border-radius:18px;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:800;margin-bottom:18px}.bar{width:260px;height:5px;background:#1e293b;border-radius:3px;overflow:hidden;margin-bottom:20px}.fill{height:100%;background:linear-gradient(90deg,#1a56db,#3b82f6);border-radius:3px;animation:p 1.6s ease-in-out infinite alternate}@keyframes p{from{transform:scaleX(.5);transform-origin:left}to{transform:scaleX(1)}}</style></head>
<body><div class="logo">F</div><h1 style="font-size:26px;font-weight:800;margin-bottom:6px">FactureStock</h1><p style="font-size:13px;color:#64748b;margin-bottom:24px">Démarrage...</p><div class="bar"><div class="fill"></div></div><p style="font-size:11px;color:#475569">Port 13000 — Standalone</p></body></html>`)
  return w
}

// ─── Cycle de vie ─────────────────────────────────────────────────────────────
app.whenReady().then(async () => {
  const localIP = getLocalIP()
  try {
    let splash
    if (!IS_DEV) {
      splash = createSplash()
      await startNextServer()
      splash.close()
    }
    createTray(localIP)
    createWindow(localIP)
    if (!IS_DEV) {
      setTimeout(() => {
        if (!mainWindow || mainWindow.isDestroyed()) return
        dialog.showMessageBox(mainWindow, {
          type: 'info', title: 'FactureStock ✓',
          message: 'FactureStock est actif !',
          detail: `Ce PC :\nhttp://localhost:${PORT}\n\nAutres PC :\nhttp://${localIP}:${PORT}`,
          buttons: ['Compris'],
        })
      }, 1500)
    }
  } catch (err) {
    dialog.showErrorBox('FactureStock — Erreur de démarrage', String(err))
    app.quit()
  }
})

app.on('window-all-closed', () => {})
app.on('before-quit', () => { if (nextProcess) { nextProcess.kill(); nextProcess = null } })
app.on('activate', () => { if (!mainWindow) createWindow(getLocalIP()) })
