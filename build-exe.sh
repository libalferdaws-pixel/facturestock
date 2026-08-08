#!/bin/bash
# Script pour générer l'installateur FactureStock.exe
# Lancer : bash build-exe.sh

set -e
echo "🔧 Construction de FactureStock..."

# 1. Vérifier les dépendances
if ! command -v node &> /dev/null; then
    echo "❌ Node.js n'est pas installé. Téléchargez-le sur https://nodejs.org"
    exit 1
fi

if ! command -v pnpm &> /dev/null; then
    echo "📦 Installation de pnpm..."
    npm install -g pnpm
fi

# 2. Installer les dépendances
echo "📦 Installation des dépendances..."
pnpm install

# 3. Build Next.js
echo "🏗️  Build Next.js..."
pnpm build

# 4. Init base de données
echo "🗄️  Initialisation base de données..."
node --import tsx db/migrate.ts || true

# 5. Build Electron
echo "📦 Génération du fichier .exe..."
pnpm exec electron-builder --win --x64

echo ""
echo "✅ Terminé ! Fichier installateur :"
ls dist-electron/*.exe 2>/dev/null || echo "   dist-electron/FactureStock-Setup-1.0.0.exe"
echo ""
echo "Double-cliquez sur le fichier .exe pour installer FactureStock sur votre PC."
