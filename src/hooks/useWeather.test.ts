import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useWeather } from './useWeather'
import type { City, WeatherError } from '../types'

vi.mock('../services/weatherApi')
vi.mock('../services/weatherCache')

import { fetchWeatherData } from '../services/weatherApi'
import { getCachedWeather, setCachedWeather, isFresh } from '../services/weatherCache'

const mockedFetch = vi.mocked(fetchWeatherData)
const mockedGetCached = vi.mocked(getCachedWeather)
const mockedSetCached = vi.mocked(setCachedWeather)
const mockedIsFresh = vi.mocked(isFresh)

const REFRESH_INTERVAL = 10 * 60 * 1000

const atlanta: City = {
  id: 'atlanta',
  name: 'Atlanta',
  country: 'US',
  state: 'GA',
  lat: 33.749,
  lon: -84.388,
  openWeatherQuery: 'Atlanta,GA,US',
  backgroundImage: 'https://example.com/img.jpg',
}

const tokyo: City = {
  id: 'tokyo',
  name: 'Tokyo',
  country: 'JP',
  lat: 35.6762,
  lon: 139.6503,
  openWeatherQuery: 'Tokyo,JP',
  backgroundImage: 'https://example.com/img.jpg',
}

function makeResult(cityName: string, country: string, source: 'open-meteo' | 'openweathermap' = 'open-meteo') {
  return {
    current: {
      location: `${cityName}, ${country}`,
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
      {
        date: 'Tue, Jan 2',
        tempHigh: 75,
        tempLow: 58,
        humidity: 60,
        conditions: 'Clouds',
        conditionIcon: '02d',
      },
    ],
    source,
  }
}

