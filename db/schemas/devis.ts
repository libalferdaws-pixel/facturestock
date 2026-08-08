import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { clients } from './clients'

export const devis = sqliteTable('devis', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  numero: text('numero').notNull().unique(),
  clientId: integer('client_id').references(() => clients.id),
  clientNom: text('client_nom').notNull(),
  date: text('date').notNull(),
  validite: text('validite'),
  statut: text('statut').notNull().default('en_attente'), // en_attente, accepte, refuse, converti
  sousTotal: real('sous_total').notNull().default(0),
  totalTva: real('total_tva').notNull().default(0),
  total: real('total').notNull().default(0),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(''),
})

export const devisItems = sqliteTable('devis_items', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  devisId: integer('devis_id').notNull().references(() => devis.id, { onDelete: 'cascade' }),
  produitId: integer('produit_id'),
  reference: text('reference'),
  designation: text('designation').notNull(),
  quantite: real('quantite').notNull().default(1),
  prixUnitaire: real('prix_unitaire').notNull().default(0),
  tva: real('tva').notNull().default(20),
  total: real('total').notNull().default(0),
})
