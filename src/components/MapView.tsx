import { useMemo, useState } from 'react'
import Map, { Marker } from 'react-map-gl/mapbox'
import { useNavigate } from 'react-router-dom'
import 'mapbox-gl/dist/mapbox-gl.css'
import { CITIES, type City } from '../types'
import './MapView.css'

const INITIAL_VIEW_STATE = {
  longitude: 0,
  latitude: 20,
  zoom: 1.5,
}

interface MapViewProps {
  selectedCityId: string | null
}

function getMapboxToken(): string {
  const token = import.meta.env.VITE_MAPBOX_TOKEN
  if (!token) {
    console.error('VITE_MAPBOX_TOKEN is not set. Please add it to your .env file.')
  }
  return token || ''
}

export function MapView({ selectedCityId }: MapViewProps) {
  const navigate = useNavigate()
  const [mapError, setMapError] = useState<string | null>(null)

  const mapboxToken = useMemo(() => getMapboxToken(), [])

  const handleCityClick = (city: City) => {
    navigate(`/?city=${city.id}`)
  }

  const handleMapClick = () => {
    if (selectedCityId) {
      navigate('/')
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
        onClick={handleMapClick}
        onError={handleMapError}
        attributionControl={false}
      >
        {CITIES.map((city) => (
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
}

function CityMarker({ city, isSelected, onClick }: CityMarkerProps) {
  return (
    <div
      className={`map-marker ${isSelected ? 'selected' : ''}`}
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
    >
      <div className="marker-dot">
        {isSelected && <div className="marker-pulse" />}
      </div>
      <div className="marker-label">{city.name}</div>
    </div>
  )
}
