import { useState, useCallback, useEffect } from 'react'
import { Dashboard } from './components/Dashboard'
import { MapView } from './components/MapView'
import { WeatherPanel } from './components/WeatherPanel'
import { useWeather } from './hooks/useWeather'
import { CITIES, DEFAULT_CITY, type City } from './types'
import './App.css'

function getCityFromURL(): City | null {
  const params = new URLSearchParams(window.location.search)
  const cityId = params.get('city')
  if (!cityId) return null
  return CITIES.find((c) => c.id === cityId) ?? null
}

function App() {
  const [selectedCity, setSelectedCity] = useState<City | null>(getCityFromURL)
  const activeCity = selectedCity ?? DEFAULT_CITY
  const { current, forecast, isLoading, error, source, refetch } = useWeather(activeCity)

  // Sync URL → state on popstate (back/forward)
  useEffect(() => {
    const onPopState = () => setSelectedCity(getCityFromURL())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const selectCity = useCallback((city: City | null) => {
    setSelectedCity(city)
    const url = city ? `/?city=${city.id}` : '/'
    window.history.pushState({}, '', url)
  }, [])

  const handleCitySelect = useCallback((cityId: string) => {
    const city = CITIES.find((c) => c.id === cityId)
    if (city) selectCity(city)
  }, [selectCity])

  const handlePanelClose = useCallback(() => {
    selectCity(null)
  }, [selectCity])

  return (
    <>
      <MapView
        selectedCityId={selectedCity?.id ?? null}
        onCitySelect={handleCitySelect}
        onDeselect={handlePanelClose}
      />
      <WeatherPanel isOpen={selectedCity !== null} onClose={handlePanelClose} cityName={selectedCity?.name}>
        <Dashboard
          current={current}
          forecast={forecast}
          isLoading={isLoading}
          error={error}
          source={source}
          onRetry={refetch}
          city={activeCity}
          onCityChange={(city) => selectCity(city)}
        />
      </WeatherPanel>
    </>
  )
}

export default App