beforeEach(() => {
  mockedGetCached.mockReturnValue(null)
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useWeather', () => {
  it('fetches data and exposes all returned state', async () => {
    mockedFetch.mockResolvedValue(makeResult('Atlanta', 'US'))

    const { result } = renderHook(() => useWeather(atlanta))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.current?.location).toBe('Atlanta, US')
    expect(result.current.forecast).toHaveLength(2)
    expect(result.current.forecast[0].tempHigh).toBe(78)
    expect(result.current.source).toBe('open-meteo')
    expect(result.current.error).toBeNull()
    expect(mockedFetch).toHaveBeenCalledWith(atlanta, expect.any(AbortSignal))
  })

  it('exposes fallback source when openweathermap is used', async () => {
    mockedFetch.mockResolvedValue(makeResult('Atlanta', 'US', 'openweathermap'))

    const { result } = renderHook(() => useWeather(atlanta))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.source).toBe('openweathermap')
    expect(result.current.current?.location).toBe('Atlanta, US')
  })

  it('sets error state when fetch rejects', async () => {
    const weatherError: WeatherError = { type: 'network', message: 'Network error.' }
    mockedFetch.mockRejectedValue(weatherError)

    const { result } = renderHook(() => useWeather(atlanta))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toEqual(weatherError)
    expect(result.current.source).toBeNull()
    expect(result.current.current).toBeNull()
  })

  it('refetch triggers a new fetch and updates state', async () => {
    mockedFetch.mockResolvedValue(makeResult('Atlanta', 'US'))

    const { result } = renderHook(() => useWeather(atlanta))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    const callsAfterMount = mockedFetch.mock.calls.length

    mockedFetch.mockResolvedValue(makeResult('Atlanta', 'US', 'openweathermap'))

    await act(async () => {
      await result.current.refetch()
    })

    expect(mockedFetch.mock.calls.length - callsAfterMount).toBeGreaterThanOrEqual(1)
    expect(result.current.source).toBe('openweathermap')
  })

  it('discards stale response when city changes rapidly', async () => {
    const signals: AbortSignal[] = []

    mockedFetch.mockImplementation(async (city, signal) => {
      signals.push(signal!)
      if (city.id === 'atlanta') {
        // Slow response — wait then return, but check abort
        await new Promise((r) => setTimeout(r, 100))
        if (signal?.aborted) throw new DOMException('aborted', 'AbortError')
        return makeResult('Atlanta', 'US')
      }
      return makeResult('Tokyo', 'JP')
    })

    const { result, rerender } = renderHook(
      ({ city }) => useWeather(city),
      { initialProps: { city: atlanta } },
    )

    // Switch to Tokyo before Atlanta resolves
    rerender({ city: tokyo })

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // Tokyo should be showing
    expect(result.current.current?.location).toBe('Tokyo, JP')

    // Wait for the slow Atlanta response to complete (it should be aborted)
    await new Promise((r) => setTimeout(r, 150))

    // Should still show Tokyo
    expect(result.current.current?.location).toBe('Tokyo, JP')
  })

  it('aborts in-flight request on city change', async () => {
    const signals: AbortSignal[] = []

    mockedFetch.mockImplementation(async (_city, signal) => {
      signals.push(signal!)
      return makeResult('Atlanta', 'US')
    })

    const { result, rerender } = renderHook(
      ({ city }) => useWeather(city),
      { initialProps: { city: atlanta } },
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    // The first signal (Atlanta) should not be aborted yet
    const atlantaSignal = signals[signals.length - 1]

    // Switch city — effect cleanup + new fetchData should abort previous controller
    rerender({ city: tokyo })

    // The atlanta controller should now be aborted
    expect(atlantaSignal.aborted).toBe(true)
  })

  it('aborts request on unmount', async () => {
    let capturedSignal: AbortSignal | undefined

    mockedFetch.mockImplementation(async (_city, signal) => {
      capturedSignal = signal
      return new Promise(() => {})
    })

    const { unmount } = renderHook(() => useWeather(atlanta))

    unmount()

    expect(capturedSignal?.aborted).toBe(true)
  })

  describe('interval refresh', () => {
    beforeEach(() => {
      vi.useFakeTimers({ shouldAdvanceTime: true })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('re-fetches after REFRESH_INTERVAL', async () => {
      mockedFetch.mockResolvedValue(makeResult('Atlanta', 'US'))

      const { result } = renderHook(() => useWeather(atlanta))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const callsAfterMount = mockedFetch.mock.calls.length

      await act(async () => {
        vi.advanceTimersByTime(REFRESH_INTERVAL)
      })

      expect(mockedFetch.mock.calls.length).toBeGreaterThan(callsAfterMount)
    })

    it('clears interval on unmount and prevents further fetches', async () => {
      mockedFetch.mockResolvedValue(makeResult('Atlanta', 'US'))

      const { result, unmount } = renderHook(() => useWeather(atlanta))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      unmount()

      const callsAfterUnmount = mockedFetch.mock.calls.length

      await act(async () => {
        vi.advanceTimersByTime(REFRESH_INTERVAL * 2)
      })

      expect(mockedFetch.mock.calls.length).toBe(callsAfterUnmount)
    })
  })

  describe('caching', () => {
    beforeEach(() => {
      mockedFetch.mockReset()
      mockedGetCached.mockReset()
      mockedSetCached.mockReset()
      mockedIsFresh.mockReset()
      mockedGetCached.mockReturnValue(null)
    })

    it('returns fresh cached data without fetching', async () => {
      const cachedEntry = {
        ...makeResult('Atlanta', 'US'),
        timestamp: Date.now(),
      }
      mockedGetCached.mockReturnValue(cachedEntry)
      mockedIsFresh.mockReturnValue(true)

      const { result } = renderHook(() => useWeather(atlanta))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.current?.location).toBe('Atlanta, US')
      expect(result.current.source).toBe('open-meteo')
      expect(result.current.error).toBeNull()
      expect(mockedFetch).not.toHaveBeenCalled()
    })

    it('shows stale cache and triggers background refresh', async () => {
      const cachedEntry = {
        ...makeResult('Atlanta', 'US'),
        timestamp: Date.now() - 6 * 60 * 1000,
      }
      mockedGetCached.mockReturnValue(cachedEntry)
      mockedIsFresh.mockReturnValue(false)
      mockedFetch.mockResolvedValue(makeResult('Atlanta', 'US', 'openweathermap'))

      const { result } = renderHook(() => useWeather(atlanta))

      // Should immediately show cached data, not loading
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.current?.location).toBe('Atlanta, US')

      // Background refresh completes
      await waitFor(() => {
        expect(result.current.isRefreshing).toBe(false)
      })

      expect(result.current.source).toBe('openweathermap')
      expect(mockedSetCached).toHaveBeenCalled()
    })

    it('preserves cached data when background refresh fails', async () => {
      const cachedEntry = {
        ...makeResult('Atlanta', 'US'),
        timestamp: Date.now() - 6 * 60 * 1000,
      }
      mockedGetCached.mockReturnValue(cachedEntry)
      mockedIsFresh.mockReturnValue(false)
      mockedFetch.mockRejectedValue({ type: 'network', message: 'Network error.' })

      const { result } = renderHook(() => useWeather(atlanta))

      await waitFor(() => {
        expect(result.current.isRefreshing).toBe(false)
      })

      // Cached data preserved, no error shown
      expect(result.current.current?.location).toBe('Atlanta, US')
      expect(result.current.error).toBeNull()
      expect(result.current.isLoading).toBe(false)
    })

    it('manual refetch bypasses cache', async () => {
      const cachedEntry = {
        ...makeResult('Atlanta', 'US'),
        timestamp: Date.now(),
      }
      mockedGetCached.mockReturnValue(cachedEntry)
      mockedIsFresh.mockReturnValue(true)
      mockedFetch.mockResolvedValue(makeResult('Atlanta', 'US', 'openweathermap'))

      const { result } = renderHook(() => useWeather(atlanta))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Initial mount uses cache, no fetch
      const callsBeforeRefetch = mockedFetch.mock.calls.length
      expect(callsBeforeRefetch).toBe(0)

      await act(async () => {
        await result.current.refetch()
      })

      expect(mockedFetch.mock.calls.length).toBeGreaterThan(callsBeforeRefetch)
      expect(result.current.source).toBe('openweathermap')
    })

    it('caches data after successful fetch', async () => {
      mockedFetch.mockResolvedValue(makeResult('Atlanta', 'US'))

      const { result } = renderHook(() => useWeather(atlanta))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(mockedSetCached).toHaveBeenCalledWith('atlanta', makeResult('Atlanta', 'US'))
    })
  })
})
