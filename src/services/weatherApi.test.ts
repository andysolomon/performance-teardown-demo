import { describe, it, expect, vi, afterEach } from 'vitest'
import { parseError, aggregateForecasts } from './weatherApi'

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

  it('propagates timeout error from primary', async () => {
    const timeoutError = { type: 'timeout' as const, message: 'Request timed out. Please try again.' }
    mockedFetchOpenMeteo.mockRejectedValue(timeoutError)

    // Even if OWM fallback is attempted, make it also fail
    globalThis.fetch = vi.fn().mockRejectedValue(timeoutError)

    await expect(fetchWeatherData(testCity)).rejects.toMatchObject({ type: 'timeout' })
  })
})

describe('aggregateForecasts', () => {
  const HOUR = 3600

  // Use noon local time to avoid date-boundary issues across timezones
  const DAY1_NOON = new Date(2024, 2, 13, 12, 0, 0).getTime() / 1000
  const DAY2_NOON = new Date(2024, 2, 14, 12, 0, 0).getTime() / 1000

  function slot(dt: number, temp_max: number, temp_min: number, humidity: number, main: string, icon: string) {
    return {
      dt,
      main: { temp: (temp_max + temp_min) / 2, temp_max, temp_min, humidity },
      weather: [{ id: 800, main, description: main.toLowerCase(), icon }],
    }
  }

  const sampleList = [
    slot(DAY1_NOON - 3 * HOUR, 70, 55, 60, 'Clear', '01d'),
    slot(DAY1_NOON, 75, 53, 50, 'Clouds', '04d'),
    slot(DAY1_NOON + 3 * HOUR, 78, 54, 40, 'Rain', '10d'),
    slot(DAY2_NOON, 65, 50, 70, 'Clear', '01d'),
    slot(DAY2_NOON + 3 * HOUR, 68, 48, 80, 'Drizzle', '09d'),
  ]

  it('picks max tempHigh and min tempLow across slots', () => {
    const result = aggregateForecasts(sampleList)
    expect(result[0].tempHigh).toBe(78)
    expect(result[0].tempLow).toBe(53)
  })

  it('averages humidity across slots', () => {
    const result = aggregateForecasts(sampleList)
    expect(result[0].humidity).toBe(50) // (60+50+40)/3 = 50
    expect(result[1].humidity).toBe(75) // (70+80)/2 = 75
  })

  it('selects highest-severity condition', () => {
    const result = aggregateForecasts(sampleList)
    expect(result[0].conditions).toBe('Rain')
    expect(result[0].conditionIcon).toBe('10d')
    expect(result[1].conditions).toBe('Drizzle')
    expect(result[1].conditionIcon).toBe('09d')
  })

  it('limits output to 5 days', () => {
    const manySlots = []
    for (let day = 0; day < 7; day++) {
      const base = new Date(2024, 2, 13 + day, 12, 0, 0).getTime() / 1000
      manySlots.push(slot(base, 70, 50, 60, 'Clear', '01d'))
    }
    const result = aggregateForecasts(manySlots)
    expect(result).toHaveLength(5)
  })

  it('returns empty array for empty list', () => {
    expect(aggregateForecasts([])).toEqual([])
  })
})
