import type { WeatherData, ForecastDay } from '../types'

export interface CacheEntry {
  current: WeatherData
  forecast: ForecastDay[]
  source: 'open-meteo' | 'openweathermap'
  timestamp: number
}

const CACHE_TTL = 5 * 60 * 1000

const cache = new Map<string, CacheEntry>()

export function getCachedWeather(cityId: string): CacheEntry | null {
  return cache.get(cityId) ?? null
}

export function setCachedWeather(cityId: string, entry: Omit<CacheEntry, 'timestamp'>): void {
  cache.set(cityId, { ...entry, timestamp: Date.now() })
}

export function isFresh(entry: CacheEntry): boolean {
  return Date.now() - entry.timestamp < CACHE_TTL
}

export function clearCache(): void {
  cache.clear()
}
