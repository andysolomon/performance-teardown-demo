import { useState, useCallback, useRef, useEffect } from 'react'
import { fetchWeatherData, type WeatherResult } from '../services/weatherApi'
import { getCache, setCache, clearCache, isFresh } from '../services/weatherCache'
import type { WeatherData, ForecastDay, HourlyForecast, WeatherError, City } from '../types'

const REFRESH_INTERVAL = 10 * 60 * 1000

interface UseWeatherResult {
  current: WeatherData | null
  forecast: ForecastDay[]
  hourly: HourlyForecast[]
  isLoading: boolean
  isRefreshing: boolean
  isStale: boolean
  error: WeatherError | null
  source: 'open-meteo' | 'openweathermap' | null
  refetch: () => Promise<void>
}

export function useWeather(city: City): UseWeatherResult {
  const [current, setCurrent] = useState<WeatherData | null>(null)
  const [forecast, setForecast] = useState<ForecastDay[]>([])
  const [hourly, setHourly] = useState<HourlyForecast[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [isStale, setIsStale] = useState(false)
  const [error, setError] = useState<WeatherError | null>(null)
  const [source, setSource] = useState<'open-meteo' | 'openweathermap' | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const hydrate = useCallback((data: WeatherResult) => {
    setCurrent(data.current)
    setForecast(data.forecast)
    setHourly(data.hourly)
    setSource(data.source)
  }, [])

  const fetchData = useCallback(async (bypassCache = false) => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    if (bypassCache) {
      clearCache(city.id)
    }

    const cached = getCache(city.id)
    const hasCachedData = cached !== undefined

    if (hasCachedData && !bypassCache) {
      hydrate(cached.data)
      setError(null)
      setIsLoading(false)

      if (isFresh(cached)) {
        return
      }

      setIsRefreshing(true)
    } else {
      setIsLoading(true)
      setError(null)
    }

    try {
      const data: WeatherResult = await fetchWeatherData(city, controller.signal)
      if (controller.signal.aborted) return
      setCache(city.id, data)
      hydrate(data)
      setIsStale(false)
    } catch (err) {
      if (controller.signal.aborted) return
      if (hasCachedData && !bypassCache) {
        setIsStale(true)
      } else {
        setError(err as WeatherError)
        setSource(null)
      }
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
        setIsRefreshing(false)
      }
    }
  }, [city, hydrate])

  const refetch = useCallback(() => fetchData(true), [fetchData])

  useEffect(() => {
    fetchData()

    const startInterval = () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
      intervalRef.current = setInterval(() => fetchData(), REFRESH_INTERVAL)
    }

    const stopInterval = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    startInterval()

    const handleVisibilityChange = () => {
      if (document.hidden) {
        stopInterval()
      } else {
        fetchData()
        startInterval()
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stopInterval()
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      abortControllerRef.current?.abort()
    }
  }, [fetchData])

  return { current, forecast, hourly, isLoading, isRefreshing, isStale, error, source, refetch }
}
