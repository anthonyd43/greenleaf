export function parseAmountToCents(s: string): number {
  const cleaned = s.replace(/[$,\s]/g, '')
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) throw new Error(`invalid amount: ${s}`)
  const [dollars, frac = ''] = cleaned.split('.')
  return Number(dollars) * 100 + Number(frac.padEnd(2, '0') || 0)
}

export function formatCents(c: number): string {
  const sign = c < 0 ? '-' : ''
  const abs = Math.abs(c)
  return `${sign}$${Math.floor(abs / 100)}.${String(abs % 100).padStart(2, '0')}`
}
