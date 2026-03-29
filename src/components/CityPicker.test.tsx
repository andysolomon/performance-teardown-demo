import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CityPicker } from './CityPicker'
import { CITIES } from '../types'

const defaultCity = CITIES[0]

describe('CityPicker', () => {
  it('renders all city options', () => {
    render(<CityPicker selectedCity={defaultCity} onCityChange={vi.fn()} />)

    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(CITIES.length)

    for (const city of CITIES) {
      expect(screen.getByRole('option', { name: `${city.name}, ${city.country}` })).toBeInTheDocument()
    }
  })

  it('reflects the selected city value', () => {
    const tokyo = CITIES.find((c) => c.id === 'tokyo')!
    render(<CityPicker selectedCity={tokyo} onCityChange={vi.fn()} />)

    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('tokyo')
  })

  it('calls onCityChange when selection changes', () => {
    const onCityChange = vi.fn()
    render(<CityPicker selectedCity={defaultCity} onCityChange={onCityChange} />)

    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'tokyo' } })

    const tokyo = CITIES.find((c) => c.id === 'tokyo')!
    expect(onCityChange).toHaveBeenCalledWith(tokyo)
  })

  it('has an accessible label', () => {
    render(<CityPicker selectedCity={defaultCity} onCityChange={vi.fn()} />)

    expect(screen.getByLabelText('Location:')).toBeInTheDocument()
  })
})
