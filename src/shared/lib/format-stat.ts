/** Compact stat for trust/social-proof rows (e.g. 1.2k+, 50+) */
export function formatCompactStat(n: number, emptyLabel = ''): string {
  if (n <= 0) return emptyLabel
  return n >= 1000 ? `${Math.round(n / 100) / 10}k+`.replace('.0k', 'k') : `${n}+`
}
