import type { WeatherResult } from './weatherApi'

const REFRESH_INTERVAL = 10 * 60 * 1000

interface CacheEntry {
  data: WeatherResult
  timestamp: number
}

const cache = new Map<string, CacheEntry>()

export function getCache(cityId: string): CacheEntry | undefined {
  return cache.get(cityId)
}

export function setCache(cityId: string, data: WeatherResult): void {
  cache.set(cityId, { data, timestamp: Date.now() })
}

export function clearCache(cityId: string): void {
  cache.delete(cityId)
}

export function isFresh(entry: CacheEntry, maxAge: number = REFRESH_INTERVAL): boolean {
  return Date.now() - entry.timestamp < maxAge
}
