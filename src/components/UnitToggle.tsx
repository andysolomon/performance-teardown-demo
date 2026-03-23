import type { UnitSystem } from '../utils/units'
import './UnitToggle.css'

interface UnitToggleProps {
  units: UnitSystem
  onToggle: (units: UnitSystem) => void
}

export function UnitToggle({ units, onToggle }: UnitToggleProps) {
  return (
    <div className="unit-toggle" role="radiogroup" aria-label="Temperature unit">
      <button
        className={`unit-toggle-option ${units === 'imperial' ? 'active' : ''}`}
        role="radio"
        aria-checked={units === 'imperial'}
        onClick={() => onToggle('imperial')}
      >
        °F
      </button>
      <button
        className={`unit-toggle-option ${units === 'metric' ? 'active' : ''}`}
        role="radio"
        aria-checked={units === 'metric'}
        onClick={() => onToggle('metric')}
      >
        °C
      </button>
    </div>
  )
}
