import type { WeatherAlert } from '../services/weatherAlerts'
import './WeatherAlerts.css'

interface WeatherAlertsProps {
  alerts: WeatherAlert[]
}

const SEVERITY_LABEL: Record<WeatherAlert['severity'], string> = {
  severe: 'Severe',
  warning: 'Warning',
  info: 'Info',
}

export function WeatherAlerts({ alerts }: WeatherAlertsProps) {
  if (alerts.length === 0) return null

  // Open the first severe alert by default; if there are none, open the first item.
  const firstSevereIndex = alerts.findIndex((a) => a.severity === 'severe')
  const defaultOpenIndex = firstSevereIndex === -1 ? 0 : firstSevereIndex

  return (
    <section
      className="weather-alerts"
      role="region"
      aria-label={`Weather advisories (${alerts.length})`}
    >
      {alerts.map((alert, i) => (
        <details
          key={alert.id}
          className={`weather-alert severity-${alert.severity}`}
          open={i === defaultOpenIndex}
        >
          <summary className="weather-alert-summary">
            <span className={`weather-alert-badge severity-${alert.severity}`}>
              {SEVERITY_LABEL[alert.severity]}
            </span>
            <span className="weather-alert-title">{alert.title}</span>
            <span className="weather-alert-source" title="Computed from current conditions, not an official warning">
              Derived advisory
            </span>
          </summary>
          <p className="weather-alert-description">{alert.description}</p>
        </details>
      ))}
    </section>
  )
}
