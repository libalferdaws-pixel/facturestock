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

// ─── Embedded Node.js path (Electron ships its own Node runtime) ─────────────
// process.execPath = path to the Electron binary which IS a full Node.js runtime.
// We use it to spawn `next start` without needing any external Node installation.
function getNodeBin() {
  // In packaged app: process.execPath is FactureStock.exe (Electron = Node)
  // In dev: just use whatever node is on PATH (should exist for dev)
  return process.execPath
}

// ─── Get local IP address ─────────────────────────────────────────────────────
function getLocalIP() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return 'localhost'
}

// ─── Start Next.js server using Electron's built-in Node.js ──────────────────
// This is the key to being STANDALONE — no external Node.js needed on Windows.
// Electron bundles Node.js internally; we reuse its binary to run `next start`.
function startNextServer() {
  return new Promise((resolve, reject) => {
    if (IS_DEV) {
      // In dev mode, Next.js dev server is already running separately
      resolve()
      return
    }

    // In packaged app: app files live inside the asar at resources/app.asar
    // but node_modules/.bin and next are accessible via process.resourcesPath
    const appDir = path.join(process.resourcesPath, 'app.asar')
    const nextBin = path.join(process.resourcesPath, 'app.asar', 'node_modules', 'next', 'dist', 'bin', 'next')

    // Data directory in user's AppData (persists across updates)
    const dataDir = path.join(app.getPath('userData'), 'FactureStock')
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

    process.env.DATA_DIR = dataDir
    process.env.PORT = String(PORT)
    process.env.NODE_ENV = 'production'
    process.env.HOSTNAME = '0.0.0.0'
    process.env.NEXT_TELEMETRY_DISABLED = '1'

    console.log('[FactureStock] Starting Next.js server...')
    console.log('[FactureStock] Node binary:', getNodeBin())
    console.log('[FactureStock] App dir:', appDir)
    console.log('[FactureStock] Data dir:', dataDir)

    nextServer = spawn(getNodeBin(), [nextBin, 'start', '-p', String(PORT), '-H', '0.0.0.0'], {
      cwd: path.join(process.resourcesPath, 'app.asar'),
      env: { ...process.env },
      stdio: ['ignore', 'pipe', 'pipe'],
      // Windows: hide the console window
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
      console.error('[Next spawn error]', err)
      reject(err)
    })
    nextServer.on('exit', (code) => {
      if (code !== 0 && code !== null) {
        console.error('[Next exited with code]', code)
      }
    })

    waitForServer(resolve, reject, 90)
  })
}

function waitForServer(resolve, reject, retries) {
  if (retries <= 0) {
    reject(new Error('Le serveur Next.js n\'a pas démarré dans les temps.\nVérifiez que le port 13000 est libre.'))
    return
  }
  http.get(`http://localhost:${PORT}/api/health`, (res) => {
    if (res.statusCode === 200) {
      console.log('[FactureStock] Server ready on port', PORT)
      resolve()
    } else {
      setTimeout(() => waitForServer(resolve, reject, retries - 1), 1000)
    }
  }).on('error', () => {
    setTimeout(() => waitForServer(resolve, reject, retries - 1), 1000)
  })
}

// ─── System tray icon ─────────────────────────────────────────────────────────
function createTray(localIP) {
  // Try to load icon; fallback to empty
  let icon
  try {
    const iconPath = path.join(__dirname, '..', 'public', 'icon.ico')
    if (fs.existsSync(iconPath)) {
      icon = nativeImage.createFromPath(iconPath)
    } else {
      icon = nativeImage.createEmpty()
    }
  } catch {
    icon = nativeImage.createEmpty()
  }

  tray = new Tray(icon)

  const menu = Menu.buildFromTemplate([
    { label: 'FactureStock — Serveur actif', enabled: false },
    { type: 'separator' },
    { label: `📍 Local : http://localhost:${PORT}`, enabled: false },
    { label: `🌐 Réseau : http://${localIP}:${PORT}`, enabled: false },
    { type: 'separator' },
    {
      label: 'Ouvrir FactureStock',
      click: () => {
        if (mainWindow) { mainWindow.show(); mainWindow.focus() }
        else createWindow(localIP)
      },
    },
    {
      label: 'Copier l\'adresse réseau',
      click: () => {
        clipboard.writeText(`http://${localIP}:${PORT}`)
        dialog.showMessageBox({
          message: `Adresse copiée !\nhttp://${localIP}:${PORT}`,
          type: 'info', title: 'FactureStock'
        })
      },
    },
    { type: 'separator' },
    {
      label: 'Quitter FactureStock',
      click: () => {
        if (nextServer) nextServer.kill()
        app.quit()
      },
    },
  ])

  tray.setContextMenu(menu)
  tray.setToolTip(`FactureStock — http://${localIP}:${PORT}`)

  tray.on('double-click', () => {
    if (mainWindow) { mainWindow.show(); mainWindow.focus() }
    else createWindow(localIP)
  })
}

