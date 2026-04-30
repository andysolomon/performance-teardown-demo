import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Pie, Bar } from 'react-chartjs-2'
import type { WeatherData, ForecastDay, HourlyForecast as HourlyForecastType, WeatherError, WeatherMetric, ChartData, City } from '../types'
import { MetricCard } from './MetricCard'
import { HourlyForecast } from './HourlyForecast'
import { CityPicker } from './CityPicker'
import { UnitToggle } from './UnitToggle'
import { PanelSkeleton } from './PanelSkeleton'
import { CityHero } from './CityHero'
import { getStoredUnits, setStoredUnits, convertTemp, convertWindSpeed, convertVisibility, convertPrecipitation, tempUnit, speedUnit, distanceUnit, precipitationUnit, formatDaylight, degreesToCompass, type UnitSystem } from '../utils/units'
import { temperatureSummary, conditionsSummary, humiditySummary } from '../utils/chartSummaries'
import './Dashboard.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface DashboardProps {
  current: WeatherData | null
  forecast: ForecastDay[]
  hourly: HourlyForecastType[]
  isLoading: boolean
  isRefreshing: boolean
  isStale: boolean
  error: WeatherError | null
  source: 'open-meteo' | 'openweathermap' | null
  onRetry: () => void
  city: City
  onCityChange: (city: City) => void
}

