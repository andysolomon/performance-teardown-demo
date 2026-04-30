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

/**
 * Convert precipitation amount.
 * Open-Meteo is configured to return mm by default; we treat the input as mm
 * and convert to inches for imperial.
 */
export function convertPrecipitation(mm: number, units: UnitSystem): number {
  if (units === 'imperial') return Math.round((mm / 25.4) * 100) / 100
  return Math.round(mm * 10) / 10
}

export function precipitationUnit(units: UnitSystem): string {
  return units === 'metric' ? 'mm' : 'in'
}

/**
 * Format a duration in seconds as a compact "Xh Ym" string.
 * Returns "--" when the value is not a finite non-negative number.
 */
export function formatDaylight(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return '--'
  const totalMinutes = Math.round(seconds / 60)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${hours}h ${minutes}m`
}

const COMPASS_POINTS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'] as const

/**
 * Convert a wind direction in meteorological degrees (0 = North, 90 = East)
 * to an 8-point compass abbreviation.
 */
export function degreesToCompass(degrees: number): string {
  if (!Number.isFinite(degrees)) return '--'
  const normalized = ((degrees % 360) + 360) % 360
  const index = Math.round(normalized / 45) % 8
  return COMPASS_POINTS[index]
}
