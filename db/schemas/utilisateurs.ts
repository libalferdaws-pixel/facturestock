import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const utilisateurs = sqliteTable('utilisateurs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  nom: text('nom').notNull(),
  email: text('email').notNull().unique(),
  motDePasse: text('mot_de_passe').notNull(),
  role: text('role').notNull().default('vendeur'), // admin, caissier, vendeur, lecture
  actif: integer('actif').notNull().default(1),
  createdAt: text('created_at').notNull().default(''),
})
