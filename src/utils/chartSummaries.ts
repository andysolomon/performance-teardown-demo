import type { ForecastDay } from '../types'

export function temperatureSummary(forecast: ForecastDay[], unitLabel: string): string {
  if (forecast.length === 0) return 'No forecast data available.'
  const highs = forecast.map((d) => d.tempHigh)
  const lows = forecast.map((d) => d.tempLow)
  return `Temperature trend over ${forecast.length} days: highs from ${Math.min(...highs)}${unitLabel} to ${Math.max(...highs)}${unitLabel}, lows from ${Math.min(...lows)}${unitLabel} to ${Math.max(...lows)}${unitLabel}.`
}

export function conditionsSummary(forecast: ForecastDay[]): string {
  if (forecast.length === 0) return 'No forecast data available.'
  const counts: Record<string, number> = {}
  forecast.forEach((d) => {
    counts[d.conditions] = (counts[d.conditions] || 0) + 1
  })
  const parts = Object.entries(counts)
    .map(([condition, count]) => `${count} day${count > 1 ? 's' : ''} ${condition}`)
    .join(', ')
  return `Conditions distribution: ${parts}.`
}

export function humiditySummary(forecast: ForecastDay[]): string {
  if (forecast.length === 0) return 'No forecast data available.'
  const humidities = forecast.map((d) => d.humidity)
  return `Humidity forecast over ${forecast.length} days: ranging from ${Math.min(...humidities)}% to ${Math.max(...humidities)}%.`
}
