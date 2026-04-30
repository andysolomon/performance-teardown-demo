import { describe, it, expect, beforeEach } from 'vitest'
import {
  convertTemp,
  convertWindSpeed,
  convertVisibility,
  convertPrecipitation,
  tempUnit,
  speedUnit,
  distanceUnit,
  precipitationUnit,
  formatDaylight,
  degreesToCompass,
  getStoredUnits,
  setStoredUnits,
} from './units'

describe('unit conversion utilities', () => {
  describe('convertTemp', () => {
    it('returns same value for imperial', () => {
      expect(convertTemp(72, 'imperial')).toBe(72)
    })

    it('converts 32°F to 0°C', () => {
      expect(convertTemp(32, 'metric')).toBe(0)
    })

    it('converts 212°F to 100°C', () => {
      expect(convertTemp(212, 'metric')).toBe(100)
    })

    it('converts 72°F to 22°C', () => {
      expect(convertTemp(72, 'metric')).toBe(22)
    })
  })

  describe('convertWindSpeed', () => {
    it('returns same value for imperial', () => {
      expect(convertWindSpeed(10, 'imperial')).toBe(10)
    })

    it('converts 10 mph to 16 km/h', () => {
      expect(convertWindSpeed(10, 'metric')).toBe(16)
    })
  })

  describe('convertVisibility', () => {
    it('returns same value for imperial', () => {
      expect(convertVisibility(10, 'imperial')).toBe(10)
    })

    it('converts 10 mi to 16 km', () => {
      expect(convertVisibility(10, 'metric')).toBe(16)
    })
  })

  describe('unit labels', () => {
    it('returns °F for imperial', () => {
      expect(tempUnit('imperial')).toBe('°F')
    })

    it('returns °C for metric', () => {
      expect(tempUnit('metric')).toBe('°C')
    })

    it('returns mph for imperial', () => {
      expect(speedUnit('imperial')).toBe('mph')
    })

    it('returns km/h for metric', () => {
      expect(speedUnit('metric')).toBe('km/h')
    })

    it('returns mi for imperial', () => {
      expect(distanceUnit('imperial')).toBe('mi')
    })

    it('returns km for metric', () => {
      expect(distanceUnit('metric')).toBe('km')
    })
  })

  describe('convertPrecipitation', () => {
    it('returns mm rounded to 1 decimal for metric', () => {
      expect(convertPrecipitation(2.55, 'metric')).toBeCloseTo(2.6, 5)
    })

    it('returns 0 for 0 mm in either unit', () => {
      expect(convertPrecipitation(0, 'metric')).toBe(0)
      expect(convertPrecipitation(0, 'imperial')).toBe(0)
    })

    it('converts 25.4 mm to 1 in for imperial', () => {
      expect(convertPrecipitation(25.4, 'imperial')).toBe(1)
    })

    it('converts 12.7 mm to 0.5 in for imperial', () => {
      expect(convertPrecipitation(12.7, 'imperial')).toBe(0.5)
    })
  })

  describe('precipitationUnit', () => {
    it('returns mm for metric', () => {
      expect(precipitationUnit('metric')).toBe('mm')
    })

    it('returns in for imperial', () => {
      expect(precipitationUnit('imperial')).toBe('in')
    })
  })

  describe('formatDaylight', () => {
    it('formats 12h 0m', () => {
      expect(formatDaylight(12 * 3600)).toBe('12h 0m')
    })

    it('formats 12h 30m', () => {
      expect(formatDaylight(12 * 3600 + 30 * 60)).toBe('12h 30m')
    })

    it('rounds to nearest minute', () => {
      expect(formatDaylight(12 * 3600 + 30 * 60 + 45)).toBe('12h 31m')
    })

    it('handles 0 seconds', () => {
      expect(formatDaylight(0)).toBe('0h 0m')
    })

    it('returns -- for negative values', () => {
      expect(formatDaylight(-1)).toBe('--')
    })

    it('returns -- for non-finite values', () => {
      expect(formatDaylight(NaN)).toBe('--')
      expect(formatDaylight(Infinity)).toBe('--')
    })
  })

  describe('degreesToCompass', () => {
    it.each([
      [0, 'N'],
      [45, 'NE'],
      [90, 'E'],
      [135, 'SE'],
      [180, 'S'],
      [225, 'SW'],
      [270, 'W'],
      [315, 'NW'],
      [360, 'N'],
    ])('maps %i° to %s', (deg, label) => {
      expect(degreesToCompass(deg)).toBe(label)
    })

    it('rounds to nearest 8-point direction', () => {
      expect(degreesToCompass(22)).toBe('N')
      expect(degreesToCompass(23)).toBe('NE')
      expect(degreesToCompass(67)).toBe('NE')
      expect(degreesToCompass(68)).toBe('E')
    })

    it('normalizes negative degrees', () => {
      expect(degreesToCompass(-45)).toBe('NW')
    })

    it('normalizes degrees over 360', () => {
      expect(degreesToCompass(450)).toBe('E')
    })

    it('returns -- for non-finite values', () => {
      expect(degreesToCompass(NaN)).toBe('--')
    })
  })

  describe('localStorage persistence', () => {
    beforeEach(() => {
      localStorage.removeItem('weather-units')
    })

    it('defaults to imperial when nothing stored', () => {
      expect(getStoredUnits()).toBe('imperial')
    })

    it('roundtrips metric preference', () => {
      setStoredUnits('metric')
      expect(getStoredUnits()).toBe('metric')
    })

    it('roundtrips imperial preference', () => {
      setStoredUnits('imperial')
      expect(getStoredUnits()).toBe('imperial')
    })

    it('defaults to imperial for invalid stored value', () => {
      localStorage.setItem('weather-units', 'invalid')
      expect(getStoredUnits()).toBe('imperial')
    })
  })
})
