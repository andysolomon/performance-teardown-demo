import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Dashboard } from './Dashboard'
import type { WeatherData, ForecastDay } from '../types'
import { DEFAULT_CITY } from '../types'

const mockCurrent: WeatherData = {
  location: 'Atlanta, US',
  temperature: 72,
  feelsLike: 70,
  humidity: 65,
  pressure: 1015,
  windSpeed: 12,
  windDirection: 180,
  uvIndex: 5,
  visibility: 10,
  conditions: 'Clear',
  conditionIcon: '01d',
  sunrise: '6:30 AM',
  sunset: '7:45 PM',
  lastUpdated: '12:00 PM',
}

const mockForecast: ForecastDay[] = [
  { date: 'Thu Mar 13', tempHigh: 75, tempLow: 55, humidity: 60, conditions: 'Clear', conditionIcon: '01d' },
  { date: 'Fri Mar 14', tempHigh: 78, tempLow: 58, humidity: 55, conditions: 'Clouds', conditionIcon: '03d' },
  { date: 'Sat Mar 15', tempHigh: 80, tempLow: 60, humidity: 50, conditions: 'Clear', conditionIcon: '01d' },
]

const mockHourly = [
  { time: '2 PM', temperature: 72, conditions: 'Clear', conditionIcon: '01d' },
  { time: '3 PM', temperature: 74, conditions: 'Clear', conditionIcon: '01d' },
  { time: '4 PM', temperature: 73, conditions: 'Clouds', conditionIcon: '03d' },
]

