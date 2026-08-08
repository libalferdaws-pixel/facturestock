export function formatMontant(montant: number): string {
  return new Intl.NumberFormat('fr-MA', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(montant) + ' DH'
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('fr-MA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function today(): string {
  return new Date().toISOString().split('T')[0]
}

export function nowISO(): string {
  return new Date().toISOString()
}

export function genNumeroFacture(dernier: number): string {
  const annee = new Date().getFullYear()
  return `FAC-${annee}-${String(dernier + 1).padStart(4, '0')}`
}

export function genNumeroDevis(dernier: number): string {
  const annee = new Date().getFullYear()
  return `DEV-${annee}-${String(dernier + 1).padStart(4, '0')}`
}

export function genNumeroBon(dernier: number): string {
  const annee = new Date().getFullYear()
  return `BL-${annee}-${String(dernier + 1).padStart(4, '0')}`
}

export function calcItems(items: { quantite?: number; qte?: number; prixUnitaire: number; tva?: number }[]) {
  let sousTotal = 0
  let totalTva = 0
  for (const item of items) {
    const qty = item.qte ?? item.quantite ?? 1
    const ht = qty * item.prixUnitaire
    sousTotal += ht
    totalTva += ht * ((item.tva || 0) / 100)
  }
  return { sousTotal, totalTva, total: sousTotal + totalTva }
}
