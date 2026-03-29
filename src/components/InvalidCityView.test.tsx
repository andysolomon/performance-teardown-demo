import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { InvalidCityView } from './InvalidCityView'
import { CITIES } from '../types'

describe('InvalidCityView', () => {
  it('renders heading and invalid city ID', () => {
    render(<InvalidCityView invalidCityId="foobar" onGoHome={vi.fn()} onCityChange={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'City not supported' })).toBeInTheDocument()
    expect(screen.getByText(/foobar/)).toBeInTheDocument()
  })

  it('calls onGoHome when Return Home button is clicked', () => {
    const onGoHome = vi.fn()
    render(<InvalidCityView invalidCityId="xyz" onGoHome={onGoHome} onCityChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: 'Return Home' }))
    expect(onGoHome).toHaveBeenCalledOnce()
  })

  it('renders a city picker and calls onCityChange when a city is selected', () => {
    const onCityChange = vi.fn()
    render(<InvalidCityView invalidCityId="xyz" onGoHome={vi.fn()} onCityChange={onCityChange} />)

    const select = screen.getByRole('combobox')
    expect(select).toBeInTheDocument()

    fireEvent.change(select, { target: { value: 'tokyo' } })
    const tokyo = CITIES.find((c) => c.id === 'tokyo')!
    expect(onCityChange).toHaveBeenCalledWith(tokyo)
  })

  it('sanitises the city ID as text content only', () => {
    const xss = '<script>alert("xss")</script>'
    render(<InvalidCityView invalidCityId={xss} onGoHome={vi.fn()} onCityChange={vi.fn()} />)

    expect(screen.queryByText('alert("xss")', { exact: false })).toBeInTheDocument()
    expect(document.querySelector('script')).toBeNull()
  })
})
