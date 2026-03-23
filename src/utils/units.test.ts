import { describe, it, expect, beforeEach } from 'vitest'
import {
  convertTemp,
  convertWindSpeed,
  convertVisibility,
  tempUnit,
  speedUnit,
  distanceUnit,
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
