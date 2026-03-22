export interface City {
  id: string
  name: string
  country: string
  state?: string
  lat: number
  lon: number
  openWeatherQuery: string
  backgroundImage: string
}

export const CITIES: City[] = [
  {
    id: 'atlanta',
    name: 'Atlanta',
    country: 'US',
    state: 'GA',
    lat: 33.749,
    lon: -84.388,
    openWeatherQuery: 'Atlanta,GA,US',
    backgroundImage: 'https://images.unsplash.com/photo-1566140967404-b8b3932483f5?w=1920&q=80',
  },
  {
    id: 'new-york',
    name: 'New York',
    country: 'US',
    state: 'NY',
    lat: 40.7128,
    lon: -74.006,
    openWeatherQuery: 'New York,NY,US',
    backgroundImage: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=1920&q=80',
  },
  {
    id: 'los-angeles',
    name: 'Los Angeles',
    country: 'US',
    state: 'CA',
    lat: 34.0522,
    lon: -118.2437,
    openWeatherQuery: 'Los Angeles,CA,US',
    backgroundImage: 'https://images.unsplash.com/photo-1534190760961-74e8c1c5c3da?w=1920&q=80',
  },
  {
    id: 'london',
    name: 'London',
    country: 'GB',
    lat: 51.5074,
    lon: -0.1278,
    openWeatherQuery: 'London,GB',
    backgroundImage: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=1920&q=80',
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    country: 'JP',
    lat: 35.6762,
    lon: 139.6503,
    openWeatherQuery: 'Tokyo,JP',
    backgroundImage: 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1920&q=80',
  },
  {
    id: 'paris',
    name: 'Paris',
    country: 'FR',
    lat: 48.8566,
    lon: 2.3522,
    openWeatherQuery: 'Paris,FR',
    backgroundImage: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1920&q=80',
  },
  {
    id: 'sydney',
    name: 'Sydney',
    country: 'AU',
    lat: -33.8688,
    lon: 151.2093,
    openWeatherQuery: 'Sydney,AU',
    backgroundImage: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=1920&q=80',
  },
  {
    id: 'dubai',
    name: 'Dubai',
    country: 'AE',
    lat: 25.2048,
    lon: 55.2708,
    openWeatherQuery: 'Dubai,AE',
    backgroundImage: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=1920&q=80',
  },
  {
    id: 'singapore',
    name: 'Singapore',
    country: 'SG',
    lat: 1.3521,
    lon: 103.8198,
    openWeatherQuery: 'Singapore,SG',
    backgroundImage: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=1920&q=80',
  },
  {
    id: 'mumbai',
    name: 'Mumbai',
    country: 'IN',
    lat: 19.076,
    lon: 72.8777,
    openWeatherQuery: 'Mumbai,IN',
    backgroundImage: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=1920&q=80',
  },
]

export const DEFAULT_CITY = CITIES[0]

// Geographic left-to-right tab order for keyboard navigation
const CITY_MARKER_TAB_ORDER = [
  'los-angeles',
  'new-york',
  'atlanta',
  'london',
  'paris',
  'dubai',
  'mumbai',
  'singapore',
  'tokyo',
  'sydney',
] as const

export const CITIES_FOR_MARKERS = CITY_MARKER_TAB_ORDER
  .map((id) => CITIES.find((city) => city.id === id))
  .filter((city): city is City => Boolean(city))

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
