const { app, BrowserWindow, dialog, shell, Menu, Tray, nativeImage, clipboard } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const http = require('http')
const os = require('os')
const fs = require('fs')

const PORT = 13000
const IS_DEV = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow
let nextServer
let tray

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

// ─── Start Next.js standalone server ─────────────────────────────────────────
//
// Structure dans le .exe installé :
//   resources/
//     standalone/          ← extraResources depuis .next/standalone/
//       server.js
//       node_modules/
//       .next/
//     app.asar             ← electron/main.js + electron/preload.js uniquement
//     app.asar.unpacked/
//       node_modules/better-sqlite3/   ← binaire natif .node
//
function startNextServer() {
  return new Promise((resolve, reject) => {
    if (IS_DEV) { resolve(); return }

    // Le standalone est dans resources/standalone/ (extraResources)
    const standaloneDir = path.join(process.resourcesPath, 'standalone')
    const serverScript = path.join(standaloneDir, 'server.js')

    // Données persistantes dans AppData/Roaming/FactureStock/
    const dataDir = path.join(app.getPath('userData'), 'FactureStock')
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

    // Le binaire better-sqlite3 est dans app.asar.unpacked (asarUnpack)
    const sqliteBinary = path.join(
      process.resourcesPath,
      'app.asar.unpacked',
      'node_modules',
      'better-sqlite3',
      'build',
      'Release',
      'better_sqlite3.node'
    )

    // Variables d'environnement pour server.js
    const serverEnv = {
      ...process.env,
      DATA_DIR: dataDir,
      PORT: String(PORT),
      HOSTNAME: '0.0.0.0',
      NODE_ENV: 'production',
      NEXT_TELEMETRY_DISABLED: '1',
      BETTER_SQLITE3_PATH: sqliteBinary,
    }

    console.log('[FactureStock] standaloneDir :', standaloneDir)
    console.log('[FactureStock] serverScript  :', serverScript)
    console.log('[FactureStock] dataDir       :', dataDir)
    console.log('[FactureStock] execPath      :', process.execPath)
    console.log('[FactureStock] sqliteBinary  :', sqliteBinary)
    console.log('[FactureStock] serverScript exists:', fs.existsSync(serverScript))

    if (!fs.existsSync(serverScript)) {
      // Lister le dossier resources pour debug
      try {
        const items = fs.readdirSync(process.resourcesPath)
        console.log('[FactureStock] resources/ contient:', items.join(', '))
      } catch(e) { console.log('[FactureStock] Cannot list resources:', e.message) }

      reject(new Error(
        `server.js introuvable !\n\nChemin attendu :\n${serverScript}\n\n` +
        `Contenu de resources/ :\n` +
        ((() => { try { return fs.readdirSync(process.resourcesPath).join('\n') } catch(e) { return e.message } })())
      ))
      return
    }

    // Lancer server.js avec le Node.js intégré à Electron (process.execPath)
    nextServer = spawn(process.execPath, [serverScript], {
      cwd: standaloneDir,
      env: serverEnv,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    })

    nextServer.stdout.on('data', d => {
      const msg = d.toString().trim()
      if (msg) console.log('[Next]', msg)
    })
    nextServer.stderr.on('data', d => {
      const msg = d.toString().trim()
      if (msg) console.error('[Next err]', msg)
    })
    nextServer.on('error', err => {
      console.error('[spawn error]', err)
      reject(err)
    })
    nextServer.on('exit', code => {
      if (code !== 0 && code !== null) {
        console.error('[Next exit]', code)
      }
    })

    // Attendre que /api/health réponde 200 (max 90 secondes)
    waitForServer(resolve, reject, 90)
  })
}

function waitForServer(resolve, reject, retries) {
  if (retries <= 0) {
    reject(new Error(
      'Le serveur Next.js n\'a pas démarré après 90 secondes.\n' +
      'Le port 13000 est peut-être occupé par un autre programme.'
    ))
    return
  }
  http.get(`http://localhost:${PORT}/api/health`, res => {
    if (res.statusCode === 200) {
      console.log('[FactureStock] ✓ Serveur prêt sur port', PORT)
      resolve()
    } else {
      setTimeout(() => waitForServer(resolve, reject, retries - 1), 1000)
    }
  }).on('error', () => {
    setTimeout(() => waitForServer(resolve, reject, retries - 1), 1000)
  })
}

// ─── System Tray ──────────────────────────────────────────────────────────────
function createTray(localIP) {
  let icon
  try {
    const iconPath = app.isPackaged
      ? path.join(process.resourcesPath, 'standalone', 'public', 'icon.ico')
      : path.join(__dirname, '..', 'public', 'icon.ico')
    icon = fs.existsSync(iconPath) ? nativeImage.createFromPath(iconPath) : nativeImage.createEmpty()
  } catch { icon = nativeImage.createEmpty() }

  tray = new Tray(icon)
  const menu = Menu.buildFromTemplate([
    { label: 'FactureStock — Actif ✓', enabled: false },
    { type: 'separator' },
    { label: `📍 http://localhost:${PORT}`, enabled: false },
    { label: `🌐 http://${localIP}:${PORT}`, enabled: false },
    { type: 'separator' },
    {
      label: 'Ouvrir',
      click: () => mainWindow ? (mainWindow.show(), mainWindow.focus()) : createWindow(localIP)
    },
    {
      label: 'Copier adresse réseau',
      click: () => {
        clipboard.writeText(`http://${localIP}:${PORT}`)
        dialog.showMessageBox({
          message: `Copié !\nhttp://${localIP}:${PORT}`,
          type: 'info',
          title: 'FactureStock'
        })
      }
    },
    { type: 'separator' },
    {
      label: 'Quitter',
      click: () => { if (nextServer) nextServer.kill(); app.quit() }
    },
  ])
  tray.setContextMenu(menu)
  tray.setToolTip(`FactureStock — http://${localIP}:${PORT}`)
  tray.on('double-click', () => mainWindow
    ? (mainWindow.show(), mainWindow.focus())
    : createWindow(localIP)
  )
}

