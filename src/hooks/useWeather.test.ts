import { describe, it, expect, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useWeather } from './useWeather'
import type { City } from '../types'

vi.mock('../services/weatherApi')

import { fetchWeatherData } from '../services/weatherApi'

const mockedFetch = vi.mocked(fetchWeatherData)

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

function makeResult(cityName: string, country: string) {
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
    forecast: [],
    source: 'open-meteo' as const,
  }
}

afterEach(() => {
  vi.restoreAllMocks()
})

describe('useWeather', () => {
  it('fetches data for the given city', async () => {
    mockedFetch.mockResolvedValue(makeResult('Atlanta', 'US'))

    const { result } = renderHook(() => useWeather(atlanta))

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.current?.location).toBe('Atlanta, US')
    expect(mockedFetch).toHaveBeenCalledWith(atlanta, expect.any(AbortSignal))
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
})
