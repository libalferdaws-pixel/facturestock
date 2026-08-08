import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const caisse = sqliteTable('caisse', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  numero: text('numero').notNull().unique(),
  date: text('date').notNull(),
  clientNom: text('client_nom').notNull().default('Client'),
  total: real('total').notNull().default(0),
  montantRecu: real('montant_recu').notNull().default(0),
  monnaie: real('monnaie').notNull().default(0),
  modePaiement: text('mode_paiement').notNull().default('especes'),
  utilisateurId: integer('utilisateur_id'),
  devise: text('devise').notNull().default('MAD'),
  createdAt: text('created_at').notNull().default(''),
})

export const caisseItems = sqliteTable('caisse_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  caisseId: integer('caisse_id').notNull(),
  produitId: integer('produit_id'),
  reference: text('reference'),
  designation: text('designation').notNull(),
  quantite: real('quantite').notNull().default(1),
  prixUnitaire: real('prix_unitaire').notNull().default(0),
  tva: real('tva').notNull().default(20),
  total: real('total').notNull().default(0),
})