// ─── Create main window ───────────────────────────────────────────────────────
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

  // Remove default menu bar (File/Edit/View...)
  mainWindow.removeMenu()

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.loadURL(`http://localhost:${PORT}`)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()

    // Show LAN info banner in the app
    if (!IS_DEV) {
      setTimeout(() => {
        mainWindow.webContents.executeJavaScript(`
          (() => {
            if (document.getElementById('fs-network-banner')) return
            const b = document.createElement('div')
            b.id = 'fs-network-banner'
            b.style.cssText = 'position:fixed;bottom:16px;right:16px;background:#0f172a;color:white;padding:10px 16px;border-radius:10px;font-size:12px;z-index:9999;font-family:sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.3);cursor:pointer;max-width:280px;'
            b.innerHTML = '<div style="font-weight:700;margin-bottom:4px">🌐 Serveur actif sur le réseau</div><div style="color:#94a3b8">Autres PC : <span style="color:#60a5fa;font-weight:600">http://${ip}:${PORT}</span></div><div style="color:#475569;font-size:10px;margin-top:4px">Cliquez pour fermer</div>'
            b.onclick = () => b.remove()
            document.body.appendChild(b)
            setTimeout(() => { if(b.parentNode) b.remove() }, 12000)
          })()
        `).catch(() => {})
      }, 2500)
    }
  })

  mainWindow.on('closed', () => { mainWindow = null })
}

// ─── Splash screen ────────────────────────────────────────────────────────────
function createSplash() {
  const splash = new BrowserWindow({
    width: 440, height: 300,
    frame: false,
    alwaysOnTop: true,
    backgroundColor: '#0f172a',
    resizable: false,
    center: true,
    skipTaskbar: true,
  })

  splash.loadURL(`data:text/html;charset=utf-8,<!DOCTYPE html>
<html lang="fr">
<head><meta charset="utf-8">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    background:#0f172a; display:flex; flex-direction:column;
    align-items:center; justify-content:center; height:100vh;
    font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
    color:white; padding:30px;
  }
  .logo { width:70px;height:70px;background:#1a56db;border-radius:18px;
    display:flex;align-items:center;justify-content:center;
    font-size:36px;font-weight:800;margin-bottom:18px;
    box-shadow:0 8px 32px rgba(26,86,219,0.4); }
  h1 { font-size:26px;font-weight:800;margin-bottom:6px; }
  .sub { font-size:13px;color:#64748b;margin-bottom:6px; }
  .subtitle { font-size:12px;color:#475569;margin-bottom:28px; }
  .bar-wrap { width:260px;height:5px;background:#1e293b;border-radius:3px;overflow:hidden;margin-bottom:18px; }
  .bar { height:100%;background:linear-gradient(90deg,#1a56db,#3b82f6);
    border-radius:3px;animation:pulse 1.4s ease-in-out infinite alternate; }
  .info { font-size:11px;color:#334155;text-align:center;line-height:1.6; }
  .badge { display:inline-block;background:#1e293b;color:#60a5fa;
    padding:2px 8px;border-radius:4px;font-size:10px;font-weight:600;margin-top:6px; }
  @keyframes pulse { from{opacity:0.6;transform:scaleX(0.7)} to{opacity:1;transform:scaleX(1)} }
</style>
</head>
<body>
  <div class="logo">F</div>
  <h1>FactureStock</h1>
  <div class="sub">Gestion commerciale — Maroc</div>
  <div class="subtitle">Démarrage du serveur intégré...</div>
  <div class="bar-wrap"><div class="bar"></div></div>
  <div class="info">
    Node.js intégré — Aucune installation requise<br>
    <span class="badge">Standalone · Windows x64</span>
  </div>
</body>
</html>`)

  return splash
}

// ─── App lifecycle ────────────────────────────────────────────────────────────
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

    // Show network info dialog on first launch (production only)
    if (!IS_DEV) {
      setTimeout(() => {
        if (mainWindow) {
          dialog.showMessageBox(mainWindow, {
            type: 'info',
            title: 'FactureStock — Serveur démarré ✓',
            message: '✓ FactureStock est actif !',
            detail:
              `Ce PC (serveur) :\nhttp://localhost:${PORT}\n\n` +
              `Autres PC du réseau local :\nhttp://${localIP}:${PORT}\n\n` +
              `Sur chaque autre PC, ouvrez Chrome ou Edge et entrez cette adresse.\n\n` +
              `Note : Node.js est intégré — aucune installation requise sur les autres PC.`,
            buttons: ['Compris'],
            defaultId: 0,
          })
        }
      }, 1500)
    }

  } catch (err) {
    dialog.showErrorBox('Erreur de démarrage — FactureStock', String(err))
    app.quit()
  }
})

// Keep app running in tray when window is closed (server stays active)
app.on('window-all-closed', () => {
  // Do NOT quit — keep running in system tray so the server stays alive
  // Other PCs can still connect even if the window is closed
})

app.on('before-quit', () => {
  if (nextServer) {
    nextServer.kill('SIGTERM')
    nextServer = null
  }
})

// Re-open window when clicking app icon (macOS)
app.on('activate', () => {
  if (!mainWindow) createWindow(getLocalIP())
})
