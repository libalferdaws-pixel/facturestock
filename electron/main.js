const { app, BrowserWindow, dialog, shell, Menu, Tray, nativeImage } = require('electron')
const { spawn } = require('child_process')
const path = require('path')
const http = require('http')
const os = require('os')

const PORT = 13000
const IS_DEV = process.env.NODE_ENV === 'development' || !app.isPackaged

let mainWindow
let nextServer
let tray

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

// ─── Start Next.js server (listen on 0.0.0.0 = toutes interfaces réseau) ─────
function startNextServer() {
  return new Promise((resolve, reject) => {
    if (IS_DEV) {
      resolve()
      return
    }

    const serverPath = path.join(process.resourcesPath, 'app')
    const dataDir = path.join(app.getPath('userData'), 'facturestock-data')
    process.env.DATA_DIR = dataDir
    process.env.PORT = String(PORT)
    process.env.NODE_ENV = 'production'
    // Listen on all interfaces so other PCs on the network can connect
    process.env.HOSTNAME = '0.0.0.0'

    nextServer = spawn(process.execPath, [
      path.join(serverPath, 'node_modules', 'next', 'dist', 'bin', 'next'),
      'start',
      '-p', String(PORT),
      '-H', '0.0.0.0',
    ], {
      cwd: serverPath,
      env: { ...process.env },
      stdio: 'pipe',
    })

    nextServer.stdout.on('data', d => console.log('[Next]', d.toString()))
    nextServer.stderr.on('data', d => console.error('[Next err]', d.toString()))
    nextServer.on('error', err => reject(err))

    waitForServer(resolve, reject, 60)
  })
}

function waitForServer(resolve, reject, retries) {
  if (retries <= 0) {
    reject(new Error('Next.js server did not démarrer dans les temps'))
    return
  }
  http.get(`http://localhost:${PORT}/api/health`, (res) => {
    if (res.statusCode === 200) resolve()
    else setTimeout(() => waitForServer(resolve, reject, retries - 1), 1000)
  }).on('error', () => {
    setTimeout(() => waitForServer(resolve, reject, retries - 1), 1000)
  })
}

// ─── System tray icon ─────────────────────────────────────────────────────────
function createTray(localIP) {
  const icon = nativeImage.createEmpty()
  tray = new Tray(icon)

  const menu = Menu.buildFromTemplate([
    {
      label: `FactureStock — Serveur actif`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: `📍 Accès local : http://localhost:${PORT}`,
      enabled: false,
    },
    {
      label: `🌐 Accès réseau : http://${localIP}:${PORT}`,
      enabled: false,
    },
    { type: 'separator' },
    {
      label: 'Ouvrir FactureStock',
      click: () => {
        if (mainWindow) mainWindow.show()
        else createWindow(localIP)
      },
    },
    {
      label: 'Copier l\'adresse réseau',
      click: () => {
        const { clipboard } = require('electron')
        clipboard.writeText(`http://${localIP}:${PORT}`)
        dialog.showMessageBox({ message: `Adresse copiée !\nhttp://${localIP}:${PORT}`, type: 'info' })
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
  tray.setTitle('FactureStock')
}

// ─── Create main window ───────────────────────────────────────────────────────
function createWindow(localIP) {
  const ip = localIP || getLocalIP()

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    title: 'FactureStock',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    show: false,
    backgroundColor: '#f8fafc',
  })

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })

  mainWindow.loadURL(`http://localhost:${PORT}`)

  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    mainWindow.focus()

    // Show network info banner after load
    setTimeout(() => {
      mainWindow.webContents.executeJavaScript(`
        (() => {
          const existing = document.getElementById('fs-network-banner')
          if (existing) return
          const banner = document.createElement('div')
          banner.id = 'fs-network-banner'
          banner.style.cssText = 'position:fixed;bottom:16px;right:16px;background:#0f172a;color:white;padding:10px 16px;border-radius:10px;font-size:12px;z-index:9999;font-family:sans-serif;box-shadow:0 4px 20px rgba(0,0,0,0.3);cursor:pointer;'
          banner.innerHTML = '<div style="font-weight:700;margin-bottom:4px">🌐 Serveur actif sur le réseau</div><div style="color:#94a3b8">Autres PC : <span style="color:#60a5fa;font-weight:600">http://${ip}:${PORT}</span></div>'
          banner.onclick = () => banner.remove()
          document.body.appendChild(banner)
          setTimeout(() => banner && banner.remove(), 10000)
        })()
      `).catch(() => {})
    }, 2000)
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// ─── Splash screen ────────────────────────────────────────────────────────────
function createSplash(localIP) {
  const splash = new BrowserWindow({
    width: 420, height: 280,
    frame: false,
    alwaysOnTop: true,
    backgroundColor: '#0f172a',
    resizable: false,
  })

  splash.loadURL(`data:text/html;charset=utf-8,<!DOCTYPE html>
<html>
<body style="background:%230f172a;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;font-family:sans-serif;color:white;margin:0;padding:20px;box-sizing:border-box">
  <div style="width:64px;height:64px;background:%231a56db;border-radius:16px;display:flex;align-items:center;justify-content:center;font-size:32px;font-weight:bold;margin-bottom:16px">F</div>
  <div style="font-size:24px;font-weight:800;margin-bottom:4px">FactureStock</div>
  <div style="font-size:13px;color:%2394a3b8;margin-bottom:24px">Démarrage du serveur...</div>
  <div style="width:240px;height:4px;background:%231e293b;border-radius:2px;overflow:hidden;margin-bottom:20px">
    <div style="width:100%;height:100%;background:linear-gradient(90deg,%231a56db,%2360a5fa);border-radius:2px;animation:slide 1.5s ease-in-out infinite alternate"></div>
  </div>
  <div style="font-size:11px;color:%23475569;text-align:center">
    Ce PC devient le serveur.<br>Les autres PC se connecteront via le réseau.
  </div>
  <style>@keyframes slide{from{transform:translateX(-100%)}to{transform:translateX(0)}}</style>
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
      splash = createSplash(localIP)
      await startNextServer()
      splash.close()
    }

    createTray(localIP)
    createWindow(localIP)

    // Show network access dialog on first launch
    if (!IS_DEV) {
      setTimeout(() => {
        dialog.showMessageBox(mainWindow, {
          type: 'info',
          title: 'FactureStock — Serveur démarré',
          message: 'FactureStock est actif sur votre réseau local !',
          detail:
            `Ce PC (serveur) : http://localhost:${PORT}\n\n` +
            `Autres PC du réseau :\nhttp://${localIP}:${PORT}\n\n` +
            `Sur chaque autre PC, ouvrez un navigateur et entrez cette adresse.\n` +
            `Assurez-vous que le pare-feu Windows autorise le port ${PORT}.`,
          buttons: ['OK, compris'],
        })
      }, 1500)
    }

  } catch (err) {
    dialog.showErrorBox('Erreur de démarrage', String(err))
    app.quit()
  }
})

app.on('window-all-closed', (e) => {
  // On Windows/Linux, keep running in tray even if window is closed
  if (process.platform !== 'darwin') {
    e.preventDefault && e.preventDefault()
    // App stays alive in system tray — server keeps running
  }
})

app.on('before-quit', () => {
  if (nextServer) nextServer.kill()
})
