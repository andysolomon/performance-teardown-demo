import { useMemo, useState, useCallback, useRef } from 'react'
import Map, { Marker } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import { CITIES_FOR_MARKERS, type City } from '../types'
import './MapView.css'

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 1.5,
}

interface MapViewProps {
  selectedCityId: string | null
  onCitySelect: (cityId: string) => void
  onDeselect?: () => void
  markerRefs?: React.MutableRefObject<Record<string, HTMLDivElement | null>>
}

function getMapboxToken(): string {
  const token = import.meta.env.VITE_MAPBOX_TOKEN
  if (!token) {
    console.error('VITE_MAPBOX_TOKEN is not set. Please add it to your .env file.')
  }
  return token || ''
}

export function MapView({ selectedCityId, onCitySelect, onDeselect, markerRefs: externalRefs }: MapViewProps) {
  const [mapError, setMapError] = useState<string | null>(null)
  const internalRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const refs = externalRefs ?? internalRefs

  const mapboxToken = useMemo(() => getMapboxToken(), [])

  const handleMapLoad = useCallback((event: { target: mapboxgl.Map }) => {
    const map = event.target

    // Ocean water
    map.setPaintProperty('water', 'fill-color', [
      'interpolate',
      ['linear'],
      ['zoom'],
      0, '#1a3c6e',
      4, '#2563a8',
      8, '#3b82d4',
    ])

    // Land fill
    map.setPaintProperty('land', 'background-color', '#f5efe6')

    // Landcover (forests, grass, etc.)
    if (map.getLayer('landcover')) {
      map.setPaintProperty('landcover', 'fill-color', [
        'match',
        ['get', 'class'],
        'wood', '#c8dbb0',
        'scrub', '#d4dfc4',
        'grass', '#d8e4c8',
        'crop', '#e6deb8',
        'snow', '#f0f0f8',
        '#e8e0d0',
      ])
      map.setPaintProperty('landcover', 'fill-opacity', 0.6)
    }

    // Country boundaries
    if (map.getLayer('admin-0-boundary')) {
      map.setPaintProperty('admin-0-boundary', 'line-color', '#8b7355')
      map.setPaintProperty('admin-0-boundary', 'line-width', [
        'interpolate', ['linear'], ['zoom'],
        0, 0.8,
        4, 1.5,
        8, 2,
      ])
    }

    // State/province boundaries
    if (map.getLayer('admin-1-boundary')) {
      map.setPaintProperty('admin-1-boundary', 'line-color', '#b8a88a')
      map.setPaintProperty('admin-1-boundary', 'line-width', [
        'interpolate', ['linear'], ['zoom'],
        0, 0.3,
        4, 0.6,
        8, 1,
      ])
      map.setPaintProperty('admin-1-boundary', 'line-dasharray', [3, 2])
    }

    // National parks
    if (map.getLayer('national-park')) {
      map.setPaintProperty('national-park', 'fill-color', '#a8d5a2')
      map.setPaintProperty('national-park', 'fill-opacity', 0.5)
    }
  }, [])

  const handleCityClick = (city: City) => {
    onCitySelect(city.id)
  }

  const handleMapClick = () => {
    if (selectedCityId && onDeselect) {
      onDeselect()
    }
  }

  const handleMapError = (event: { error?: { message?: string; status?: number }; type?: string }) => {
    console.error('Map error:', event)

    const message = event.error?.message || ''
    // Only treat token/auth errors as fatal — not transient tile failures during zoom/pan
    const isFatal =
      message.includes('access token') ||
      message.includes('unauthorized') ||
      message.includes('forbidden') ||
      event.error?.status === 401

    if (isFatal) {
      setMapError(message || 'Failed to load map')
    }
  }

  if (!mapboxToken) {
    return (
      <div className="map-error">
        <div className="map-error-content">
          <h2>Mapbox Token Required</h2>
          <p>To display the map, you need a Mapbox access token.</p>
          <ol>
            <li>Create a free account at <a href="https://www.mapbox.com/" target="_blank" rel="noopener noreferrer">mapbox.com</a></li>
            <li>Get your access token from the dashboard</li>
            <li>Add <code>VITE_MAPBOX_TOKEN=your_token_here</code> to your <code>.env</code> file</li>
            <li>Restart the dev server</li>
          </ol>
        </div>
      </div>
    )
  }

  if (mapError) {
    return (
      <div className="map-error">
        <div className="map-error-content">
          <h2>Map Loading Error</h2>
          <p>{mapError}</p>
          <p>Please check your Mapbox token has the correct permissions.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="map-container">
      <Map
        mapboxAccessToken={mapboxToken}
        initialViewState={INITIAL_VIEW_STATE}
        mapStyle="mapbox://styles/mapbox/light-v11"
        onLoad={handleMapLoad}
        onClick={handleMapClick}
        onError={handleMapError}
        attributionControl={false}
      >
        {CITIES_FOR_MARKERS.map((city) => (
          <Marker
            key={city.id}
            longitude={city.lon}
            latitude={city.lat}
            anchor="bottom"
          >
            <CityMarker
              city={city}
              isSelected={selectedCityId === city.id}
              onClick={() => handleCityClick(city)}
              markerRef={(el) => { refs.current[city.id] = el }}
            />
          </Marker>
        ))}
      </Map>
    </div>
  )
}

interface CityMarkerProps {
  city: City
  isSelected: boolean
  onClick: () => void
  markerRef?: (el: HTMLDivElement | null) => void
}

function CityMarker({ city, isSelected, onClick, markerRef }: CityMarkerProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      e.stopPropagation()
      onClick()
    }
  }

  return (
    <div
      ref={markerRef}
      className={`map-marker ${isSelected ? 'selected' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={`${city.name}, ${city.country}${isSelected ? ' — selected' : ''}`}
      aria-pressed={isSelected}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      onKeyDown={handleKeyDown}
    >
      <div className="marker-dot">
        {isSelected && <div className="marker-pulse" />}
      </div>
      <div className="marker-label">{city.name}</div>
    </div>
  )
}
