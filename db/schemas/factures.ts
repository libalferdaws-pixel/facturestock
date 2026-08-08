import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { clients } from './clients'

export const factures = sqliteTable('factures', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  numero: text('numero').notNull().unique(),
  clientId: integer('client_id').references(() => clients.id),
  clientNom: text('client_nom').notNull(),
  date: text('date').notNull(),
  echeance: text('echeance'),
  statut: text('statut').notNull().default('brouillon'), // brouillon, envoyee, payee, annulee
  sousTotal: real('sous_total').notNull().default(0),
  totalTva: real('total_tva').notNull().default(0),
  total: real('total').notNull().default(0),
  montantPaye: real('montant_paye').notNull().default(0),
  devise: text('devise').notNull().default('MAD'),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(''),
})

export const factureItems = sqliteTable('facture_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  factureId: integer('facture_id').notNull().references(() => factures.id, { onDelete: 'cascade' }),
  produitId: integer('produit_id'),
  reference: text('reference'),
  designation: text('designation').notNull(),
  quantite: real('quantite').notNull().default(1),
  prixUnitaire: real('prix_unitaire').notNull().default(0),
  tva: real('tva').notNull().default(20),
  total: real('total').notNull().default(0),
})
