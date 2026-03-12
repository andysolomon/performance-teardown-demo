import type { WeatherMetric } from '../types'
import './MetricCard.css'

interface MetricCardProps {
  metric: WeatherMetric
}

export function MetricCard({ metric }: MetricCardProps) {
  return (
    <div className="metric-card">
      <h3 className="metric-title">{metric.title}</h3>
      <p className="metric-value">
        {metric.value}
        {metric.unit && <span className="metric-unit">{metric.unit}</span>}
      </p>
      {metric.icon && <span className="metric-icon">{metric.icon}</span>}
    </div>
  )
}
