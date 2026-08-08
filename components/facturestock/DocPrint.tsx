'use client'
import { formatMontant, formatDate } from '@/lib/format'
import { Printer } from 'lucide-react'

interface Item {
  designation: string
  reference?: string | null
  quantite: number
  prixUnitaire: number
  tva: number
  total: number
}

interface DocPrintProps {
  type: 'Facture' | 'Devis' | 'Bon de livraison fournisseur'
  numero: string
  date: string
  clientNom?: string
  fournisseurNom?: string
  echeance?: string | null
  validite?: string | null
  items: Item[]
  sousTotal: number
  totalTva: number
  total: number
  notes?: string | null
  statut?: string
}

export function DocPrint(props: DocPrintProps) {
  const partieName = props.clientNom || props.fournisseurNom || '—'

  return (
    <div>
      <button
        onClick={() => window.print()}
        className="no-print flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors mb-4">
        <Printer className="w-4 h-4" />
        Imprimer / PDF
      </button>

      <div id="print-zone" className="bg-white p-8 rounded-xl border border-border max-w-3xl print:border-0 print:p-0">
        {/* En-tête */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-white font-bold">F</span>
              </div>
              <h1 className="text-xl font-bold text-foreground">FactureStock</h1>
            </div>
            <p className="text-sm text-muted-foreground">Maroc — Dirham (DH)</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-primary">{props.type}</h2>
            <p className="text-lg font-semibold text-foreground">{props.numero}</p>
            <p className="text-sm text-muted-foreground">Date: {formatDate(props.date)}</p>
            {props.echeance && <p className="text-sm text-muted-foreground">Échéance: {formatDate(props.echeance)}</p>}
            {props.validite && <p className="text-sm text-muted-foreground">Valide jusqu'au: {formatDate(props.validite)}</p>}
            {props.statut && (
              <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                {props.statut}
              </span>
            )}
          </div>
        </div>

        {/* Partie */}
        <div className="mb-6 p-4 bg-muted/40 rounded-lg">
          <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">
            {props.clientNom ? 'Client / الزبون' : 'Fournisseur / المورد'}
          </p>
          <p className="font-semibold text-foreground">{partieName}</p>
        </div>

        {/* Tableau des lignes */}
        <table className="w-full text-sm border-collapse mb-6">
          <thead>
            <tr className="bg-primary text-white">
              <th className="px-3 py-2 text-left rounded-tl-lg">Désignation / الوصف</th>
              <th className="px-3 py-2 text-center w-16">Qté</th>
              <th className="px-3 py-2 text-right w-28">P.U. HT</th>
              <th className="px-3 py-2 text-right w-16">TVA</th>
              <th className="px-3 py-2 text-right w-28 rounded-tr-lg">Total TTC</th>
            </tr>
          </thead>
          <tbody>
            {props.items.map((item, i) => (
              <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50'}>
                <td className="px-3 py-2 border-b border-border">
                  <p className="font-medium">{item.designation}</p>
                  {item.reference && <p className="text-xs text-muted-foreground">{item.reference}</p>}
                </td>
                <td className="px-3 py-2 text-center border-b border-border">{item.quantite}</td>
                <td className="px-3 py-2 text-right border-b border-border">{formatMontant(item.prixUnitaire)}</td>
                <td className="px-3 py-2 text-right border-b border-border text-muted-foreground">{item.tva}%</td>
                <td className="px-3 py-2 text-right border-b border-border font-semibold">{formatMontant(item.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totaux */}
        <div className="flex justify-end mb-6">
          <div className="w-64 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sous-total HT</span>
              <span>{formatMontant(props.sousTotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">TVA</span>
              <span>{formatMontant(props.totalTva)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t-2 border-primary pt-2">
              <span>Total TTC</span>
              <span className="text-primary">{formatMontant(props.total)}</span>
            </div>
          </div>
        </div>

        {props.notes && (
          <div className="border-t border-border pt-4">
            <p className="text-xs text-muted-foreground uppercase font-semibold mb-1">Notes</p>
            <p className="text-sm text-foreground whitespace-pre-line">{props.notes}</p>
          </div>
        )}

        <div className="mt-8 pt-4 border-t border-border text-center text-xs text-muted-foreground">
          <p>Document généré par FactureStock — Maroc</p>
        </div>
      </div>
    </div>
  )
}
