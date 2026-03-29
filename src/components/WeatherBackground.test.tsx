import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { WeatherBackground } from './WeatherBackground'

function renderBg(temperature: number | null, conditions: string | null) {
  const { container } = render(<WeatherBackground temperature={temperature} conditions={conditions} />)
  return container.querySelector('.weather-bg')!
}

describe('WeatherBackground', () => {
  describe('condition-based themes', () => {
    it('applies snow theme', () => {
      const el = renderBg(30, 'Snow')
      expect(el.className).toContain('weather-snow')
    })

    it('applies rain theme', () => {
      const el = renderBg(60, 'Rain')
      expect(el.className).toContain('weather-rain')
    })

    it('applies storm theme', () => {
      const el = renderBg(70, 'Thunderstorm')
      expect(el.className).toContain('weather-storm')
    })

    it('applies fog theme', () => {
      const el = renderBg(55, 'Fog')
      expect(el.className).toContain('weather-fog')
    })

    it('applies cloudy theme', () => {
      const el = renderBg(65, 'Clouds')
      expect(el.className).toContain('weather-cloudy')
    })
  })

  describe('temperature-based themes (clear conditions)', () => {
    it('applies hot theme for ≥95°F', () => {
      const el = renderBg(100, 'Clear')
      expect(el.className).toContain('weather-hot')
      expect(el.getAttribute('style')).toContain('linear-gradient')
    })

    it('applies warm theme for ≥80°F', () => {
      const el = renderBg(85, 'Clear')
      expect(el.className).toContain('weather-warm')
    })

    it('applies pleasant theme for ≥60°F', () => {
      const el = renderBg(72, 'Clear')
      expect(el.className).toContain('weather-pleasant')
    })

    it('applies cool theme for ≥40°F', () => {
      const el = renderBg(45, 'Clear')
      expect(el.className).toContain('weather-cool')
    })

    it('applies cold theme for <40°F', () => {
      const el = renderBg(20, 'Clear')
      expect(el.className).toContain('weather-cold')
    })
  })

  describe('edge cases', () => {
    it('uses default theme when temperature is null and conditions are null', () => {
      const el = renderBg(null, null)
      expect(el.className).toContain('weather-pleasant')
    })

    it('renders three blob elements', () => {
      const { container } = render(<WeatherBackground temperature={72} conditions="Clear" />)
      const blobs = container.querySelectorAll('.weather-bg-blob')
      expect(blobs).toHaveLength(3)
    })
  })
})