// ─── Fenêtre principale ───────────────────────────────────────────────────────
function createWindow(localIP) {
  const ip = localIP || getLocalIP()
  mainWindow = new BrowserWindow({
    width: 1300,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    title: 'FactureStock',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
    backgroundColor: '#f8fafc',
    autoHideMenuBar: true,
  })
  mainWindow.removeMenu()
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  // En cas d'erreur de chargement, réessayer
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error('[window] did-fail-load', errorCode, errorDescription)
    setTimeout(() => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL(`http://localhost:${PORT}`)
      }
    }, 2000)
  })

  mainWindow.loadURL(`http://localhost:${PORT}`)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()
    if (!IS_DEV) {
      setTimeout(() => {
        if (!mainWindow || mainWindow.isDestroyed()) return
        mainWindow.webContents.executeJavaScript(`
          (() => {
            if (document.getElementById('fs-net')) return
            const b = document.createElement('div')
            b.id = 'fs-net'
            b.style.cssText='position:fixed;bottom:16px;right:16px;background:#0f172a;color:#fff;padding:10px 16px;border-radius:10px;font-size:12px;z-index:9999;font-family:sans-serif;box-shadow:0 4px 20px rgba(0,0,0,.35);cursor:pointer;max-width:280px'
            b.innerHTML='<div style="font-weight:700;margin-bottom:4px">🌐 Serveur actif sur le réseau</div><div style="color:#94a3b8">Autres PC : <span style="color:#60a5fa;font-weight:600">http://${ip}:${PORT}</span></div><div style="color:#475569;font-size:10px;margin-top:4px">Clic pour fermer</div>'
            b.onclick=()=>b.remove()
            document.body.appendChild(b)
            setTimeout(()=>{if(b.parentNode)b.remove()},12000)
          })()
        `).catch(() => {})
      }, 2500)
    }
  })
  mainWindow.on('closed', () => { mainWindow = null })
}

// ─── Splash screen ────────────────────────────────────────────────────────────
function createSplash() {
  const w = new BrowserWindow({
    width: 440,
    height: 300,
    frame: false,
    alwaysOnTop: true,
    backgroundColor: '#0f172a',
    resizable: false,
    center: true,
    skipTaskbar: true,
  })
  w.loadURL(`data:text/html;charset=utf-8,<!DOCTYPE html><html><head><meta charset="utf-8">
<style>*{margin:0;padding:0;box-sizing:border-box}
body{background:#0f172a;display:flex;flex-direction:column;align-items:center;justify-content:center;
height:100vh;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#fff;padding:30px}
.logo{width:70px;height:70px;background:#1a56db;border-radius:18px;display:flex;align-items:center;
justify-content:center;font-size:36px;font-weight:800;margin-bottom:18px;box-shadow:0 8px 32px rgba(26,86,219,.4)}
h1{font-size:26px;font-weight:800;margin-bottom:6px}
.sub{font-size:13px;color:#64748b;margin-bottom:24px}
.bar{width:260px;height:5px;background:#1e293b;border-radius:3px;overflow:hidden;margin-bottom:20px}
.fill{height:100%;background:linear-gradient(90deg,#1a56db,#3b82f6);border-radius:3px;
animation:p 1.6s ease-in-out infinite alternate}
.info{font-size:11px;color:#334155;text-align:center;line-height:1.7}
.badge{display:inline-block;background:#1e293b;color:#60a5fa;padding:2px 10px;border-radius:4px;
font-size:10px;font-weight:700;margin-top:6px}
@keyframes p{from{transform:scaleX(.5);transform-origin:left}to{transform:scaleX(1);transform-origin:left}}
</style></head><body>
<div class="logo">F</div><h1>FactureStock</h1>
<div class="sub">Démarrage du serveur intégré...</div>
<div class="bar"><div class="fill"></div></div>
<div class="info">Standalone · Node.js intégré · Aucune installation requise<br>
<span class="badge">Windows x64 · Port 13000</span></div>
</body></html>`)
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
          type: 'info',
          title: 'FactureStock — Serveur démarré ✓',
          message: '✓ FactureStock est actif !',
          detail:
            `Ce PC :\nhttp://localhost:${PORT}\n\n` +
            `Autres PC du réseau :\nhttp://${localIP}:${PORT}\n\n` +
            `Ouvrez Chrome ou Edge sur les autres PC et tapez cette adresse.\n` +
            `Le port 13000 a été ouvert automatiquement dans le pare-feu Windows.`,
          buttons: ['Compris'],
        })
      }, 1500)
    }
  } catch (err) {
    dialog.showErrorBox('FactureStock — Erreur de démarrage', String(err))
    app.quit()
  }
})

app.on('window-all-closed', () => { /* garder dans le tray */ })
app.on('before-quit', () => {
  if (nextServer) { nextServer.kill('SIGTERM'); nextServer = null }
})
app.on('activate', () => { if (!mainWindow) createWindow(getLocalIP()) })
