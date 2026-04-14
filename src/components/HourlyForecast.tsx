import type { HourlyForecast as HourlyForecastType } from '../types'
import { convertTemp, tempUnit, type UnitSystem } from '../utils/units'
import './HourlyForecast.css'

interface HourlyForecastProps {
  hours: HourlyForecastType[]
  units: UnitSystem
}

export function HourlyForecast({ hours, units }: HourlyForecastProps) {
  if (hours.length === 0) return null

  const isLimited = hours.length > 0 && hours.length < 24

  return (
    <section className="hourly-forecast" aria-label="Hourly Forecast">
      <h2>Next 24 Hours</h2>
      {isLimited && (
        <p className="hourly-limited">Limited hourly data available ({hours.length} of 24 hours)</p>
      )}
      <div className="hourly-scroll">
        {hours.map((hour) => (
          <div
            key={hour.time}
            className="hourly-item"
            aria-label={`${hour.time}: ${convertTemp(hour.temperature, units)}${tempUnit(units)}, ${hour.conditions}`}
          >
            <span className="hourly-time">{hour.time}</span>
            <span className="hourly-temp">{convertTemp(hour.temperature, units)}°</span>
            <span className="hourly-conditions">{hour.conditions}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
