import { describe, it, expect } from 'vitest'
import { getCityById } from './utils/cityUrl'
import { CITIES } from './types'

describe('getCityById', () => {
  it('returns null city and null invalidId when no param', () => {
    expect(getCityById()).toEqual({ city: null, invalidId: null })
    expect(getCityById(undefined)).toEqual({ city: null, invalidId: null })
  })

  it('returns the matching city when id is valid', () => {
    const result = getCityById('tokyo')
    expect(result.city).toEqual(CITIES.find((c) => c.id === 'tokyo'))
    expect(result.invalidId).toBeNull()
  })

  it('returns null city and the raw id when id is invalid', () => {
    const result = getCityById('atlantis')
    expect(result.city).toBeNull()
    expect(result.invalidId).toBe('atlantis')
  })
})
