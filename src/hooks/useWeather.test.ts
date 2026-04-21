import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { useWeather } from './useWeather'
import type { City, WeatherError } from '../types'

vi.mock('../services/weatherApi')
vi.mock('../services/weatherCache', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../services/weatherCache')>()
  return { ...actual }
})

import { fetchWeatherData } from '../services/weatherApi'
import { clearCache } from '../services/weatherCache'

const mockedFetch = vi.mocked(fetchWeatherData)

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
    hourly: [],
  }
}

afterEach(() => {
  vi.restoreAllMocks()
  clearCache('atlanta')
  clearCache('tokyo')
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

    it('pauses interval when tab becomes hidden', async () => {
      mockedFetch.mockResolvedValue(makeResult('Atlanta', 'US'))

      const { result } = renderHook(() => useWeather(atlanta))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      const callsAfterMount = mockedFetch.mock.calls.length

      // Simulate tab becoming hidden
      Object.defineProperty(document, 'hidden', { value: true, configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))

      await act(async () => {
        vi.advanceTimersByTime(REFRESH_INTERVAL * 2)
      })

      // No new fetches should have happened
      expect(mockedFetch.mock.calls.length).toBe(callsAfterMount)

      // Restore
      Object.defineProperty(document, 'hidden', { value: false, configurable: true })
    })

    it('resumes fetching when tab becomes visible again', async () => {
      mockedFetch.mockResolvedValue(makeResult('Atlanta', 'US'))

      const { result } = renderHook(() => useWeather(atlanta))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      // Hide the tab
      Object.defineProperty(document, 'hidden', { value: true, configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))

      // Make cache stale so fetchData actually calls fetchWeatherData on resume
      const { getCache: getCacheEntry } = await import('../services/weatherCache')
      const entry = getCacheEntry('atlanta')!
      entry.timestamp = Date.now() - 11 * 60 * 1000

      const callsWhileHidden = mockedFetch.mock.calls.length

      // Show again — should trigger immediate network fetch (stale cache)
      mockedFetch.mockResolvedValue(makeResult('Atlanta Refreshed', 'US'))
      Object.defineProperty(document, 'hidden', { value: false, configurable: true })
      document.dispatchEvent(new Event('visibilitychange'))

      await waitFor(() => {
        expect(mockedFetch.mock.calls.length).toBeGreaterThan(callsWhileHidden)
      })

      // Interval should also have restarted
      const callsAfterResume = mockedFetch.mock.calls.length

      await act(async () => {
        vi.advanceTimersByTime(REFRESH_INTERVAL)
      })

      expect(mockedFetch.mock.calls.length).toBeGreaterThan(callsAfterResume)

      // Restore
      Object.defineProperty(document, 'hidden', { value: false, configurable: true })
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
    it('shows cached data instantly without loading on revisit', async () => {
      mockedFetch.mockResolvedValue(makeResult('Atlanta', 'US'))

      const { result, unmount } = renderHook(() => useWeather(atlanta))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      unmount()

      mockedFetch.mockClear()
      mockedFetch.mockResolvedValue(makeResult('Atlanta', 'US'))

      const { result: result2 } = renderHook(() => useWeather(atlanta))

      expect(result2.current.isLoading).toBe(false)
      expect(result2.current.current?.location).toBe('Atlanta, US')
    })

    it('background refresh updates data when cache is stale', async () => {
      mockedFetch.mockResolvedValue(makeResult('Atlanta', 'US'))

      const { result, unmount } = renderHook(() => useWeather(atlanta))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      unmount()

      // Make cache stale
      const { getCache } = await import('../services/weatherCache')
      const entry = getCache('atlanta')!
      entry.timestamp = Date.now() - 11 * 60 * 1000

      mockedFetch.mockResolvedValue(makeResult('Atlanta Updated', 'US'))

      const { result: result2 } = renderHook(() => useWeather(atlanta))

      expect(result2.current.isLoading).toBe(false)
      expect(result2.current.current?.location).toBe('Atlanta, US')
      expect(result2.current.isRefreshing).toBe(true)

      await waitFor(() => {
        expect(result2.current.isRefreshing).toBe(false)
      })

      expect(result2.current.current?.location).toBe('Atlanta Updated, US')
    })

    it('failed background refresh preserves cache and sets isStale', async () => {
      mockedFetch.mockResolvedValue(makeResult('Atlanta', 'US'))

      const { result, unmount } = renderHook(() => useWeather(atlanta))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      unmount()

      // Make cache stale
      const { getCache } = await import('../services/weatherCache')
      const entry = getCache('atlanta')!
      entry.timestamp = Date.now() - 11 * 60 * 1000

      const weatherError: WeatherError = { type: 'network', message: 'Network error.' }
      mockedFetch.mockRejectedValue(weatherError)

      const { result: result2 } = renderHook(() => useWeather(atlanta))

      await waitFor(() => {
        expect(result2.current.isRefreshing).toBe(false)
      })

      expect(result2.current.current?.location).toBe('Atlanta, US')
      expect(result2.current.isStale).toBe(true)
      expect(result2.current.error).toBeNull()
    })

    it('manual refetch bypasses cache', async () => {
      mockedFetch.mockResolvedValue(makeResult('Atlanta', 'US'))

      const { result } = renderHook(() => useWeather(atlanta))

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      mockedFetch.mockResolvedValue(makeResult('Atlanta Fresh', 'US'))

      await act(async () => {
        await result.current.refetch()
      })

      expect(result.current.current?.location).toBe('Atlanta Fresh, US')
    })

    it('switching cities reuses cache', async () => {
      mockedFetch.mockImplementation(async (city) => {
        if (city.id === 'atlanta') return makeResult('Atlanta', 'US')
        return makeResult('Tokyo', 'JP')
      })

      const { result, rerender } = renderHook(
        ({ city }) => useWeather(city),
        { initialProps: { city: atlanta } },
      )

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      rerender({ city: tokyo })

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false)
      })

      expect(result.current.current?.location).toBe('Tokyo, JP')

      mockedFetch.mockClear()

      rerender({ city: atlanta })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.current?.location).toBe('Atlanta, US')
    })
  })
})
