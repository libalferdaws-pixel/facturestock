@echo off
chcp 65001 > nul
echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║      FactureStock — Build Windows Standalone (.exe)             ║
echo ║   Node.js embarqué dans Electron — Aucune installation requise  ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
echo Architecture du build standalone:
echo   pnpm build     → Next.js compile en mode "output: standalone"
echo                    .next/standalone/server.js  (serveur minimal)
echo                    .next/standalone/node_modules/  (deps seulement)
echo   post-build.js  → Copie .next/static + public/ dans standalone/
echo   electron-builder → Emballe tout dans FactureStock-Setup.exe
echo.
echo L'installateur final = Electron + Node.js integre + server.js
echo Taille estimee: 120-160 MB
echo.

:: Vérifier pnpm
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERREUR] pnpm non trouve. Installez: npm install -g pnpm
  pause & exit /b 1
)

:: Vérifier Node.js (requis uniquement pour ce build, pas pour l'utilisateur final)
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERREUR] Node.js non trouve sur ce PC de BUILD.
  echo          Telechargez: https://nodejs.org/  (version LTS recommandee)
  echo.
  echo          Note: Node.js est UNIQUEMENT requis sur ce PC pour compiler.
  echo          L'exe final n'a PAS besoin de Node.js sur le PC cible.
  pause & exit /b 1
)

echo [1/5] Installation des dependances (pnpm install)...
call pnpm install
if %errorlevel% neq 0 (
  echo.
  echo [ERREUR] pnpm install a echoue.
  echo.
  echo Si l'erreur concerne better-sqlite3 (module natif C++), installez:
  echo   Visual C++ Build Tools 2022
  echo   https://visualstudio.microsoft.com/visual-cpp-build-tools/
  echo   Cocher: "Developpement Desktop en C++"
  echo.
  echo Puis relancez ce script.
  pause & exit /b 1
)

echo.
echo [2/5] Build Next.js standalone (next build)...
call pnpm build
if %errorlevel% neq 0 (
  echo [ERREUR] next build a echoue. Verifiez les erreurs ci-dessus.
  pause & exit /b 1
)

echo.
echo [3/5] Copie assets statiques dans .next/standalone/ (post-build)...
node scripts/post-build.js
if %errorlevel% neq 0 (
  echo [ERREUR] post-build.js a echoue.
  pause & exit /b 1
)

echo.
echo [4/5] Initialisation base de donnees SQLite...
call pnpm db:init
if %errorlevel% neq 0 (
  echo [ERREUR] db:init a echoue.
  pause & exit /b 1
)

echo.
echo [5/5] Packaging Electron — creation de l'installateur Windows x64...
echo       (Telechargement Electron si premier build — peut prendre 2-3 min)
call pnpm exec electron-builder --win --x64
if %errorlevel% neq 0 (
  echo [ERREUR] electron-builder a echoue.
  pause & exit /b 1
)

echo.
echo ╔══════════════════════════════════════════════════════════════════╗
echo ║  Build termine avec succes !                                    ║
echo ║                                                                  ║
echo ║  Installateur: dist-electron\FactureStock-Setup-1.0.0.exe       ║
echo ║                                                                  ║
echo ║  STANDALONE — Contenu de l'exe:                                 ║
echo ║    • Electron (Chrome + Node.js integre)                        ║
echo ║    • .next/standalone/server.js  (serveur Next.js minimal)      ║
echo ║    • better-sqlite3.node  (module natif SQLite)                 ║
echo ║    • Port 13000 ouvert automatiquement dans le pare-feu         ║
echo ║                                                                  ║
echo ║  Sur le PC cible: juste double-cliquer l'installateur.          ║
echo ║  Node.js n'est PAS requis sur le PC de destination.             ║
echo ╚══════════════════════════════════════════════════════════════════╝
echo.
if exist dist-electron (
  explorer dist-electron
)
pause
