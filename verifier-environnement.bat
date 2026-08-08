@echo off
chcp 65001 > nul
echo.
echo ====================================================
echo  FactureStock — Verification de l'environnement
echo ====================================================
echo.

:: Check Node.js
node --version >nul 2>&1
if %errorlevel% equ 0 (
  echo [OK] Node.js : 
  node --version
) else (
  echo [MANQUANT] Node.js — Telechargez sur https://nodejs.org/
)

:: Check pnpm
pnpm --version >nul 2>&1
if %errorlevel% equ 0 (
  echo [OK] pnpm :
  pnpm --version
) else (
  echo [MANQUANT] pnpm — Installez avec: npm install -g pnpm
)

:: Check Git
git --version >nul 2>&1
if %errorlevel% equ 0 (
  echo [OK] Git :
  git --version
) else (
  echo [MANQUANT] Git — Telechargez sur https://git-scm.com/
)

:: Check Visual C++ (needed for better-sqlite3 native build)
reg query "HKLM\SOFTWARE\Microsoft\VisualStudio\14.0" >nul 2>&1
if %errorlevel% equ 0 (
  echo [OK] Visual C++ Build Tools detecte
) else (
  reg query "HKLM\SOFTWARE\Wow6432Node\Microsoft\VisualStudio\14.0" >nul 2>&1
  if %errorlevel% equ 0 (
    echo [OK] Visual C++ Build Tools detecte (32-bit registry)
  ) else (
    echo [INFO] Visual C++ Build Tools non detecte dans le registre
    echo        Si pnpm install echoue sur better-sqlite3, installez:
    echo        https://visualstudio.microsoft.com/visual-cpp-build-tools/
    echo        Selection requise: "Developpement Desktop en C++"
  )
)

echo.
echo ====================================================
echo  Si tout est [OK], lancez: build-windows.bat
echo ====================================================
echo.
pause
