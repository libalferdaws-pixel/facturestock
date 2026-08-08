# FactureStock — Mode Réseau Local (Multi-PC)

## Architecture

```
                    RÉSEAU LOCAL (Wi-Fi ou câble)
                           │
          ┌────────────────┼────────────────┐
          │                │                │
   [PC SERVEUR]      [PC Client 1]    [PC Client 2]
   FactureStock       Navigateur       Navigateur
   installé          web seulement    web seulement
   Port 13000
```

## Sur le PC Serveur (1 seul PC)

### Installer FactureStock
```bash
pnpm install
pnpm electron:build
```
Installez `dist-electron/FactureStock-Setup-1.0.0.exe`

### Ouvrir le pare-feu Windows
Double-cliquez sur `ouvrir-port-reseau.bat` en tant qu'**Administrateur**.

### Trouver l'adresse IP du serveur
```
ipconfig
```
Notez l'**Adresse IPv4** — exemple : `192.168.1.10`

### Lancer FactureStock
Double-cliquez sur l'icône de bureau. Une notification affichera l'adresse réseau.

---

## Sur les autres PC (clients)

**Aucune installation nécessaire !**

Ouvrez simplement un navigateur (Chrome, Firefox, Edge) et tapez :
```
http://192.168.1.10:13000
```
*(remplacez `192.168.1.10` par l'IP réelle du PC serveur)*

C'est tout ! Tous les PC accèdent aux mêmes factures, clients et stock.

---

## Conseils

- Le **PC serveur doit rester allumé** tant que les autres PC travaillent
- Donnez une **IP fixe** au PC serveur dans votre box/routeur
- L'app fonctionne avec **Chrome, Firefox, Edge** sur les PC clients
- Les données sont sauvegardées uniquement sur le PC serveur
