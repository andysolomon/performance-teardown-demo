import { useState, useEffect, useCallback } from 'react'
import { fetchWeatherData, type WeatherResult } from '../services/weatherApi'
import type { WeatherData, ForecastDay, WeatherError } from '../types'

const REFRESH_INTERVAL = 10 * 60 * 1000

interface UseWeatherResult {
  current: WeatherData | null
  forecast: ForecastDay[]
  isLoading: boolean
  error: WeatherError | null
  source: 'open-meteo' | 'openweathermap' | null
  refetch: () => Promise<void>
}

export function useWeather(): UseWeatherResult {
  const [current, setCurrent] = useState<WeatherData | null>(null)
  const [forecast, setForecast] = useState<ForecastDay[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<WeatherError | null>(null)
  const [source, setSource] = useState<'open-meteo' | 'openweathermap' | null>(null)

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      const data: WeatherResult = await fetchWeatherData()
      setCurrent(data.current)
      setForecast(data.forecast)
      setSource(data.source)
    } catch (err) {
      setError(err as WeatherError)
      setSource(null)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()

    const intervalId = setInterval(fetchData, REFRESH_INTERVAL)

    return () => clearInterval(intervalId)
  }, [fetchData])

  return { current, forecast, isLoading, error, source, refetch: fetchData }
}
