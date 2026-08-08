import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core'

export const fournisseurs = sqliteTable('fournisseurs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nom: text('nom').notNull(),
  ice: text('ice'),
  rc: text('rc'),
  telephone: text('telephone'),
  email: text('email'),
  adresse: text('adresse'),
  ville: text('ville'),
  createdAt: text('created_at').notNull().default(''),
})
