import type { WeatherData, ForecastDay } from '../types'

export type AlertSeverity = 'info' | 'warning' | 'severe'

export interface WeatherAlert {
  /** Stable key — used both for React lists and aria identifiers */
  id: string
  title: string
  description: string
  severity: AlertSeverity
  /**
   * Where the alert came from. Currently only 'derived' (computed from the
   * existing weather payload). When/if a real alerts provider is added, this
   * lets the UI label official alerts differently.
   */
  source: 'derived'
}

const SEVERITY_RANK: Record<AlertSeverity, number> = {
  severe: 0,
  warning: 1,
  info: 2,
}

/**
 * Derive client-side weather advisories from the weather payload we already
 * have. These are NOT official government warnings and should be labelled as
 * such in the UI.
 *
 * Inputs are interpreted in the upstream API's native units (Fahrenheit for
 * temperature, mph for wind, mm for precipitation amount) so rule firing is
 * independent of the user's unit preference.
 *
 * Returns an empty array when nothing is triggered, sorted severe → warning
 * → info otherwise.
 */
export function deriveAlerts(
  current: WeatherData | null,
  _forecast: ForecastDay[] = [],
): WeatherAlert[] {
  if (!current) return []

  const alerts: WeatherAlert[] = []

  // UV
  if (current.uvIndex != null) {
    if (current.uvIndex >= 11) {
      alerts.push({
        id: 'uv-extreme',
        title: 'Extreme UV index',
        description: `UV index is ${current.uvIndex}. Avoid sun exposure between 10am and 4pm; SPF 30+ and protective clothing strongly recommended.`,
        severity: 'severe',
        source: 'derived',
      })
    } else if (current.uvIndex >= 8) {
      alerts.push({
        id: 'uv-very-high',
        title: 'Very high UV',
        description: `UV index is ${current.uvIndex}. Take precautions: sunscreen, hat, and sunglasses.`,
        severity: 'warning',
        source: 'derived',
      })
    }
  }

  // Wind
  if (current.windSpeed >= 60) {
    alerts.push({
      id: 'wind-damaging',
      title: 'Damaging winds',
      description: `Wind speed of ${current.windSpeed} mph. Secure loose outdoor objects and avoid travel where possible.`,
      severity: 'severe',
      source: 'derived',
    })
  } else if (current.windSpeed >= 40) {
    alerts.push({
      id: 'wind-high',
      title: 'High winds',
      description: `Wind speed of ${current.windSpeed} mph. Use caution outdoors and while driving high-profile vehicles.`,
      severity: 'warning',
      source: 'derived',
    })
  }

  // Temperature extremes (always evaluated in Fahrenheit — the upstream native unit)
  if (current.temperature >= 100) {
    alerts.push({
      id: 'temp-heat',
      title: 'Extreme heat',
      description: `Temperature is ${current.temperature}°F. Stay hydrated, limit outdoor exertion, and check on vulnerable neighbors.`,
      severity: 'severe',
      source: 'derived',
    })
  } else if (current.temperature <= 0) {
    alerts.push({
      id: 'temp-cold',
      title: 'Extreme cold',
      description: `Temperature is ${current.temperature}°F. Risk of frostbite within minutes on exposed skin.`,
      severity: 'severe',
      source: 'derived',
    })
  }

  // Precipitation
  if (current.precipitation != null && current.precipitation >= 25) {
    alerts.push({
      id: 'precip-heavy',
      title: 'Heavy precipitation',
      description: `${current.precipitation} mm of precipitation in the last hour. Monitor local flooding advisories.`,
      severity: 'warning',
      source: 'derived',
    })
  } else if (current.precipitationChance != null && current.precipitationChance >= 80) {
    alerts.push({
      id: 'precip-likely',
      title: 'Heavy precipitation likely',
      description: `${current.precipitationChance}% chance of significant precipitation today.`,
      severity: 'warning',
      source: 'derived',
    })
  }

  // Thunderstorms
  if (current.conditions === 'Thunderstorm') {
    alerts.push({
      id: 'thunderstorm',
      title: 'Thunderstorm in area',
      description: 'Active thunderstorm reported. Seek shelter indoors and avoid open areas.',
      severity: 'warning',
      source: 'derived',
    })
  }

  return alerts.sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity])
}
