import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { HourlyForecast } from './HourlyForecast'
import type { HourlyForecast as HourlyForecastType } from '../types'

const mockHours: HourlyForecastType[] = [
  { time: '3 PM', temperature: 72, conditions: 'Clear', conditionIcon: '01d' },
  { time: '4 PM', temperature: 74, conditions: 'Clouds', conditionIcon: '03d' },
  { time: '5 PM', temperature: 71, conditions: 'Rain', conditionIcon: '10d' },
]

describe('HourlyForecast', () => {
  it('renders correct number of hourly items', () => {
    render(<HourlyForecast hours={mockHours} units="imperial" />)
    expect(screen.getAllByText(/PM/).length).toBe(3)
  })

  it('renders nothing when hours is empty', () => {
    const { container } = render(<HourlyForecast hours={[]} units="imperial" />)
    expect(container.innerHTML).toBe('')
  })

  it('each item has accessible aria-label', () => {
    render(<HourlyForecast hours={mockHours} units="imperial" />)
    expect(screen.getByLabelText(/3 PM: 72°F, Clear/)).toBeInTheDocument()
  })

  it('renders section with aria-label', () => {
    render(<HourlyForecast hours={mockHours} units="imperial" />)
    expect(screen.getByLabelText('Hourly Forecast')).toBeInTheDocument()
  })

  it('converts temperatures for metric units', () => {
    render(<HourlyForecast hours={mockHours} units="metric" />)
    // 72°F = 22°C
    expect(screen.getByLabelText(/3 PM: 22°C, Clear/)).toBeInTheDocument()
  })
})
