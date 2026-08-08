import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const avoirs = sqliteTable('avoirs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  numero: text('numero').notNull().unique(),
  factureId: integer('facture_id'),
  clientId: integer('client_id'),
  clientNom: text('client_nom').notNull(),
  date: text('date').notNull(),
  motif: text('motif'),
  sousTotal: real('sous_total').notNull().default(0),
  totalTva: real('total_tva').notNull().default(0),
  total: real('total').notNull().default(0),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(''),
})

export const avoirItems = sqliteTable('avoir_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  avoirId: integer('avoir_id').notNull(),
  produitId: integer('produit_id'),
  reference: text('reference'),
  designation: text('designation').notNull(),
  quantite: real('quantite').notNull().default(1),
  prixUnitaire: real('prix_unitaire').notNull().default(0),
  tva: real('tva').notNull().default(20),
  total: real('total').notNull().default(0),
})
