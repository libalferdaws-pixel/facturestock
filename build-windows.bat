@echo off
chcp 65001 > nul
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║          FactureStock — Build Windows Standalone             ║
echo ║   Aucun Node.js requis sur le PC de destination             ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.

:: Vérifier que pnpm est disponible
where pnpm >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERREUR] pnpm non trouvé. Installez-le avec: npm install -g pnpm
  echo          Ou via: https://pnpm.io/installation
  pause
  exit /b 1
)

:: Vérifier que Node.js est disponible (nécessaire pour build, pas pour l'utilisateur final)
where node >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERREUR] Node.js non trouvé sur ce PC de BUILD.
  echo          Téléchargez Node.js LTS : https://nodejs.org/
  echo.
  echo          Note: Node.js est requis SEULEMENT pour compiler FactureStock.
  echo          L'installateur .exe final n'a PAS besoin de Node.js sur le PC cible.
  pause
  exit /b 1
)

echo [1/4] Installation des dépendances...
call pnpm install
if %errorlevel% neq 0 (
  echo [ERREUR] pnpm install a échoué.
  echo.
  echo Si better-sqlite3 échoue, installez Visual C++ Build Tools:
  echo https://visualstudio.microsoft.com/visual-cpp-build-tools/
  echo Sélectionnez: "Développement Desktop en C++"
  pause
  exit /b 1
)

echo.
echo [2/4] Build Next.js (production)...
call pnpm build
if %errorlevel% neq 0 (
  echo [ERREUR] next build a échoué.
  pause
  exit /b 1
)

echo.
echo [3/4] Packaging Electron (standalone Windows x64)...
echo       Node.js sera EMBARQUÉ dans l'installateur...
call pnpm electron:build
if %errorlevel% neq 0 (
  echo [ERREUR] electron-builder a échoué.
  pause
  exit /b 1
)

echo.
echo [4/4] ✓ Build terminé !
echo.
echo ╔══════════════════════════════════════════════════════════════╗
echo ║  Installateur créé dans : dist-electron\                    ║
echo ║  Fichier : FactureStock-Setup-1.0.0.exe                     ║
echo ║                                                              ║
echo ║  STANDALONE : Node.js intégré dans l'installateur           ║
echo ║  L'utilisateur final n'a rien d'autre à installer !         ║
echo ╚══════════════════════════════════════════════════════════════╝
echo.
explorer dist-electron
pause
