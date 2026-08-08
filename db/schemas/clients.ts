import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const clients = sqliteTable('clients', {
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
