export interface WeatherMetric {
  id: string
  title: string
  value: number | string
  unit?: string
  icon?: string
}

export interface ChartData {
  labels: string[]
  datasets: Dataset[]
}

export interface Dataset {
  label: string
  data: number[]
  backgroundColor?: string | string[]
  borderColor?: string | string[]
  borderWidth?: number
  fill?: boolean
  tension?: number
}

export interface WeatherData {
  location: string
  temperature: number
  feelsLike: number
  humidity: number
  pressure: number
  windSpeed: number
  windDirection: number
  uvIndex: number
  visibility: number
  conditions: string
  conditionIcon: string
  sunrise: string
  sunset: string
  lastUpdated: string
}

export interface ForecastDay {
  date: string
  tempHigh: number
  tempLow: number
  humidity: number
  conditions: string
  conditionIcon: string
}

export interface WeatherApiResponse {
  current: WeatherData
  forecast: ForecastDay[]
}

export type WeatherErrorType = 'network' | 'rate_limit' | 'invalid_key' | 'unknown'

export interface WeatherError {
  type: WeatherErrorType
  message: string
}
