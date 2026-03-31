import { CITIES, type City } from '../types'

export interface CityURLResult {
  city: City | null
  invalidId: string | null
}

export function getCityFromURL(): CityURLResult {
  const params = new URLSearchParams(window.location.search)
  const cityId = params.get('city')
  if (!cityId) return { city: null, invalidId: null }
  const found = CITIES.find((c) => c.id === cityId)
  if (found) return { city: found, invalidId: null }
  return { city: null, invalidId: cityId }
}
