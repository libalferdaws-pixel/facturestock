import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const achats = sqliteTable('achats', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  numero: text('numero').notNull().unique(),
  fournisseurId: integer('fournisseur_id'),
  fournisseurNom: text('fournisseur_nom').notNull(),
  date: text('date').notNull(),
  echeance: text('echeance'),
  statut: text('statut').notNull().default('recu'), // recu, partiel, paye, annule
  sousTotal: real('sous_total').notNull().default(0),
  totalTva: real('total_tva').notNull().default(0),
  total: real('total').notNull().default(0),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(''),
})

export const achatItems = sqliteTable('achat_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  achatId: integer('achat_id').notNull(),
  produitId: integer('produit_id'),
  reference: text('reference'),
  designation: text('designation').notNull(),
  quantite: real('quantite').notNull().default(1),
  prixUnitaire: real('prix_unitaire').notNull().default(0),
  tva: real('tva').notNull().default(20),
  total: real('total').notNull().default(0),
})
