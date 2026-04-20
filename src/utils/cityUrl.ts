import { CITIES, type City } from '../types'

export interface CityURLResult {
  city: City | null
  invalidId: string | null
}

export function getCityById(cityId?: string): CityURLResult {
  if (!cityId) return { city: null, invalidId: null }
  const found = CITIES.find((c) => c.id === cityId)
  if (found) return { city: found, invalidId: null }
  return { city: null, invalidId: cityId }
}

// Backwards-compatible alias
export function getCityFromURL(): CityURLResult {
  const params = new URLSearchParams(window.location.search)
  const id = params.get('city')
  return getCityById(id ?? undefined)
}
