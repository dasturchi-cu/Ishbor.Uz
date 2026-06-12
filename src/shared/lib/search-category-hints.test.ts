import { describe, expect, it } from 'vitest'
import { categoryHintsForQuery } from './search-category-hints'

describe('categoryHintsForQuery', () => {
  it('maps logo and dizayn to graphic/uiux', () => {
    expect(categoryHintsForQuery('logo dizayn')).toContain('graphic')
    expect(categoryHintsForQuery('logo dizayn')).toContain('uiux')
  })

  it('maps web sayt to web category', () => {
    expect(categoryHintsForQuery('web sayt')).toContain('web')
  })

  it('maps seo to seo category', () => {
    expect(categoryHintsForQuery('seo')).toEqual(['seo'])
  })
})
