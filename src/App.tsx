import { useState, useCallback, useEffect, useMemo, useRef, lazy, Suspense } from 'react'
import { MapView } from './components/MapView'
import { WeatherPanel } from './components/WeatherPanel'
import { InvalidCityView } from './components/InvalidCityView'
import { PanelSkeleton } from './components/PanelSkeleton'
import { useWeather } from './hooks/useWeather'
import { CITIES, DEFAULT_CITY, type City } from './types'
import { getCityFromURL } from './utils/cityUrl'
import './App.css'

const Dashboard = lazy(() => import('./components/Dashboard').then((m) => ({ default: m.Dashboard })))

function App() {
  const [selectedCity, setSelectedCity] = useState<City | null>(() => getCityFromURL().city)
  const [invalidCityId, setInvalidCityId] = useState<string | null>(() => getCityFromURL().invalidId)
  const announcement = useMemo(() => selectedCity ? `${selectedCity.name} selected, weather panel opened` : '', [selectedCity])
  const markerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const lastSelectedRef = useRef<string | null>(null)
  const activeCity = selectedCity ?? DEFAULT_CITY
  const { current, forecast, hourly, isLoading, error, source, refetch } = useWeather(activeCity)

  // Sync URL → state on popstate (back/forward)
  useEffect(() => {
    const onPopState = () => {
      const result = getCityFromURL()
      setSelectedCity(result.city)
      setInvalidCityId(result.invalidId)
    }
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [])

  const selectCity = useCallback((city: City | null) => {
    setSelectedCity(city)
    setInvalidCityId(null)
    const url = city ? `/?city=${city.id}` : '/'
    window.history.pushState({}, '', url)
  }, [])

  useEffect(() => {
    if (selectedCity) {
      lastSelectedRef.current = selectedCity.id
    }
  }, [selectedCity])

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
        markerRefs={markerRefs}
      />
      <WeatherPanel
        isOpen={selectedCity !== null || invalidCityId !== null}
        onClose={handlePanelClose}
        cityName={invalidCityId ? 'Unknown City' : selectedCity?.name}
      >
        {invalidCityId ? (
          <InvalidCityView
            invalidCityId={invalidCityId}
            onGoHome={handlePanelClose}
            onCityChange={(city) => selectCity(city)}
          />
        ) : (
          <Suspense fallback={<PanelSkeleton />}>
            <Dashboard
              current={current}
              forecast={forecast}
              hourly={hourly}
              isLoading={isLoading}
              error={error}
              source={source}
              onRetry={refetch}
              city={activeCity}
              onCityChange={(city) => selectCity(city)}
            />
          </Suspense>
        )}
      </WeatherPanel>
      <div className="sr-only" aria-live="polite" role="status">
        {announcement}
      </div>
    </>
  )
}

export default App
