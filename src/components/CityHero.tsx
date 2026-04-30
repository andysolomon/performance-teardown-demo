import { useEffect, useState } from 'react'
import type { City } from '../types'
import './CityHero.css'

interface CityHeroProps {
  city: City | null
}

type Status = 'loading' | 'loaded' | 'error'

/**
 * Hero banner showing a city-specific image with a dark gradient overlay so
 * any text rendered on top stays readable. Renders nothing when no city is
 * selected, when the city has no `backgroundImage`, or when the image fails
 * to load — in those cases the surrounding animated WeatherBackground
 * remains the only background, with no broken-image icon or layout shift.
 */
export function CityHero({ city }: CityHeroProps) {
  const [status, setStatus] = useState<Status>('loading')

  // Reset state whenever the city (and therefore the image URL) changes
  useEffect(() => {
    setStatus('loading')
  }, [city?.id])

  if (!city || !city.backgroundImage || status === 'error') {
    return null
  }

  return (
    <div
      className={`city-hero ${status === 'loaded' ? 'loaded' : 'loading'}`}
      aria-hidden="true"
      data-testid="city-hero"
    >
      <img
        className="city-hero-img"
        src={city.backgroundImage}
        alt=""
        loading="lazy"
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
      />
      <div className="city-hero-overlay" />
    </div>
  )
}
