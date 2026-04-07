import { useState, useCallback, useRef, useEffect } from 'react'
import { fetchWeatherData, type WeatherResult } from '../services/weatherApi'
import { getCachedWeather, setCachedWeather, isFresh } from '../services/weatherCache'
import type { WeatherData, ForecastDay, WeatherError, City } from '../types'

const REFRESH_INTERVAL = 10 * 60 * 1000

interface UseWeatherResult {
  current: WeatherData | null
  forecast: ForecastDay[]
  isLoading: boolean
  isRefreshing: boolean
  error: WeatherError | null
  source: 'open-meteo' | 'openweathermap' | null
  refetch: () => Promise<void>
}

export function useWeather(city: City): UseWeatherResult {
  const [current, setCurrent] = useState<WeatherData | null>(null)
  const [forecast, setForecast] = useState<ForecastDay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [error, setError] = useState<WeatherError | null>(null)
  const [source, setSource] = useState<'open-meteo' | 'openweathermap' | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async (skipCache = false) => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    const cached = skipCache ? null : getCachedWeather(city.id)

    if (cached) {
      setCurrent(cached.current)
      setForecast(cached.forecast)
      setSource(cached.source)
      setError(null)

      if (isFresh(cached)) {
        setIsLoading(false)
        return
      }

      // Stale cache — show cached data, refresh in background
      setIsLoading(false)
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
      setError(null)
    }

    try {
      const data: WeatherResult = await fetchWeatherData(city, controller.signal)
      if (controller.signal.aborted) return
      setCurrent(data.current)
      setForecast(data.forecast)
      setSource(data.source)
      setCachedWeather(city.id, data)
    } catch (err) {
      if (controller.signal.aborted) return
      if (!cached) {
        setError(err as WeatherError)
        setSource(null)
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [city])

  const refetch = useCallback(async () => {
    await fetchData(true)
  }, [fetchData])

  useEffect(() => {
    fetchData()

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(() => fetchData(), REFRESH_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      abortControllerRef.current?.abort()
    }
  }, [fetchData])

  return { current, forecast, isLoading, isRefreshing, error, source, refetch }
}
