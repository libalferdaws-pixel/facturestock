import { NextRequest, NextResponse } from 'next/server'
import { getDb } from '@/db/sqlite'
import { factures, factureItems, clients, produits } from '@/db/schemas'
import * as XLSX from 'xlsx'

export async function GET(req: NextRequest) {
  try {
    const db = getDb()
    const type = req.nextUrl.searchParams.get('type') || 'factures'

    let data: Record<string, unknown>[] = []
    let sheetName = 'Données'

    if (type === 'factures') {
      const list = await db.select().from(factures)
      data = list.map(f => ({
        'Numéro': f.numero, 'Client': f.clientNom, 'Date': f.date,
        'Échéance': f.echeance || '', 'Statut': f.statut,
        'Sous-total HT': f.sousTotal, 'TVA': f.totalTva, 'Total TTC': f.total,
        'Montant payé': f.montantPaye || 0, 'Devise': f.devise,
      }))
      sheetName = 'Factures'
    } else if (type === 'clients') {
      const list = await db.select().from(clients)
      data = list.map(c => ({
        'Nom': c.nom, 'ICE': c.ice || '', 'RC': c.rc || '',
        'Téléphone': c.telephone || '', 'Email': c.email || '',
        'Ville': c.ville || '', 'Adresse': c.adresse || '',
      }))
      sheetName = 'Clients'
    } else if (type === 'produits') {
      const list = await db.select().from(produits)
      data = list.map(p => ({
        'Référence': p.reference, 'Désignation': p.designation,
        'Code-barres': p.codeBarres || '', 'Catégorie': p.categorie || '',
        'Unité': p.unite, "Prix d'achat": p.prixAchat, 'Prix de vente': p.prixVente,
        'TVA%': p.tva, 'Stock actuel': p.stockActuel, 'Stock minimum': p.stockMinimum,
      }))
      sheetName = 'Produits'
    }

    const wb = XLSX.utils.book_new()
    const ws = XLSX.utils.json_to_sheet(data)
    XLSX.utils.book_append_sheet(wb, ws, sheetName)
    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' })

    return new NextResponse(buf, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${sheetName}-${new Date().toISOString().split('T')[0]}.xlsx"`,
      },
    })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}

// Import produits from Excel
export async function POST(req: NextRequest) {
  try {
    const db = getDb()
    const formData = await req.formData()
    const file = formData.get('file') as File
    if (!file) return NextResponse.json({ success: false, error: 'Fichier manquant' }, { status: 400 })

    const buf = await file.arrayBuffer()
    const wb = XLSX.read(buf, { type: 'buffer' })
    const ws = wb.Sheets[wb.SheetNames[0]]
    const rows = XLSX.utils.sheet_to_json(ws) as Record<string, unknown>[]

    let imported = 0
    for (const row of rows) {
      const designation = String(row['Désignation'] || row['designation'] || '')
      if (!designation) continue
      await db.insert(produits).values({
        reference: String(row['Référence'] || row['reference'] || `IMPORT-${Date.now()}`),
        designation,
        codeBarres: String(row['Code-barres'] || row['code_barres'] || '') || null,
        categorie: String(row['Catégorie'] || '') || null,
        unite: String(row['Unité'] || 'pcs'),
        prixAchat: Number(row["Prix d'achat"] || 0),
        prixVente: Number(row['Prix de vente'] || 0),
        tva: Number(row['TVA%'] || 20),
        stockActuel: Number(row['Stock actuel'] || 0),
        stockMinimum: Number(row['Stock minimum'] || 0),
        createdAt: new Date().toISOString(),
      }).onConflictDoNothing()
      imported++
    }

    return NextResponse.json({ success: true, data: { imported } })
  } catch (e) {
    return NextResponse.json({ success: false, error: String(e) }, { status: 500 })
  }
}
