import { describe, it, expect, afterEach } from 'vitest'
import { getCityFromURL } from './App'
import { CITIES } from './types'

function setURL(search: string) {
  Object.defineProperty(window, 'location', {
    value: { ...window.location, search },
    writable: true,
  })
}

describe('getCityFromURL', () => {
  afterEach(() => setURL(''))

  it('returns null city and null invalidId when no param', () => {
    setURL('')
    expect(getCityFromURL()).toEqual({ city: null, invalidId: null })
  })

  it('returns the matching city when param is valid', () => {
    setURL('?city=tokyo')
    const result = getCityFromURL()
    expect(result.city).toEqual(CITIES.find((c) => c.id === 'tokyo'))
    expect(result.invalidId).toBeNull()
  })

  it('returns null city and the raw id when param is invalid', () => {
    setURL('?city=atlantis')
    const result = getCityFromURL()
    expect(result.city).toBeNull()
    expect(result.invalidId).toBe('atlantis')
  })
})
