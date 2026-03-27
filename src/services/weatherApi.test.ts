import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseError } from './weatherApi'

vi.mock('./openMeteoApi')

import { fetchWeatherData } from './weatherApi'
import { fetchOpenMeteoWeather } from './openMeteoApi'

const mockedFetchOpenMeteo = vi.mocked(fetchOpenMeteoWeather)

const testCity = {
  id: 'atlanta',
  name: 'Atlanta',
  country: 'US',
  state: 'GA',
  lat: 33.749,
  lon: -84.388,
  openWeatherQuery: 'Atlanta,GA,US',
  backgroundImage: 'https://example.com/img.jpg',
}

describe('parseError', () => {
  it('returns invalid_key for 401', () => {
    expect(parseError(401)).toMatchObject({ type: 'invalid_key' })
  })

  it('returns rate_limit for 429', () => {
    expect(parseError(429)).toMatchObject({ type: 'rate_limit' })
  })

  it('returns network for status >= 500', () => {
    expect(parseError(500)).toMatchObject({ type: 'network' })
  })

  it('returns unknown for other statuses', () => {
    expect(parseError(400)).toMatchObject({ type: 'unknown' })
  })
})

describe('fetchWeatherData', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  const mockWeatherResult = {
    current: {
      location: 'Atlanta, US',
      temperature: 73,
      feelsLike: 73,
      humidity: 65,
      pressure: 1015,
      windSpeed: 12,
      windDirection: 0,
      visibility: 10,
      conditions: 'Clear',
      conditionIcon: '01d',
      sunrise: '6:30 AM',
      sunset: '7:45 PM',
      lastUpdated: '12:00 PM',
    },
    forecast: [],
  }

  it('returns open-meteo source when primary succeeds', async () => {
    mockedFetchOpenMeteo.mockResolvedValue(mockWeatherResult)

    const result = await fetchWeatherData(testCity)

    expect(result.source).toBe('open-meteo')
  })

  it('forwards signal to fetchOpenMeteoWeather', async () => {
    const controller = new AbortController()
    mockedFetchOpenMeteo.mockResolvedValue(mockWeatherResult)

    await fetchWeatherData(testCity, controller.signal)

    expect(mockedFetchOpenMeteo).toHaveBeenCalledWith(testCity, controller.signal)
  })

  it('throws when primary fails and fallback also fails', async () => {
    const primaryError = { type: 'network' as const, message: 'Server error. Please try again later.' }
    mockedFetchOpenMeteo.mockRejectedValue(primaryError)

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: () => Promise.resolve({}),
    })

    await expect(fetchWeatherData(testCity)).rejects.toMatchObject({ type: 'network' })
  })
})