describe('Dashboard', () => {
  beforeEach(() => {
    localStorage.removeItem('weather-units')
  })

  it('renders skeleton loading state', () => {
    const { container } = render(
      <Dashboard
        current={null}
        forecast={[]}
        hourly={[]}
        isLoading={true}
        isRefreshing={false}
        isStale={false}
        error={null}
        source={null}
        onRetry={vi.fn()}
        city={DEFAULT_CITY}
        onCityChange={vi.fn()}
      />
    )

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThanOrEqual(10)
    expect(screen.queryByText('Loading weather data...')).not.toBeInTheDocument()
  })

  it('renders error state', () => {
    const error = { type: 'network' as const, message: 'Network error' }
    render(
      <Dashboard
        current={null}
        forecast={[]}
        hourly={[]}
        isLoading={false}
        isRefreshing={false}
        isStale={false}
        error={error}
        source={null}
        onRetry={vi.fn()}
        city={DEFAULT_CITY}
        onCityChange={vi.fn()}
      />
    )

    expect(screen.getByText('Unable to load weather data')).toBeInTheDocument()
    expect(screen.getByText('Network error')).toBeInTheDocument()
  })

  it('renders dashboard header with location', () => {
    render(
      <Dashboard
        current={mockCurrent}
        forecast={mockForecast}
        hourly={[]}
        isLoading={false}
        isRefreshing={false}
        isStale={false}
        error={null}
        source="open-meteo"
        onRetry={vi.fn()}
        city={DEFAULT_CITY}
        onCityChange={vi.fn()}
      />
    )

    const subtitle = screen.getByText(/Updated/)
    expect(subtitle).toBeInTheDocument()
    expect(subtitle.textContent).toContain('Atlanta, US')
  })

  it('renders all metric cards including UV when available', () => {
    render(
      <Dashboard
        current={mockCurrent}
        forecast={mockForecast}
        hourly={[]}
        isLoading={false}
        isRefreshing={false}
        isStale={false}
        error={null}
        source="open-meteo"
        onRetry={vi.fn()}
        city={DEFAULT_CITY}
        onCityChange={vi.fn()}
      />
    )

    expect(screen.getByText('Temperature')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Humidity' })).toBeInTheDocument()
    expect(screen.getByText('Wind Speed')).toBeInTheDocument()
    expect(screen.getByText('UV Index')).toBeInTheDocument()
  })

  it('hides UV Index card when uvIndex is undefined', () => {
    const currentWithoutUV = { ...mockCurrent, uvIndex: undefined }
    render(
      <Dashboard
        current={currentWithoutUV}
        forecast={mockForecast}
        hourly={[]}
        isLoading={false}
        isRefreshing={false}
        isStale={false}
        error={null}
        source="openweathermap"
        onRetry={vi.fn()}
        city={DEFAULT_CITY}
        onCityChange={vi.fn()}
      />
    )

    expect(screen.getByText('Temperature')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Humidity' })).toBeInTheDocument()
    expect(screen.getByText('Wind Speed')).toBeInTheDocument()
    expect(screen.queryByText('UV Index')).not.toBeInTheDocument()
  })

  it('renders chart sections', () => {
    render(
      <Dashboard
        current={mockCurrent}
        forecast={mockForecast}
        hourly={[]}
        isLoading={false}
        isRefreshing={false}
        isStale={false}
        error={null}
        source="open-meteo"
        onRetry={vi.fn()}
        city={DEFAULT_CITY}
        onCityChange={vi.fn()}
      />
    )

    expect(screen.getByText('Temperature Trend')).toBeInTheDocument()
    expect(screen.getByText('Conditions Distribution')).toBeInTheDocument()
    expect(screen.getByText('Humidity Forecast')).toBeInTheDocument()
  })

  it('renders additional info section', () => {
    render(
      <Dashboard
        current={mockCurrent}
        forecast={mockForecast}
        hourly={[]}
        isLoading={false}
        isRefreshing={false}
        isStale={false}
        error={null}
        source="open-meteo"
        onRetry={vi.fn()}
        city={DEFAULT_CITY}
        onCityChange={vi.fn()}
      />
    )

    expect(screen.getByText('Sunrise')).toBeInTheDocument()
    expect(screen.getByText('Sunset')).toBeInTheDocument()
    expect(screen.getByText('Visibility')).toBeInTheDocument()
    expect(screen.getByText('Pressure')).toBeInTheDocument()
  })

  it('renders unit toggle in header', () => {
    render(
      <Dashboard
        current={mockCurrent}
        forecast={mockForecast}
        hourly={[]}
        isLoading={false}
        isRefreshing={false}
        isStale={false}
        error={null}
        source="open-meteo"
        onRetry={vi.fn()}
        city={DEFAULT_CITY}
        onCityChange={vi.fn()}
      />
    )

    expect(screen.getByRole('radiogroup', { name: 'Temperature unit' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '°F' })).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '°C' })).toBeInTheDocument()
  })

  it('displays metric values when toggled to °C', () => {
    render(
      <Dashboard
        current={mockCurrent}
        forecast={[]}
        hourly={[]}
        isLoading={false}
        isRefreshing={false}
        isStale={false}
        error={null}
        source="open-meteo"
        onRetry={vi.fn()}
        city={DEFAULT_CITY}
        onCityChange={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('radio', { name: '°C' }))

    expect(screen.getByText('22')).toBeInTheDocument()
    expect(screen.getByText('km/h')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '°C' })).toHaveAttribute('aria-checked', 'true')
  })

  it('persists metric preference in localStorage', () => {
    localStorage.setItem('weather-units', 'metric')

    render(
      <Dashboard
        current={mockCurrent}
        forecast={[]}
        hourly={[]}
        isLoading={false}
        isRefreshing={false}
        isStale={false}
        error={null}
        source="open-meteo"
        onRetry={vi.fn()}
        city={DEFAULT_CITY}
        onCityChange={vi.fn()}
      />
    )

    expect(screen.getByText('22')).toBeInTheDocument()
    expect(screen.getByText('km/h')).toBeInTheDocument()
    expect(screen.getByRole('radio', { name: '°C' })).toHaveAttribute('aria-checked', 'true')
  })

  it('charts section has aria-label', () => {
    render(
      <Dashboard
        current={mockCurrent}
        forecast={mockForecast}
        hourly={[]}
        isLoading={false}
        isRefreshing={false}
        isStale={false}
        error={null}
        source="open-meteo"
        onRetry={vi.fn()}
        city={DEFAULT_CITY}
        onCityChange={vi.fn()}
      />
    )

    expect(screen.getByLabelText('Forecast Charts')).toBeInTheDocument()
  })

  it('chart wrappers have role="img" and aria-label', () => {
    render(
      <Dashboard
        current={mockCurrent}
        forecast={mockForecast}
        hourly={[]}
        isLoading={false}
        isRefreshing={false}
        isStale={false}
        error={null}
        source="open-meteo"
        onRetry={vi.fn()}
        city={DEFAULT_CITY}
        onCityChange={vi.fn()}
      />
    )

    const chartImages = screen.getAllByRole('img')
    expect(chartImages.length).toBeGreaterThanOrEqual(3)
  })

  it('provides sr-only data tables for charts', () => {
    render(
      <Dashboard
        current={mockCurrent}
        forecast={mockForecast}
        hourly={[]}
        isLoading={false}
        isRefreshing={false}
        isStale={false}
        error={null}
        source="open-meteo"
        onRetry={vi.fn()}
        city={DEFAULT_CITY}
        onCityChange={vi.fn()}
      />
    )

    expect(screen.getByText('Temperature Trend Data')).toBeInTheDocument()
    expect(screen.getByText('Conditions Distribution Data')).toBeInTheDocument()
    expect(screen.getByText('Humidity Forecast Data')).toBeInTheDocument()
  })

  it('shows refreshing indicator when isRefreshing is true', () => {
    render(
      <Dashboard
        current={mockCurrent}
        forecast={mockForecast}
        hourly={[]}
        isLoading={false}
        isRefreshing={true}
        isStale={false}
        error={null}
        source="open-meteo"
        onRetry={vi.fn()}
        city={DEFAULT_CITY}
        onCityChange={vi.fn()}
      />
    )

    expect(screen.getByText(/Refreshing…/)).toBeInTheDocument()
    expect(screen.queryByText(/Data may be outdated/)).not.toBeInTheDocument()
  })

  it('shows stale indicator when isStale is true', () => {
    render(
      <Dashboard
        current={mockCurrent}
        forecast={mockForecast}
        hourly={[]}
        isLoading={false}
        isRefreshing={false}
        isStale={true}
        error={null}
        source="open-meteo"
        onRetry={vi.fn()}
        city={DEFAULT_CITY}
        onCityChange={vi.fn()}
      />
    )

    expect(screen.getByText(/Data may be outdated/)).toBeInTheDocument()
    expect(screen.queryByText(/Refreshing…/)).not.toBeInTheDocument()
  })

  it('hides refresh and stale indicators when both are false', () => {
    render(
      <Dashboard
        current={mockCurrent}
        forecast={mockForecast}
        hourly={[]}
        isLoading={false}
        isRefreshing={false}
        isStale={false}
        error={null}
        source="open-meteo"
        onRetry={vi.fn()}
        city={DEFAULT_CITY}
        onCityChange={vi.fn()}
      />
    )

    expect(screen.queryByText(/Refreshing…/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Data may be outdated/)).not.toBeInTheDocument()
  })

  it('renders chart tabs when hourly data exists', () => {
    render(
      <Dashboard current={mockCurrent} forecast={mockForecast} hourly={mockHourly}
        isLoading={false} isRefreshing={false} isStale={false} error={null}
        source="open-meteo" onRetry={vi.fn()} city={DEFAULT_CITY} onCityChange={vi.fn()} />
    )
    expect(screen.getByRole('tablist', { name: 'Forecast view' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '5-Day' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Hourly' })).toBeInTheDocument()
  })

  it('shows 5-day charts by default', () => {
    render(
      <Dashboard current={mockCurrent} forecast={mockForecast} hourly={mockHourly}
        isLoading={false} isRefreshing={false} isStale={false} error={null}
        source="open-meteo" onRetry={vi.fn()} city={DEFAULT_CITY} onCityChange={vi.fn()} />
    )
    expect(screen.getByText('Temperature Trend')).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '5-Day' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tab', { name: 'Hourly' })).toHaveAttribute('aria-selected', 'false')
  })

  it('switches to hourly chart when Hourly tab clicked', () => {
    render(
      <Dashboard current={mockCurrent} forecast={[]} hourly={mockHourly}
        isLoading={false} isRefreshing={false} isStale={false} error={null}
        source="open-meteo" onRetry={vi.fn()} city={DEFAULT_CITY} onCityChange={vi.fn()} />
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Hourly' }))
    expect(screen.getByText('Hourly Temperature')).toBeInTheDocument()
    expect(screen.queryByText('Temperature Trend')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Hourly' })).toHaveAttribute('aria-selected', 'true')
  })

  it('switches back to 5-day charts', () => {
    render(
      <Dashboard current={mockCurrent} forecast={[]} hourly={mockHourly}
        isLoading={false} isRefreshing={false} isStale={false} error={null}
        source="open-meteo" onRetry={vi.fn()} city={DEFAULT_CITY} onCityChange={vi.fn()} />
    )
    fireEvent.click(screen.getByRole('tab', { name: 'Hourly' }))
    fireEvent.click(screen.getByRole('tab', { name: '5-Day' }))
    expect(screen.queryByText('Hourly Temperature')).not.toBeInTheDocument()
    expect(screen.getByRole('tab', { name: '5-Day' })).toHaveAttribute('aria-selected', 'true')
  })

  it('renders share button and copies link on click', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    Object.assign(navigator, { clipboard: { writeText } })

    render(
      <Dashboard current={mockCurrent} forecast={mockForecast} hourly={[]}
        isLoading={false} isRefreshing={false} isStale={false} error={null}
        source="open-meteo" onRetry={vi.fn()} city={DEFAULT_CITY} onCityChange={vi.fn()} />
    )

    const shareButton = screen.getByRole('button', { name: 'Copy link to clipboard' })
    expect(shareButton).toBeInTheDocument()
    fireEvent.click(shareButton)
    expect(writeText).toHaveBeenCalledWith(window.location.href)
  })
})
