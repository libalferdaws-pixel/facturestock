# FactureStock — Guide d'installation

## Option 1 : Générer le fichier .exe (recommandé)

### Prérequis
- Node.js 20+ : https://nodejs.org
- pnpm : `npm install -g pnpm`

### Étapes

```bash
# 1. Cloner ou extraire le projet
cd facturestock

# 2. Installer les dépendances
pnpm install

# 3. Construire l'app
pnpm electron:build
```

Le fichier **FactureStock-Setup-1.0.0.exe** sera généré dans le dossier `dist-electron/`.

Double-cliquez dessus pour l'installer sur votre PC Windows.

---

## Option 2 : Lancer sans installer (mode développement)

```bash
pnpm install
pnpm electron:dev
```

---

## Données

Les données sont sauvegardées automatiquement dans :
- **Windows** : `C:\Users\[votre nom]\AppData\Roaming\FactureStock\facturestock-data\`
- **Linux** : `~/.config/FactureStock/facturestock-data/`

---

## Fonctionnalités

- ✅ Factures (DH, TVA Maroc)
- ✅ Devis / bons de commande
- ✅ Clients avec ICE / RC
- ✅ Fournisseurs
- ✅ Gestion du stock avec alertes
- ✅ Bons de livraison fournisseur
- ✅ Tableau de bord
- ✅ Impression / export PDF (via navigateur)
- ✅ Interface bilingue Français / Arabe
- ✅ Code-barres sur les produits
