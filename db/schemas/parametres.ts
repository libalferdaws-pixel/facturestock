import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'

export const parametres = sqliteTable('parametres', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  cle: text('cle').notNull().unique(),
  valeur: text('valeur').notNull().default(''),
})

// Keys: nom_societe, adresse, ville, telephone, email, ice, rc, logo_base64,
//       devise_defaut, tva_defaut, note_facture, note_devis, prefixe_facture,
//       prefixe_devis, prefixe_bon, backup_auto, backup_path, next_facture_num,
//       next_devis_num, next_bon_num
