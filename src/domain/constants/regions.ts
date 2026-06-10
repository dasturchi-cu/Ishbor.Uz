/** O'zbekistonning barcha viloyatlari va Toshkent shahri */
export const UZ_REGIONS = [
  'Andijon',
  'Buxoro',
  "Farg'ona",
  'Jizzax',
  'Navoiy',
  'Namangan',
  'Qashqadaryo',
  "Qoraqalpog'iston",
  'Samarqand',
  'Sirdaryo',
  'Surxondaryo',
  'Toshkent shahri',
  'Toshkent viloyati',
  'Xorazm',
] as const

export type UzRegion = (typeof UZ_REGIONS)[number]

export function regionSlug(region: string): string {
  return region
    .toLowerCase()
    .replace(/'/g, '')
    .replace(/\s+/g, '-')
}

export function regionFromSlug(slug: string): UzRegion | undefined {
  const normalized = slug.toLowerCase()
  return UZ_REGIONS.find((r) => regionSlug(r) === normalized)
}
