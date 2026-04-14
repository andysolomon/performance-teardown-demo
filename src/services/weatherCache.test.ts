import { describe, it, expect, vi, afterEach } from 'vitest'
import { getCache, setCache, clearCache, isFresh } from './weatherCache'
import type { WeatherResult } from './weatherApi'

const makeData = (location: string): WeatherResult => ({
  current: {
    location,
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
  forecast: [],
  hourly: [],
  source: 'open-meteo',
})

afterEach(() => {
  clearCache('atlanta')
  clearCache('tokyo')
  vi.restoreAllMocks()
})

describe('weatherCache', () => {
  it('returns undefined for cache miss', () => {
    expect(getCache('nonexistent')).toBeUndefined()
  })

  it('stores and retrieves cached data', () => {
    const data = makeData('Atlanta, US')
    setCache('atlanta', data)

    const entry = getCache('atlanta')
    expect(entry).toBeDefined()
    expect(entry!.data.current.location).toBe('Atlanta, US')
  })

  it('clears cache for a specific city', () => {
    setCache('atlanta', makeData('Atlanta, US'))
    setCache('tokyo', makeData('Tokyo, JP'))

    clearCache('atlanta')

    expect(getCache('atlanta')).toBeUndefined()
    expect(getCache('tokyo')).toBeDefined()
  })

  it('isFresh returns true within maxAge', () => {
    setCache('atlanta', makeData('Atlanta, US'))
    const entry = getCache('atlanta')!

    expect(isFresh(entry)).toBe(true)
  })

  it('isFresh returns false after maxAge', () => {
    setCache('atlanta', makeData('Atlanta, US'))
    const entry = getCache('atlanta')!

    vi.spyOn(Date, 'now').mockReturnValue(entry.timestamp + 10 * 60 * 1000 + 1)

    expect(isFresh(entry)).toBe(false)
  })

  it('isFresh respects custom maxAge', () => {
    setCache('atlanta', makeData('Atlanta, US'))
    const entry = getCache('atlanta')!

    vi.spyOn(Date, 'now').mockReturnValue(entry.timestamp + 5000)

    expect(isFresh(entry, 10000)).toBe(true)
    expect(isFresh(entry, 3000)).toBe(false)
  })
})
