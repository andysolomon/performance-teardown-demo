import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MapView } from './MapView'
import { CITIES_FOR_MARKERS } from '../types'

// Mock react-map-gl/mapbox — Map and Marker as pass-through wrappers
vi.mock('react-map-gl/mapbox', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>,
  Marker: ({ children }: { children: React.ReactNode }) => <div data-testid="marker-wrapper">{children}</div>,
}))

vi.mock('mapbox-gl/dist/mapbox-gl.css', () => ({}))

// Provide a Mapbox token in the test environment
vi.stubEnv('VITE_MAPBOX_TOKEN', 'test-token')

describe('MapView', () => {
  it('renders all city markers', () => {
    render(<MapView selectedCityId={null} onCitySelect={vi.fn()} />)

    const markers = screen.getAllByRole('button')
    expect(markers).toHaveLength(CITIES_FOR_MARKERS.length)
  })

  it('markers have correct ARIA attributes', () => {
    render(<MapView selectedCityId={null} onCitySelect={vi.fn()} />)

    const firstCity = CITIES_FOR_MARKERS[0]
    const marker = screen.getByRole('button', { name: `${firstCity.name}, ${firstCity.country}` })
    expect(marker).toHaveAttribute('tabindex', '0')
    expect(marker).toHaveAttribute('aria-pressed', 'false')
  })

  it('selected marker has aria-pressed true', () => {
    render(<MapView selectedCityId="atlanta" onCitySelect={vi.fn()} />)

    const marker = screen.getByRole('button', { name: 'Atlanta, US' })
    expect(marker).toHaveAttribute('aria-pressed', 'true')
    expect(marker.className).toContain('selected')
  })

  it('calls onCitySelect on click', () => {
    const onCitySelect = vi.fn()
    render(<MapView selectedCityId={null} onCitySelect={onCitySelect} />)

    const marker = screen.getByRole('button', { name: 'Atlanta, US' })
    fireEvent.click(marker)

    expect(onCitySelect).toHaveBeenCalledWith('atlanta')
  })

  it('calls onCitySelect on Enter key', () => {
    const onCitySelect = vi.fn()
    render(<MapView selectedCityId={null} onCitySelect={onCitySelect} />)

    const marker = screen.getByRole('button', { name: 'Atlanta, US' })
    fireEvent.keyDown(marker, { key: 'Enter' })

    expect(onCitySelect).toHaveBeenCalledWith('atlanta')
  })

  it('calls onCitySelect on Space key', () => {
    const onCitySelect = vi.fn()
    render(<MapView selectedCityId={null} onCitySelect={onCitySelect} />)

    const marker = screen.getByRole('button', { name: 'Atlanta, US' })
    fireEvent.keyDown(marker, { key: ' ' })

    expect(onCitySelect).toHaveBeenCalledWith('atlanta')
  })

  it('shows error when Mapbox token is missing', () => {
    vi.stubEnv('VITE_MAPBOX_TOKEN', '')

    render(<MapView selectedCityId={null} onCitySelect={vi.fn()} />)

    expect(screen.getByText('Mapbox Token Required')).toBeInTheDocument()

    vi.stubEnv('VITE_MAPBOX_TOKEN', 'test-token')
  })

  it('displays marker labels', () => {
    render(<MapView selectedCityId={null} onCitySelect={vi.fn()} />)

    for (const city of CITIES_FOR_MARKERS) {
      expect(screen.getByText(city.name)).toBeInTheDocument()
    }
  })
})
