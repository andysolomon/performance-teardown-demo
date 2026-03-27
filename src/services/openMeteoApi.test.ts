import { describe, it, expect, vi, afterEach } from 'vitest'
import {
  parseError,
  getConditionFromCode,
  formatTimeFromIso,
  fetchOpenMeteoWeather,
} from './openMeteoApi'

describe('getConditionFromCode', () => {
  it.each([
    [0, 'Clear'],
    [1, 'Clear'],
    [2, 'Clouds'],
    [3, 'Clouds'],
    [45, 'Fog'],
    [51, 'Drizzle'],
    [61, 'Rain'],
    [71, 'Snow'],
    [80, 'Rain'],
    [95, 'Thunderstorm'],
  ])('maps code %i to %s', (code, expected) => {
    expect(getConditionFromCode(code)).toBe(expected)
  })

  it('returns Clear for unknown codes', () => {
    expect(getConditionFromCode(999)).toBe('Clear')
  })
})

describe('formatTimeFromIso', () => {
  it.each([
    ['2024-01-01T14:30', '2:30 PM'],
    ['2024-01-01T00:00', '12:00 AM'],
    ['2024-01-01T12:00', '12:00 PM'],
    ['2024-01-01T09:05', '9:05 AM'],
  ])('formats %s as %s', (input, expected) => {
    expect(formatTimeFromIso(input)).toBe(expected)
  })

  it('returns -- for strings without T separator', () => {
    expect(formatTimeFromIso('no-time-here')).toBe('--')
  })

  it('returns -- for empty string', () => {
    expect(formatTimeFromIso('')).toBe('--')
  })
})

describe('parseError', () => {
  it('returns network error for status >= 500', () => {
    expect(parseError(500)).toEqual({ type: 'network', message: 'Server error. Please try again later.' })
  })

  it('returns network error for status 503', () => {
    expect(parseError(503)).toEqual({ type: 'network', message: 'Server error. Please try again later.' })
  })

  it('returns unknown error for other statuses', () => {
    expect(parseError(400)).toEqual({ type: 'unknown', message: 'An unexpected error occurred.' })
  })

  it('uses custom message when provided', () => {
    expect(parseError(400, 'custom message')).toEqual({ type: 'unknown', message: 'custom message' })
  })
})

describe('fetchOpenMeteoWeather', () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
    vi.restoreAllMocks()
  })

  const mockOpenMeteoResponse = {
    current: {
      temperature_2m: 72.5,
      relative_humidity_2m: 65,
      wind_speed_10m: 11.8,
      weather_code: 0,
      pressure_msl: 1015.2,
      apparent_temperature: 70.1,
      wind_direction_10m: 225.4,
      visibility: 24140,
      uv_index: 5.3,
    },
    daily: {
      time: ['2024-03-13', '2024-03-14', '2024-03-15', '2024-03-16', '2024-03-17', '2024-03-18'],
      temperature_2m_max: [75, 78, 80, 77, 74, 72],
      temperature_2m_min: [55, 58, 60, 57, 54, 52],
      weather_code: [0, 2, 61, 3, 1, 71],
      relative_humidity_2m_mean: [60, 55, 70, 65, 58, 62],
      sunrise: ['2024-03-13T06:30', '2024-03-14T06:29', '2024-03-15T06:28', '2024-03-16T06:27', '2024-03-17T06:26', '2024-03-18T06:25'],
      sunset: ['2024-03-13T19:45', '2024-03-14T19:46', '2024-03-15T19:47', '2024-03-16T19:48', '2024-03-17T19:49', '2024-03-18T19:50'],
    },
    timezone: 'America/New_York',
  }

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

  it('returns correctly shaped weather data on success', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOpenMeteoResponse),
    })

    const result = await fetchOpenMeteoWeather(testCity)

    expect(result.current.location).toBe('Atlanta, US')
    expect(result.current.temperature).toBe(73)
    expect(result.current.humidity).toBe(65)
    expect(result.current.pressure).toBe(1015)
    expect(result.current.windSpeed).toBe(12)
    expect(result.current.feelsLike).toBe(70)
    expect(result.current.windDirection).toBe(225)
    expect(result.current.visibility).toBe(15)
    expect(result.current.conditions).toBe('Clear')
    expect(result.current.uvIndex).toBe(5.3)
    expect(result.current.sunrise).toBe('6:30 AM')
    expect(result.current.sunset).toBe('7:45 PM')
    expect(result.forecast).toHaveLength(5)
    expect(result.forecast[0].conditions).toBe('Clear')
    expect(result.forecast[2].conditions).toBe('Rain')
  })

  it('throws network error on non-ok response', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 })

    await expect(fetchOpenMeteoWeather(testCity)).rejects.toMatchObject({ type: 'network' })
  })

  it('throws network error on fetch TypeError', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'))

    await expect(fetchOpenMeteoWeather(testCity)).rejects.toMatchObject({ type: 'network' })
  })

  it('returns undefined for optional fields when not in API response', async () => {
    const responseWithoutOptionalFields = {
      ...mockOpenMeteoResponse,
      current: {
        temperature_2m: 72.5,
        relative_humidity_2m: 65,
        wind_speed_10m: 11.8,
        weather_code: 0,
        pressure_msl: 1015.2,
      },
    }

    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(responseWithoutOptionalFields),
    })

    const result = await fetchOpenMeteoWeather(testCity)

    expect(result.current.feelsLike).toBeUndefined()
    expect(result.current.windDirection).toBeUndefined()
    expect(result.current.visibility).toBeUndefined()
    expect(result.current.uvIndex).toBeUndefined()
  })

  it('rejects when signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort()

    await expect(fetchOpenMeteoWeather(testCity, controller.signal)).rejects.toBeDefined()
  })

  it('passes signal to fetch', async () => {
    const controller = new AbortController()
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOpenMeteoResponse),
    })

    await fetchOpenMeteoWeather(testCity, controller.signal)

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal }),
    )
  })

  it('does not call Math.random', async () => {
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockOpenMeteoResponse),
    })

    const randomSpy = vi.spyOn(Math, 'random')

    await fetchOpenMeteoWeather(testCity)

    expect(randomSpy).not.toHaveBeenCalled()
  })
})
