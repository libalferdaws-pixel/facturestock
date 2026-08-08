import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const produits = sqliteTable('produits', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  reference: text('reference').notNull(),
  designation: text('designation').notNull(),
  codeBarres: text('code_barres'),
  categorie: text('categorie'),
  unite: text('unite').notNull().default('pcs'),
  prixAchat: real('prix_achat').notNull().default(0),
  prixVente: real('prix_vente').notNull().default(0),
  tva: real('tva').notNull().default(20),
  stockActuel: real('stock_actuel').notNull().default(0),
  stockMinimum: real('stock_minimum').notNull().default(0),
  createdAt: text('created_at').notNull().default(''),
})
