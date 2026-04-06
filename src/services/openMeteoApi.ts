import type { WeatherData, ForecastDay, WeatherError, WeatherErrorType, City } from '../types'

const BASE_URL = 'https://api.open-meteo.com/v1'

export function parseError(status: number, message?: string): WeatherError {
  if (status >= 500) {
    return { type: 'network', message: 'Server error. Please try again later.' }
  }
  return { type: 'unknown', message: message || 'An unexpected error occurred.' }
}

export function getConditionFromCode(code: number): string {
  const conditions: Record<number, string> = {
    0: 'Clear',
    1: 'Clear',
    2: 'Clouds',
    3: 'Clouds',
    45: 'Fog',
    48: 'Fog',
    51: 'Drizzle',
    53: 'Drizzle',
    55: 'Drizzle',
    61: 'Rain',
    63: 'Rain',
    65: 'Rain',
    71: 'Snow',
    73: 'Snow',
    75: 'Snow',
    80: 'Rain',
    81: 'Rain',
    82: 'Rain',
    95: 'Thunderstorm',
    96: 'Thunderstorm',
    99: 'Thunderstorm',
  }

  return conditions[code] || 'Clear'
}

export function formatTimeFromIso(isoDateTime: string): string {
  const timePart = isoDateTime.split('T')[1]
  if (!timePart) {
    return '--'
  }

  const [hourStr, minuteStr] = timePart.split(':')
  const hour24 = Number.parseInt(hourStr, 10)
  const minute = Number.parseInt(minuteStr, 10)

  if (Number.isNaN(hour24) || Number.isNaN(minute)) {
    return '--'
  }

  const suffix = hour24 >= 12 ? 'PM' : 'AM'
  const hour12 = hour24 % 12 || 12
  const minutePadded = String(minute).padStart(2, '0')

  return `${hour12}:${minutePadded} ${suffix}`
}

interface OpenMeteoResponse {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    wind_speed_10m: number
    weather_code: number
    pressure_msl: number
    apparent_temperature?: number
    wind_direction_10m?: number
    visibility?: number
    uv_index?: number
  }
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weather_code: number[]
    relative_humidity_2m_mean: number[]
    sunrise: string[]
    sunset: string[]
  }
  timezone: string
}

export async function fetchOpenMeteoWeather(city: City, signal?: AbortSignal): Promise<{ current: WeatherData; forecast: ForecastDay[] }> {
  try {
    const url = `${BASE_URL}/forecast?latitude=${city.lat}&longitude=${city.lon}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,pressure_msl,apparent_temperature,wind_direction_10m,visibility,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_mean,sunrise,sunset&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`

    const timeoutSignal = AbortSignal.timeout(10_000)
    const composedSignal = signal ? AbortSignal.any([signal, timeoutSignal]) : timeoutSignal

    const response = await fetch(url, { signal: composedSignal })

    if (!response.ok) {
      throw parseError(response.status)
    }

    const data: OpenMeteoResponse = await response.json()

    const uvIndex = data.current.uv_index != null ? Math.round(data.current.uv_index * 10) / 10 : undefined
    const feelsLike = data.current.apparent_temperature != null ? Math.round(data.current.apparent_temperature) : undefined
    const windDirection = data.current.wind_direction_10m != null ? Math.round(data.current.wind_direction_10m) : undefined
    const visibility = data.current.visibility != null ? Math.round(data.current.visibility / 1609) : undefined

    const current: WeatherData = {
      location: `${city.name}, ${city.country}`,
      temperature: Math.round(data.current.temperature_2m),
      ...(feelsLike !== undefined && { feelsLike }),
      humidity: data.current.relative_humidity_2m,
      pressure: Math.round(data.current.pressure_msl),
      windSpeed: Math.round(data.current.wind_speed_10m),
      ...(windDirection !== undefined && { windDirection }),
      ...(uvIndex !== undefined && { uvIndex }),
      ...(visibility !== undefined && { visibility }),
      conditions: getConditionFromCode(data.current.weather_code),
      conditionIcon: '01d',
      sunrise: formatTimeFromIso(data.daily.sunrise[0] || ''),
      sunset: formatTimeFromIso(data.daily.sunset[0] || ''),
      lastUpdated: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }

    const forecast: ForecastDay[] = data.daily.time.slice(0, 5).map((dateStr, i) => ({
      date: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      tempHigh: Math.round(data.daily.temperature_2m_max[i]),
      tempLow: Math.round(data.daily.temperature_2m_min[i]),
      humidity: Math.round(data.daily.relative_humidity_2m_mean[i]),
      conditions: getConditionFromCode(data.daily.weather_code[i]),
      conditionIcon: '01d',
    }))

    return { current, forecast }
  } catch (error) {
    if ((error as WeatherError).type) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'TimeoutError') {
      throw { type: 'timeout' as WeatherErrorType, message: 'Request timed out. Please try again.' }
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw { type: 'network' as WeatherErrorType, message: 'Network error. Please check your connection.' }
    }

    throw { type: 'unknown' as WeatherErrorType, message: 'An unexpected error occurred.' }
  }
}
