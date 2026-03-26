import type { City } from '../types'
import { CITIES } from '../types'
import './CityPicker.css'

interface CityPickerProps {
  selectedCity: City
  onCityChange: (city: City) => void
}

export function CityPicker({ selectedCity, onCityChange }: CityPickerProps) {
  return (
    <div className="city-picker">
      <label htmlFor="city-select" className="city-picker-label">
        Location:
      </label>
      <select
        id="city-select"
        className="city-picker-select"
        value={selectedCity.id}
        onChange={(e) => {
          const city = CITIES.find((c) => c.id === e.target.value)
          if (city) onCityChange(city)
        }}
      >
        {CITIES.map((city) => (
          <option key={city.id} value={city.id}>
            {city.name}, {city.country}
          </option>
        ))}
      </select>
    </div>
  )
}
