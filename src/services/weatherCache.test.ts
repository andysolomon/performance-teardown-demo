import { describe, it, expect, vi, afterEach } from 'vitest'
import { getCachedWeather, setCachedWeather, isFresh, clearCache, type CacheEntry } from './weatherCache'

const CACHE_TTL = 5 * 60 * 1000

function makeEntry(source: 'open-meteo' | 'openweathermap' = 'open-meteo'): Omit<CacheEntry, 'timestamp'> {
  return {
    current: {
      location: 'Atlanta, US',
      temperature: 73,
      humidity: 65,
      pressure: 1015,
      windSpeed: 12,
      conditions: 'Clear',
      conditionIcon: '01d',
      sunrise: '6:30 AM',
      sunset: '7:45 PM',
      lastUpdated: '12:00 PM',
    },
    forecast: [
      {
        date: 'Mon, Jan 1',
        tempHigh: 78,
        tempLow: 60,
        humidity: 55,
        conditions: 'Clear',
        conditionIcon: '01d',
      },
    ],
    source,
  }
}

afterEach(() => {
  clearCache()
  vi.restoreAllMocks()
})

describe('weatherCache', () => {
  it('returns null for unknown city', () => {
    expect(getCachedWeather('unknown')).toBeNull()
  })

  it('stores and retrieves cache entry', () => {
    const entry = makeEntry()
    setCachedWeather('atlanta', entry)

    const cached = getCachedWeather('atlanta')
    expect(cached).not.toBeNull()
    expect(cached!.current.location).toBe('Atlanta, US')
    expect(cached!.source).toBe('open-meteo')
    expect(cached!.timestamp).toBeGreaterThan(0)
  })

  it('overwrites existing entry for same city', () => {
    setCachedWeather('atlanta', makeEntry('open-meteo'))
    setCachedWeather('atlanta', makeEntry('openweathermap'))

    const cached = getCachedWeather('atlanta')
    expect(cached!.source).toBe('openweathermap')
  })

  it('isFresh returns true within TTL', () => {
    setCachedWeather('atlanta', makeEntry())
    const cached = getCachedWeather('atlanta')!
    expect(isFresh(cached)).toBe(true)
  })

  it('isFresh returns false after TTL expires', () => {
    const now = Date.now()
    vi.spyOn(Date, 'now').mockReturnValue(now)

    setCachedWeather('atlanta', makeEntry())
    const cached = getCachedWeather('atlanta')!

    vi.spyOn(Date, 'now').mockReturnValue(now + CACHE_TTL + 1)
    expect(isFresh(cached)).toBe(false)
  })

  it('clearCache removes all entries', () => {
    setCachedWeather('atlanta', makeEntry())
    setCachedWeather('tokyo', makeEntry())

    clearCache()

    expect(getCachedWeather('atlanta')).toBeNull()
    expect(getCachedWeather('tokyo')).toBeNull()
  })

  it('stores separate entries per city', () => {
    setCachedWeather('atlanta', makeEntry('open-meteo'))
    setCachedWeather('tokyo', makeEntry('openweathermap'))

    expect(getCachedWeather('atlanta')!.source).toBe('open-meteo')
    expect(getCachedWeather('tokyo')!.source).toBe('openweathermap')
  })
})
