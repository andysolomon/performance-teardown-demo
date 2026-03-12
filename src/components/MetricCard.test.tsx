import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MetricCard } from './MetricCard'
import type { WeatherMetric } from '../types'

describe('MetricCard', () => {
  it('renders metric title and value', () => {
    const metric: WeatherMetric = {
      id: 'temperature',
      title: 'Temperature',
      value: 72,
      unit: '°F',
    }

    render(<MetricCard metric={metric} />)

    expect(screen.getByText('Temperature')).toBeInTheDocument()
    expect(screen.getByText('72')).toBeInTheDocument()
  })

  it('renders value with unit', () => {
    const metric: WeatherMetric = {
      id: 'humidity',
      title: 'Humidity',
      value: 65,
      unit: '%',
    }

    render(<MetricCard metric={metric} />)

    expect(screen.getByText('65')).toBeInTheDocument()
    expect(screen.getByText('%')).toBeInTheDocument()
  })

  it('renders without unit', () => {
    const metric: WeatherMetric = {
      id: 'uv',
      title: 'UV Index',
      value: 5,
    }

    render(<MetricCard metric={metric} />)

    expect(screen.getByText('UV Index')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('renders with icon', () => {
    const metric: WeatherMetric = {
      id: 'wind',
      title: 'Wind Speed',
      value: 12,
      unit: 'mph',
      icon: '💨',
    }

    render(<MetricCard metric={metric} />)

    expect(screen.getByText('💨')).toBeInTheDocument()
  })
})
