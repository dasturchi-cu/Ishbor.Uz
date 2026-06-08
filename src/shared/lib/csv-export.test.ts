import { describe, expect, it } from 'vitest'
import { escapeCsvCell } from './csv-export'

describe('escapeCsvCell', () => {
  it('escapes commas and quotes', () => {
    expect(escapeCsvCell('Ali, Vali')).toBe('"Ali, Vali"')
    expect(escapeCsvCell('He said "hi"')).toBe('"He said ""hi"""')
  })

  it('leaves plain text unchanged', () => {
    expect(escapeCsvCell('Toshkent')).toBe('Toshkent')
  })
})
