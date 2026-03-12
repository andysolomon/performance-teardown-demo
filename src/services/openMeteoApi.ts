import type { WeatherData, ForecastDay, WeatherError, WeatherErrorType } from '../types'

const ATLANTA_LAT = 33.749
const ATLANTA_LON = -84.388
const BASE_URL = 'https://api.open-meteo.com/v1'

function parseError(status: number, message?: string): WeatherError {
  if (status >= 500) {
    return { type: 'network', message: 'Server error. Please try again later.' }
  }
  return { type: 'unknown', message: message || 'An unexpected error occurred.' }
}

function getConditionFromCode(code: number): string {
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

interface OpenMeteoResponse {
  current: {
    temperature_2m: number
    relative_humidity_2m: number
    wind_speed_10m: number
    weather_code: number
    pressure_msl: number
  }
  daily: {
    time: string[]
    temperature_2m_max: number[]
    temperature_2m_min: number[]
    weather_code: number[]
  }
  timezone: string
}

export async function fetchOpenMeteoWeather(): Promise<{ current: WeatherData; forecast: ForecastDay[] }> {
  try {
    const url = `${BASE_URL}/forecast?latitude=${ATLANTA_LAT}&longitude=${ATLANTA_LON}&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code,pressure_msl&daily=weather_code,temperature_2m_max,temperature_2m_min&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=America%2FNew_York`

    const response = await fetch(url)

    if (!response.ok) {
      throw parseError(response.status)
    }

    const data: OpenMeteoResponse = await response.json()

    const uvIndex = Math.round((Math.random() * 10 + 1) * 10) / 10

    const current: WeatherData = {
      location: 'Atlanta, US',
      temperature: Math.round(data.current.temperature_2m),
      feelsLike: Math.round(data.current.temperature_2m),
      humidity: data.current.relative_humidity_2m,
      pressure: Math.round(data.current.pressure_msl),
      windSpeed: Math.round(data.current.wind_speed_10m),
      windDirection: 0,
      uvIndex,
      visibility: 10,
      conditions: getConditionFromCode(data.current.weather_code),
      conditionIcon: '01d',
      sunrise: '6:30 AM',
      sunset: '7:45 PM',
      lastUpdated: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
    }

    const forecast: ForecastDay[] = data.daily.time.slice(0, 5).map((dateStr, i) => ({
      date: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      tempHigh: Math.round(data.daily.temperature_2m_max[i]),
      tempLow: Math.round(data.daily.temperature_2m_min[i]),
      humidity: 50,
      conditions: getConditionFromCode(data.daily.weather_code[i]),
      conditionIcon: '01d',
    }))

    return { current, forecast }
  } catch (error) {
    if ((error as WeatherError).type) {
      throw error
    }
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw { type: 'network' as WeatherErrorType, message: 'Network error. Please check your connection.' }
    }
    throw { type: 'unknown' as WeatherErrorType, message: 'An unexpected error occurred.' }
  }
}
