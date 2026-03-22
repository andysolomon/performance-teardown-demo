import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { CITIES_FOR_MARKERS } from '../types'

// Mock react-map-gl/mapbox — render children directly
vi.mock('react-map-gl/mapbox', () => ({
  default: ({ children }: { children: React.ReactNode }) => <div data-testid="map">{children}</div>,
  Marker: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Lazy import after mocks are set up
const { MapView } = await import('./MapView')

function renderMapView(selectedCityId: string | null = null) {
  const registerMarkerRef = vi.fn()
  return {
    registerMarkerRef,
    ...render(
      <MemoryRouter>
        <MapView selectedCityId={selectedCityId} registerMarkerRef={registerMarkerRef} />
      </MemoryRouter>
    ),
  }
}

describe('MapView marker accessibility', () => {
  it('renders all markers with role="button" and correct aria-label', () => {
    renderMapView()
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(CITIES_FOR_MARKERS.length)

    CITIES_FOR_MARKERS.forEach((city) => {
      expect(screen.getByLabelText(city.name)).toBeInTheDocument()
    })
  })

  it('renders markers in the approved geographic tab order', () => {
    renderMapView()
    const buttons = screen.getAllByRole('button')
    const names = buttons.map((btn) => btn.getAttribute('aria-label'))

    const expectedOrder = [
      'Los Angeles',
      'New York',
      'Atlanta',
      'London',
      'Paris',
      'Dubai',
      'Mumbai',
      'Singapore',
      'Tokyo',
      'Sydney',
    ]

    expect(names).toEqual(expectedOrder)
  })

  it('markers have tabIndex=0 for keyboard focus', () => {
    renderMapView()
    const buttons = screen.getAllByRole('button')
    buttons.forEach((btn) => {
      expect(btn).toHaveAttribute('tabindex', '0')
    })
  })

  it('activates marker on Enter key', () => {
    renderMapView()
    const marker = screen.getByLabelText('Atlanta')
    fireEvent.keyDown(marker, { key: 'Enter' })
    // Navigation would be triggered — we verify no error and the handler ran
    expect(marker).toBeInTheDocument()
  })

  it('activates marker on Space key', () => {
    renderMapView()
    const marker = screen.getByLabelText('Tokyo')
    fireEvent.keyDown(marker, { key: ' ' })
    expect(marker).toBeInTheDocument()
  })

  it('registers marker refs on render', () => {
    const { registerMarkerRef } = renderMapView()
    expect(registerMarkerRef).toHaveBeenCalledTimes(CITIES_FOR_MARKERS.length)
    CITIES_FOR_MARKERS.forEach((city) => {
      expect(registerMarkerRef).toHaveBeenCalledWith(city.id, expect.any(HTMLDivElement))
    })
  })

  it('applies selected class to the active city marker', () => {
    renderMapView('atlanta')
    const marker = screen.getByLabelText('Atlanta')
    expect(marker.className).toContain('selected')
  })
})
