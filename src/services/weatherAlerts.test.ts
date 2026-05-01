import { describe, it, expect } from 'vitest'
import { deriveAlerts } from './weatherAlerts'
import type { WeatherData } from '../types'

const baseCurrent: WeatherData = {
  location: 'Atlanta, US',
  temperature: 72,
  feelsLike: 70,
  humidity: 60,
  pressure: 1015,
  windSpeed: 10,
  windDirection: 180,
  uvIndex: 5,
  visibility: 10,
  conditions: 'Clear',
  conditionIcon: '01d',
  sunrise: '6:30 AM',
  sunset: '7:45 PM',
  lastUpdated: '12:00 PM',
}

describe('deriveAlerts', () => {
  it('returns empty array for null current', () => {
    expect(deriveAlerts(null)).toEqual([])
  })

  it('returns empty array for benign weather', () => {
    expect(deriveAlerts(baseCurrent)).toEqual([])
  })

  describe('UV', () => {
    it('does not fire below 8', () => {
      expect(deriveAlerts({ ...baseCurrent, uvIndex: 7.9 })).toEqual([])
    })

    it('fires Very High UV at 8', () => {
      const alerts = deriveAlerts({ ...baseCurrent, uvIndex: 8 })
      expect(alerts).toHaveLength(1)
      expect(alerts[0].id).toBe('uv-very-high')
      expect(alerts[0].severity).toBe('warning')
    })

    it('fires Extreme UV at 11', () => {
      const alerts = deriveAlerts({ ...baseCurrent, uvIndex: 11 })
      expect(alerts).toHaveLength(1)
      expect(alerts[0].id).toBe('uv-extreme')
      expect(alerts[0].severity).toBe('severe')
    })

    it('does not double-fire when both thresholds met', () => {
      const alerts = deriveAlerts({ ...baseCurrent, uvIndex: 12 })
      expect(alerts.filter((a) => a.id.startsWith('uv-'))).toHaveLength(1)
      expect(alerts[0].id).toBe('uv-extreme')
    })
  })

  describe('Wind', () => {
    it('fires High Winds at 40 mph', () => {
      const alerts = deriveAlerts({ ...baseCurrent, windSpeed: 40 })
      expect(alerts[0].id).toBe('wind-high')
      expect(alerts[0].severity).toBe('warning')
    })

    it('fires Damaging Winds at 60 mph', () => {
      const alerts = deriveAlerts({ ...baseCurrent, windSpeed: 60 })
      expect(alerts[0].id).toBe('wind-damaging')
      expect(alerts[0].severity).toBe('severe')
    })

    it('does not fire below 40 mph', () => {
      expect(deriveAlerts({ ...baseCurrent, windSpeed: 39 })).toEqual([])
    })
  })

  describe('Temperature', () => {
    it('fires Extreme Heat at 100°F', () => {
      const alerts = deriveAlerts({ ...baseCurrent, temperature: 100 })
      expect(alerts[0].id).toBe('temp-heat')
      expect(alerts[0].severity).toBe('severe')
    })

    it('fires Extreme Cold at 0°F', () => {
      const alerts = deriveAlerts({ ...baseCurrent, temperature: 0 })
      expect(alerts[0].id).toBe('temp-cold')
      expect(alerts[0].severity).toBe('severe')
    })

    it('does not fire for moderate temperatures', () => {
      expect(deriveAlerts({ ...baseCurrent, temperature: 55 })).toEqual([])
    })
  })

  describe('Precipitation', () => {
    it('fires Heavy Precipitation at 25 mm', () => {
      const alerts = deriveAlerts({ ...baseCurrent, precipitation: 25 })
      expect(alerts[0].id).toBe('precip-heavy')
      expect(alerts[0].severity).toBe('warning')
    })

    it('fires Heavy Precipitation Likely at 80% chance', () => {
      const alerts = deriveAlerts({ ...baseCurrent, precipitationChance: 80 })
      expect(alerts[0].id).toBe('precip-likely')
      expect(alerts[0].severity).toBe('warning')
    })

    it('prefers heavy amount over chance when both fire', () => {
      const alerts = deriveAlerts({
        ...baseCurrent,
        precipitation: 30,
        precipitationChance: 95,
      })
      const precipAlerts = alerts.filter((a) => a.id.startsWith('precip-'))
      expect(precipAlerts).toHaveLength(1)
      expect(precipAlerts[0].id).toBe('precip-heavy')
    })
  })

  describe('Thunderstorm', () => {
    it('fires for Thunderstorm conditions', () => {
      const alerts = deriveAlerts({ ...baseCurrent, conditions: 'Thunderstorm' })
      expect(alerts.find((a) => a.id === 'thunderstorm')).toBeDefined()
    })
  })

  describe('Sorting', () => {
    it('orders severe before warning before info', () => {
      const alerts = deriveAlerts({
        ...baseCurrent,
        uvIndex: 11, // severe
        windSpeed: 45, // warning
        temperature: 105, // severe
      })

      // All severe should come before all warnings
      const severities = alerts.map((a) => a.severity)
      const lastSevereIndex = severities.lastIndexOf('severe')
      const firstWarningIndex = severities.indexOf('warning')
      expect(lastSevereIndex).toBeLessThan(firstWarningIndex)
    })
  })

  it('marks all derived alerts with source: derived', () => {
    const alerts = deriveAlerts({
      ...baseCurrent,
      uvIndex: 11,
      windSpeed: 45,
      temperature: 105,
    })
    expect(alerts.length).toBeGreaterThan(0)
    for (const alert of alerts) {
      expect(alert.source).toBe('derived')
    }
  })
})