export function Dashboard({ current, forecast, hourly, isLoading, isRefreshing, isStale, error, source, onRetry, city, onCityChange }: DashboardProps) {
  const [units, setUnits] = useState<UnitSystem>(getStoredUnits)
  const [activeTab, setActiveTab] = useState<'hourly' | '5-day'>('5-day')
  const [copied, setCopied] = useState(false)

  const handleUnitToggle = (newUnits: UnitSystem) => {
    setUnits(newUnits)
    setStoredUnits(newUnits)
  }

  const handleCopyLink = useCallback(() => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }, [])

  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const textColor = isDark ? '#9ca3af' : '#6b6375'
  const gridColor = isDark ? '#2e303a' : '#e5e4e7'

  const chartOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: 'easeOutQuart' as const,
      },
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            color: textColor,
            padding: 16,
            usePointStyle: true,
          },
        },
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: {
            color: gridColor,
          },
          ticks: {
            color: textColor,
          },
        },
        x: {
          grid: {
            display: false,
          },
          ticks: {
            color: textColor,
          },
        },
      },
    }),
    [textColor, gridColor]
  )

  const pieOptions = useMemo(
    () => ({
      responsive: true,
      maintainAspectRatio: false,
      animation: {
        duration: 800,
        easing: 'easeOutQuart' as const,
      },
      plugins: {
        legend: {
          position: 'bottom' as const,
          labels: {
            color: textColor,
            padding: 12,
            usePointStyle: true,
          },
        },
      },
    }),
    [textColor]
  )

  const metrics: WeatherMetric[] = useMemo(() => {
    if (!current) return []
    const items: WeatherMetric[] = [
      {
        id: 'temperature',
        title: 'Temperature',
        value: convertTemp(current.temperature, units),
        unit: tempUnit(units),
      },
      {
        id: 'humidity',
        title: 'Humidity',
        value: current.humidity,
        unit: '%',
      },
      {
        id: 'wind',
        title: 'Wind Speed',
        value: convertWindSpeed(current.windSpeed, units),
        unit: speedUnit(units),
      },
    ]
    if (current.uvIndex !== undefined) {
      items.push({
        id: 'uv',
        title: 'UV Index',
        value: current.uvIndex,
      })
    }
    return items
  }, [current, units])

  const temperatureChartData: ChartData | null = useMemo(() => {
    if (forecast.length === 0) return null
    return {
      labels: forecast.map((d) => d.date),
      datasets: [
        {
          label: `High (${tempUnit(units)})`,
          data: forecast.map((d) => convertTemp(d.tempHigh, units)),
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
        },
        {
          label: `Low (${tempUnit(units)})`,
          data: forecast.map((d) => convertTemp(d.tempLow, units)),
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 2,
          fill: false,
          tension: 0.4,
        },
      ],
    }
  }, [forecast, units])

  const conditionsChartData: ChartData | null = useMemo(() => {
    if (forecast.length === 0) return null
    const conditionsCount: Record<string, number> = {}
    forecast.forEach((d) => {
      conditionsCount[d.conditions] = (conditionsCount[d.conditions] || 0) + 1
    })
    const labels = Object.keys(conditionsCount)
    const data = Object.values(conditionsCount)
    return {
      labels,
      datasets: [
        {
          label: 'Conditions',
          data,
          backgroundColor: [
            'rgba(251, 191, 36, 0.8)',
            'rgba(156, 163, 175, 0.8)',
            'rgba(59, 130, 246, 0.8)',
            'rgba(34, 197, 94, 0.8)',
          ],
          borderWidth: 0,
        },
      ],
    }
  }, [forecast])

  const humidityChartData: ChartData | null = useMemo(() => {
    if (forecast.length === 0) return null
    return {
      labels: forecast.map((d) => d.date),
      datasets: [
        {
          label: 'Humidity %',
          data: forecast.map((d) => d.humidity),
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderWidth: 0,
        },
      ],
    }
  }, [forecast])

  const hourlyChartData: ChartData | null = useMemo(() => {
    if (hourly.length === 0) return null
    return {
      labels: hourly.map((h) => h.time),
      datasets: [
        {
          label: `Temperature (${tempUnit(units)})`,
          data: hourly.map((h) => convertTemp(h.temperature, units)),
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
        },
      ],
    }
  }, [hourly, units])

  if (isLoading) {
    return <PanelSkeleton />
  }

  if (error) {
    return (
      <div className="dashboard">
        <div className="error-state">
          <h2>Unable to load weather data</h2>
          <p>{error.message}</p>
          <button onClick={onRetry} className="retry-button">
            Try Again
          </button>
        </div>
      </div>
    )
  }

  if (!current) {
    return (
      <div className="dashboard">
        <div className="error-state">
          <h2>No weather data available</h2>
          <button onClick={onRetry} className="retry-button">
            Load Data
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="dashboard">
      <CityHero city={city} />
      <header className="dashboard-header">
        <div className="header-row">
          <div className="header-controls">
            <CityPicker selectedCity={city} onCityChange={onCityChange} />
            <UnitToggle units={units} onToggle={handleUnitToggle} />
            <button className="share-button" onClick={handleCopyLink} aria-label="Copy link to clipboard">
              {copied ? '✓ Link copied!' : '🔗 Share'}
            </button>
          </div>
        </div>
        <p className="dashboard-subtitle">
          {current.location} • Updated {current.lastUpdated}
          {isRefreshing && <span className="refreshing-indicator"> • Refreshing…</span>}
          {isStale && <span className="stale-indicator"> • Data may be outdated</span>}
          {source && <span className="data-source"> • {source === 'open-meteo' ? 'Open-Meteo' : 'OpenWeatherMap'}</span>}
        </p>
        <p className="current-conditions">
          {current.conditions}{current.feelsLike != null ? ` • Feels like ${convertTemp(current.feelsLike, units)}${tempUnit(units)}` : ''}
        </p>
      </header>

      <section className="metrics-grid" aria-label="Current Conditions">
        {metrics.map((metric) => (
          <MetricCard key={metric.id} metric={metric} />
        ))}
      </section>

      <HourlyForecast hours={hourly} units={units} />

      {(hourly.length > 0 || forecast.length > 0) && (
        <div className="chart-tabs" role="tablist" aria-label="Forecast view">
          <button
            className="chart-tab"
            role="tab"
            aria-selected={activeTab === '5-day'}
            aria-controls="panel-5day"
            onClick={() => setActiveTab('5-day')}
          >
            5-Day
          </button>
          <button
            className="chart-tab"
            role="tab"
            aria-selected={activeTab === 'hourly'}
            aria-controls="panel-hourly"
            onClick={() => setActiveTab('hourly')}
          >
            Hourly
          </button>
        </div>
      )}

      <section className="charts-section" aria-label="Forecast Charts">
        {activeTab === '5-day' ? (
          <div id="panel-5day" role="tabpanel">
            <div className="chart-container large">
              <h2>Temperature Trend</h2>
              <div className="chart-wrapper" role="img" aria-label={temperatureSummary(forecast, tempUnit(units))}>
                {temperatureChartData && <Line data={temperatureChartData} options={chartOptions} />}
              </div>
              <table className="sr-only">
                <caption>Temperature Trend Data</caption>
                <thead><tr><th>Date</th><th>High</th><th>Low</th></tr></thead>
                <tbody>
                  {forecast.map((d) => (
                    <tr key={d.date}><td>{d.date}</td><td>{convertTemp(d.tempHigh, units)}{tempUnit(units)}</td><td>{convertTemp(d.tempLow, units)}{tempUnit(units)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="chart-row">
              <div className="chart-container">
                <h2>Conditions Distribution</h2>
                <div className="chart-wrapper" role="img" aria-label={conditionsSummary(forecast)}>
                  {conditionsChartData && <Pie data={conditionsChartData} options={pieOptions} />}
                </div>
                <table className="sr-only">
                  <caption>Conditions Distribution Data</caption>
                  <thead><tr><th>Date</th><th>Conditions</th></tr></thead>
                  <tbody>
                    {forecast.map((d) => (
                      <tr key={d.date}><td>{d.date}</td><td>{d.conditions}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="chart-container">
                <h2>Humidity Forecast</h2>
                <div className="chart-wrapper" role="img" aria-label={humiditySummary(forecast)}>
                  {humidityChartData && <Bar data={humidityChartData} options={chartOptions} />}
                </div>
                <table className="sr-only">
                  <caption>Humidity Forecast Data</caption>
                  <thead><tr><th>Date</th><th>Humidity</th></tr></thead>
                  <tbody>
                    {forecast.map((d) => (
                      <tr key={d.date}><td>{d.date}</td><td>{d.humidity}%</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div id="panel-hourly" role="tabpanel">
            <div className="chart-container large">
              <h2>Hourly Temperature</h2>
              <div className="chart-wrapper" role="img" aria-label={`Hourly temperature forecast for the next ${hourly.length} hours`}>
                {hourlyChartData && <Line data={hourlyChartData} options={chartOptions} />}
              </div>
              <table className="sr-only">
                <caption>Hourly Temperature Data</caption>
                <thead><tr><th>Time</th><th>Temperature</th></tr></thead>
                <tbody>
                  {hourly.map((h) => (
                    <tr key={h.time}><td>{h.time}</td><td>{convertTemp(h.temperature, units)}{tempUnit(units)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="additional-info">
        <div className="info-item">
          <span className="info-label">Sunrise</span>
          <span className="info-value">{current.sunrise}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Sunset</span>
          <span className="info-value">{current.sunset}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Daylight</span>
          <span className="info-value">{current.daylightDuration != null ? formatDaylight(current.daylightDuration) : 'Unavailable'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Visibility</span>
          <span className="info-value">{current.visibility != null ? `${convertVisibility(current.visibility, units)} ${distanceUnit(units)}` : 'Unavailable'}</span>
        </div>
        <div className="info-item">
          <span className="info-label">Pressure</span>
          <span className="info-value">{current.pressure} hPa</span>
        </div>
        <div className="info-item">
          <span className="info-label">Wind Direction</span>
          <span className="info-value">
            {current.windDirection != null ? `${degreesToCompass(current.windDirection)} (${current.windDirection}°)` : 'Unavailable'}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Precipitation</span>
          <span className="info-value">
            {current.precipitation != null ? `${convertPrecipitation(current.precipitation, units)} ${precipitationUnit(units)}` : 'Unavailable'}
          </span>
        </div>
        <div className="info-item">
          <span className="info-label">Precip. Chance</span>
          <span className="info-value">{current.precipitationChance != null ? `${current.precipitationChance}%` : 'Unavailable'}</span>
        </div>
      </section>
    </div>
  )
}
