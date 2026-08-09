const { app, BrowserWindow, dialog, shell, Menu, Tray, nativeImage, clipboard } = require('electron')
const path = require('path')
const http = require('http')
const os = require('os')
const fs = require('fs')

const PORT = 13000
const IS_DEV = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow
let tray
let nextServer = null  // http.Server instance (in-process)

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

// ─── Démarrer Next.js IN-PROCESS ─────────────────────────────────────────────
//
// On importe next directement dans le processus Electron.
// Plus de spawn, plus de problème d'ABI, plus d'EPIPE.
// Le serveur HTTP tourne dans le même processus que Electron.
//
async function startNextServer() {
  if (IS_DEV) return

  // standalone/ est dans extraResources → resources/standalone/
  const standaloneDir = path.join(process.resourcesPath, 'standalone')

  if (!fs.existsSync(standaloneDir)) {
    throw new Error(`Dossier standalone introuvable :\n${standaloneDir}\n\nContenu de resources/ :\n` +
      fs.readdirSync(process.resourcesPath).join('\n'))
  }

  // Données persistantes (AppData/Roaming/FactureStock/)
  const dataDir = path.join(app.getPath('userData'), 'FactureStock')
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

  // Configurer les variables d'environnement AVANT d'importer next
  process.env.DATA_DIR = dataDir
  process.env.PORT = String(PORT)
  process.env.HOSTNAME = '0.0.0.0'
  process.env.NODE_ENV = 'production'
  process.env.NEXT_TELEMETRY_DISABLED = '1'

  // better-sqlite3 : le binaire dans app.asar.unpacked a été recompilé par
  // @electron/rebuild pour l'ABI exact d'Electron 43.
  // On le copie dans standalone/node_modules/better-sqlite3/build/Release/
  // pour que require('better-sqlite3') le trouve automatiquement.
  const sqliteUnpacked = path.join(process.resourcesPath, 'app.asar.unpacked', 'node_modules', 'better-sqlite3', 'build', 'Release', 'better_sqlite3.node')
  const sqliteStandaloneDir = path.join(standaloneDir, 'node_modules', 'better-sqlite3', 'build', 'Release')
  const sqliteStandalone = path.join(sqliteStandaloneDir, 'better_sqlite3.node')

  if (fs.existsSync(sqliteUnpacked)) {
    try {
      fs.mkdirSync(sqliteStandaloneDir, { recursive: true })
      fs.copyFileSync(sqliteUnpacked, sqliteStandalone)
      console.log('[FactureStock] ✓ better_sqlite3.node copié (ABI Electron) →', sqliteStandalone)
    } catch(e) {
      console.warn('[FactureStock] ⚠ Copie better_sqlite3.node échouée:', e.message)
    }
  } else {
    console.warn('[FactureStock] ⚠ better_sqlite3.node unpacked introuvable:', sqliteUnpacked)
  }

  // Indiquer le binding exact via env var (fallback si copie échoue)
  const bindingPath = fs.existsSync(sqliteStandalone) ? sqliteStandalone : sqliteUnpacked
  if (fs.existsSync(bindingPath)) {
    process.env.BETTER_SQLITE3_BINDING = bindingPath
    console.log('[FactureStock] BETTER_SQLITE3_BINDING:', bindingPath)
  }

  console.log('[FactureStock] standaloneDir:', standaloneDir)
  console.log('[FactureStock] dataDir:', dataDir)

  // Charger le serveur standalone directement (server.js de Next.js)
  // server.js exporte un http.Server ou se lance lui-même
  // On le charge avec require() dans notre processus
  const serverJsPath = path.join(standaloneDir, 'server.js')

  return new Promise((resolve, reject) => {
    try {
      // Modifier process.cwd() temporairement pour que next trouve ses fichiers
      const originalCwd = process.cwd
      process.chdir(standaloneDir)

      // Intercepter le server.listen pour récupérer le serveur
      const originalListen = http.Server.prototype.listen
      http.Server.prototype.listen = function(...args) {
        // Restaurer listen immédiatement pour éviter les effets de bord
        http.Server.prototype.listen = originalListen
        nextServer = this
        console.log('[FactureStock] Next.js serveur HTTP créé in-process')

        // Forcer l'écoute sur 0.0.0.0:PORT
        const cb = typeof args[args.length - 1] === 'function' ? args.pop() : null
        return originalListen.call(this, PORT, '0.0.0.0', () => {
          console.log(`[FactureStock] ✓ Serveur prêt sur port ${PORT}`)
          if (cb) cb()
          resolve()
        })
      }

      // Charger server.js — il va démarrer le serveur
      require(serverJsPath)

      // Timeout de sécurité
      setTimeout(() => {
        http.Server.prototype.listen = originalListen
        reject(new Error(`Le serveur Next.js n'a pas démarré après 30 secondes.\nstandaloneDir: ${standaloneDir}`))
      }, 30000)

    } catch (err) {
      reject(new Error(`Erreur au chargement de server.js:\n${err.message}\n\nStack:\n${err.stack}`))
    }
  })
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
    { label: 'Quitter', click: () => { if (nextServer) nextServer.close(); app.quit() } },
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
app.on('before-quit', () => { if (nextServer) { nextServer.close(); nextServer = null } })
app.on('activate', () => { if (!mainWindow) createWindow(getLocalIP()) })
