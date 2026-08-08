import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { fournisseurs } from './fournisseurs'

export const bonsLivraison = sqliteTable('bons_livraison', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  numero: text('numero').notNull().unique(),
  fournisseurId: integer('fournisseur_id').references(() => fournisseurs.id),
  fournisseurNom: text('fournisseur_nom').notNull(),
  date: text('date').notNull(),
  statut: text('statut').notNull().default('recu'), // recu, partiel, annule
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(''),
})

export const bonLivraisonItems = sqliteTable('bon_livraison_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  bonId: integer('bon_id').notNull().references(() => bonsLivraison.id, { onDelete: 'cascade' }),
  produitId: integer('produit_id'),
  reference: text('reference'),
  designation: text('designation').notNull(),
  quantite: real('quantite').notNull().default(1),
  prixUnitaire: real('prix_unitaire').notNull().default(0),
  total: real('total').notNull().default(0),
})
