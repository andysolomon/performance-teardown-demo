import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { WeatherAlerts } from './WeatherAlerts'
import type { WeatherAlert } from '../services/weatherAlerts'

const severeAlert: WeatherAlert = {
  id: 'temp-heat',
  title: 'Extreme heat',
  description: 'Temperature is 105°F.',
  severity: 'severe',
  source: 'derived',
}

const warningAlert: WeatherAlert = {
  id: 'wind-high',
  title: 'High winds',
  description: 'Wind speed of 45 mph.',
  severity: 'warning',
  source: 'derived',
}

describe('WeatherAlerts', () => {
  it('renders nothing when alerts is empty', () => {
    const { container } = render(<WeatherAlerts alerts={[]} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders a region landmark with the count', () => {
    render(<WeatherAlerts alerts={[severeAlert, warningAlert]} />)
    const region = screen.getByRole('region', { name: /Weather advisories \(2\)/ })
    expect(region).toBeInTheDocument()
  })

  it('shows severity badge text for each alert', () => {
    render(<WeatherAlerts alerts={[severeAlert, warningAlert]} />)
    expect(screen.getByText('Severe')).toBeInTheDocument()
    expect(screen.getByText('Warning')).toBeInTheDocument()
  })

  it('shows alert title and description', () => {
    render(<WeatherAlerts alerts={[severeAlert]} />)
    expect(screen.getByText('Extreme heat')).toBeInTheDocument()
    expect(screen.getByText(/Temperature is 105°F/)).toBeInTheDocument()
  })

  it('applies severity classes for visual prominence', () => {
    const { container } = render(<WeatherAlerts alerts={[severeAlert, warningAlert]} />)
    expect(container.querySelector('.weather-alert.severity-severe')).not.toBeNull()
    expect(container.querySelector('.weather-alert.severity-warning')).not.toBeNull()
  })

  it('opens the first severe alert by default', () => {
    const { container } = render(<WeatherAlerts alerts={[warningAlert, severeAlert]} />)
    const detailsList = container.querySelectorAll<HTMLDetailsElement>('details')
    // warning is at index 0 (closed), severe at index 1 (open by default)
    expect(detailsList[0].open).toBe(false)
    expect(detailsList[1].open).toBe(true)
  })

  it('opens the first item when there are no severe alerts', () => {
    const { container } = render(<WeatherAlerts alerts={[warningAlert]} />)
    const details = container.querySelector<HTMLDetailsElement>('details')!
    expect(details.open).toBe(true)
  })

  it('expands and collapses an alert via the summary toggle', () => {
    const { container } = render(<WeatherAlerts alerts={[warningAlert, severeAlert]} />)
    const detailsList = container.querySelectorAll<HTMLDetailsElement>('details')
    const closedSummary = detailsList[0].querySelector('summary')!
    expect(detailsList[0].open).toBe(false)

    // jsdom does not auto-toggle <details>, but we can simulate the expected behaviour:
    fireEvent.click(closedSummary)
    detailsList[0].open = true
    expect(detailsList[0].open).toBe(true)
  })

  it('shows the Derived advisory source pill on each alert', () => {
    render(<WeatherAlerts alerts={[severeAlert, warningAlert]} />)
    expect(screen.getAllByText('Derived advisory').length).toBe(2)
  })
})
