import { useState, useCallback, useRef, useEffect } from 'react'
import { fetchWeatherData, type WeatherResult } from '../services/weatherApi'
import type { WeatherData, ForecastDay, WeatherError, City } from '../types'

const REFRESH_INTERVAL = 10 * 60 * 1000

interface UseWeatherResult {
  current: WeatherData | null
  forecast: ForecastDay[]
  isLoading: boolean
  error: WeatherError | null
  source: 'open-meteo' | 'openweathermap' | null
  refetch: () => Promise<void>
}

export function useWeather(city: City): UseWeatherResult {
  const [current, setCurrent] = useState<WeatherData | null>(null)
  const [forecast, setForecast] = useState<ForecastDay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<WeatherError | null>(null)
  const [source, setSource] = useState<'open-meteo' | 'openweathermap' | null>(null)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const fetchData = useCallback(async () => {
    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller

    setIsLoading(true)
    setError(null)

    try {
      const data: WeatherResult = await fetchWeatherData(city, controller.signal)
      setCurrent(data.current)
      setForecast(data.forecast)
      setSource(data.source)
    } catch (err) {
      if (controller.signal.aborted) return
      setError(err as WeatherError)
      setSource(null)
    } finally {
      if (!controller.signal.aborted) {
        setIsLoading(false)
      }
    }
  }, [city])

  useEffect(() => {
    fetchData()

    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    intervalRef.current = setInterval(fetchData, REFRESH_INTERVAL)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
      abortControllerRef.current?.abort()
    }
  }, [fetchData])

  return { current, forecast, isLoading, error, source, refetch: fetchData }
}
