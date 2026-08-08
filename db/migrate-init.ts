// db/migrate-init.ts
// Called from instrumentation.ts — runs database migration once at server startup
// Works with Next.js standalone server (no tsx needed, compiled by Next.js)
import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import bcrypt from 'bcryptjs'

export async function runMigration() {
  try {
    const DATA_DIR = process.env.DATA_DIR || path.join(process.cwd(), 'data')
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true })
    const DB_PATH = path.join(DATA_DIR, 'facturestock.db')

    const sqlite = new Database(DB_PATH)
    sqlite.pragma('journal_mode = WAL')
    sqlite.pragma('foreign_keys = ON')

    sqlite.exec(`
      CREATE TABLE IF NOT EXISTS clients (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        ice TEXT, rc TEXT, telephone TEXT, email TEXT, adresse TEXT, ville TEXT,
        created_at TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS fournisseurs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        ice TEXT, rc TEXT, telephone TEXT, email TEXT, adresse TEXT, ville TEXT,
        created_at TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS produits (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        reference TEXT NOT NULL,
        designation TEXT NOT NULL,
        code_barres TEXT,
        categorie TEXT,
        unite TEXT NOT NULL DEFAULT 'pcs',
        prix_achat REAL NOT NULL DEFAULT 0,
        prix_vente REAL NOT NULL DEFAULT 0,
        tva REAL NOT NULL DEFAULT 20,
        stock_actuel REAL NOT NULL DEFAULT 0,
        stock_minimum REAL NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS factures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero TEXT NOT NULL UNIQUE,
        client_id INTEGER REFERENCES clients(id),
        client_nom TEXT NOT NULL,
        date TEXT NOT NULL,
        echeance TEXT,
        statut TEXT NOT NULL DEFAULT 'brouillon',
        sous_total REAL NOT NULL DEFAULT 0,
        total_tva REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        montant_paye REAL NOT NULL DEFAULT 0,
        devise TEXT NOT NULL DEFAULT 'MAD',
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS facture_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        facture_id INTEGER NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
        produit_id INTEGER,
        reference TEXT,
        designation TEXT NOT NULL,
        quantite REAL NOT NULL DEFAULT 1,
        prix_unitaire REAL NOT NULL DEFAULT 0,
        tva REAL NOT NULL DEFAULT 20,
        total REAL NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS devis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero TEXT NOT NULL UNIQUE,
        client_id INTEGER REFERENCES clients(id),
        client_nom TEXT NOT NULL,
        date TEXT NOT NULL,
        validite TEXT,
        statut TEXT NOT NULL DEFAULT 'en_attente',
        sous_total REAL NOT NULL DEFAULT 0,
        total_tva REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        devise TEXT NOT NULL DEFAULT 'MAD',
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS devis_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        devis_id INTEGER NOT NULL REFERENCES devis(id) ON DELETE CASCADE,
        produit_id INTEGER,
        reference TEXT,
        designation TEXT NOT NULL,
        quantite REAL NOT NULL DEFAULT 1,
        prix_unitaire REAL NOT NULL DEFAULT 0,
        tva REAL NOT NULL DEFAULT 20,
        total REAL NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS bons_livraison (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero TEXT NOT NULL UNIQUE,
        fournisseur_id INTEGER REFERENCES fournisseurs(id),
        fournisseur_nom TEXT NOT NULL,
        date TEXT NOT NULL,
        statut TEXT NOT NULL DEFAULT 'recu',
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS bon_livraison_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        bon_id INTEGER NOT NULL REFERENCES bons_livraison(id) ON DELETE CASCADE,
        produit_id INTEGER,
        reference TEXT,
        designation TEXT NOT NULL,
        quantite REAL NOT NULL DEFAULT 1,
        prix_unitaire REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS utilisateurs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nom TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        mot_de_passe TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'vendeur',
        actif INTEGER NOT NULL DEFAULT 1,
        created_at TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS parametres (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        cle TEXT NOT NULL UNIQUE,
        valeur TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS paiements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        facture_id INTEGER,
        client_id INTEGER,
        client_nom TEXT NOT NULL DEFAULT '',
        montant REAL NOT NULL DEFAULT 0,
        mode TEXT NOT NULL DEFAULT 'especes',
        reference TEXT,
        date TEXT NOT NULL,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS avoirs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero TEXT NOT NULL UNIQUE,
        facture_id INTEGER,
        client_id INTEGER,
        client_nom TEXT NOT NULL,
        date TEXT NOT NULL,
        motif TEXT,
        sous_total REAL NOT NULL DEFAULT 0,
        total_tva REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS avoir_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        avoir_id INTEGER NOT NULL REFERENCES avoirs(id) ON DELETE CASCADE,
        produit_id INTEGER,
        reference TEXT,
        designation TEXT NOT NULL,
        quantite REAL NOT NULL DEFAULT 1,
        prix_unitaire REAL NOT NULL DEFAULT 0,
        tva REAL NOT NULL DEFAULT 20,
        total REAL NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS caisse (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero TEXT NOT NULL UNIQUE,
        date TEXT NOT NULL,
        client_nom TEXT NOT NULL DEFAULT 'Client',
        total REAL NOT NULL DEFAULT 0,
        montant_recu REAL NOT NULL DEFAULT 0,
        monnaie REAL NOT NULL DEFAULT 0,
        mode_paiement TEXT NOT NULL DEFAULT 'especes',
        utilisateur_id INTEGER,
        devise TEXT NOT NULL DEFAULT 'MAD',
        created_at TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS caisse_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        caisse_id INTEGER NOT NULL REFERENCES caisse(id) ON DELETE CASCADE,
        produit_id INTEGER,
        reference TEXT,
        designation TEXT NOT NULL,
        quantite REAL NOT NULL DEFAULT 1,
        prix_unitaire REAL NOT NULL DEFAULT 0,
        tva REAL NOT NULL DEFAULT 20,
        total REAL NOT NULL DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS achats (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        numero TEXT NOT NULL UNIQUE,
        fournisseur_id INTEGER,
        fournisseur_nom TEXT NOT NULL,
        date TEXT NOT NULL,
        echeance TEXT,
        statut TEXT NOT NULL DEFAULT 'recu',
        sous_total REAL NOT NULL DEFAULT 0,
        total_tva REAL NOT NULL DEFAULT 0,
        total REAL NOT NULL DEFAULT 0,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT ''
      );

      CREATE TABLE IF NOT EXISTS achat_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        achat_id INTEGER NOT NULL REFERENCES achats(id) ON DELETE CASCADE,
        produit_id INTEGER,
        reference TEXT,
        designation TEXT NOT NULL,
        quantite REAL NOT NULL DEFAULT 1,
        prix_unitaire REAL NOT NULL DEFAULT 0,
        tva REAL NOT NULL DEFAULT 20,
        total REAL NOT NULL DEFAULT 0
      );
    `)

    // Seed default params
    const defaultParams: [string, string][] = [
      ['nom_societe', 'Mon Entreprise'],
      ['adresse', ''],
      ['ville', 'Casablanca'],
      ['telephone', ''],
      ['email', ''],
      ['ice', ''],
      ['rc', ''],
      ['logo_base64', ''],
      ['devise_defaut', 'MAD'],
      ['tva_defaut', '20'],
      ['note_facture', 'Merci pour votre confiance.'],
      ['note_devis', 'Devis valable 30 jours.'],
      ['prefixe_facture', 'FAC'],
      ['prefixe_devis', 'DEV'],
      ['prefixe_bon', 'BL'],
      ['backup_auto', '0'],
      ['backup_path', ''],
      ['next_facture_num', '1'],
      ['next_devis_num', '1'],
      ['next_bon_num', '1'],
      ['multi_devise', '0'],
    ]

    const insertParam = sqlite.prepare(`INSERT OR IGNORE INTO parametres (cle, valeur) VALUES (?, ?)`)
    for (const [k, v] of defaultParams) insertParam.run(k, v)

    // Seed default admin user
    const adminExists = sqlite.prepare(`SELECT id FROM utilisateurs WHERE email = 'admin@facturestock.ma'`).get()
    if (!adminExists) {
      const hash = bcrypt.hashSync('admin123', 10)
      sqlite.prepare(`
        INSERT INTO utilisateurs (nom, email, mot_de_passe, role, actif, created_at)
        VALUES (?, ?, ?, 'admin', 1, datetime('now'))
      `).run('Administrateur', 'admin@facturestock.ma', hash)
      console.log('[FactureStock] ✅ Utilisateur admin créé : admin@facturestock.ma / admin123')
    }

    sqlite.close()
    console.log('[FactureStock] ✅ Base de données initialisée (v2)')
  } catch (err) {
    console.error('[FactureStock] ❌ Erreur migration:', err)
    // Don't crash the server — DB might already exist
  }
}
