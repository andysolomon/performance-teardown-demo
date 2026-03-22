import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Dashboard } from './Dashboard'
import { useWeather } from '../hooks/useWeather'
import { CITIES, DEFAULT_CITY, type City } from '../types'
import './WeatherPanel.css'

interface WeatherPanelProps {
  cityId: string
  onRequestClose: (cityId: string) => void
}

export function WeatherPanel({ cityId, onRequestClose }: WeatherPanelProps) {
  const navigate = useNavigate()
  const [isVisible, setIsVisible] = useState(false)
  const [liveMessage, setLiveMessage] = useState('')
  const isClosingRef = useRef(false)

  const city = useMemo(() => CITIES.find((c) => c.id === cityId) || DEFAULT_CITY, [cityId])
  const { current, forecast, isLoading, error, source, refetch } = useWeather(city)

  useEffect(() => {
    requestAnimationFrame(() => {
      setIsVisible(true)
      setLiveMessage(`Weather panel opened for ${city.name}`)
    })
  }, [city.name])

  const handleClose = useCallback(() => {
    if (isClosingRef.current) return
    isClosingRef.current = true
    setIsVisible(false)
    setTimeout(() => {
      onRequestClose(city.id)
    }, 300)
  }, [city.id, onRequestClose])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        handleClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [handleClose])

  const handleCityChange = (newCity: City) => {
    navigate(`/?city=${newCity.id}`)
  }

  return (
    <>
      <div
        className={`weather-panel-backdrop ${isVisible ? 'visible' : ''}`}
        onClick={handleClose}
      />
      <div className={`weather-panel ${isVisible ? 'visible' : ''}`}>
        <button className="weather-panel-close" onClick={handleClose} aria-label="Close panel">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
        <Dashboard
          current={current}
          forecast={forecast}
          isLoading={isLoading}
          error={error}
          source={source}
          onRetry={refetch}
          city={city}
          onCityChange={handleCityChange}
        />
      </div>
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {liveMessage}
      </div>
    </>
  )
}
