import { CityPicker } from './CityPicker'
import { DEFAULT_CITY, type City } from '../types'
import './InvalidCityView.css'

interface InvalidCityViewProps {
  invalidCityId: string
  onGoHome: () => void
  onCityChange: (city: City) => void
}

export function InvalidCityView({ invalidCityId, onGoHome, onCityChange }: InvalidCityViewProps) {
  return (
    <div className="dashboard">
      <div className="invalid-city-state">
        <h2>City not supported</h2>
        <p>
          The city "<span className="invalid-city-id">{invalidCityId}</span>" is not available.
        </p>
        <p className="invalid-city-hint">Select a supported city below or return to the map.</p>
        <div className="invalid-city-actions">
          <CityPicker selectedCity={DEFAULT_CITY} onCityChange={onCityChange} />
          <button className="retry-button" onClick={onGoHome}>
            Return Home
          </button>
        </div>
      </div>
    </div>
  )
}
