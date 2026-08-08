import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const paiements = sqliteTable('paiements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  factureId: integer('facture_id'),
  clientId: integer('client_id'),
  clientNom: text('client_nom').notNull().default(''),
  montant: real('montant').notNull().default(0),
  mode: text('mode').notNull().default('especes'), // especes, cheque, virement, carte
  reference: text('reference'), // numéro chèque, etc.
  date: text('date').notNull(),
  notes: text('notes'),
  createdAt: text('created_at').notNull().default(''),
})
