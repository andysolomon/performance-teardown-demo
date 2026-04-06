import { describe, it, expect } from 'vitest'
import { temperatureSummary, conditionsSummary, humiditySummary } from './chartSummaries'
import type { ForecastDay } from '../types'

const mockForecast: ForecastDay[] = [
  { date: 'Thu Mar 13', tempHigh: 75, tempLow: 55, humidity: 60, conditions: 'Clear', conditionIcon: '01d' },
  { date: 'Fri Mar 14', tempHigh: 78, tempLow: 58, humidity: 55, conditions: 'Clouds', conditionIcon: '03d' },
  { date: 'Sat Mar 15', tempHigh: 80, tempLow: 60, humidity: 50, conditions: 'Clear', conditionIcon: '01d' },
]

describe('temperatureSummary', () => {
  it('generates summary with temp range', () => {
    const result = temperatureSummary(mockForecast, '°F')
    expect(result).toContain('3 days')
    expect(result).toContain('75°F')
    expect(result).toContain('80°F')
    expect(result).toContain('55°F')
    expect(result).toContain('60°F')
  })

  it('returns fallback for empty forecast', () => {
    expect(temperatureSummary([], '°F')).toBe('No forecast data available.')
  })
})

describe('conditionsSummary', () => {
  it('generates summary with condition counts', () => {
    const result = conditionsSummary(mockForecast)
    expect(result).toContain('2 days Clear')
    expect(result).toContain('1 day Clouds')
  })

  it('returns fallback for empty forecast', () => {
    expect(conditionsSummary([])).toBe('No forecast data available.')
  })
})

describe('humiditySummary', () => {
  it('generates summary with humidity range', () => {
    const result = humiditySummary(mockForecast)
    expect(result).toContain('3 days')
    expect(result).toContain('50%')
    expect(result).toContain('60%')
  })

  it('returns fallback for empty forecast', () => {
    expect(humiditySummary([])).toBe('No forecast data available.')
  })
})
