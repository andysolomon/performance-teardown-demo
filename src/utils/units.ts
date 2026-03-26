export type UnitSystem = 'imperial' | 'metric'

const STORAGE_KEY = 'weather-units'

export function getStoredUnits(): UnitSystem {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'metric' || stored === 'imperial') return stored
  } catch { /* localStorage unavailable */ }
  return 'imperial'
}

export function setStoredUnits(units: UnitSystem): void {
  try {
    localStorage.setItem(STORAGE_KEY, units)
  } catch { /* localStorage unavailable */ }
}

export function convertTemp(fahrenheit: number, units: UnitSystem): number {
  if (units === 'metric') return Math.round(((fahrenheit - 32) * 5) / 9)
  return fahrenheit
}

export function convertWindSpeed(mph: number, units: UnitSystem): number {
  if (units === 'metric') return Math.round(mph * 1.609)
  return mph
}

export function convertVisibility(miles: number, units: UnitSystem): number {
  if (units === 'metric') return Math.round(miles * 1.609)
  return miles
}

export function tempUnit(units: UnitSystem): string {
  return units === 'metric' ? '°C' : '°F'
}

export function speedUnit(units: UnitSystem): string {
  return units === 'metric' ? 'km/h' : 'mph'
}

export function distanceUnit(units: UnitSystem): string {
  return units === 'metric' ? 'km' : 'mi'
}
