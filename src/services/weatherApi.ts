import type { WeatherData, ForecastDay, WeatherError, WeatherErrorType, City } from '../types'
import { fetchOpenMeteoWeather } from './openMeteoApi'

const API_KEY = import.meta.env.VITE_OPENWEATHER_API_KEY
const BASE_URL = 'https://api.openweathermap.org/data/2.5'

export function parseError(status: number, message?: string): WeatherError {
  if (status === 401) {
    return { type: 'invalid_key', message: 'Invalid API key. Please check your configuration.' }
  }
  if (status === 429) {
    return { type: 'rate_limit', message: 'Rate limit exceeded. Please try again later.' }
  }
  if (status >= 500) {
    return { type: 'network', message: 'Server error. Please try again later.' }
  }
  return { type: 'unknown', message: message || 'An unexpected error occurred.' }
}

function formatTime(timestamp: number, timezone: number): string {
  const date = new Date((timestamp + timezone) * 1000)
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

interface CurrentWeatherResponse {
  weather: { id: number; main: string; description: string; icon: string }[]
  main: {
    temp: number
    feels_like: number
    humidity: number
    pressure: number
  }
  visibility: number
  wind: { speed: number; deg: number }
  sys: { sunrise: number; sunset: number; country: string }
  dt: number
  timezone: number
  name: string
}

interface ForecastResponse {
  list: {
    dt: number
    main: { temp: number; temp_max: number; temp_min: number; humidity: number }
    weather: { id: number; main: string; description: string; icon: string }[]
  }[]
  city: { name: string; country: string; sunrise: number; sunset: number; timezone: number }
}

async function fetchOpenWeatherMapData(city: City, signal?: AbortSignal): Promise<{ current: WeatherData; forecast: ForecastDay[] }> {
  if (!API_KEY) {
    throw { type: 'invalid_key' as WeatherErrorType, message: 'OpenWeatherMap API key not configured.' }
  }

  const currentUrl = `${BASE_URL}/weather?q=${encodeURIComponent(city.openWeatherQuery)}&units=imperial&appid=${API_KEY}`
  const forecastUrl = `${BASE_URL}/forecast?q=${encodeURIComponent(city.openWeatherQuery)}&units=imperial&appid=${API_KEY}`

  const [currentRes, forecastRes] = await Promise.all([fetch(currentUrl, { signal }), fetch(forecastUrl, { signal })])

  if (!currentRes.ok) {
    const errorData = await currentRes.json().catch(() => ({}))
    throw parseError(currentRes.status, errorData.message)
  }

  if (!forecastRes.ok) {
    const errorData = await forecastRes.json().catch(() => ({}))
    throw parseError(forecastRes.status, errorData.message)
  }

  const currentData: CurrentWeatherResponse = await currentRes.json()
  const forecastData: ForecastResponse = await forecastRes.json()

  const current: WeatherData = {
    location: `${currentData.name}, ${currentData.sys.country}`,
    temperature: Math.round(currentData.main.temp),
    feelsLike: Math.round(currentData.main.feels_like),
    humidity: currentData.main.humidity,
    pressure: currentData.main.pressure,
    windSpeed: Math.round(currentData.wind.speed),
    windDirection: currentData.wind.deg,
    visibility: Math.round(currentData.visibility / 1609),
    conditions: currentData.weather[0].main,
    conditionIcon: currentData.weather[0].icon,
    sunrise: formatTime(currentData.sys.sunrise, currentData.timezone),
    sunset: formatTime(currentData.sys.sunset, currentData.timezone),
    lastUpdated: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
  }

  const dailyForecasts: ForecastDay[] = []
  const seenDates = new Set<string>()

  for (const item of forecastData.list) {
    const dateStr = new Date(item.dt * 1000).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
    if (!seenDates.has(dateStr) && seenDates.size < 5) {
      seenDates.add(dateStr)
      dailyForecasts.push({
        date: dateStr,
        tempHigh: Math.round(item.main.temp_max),
        tempLow: Math.round(item.main.temp_min),
        humidity: item.main.humidity,
        conditions: item.weather[0].main,
        conditionIcon: item.weather[0].icon,
      })
    }
  }

  return { current, forecast: dailyForecasts }
}

export interface WeatherResult {
  current: WeatherData
  forecast: ForecastDay[]
  source: 'open-meteo' | 'openweathermap'
}

export async function fetchWeatherData(city: City, signal?: AbortSignal): Promise<WeatherResult> {
  try {
    const data = await fetchOpenMeteoWeather(city, signal)
    return { ...data, source: 'open-meteo' }
  } catch (primaryError) {
    console.warn('Open-Meteo failed, trying OpenWeatherMap fallback:', primaryError)

    if (API_KEY) {
      try {
        const data = await fetchOpenWeatherMapData(city, signal)
        return { ...data, source: 'openweathermap' }
      } catch (fallbackError) {
        console.warn('OpenWeatherMap fallback also failed:', fallbackError)
        throw fallbackError
      }
    }

    throw primaryError
  }
}
