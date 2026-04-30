import { useState, useCallback, useEffect, useMemo, useRef, lazy, Suspense } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { MapView } from './components/MapView'
import { WeatherPanel } from './components/WeatherPanel'
import { InvalidCityView } from './components/InvalidCityView'
import { PanelSkeleton } from './components/PanelSkeleton'
import { useWeather } from './hooks/useWeather'
import { useStatusAnnouncement } from './hooks/useStatusAnnouncement'
import { CITIES, DEFAULT_CITY, type City } from './types'
import { getCityById } from './utils/cityUrl'
import './App.css'

const Dashboard = lazy(() => import('./components/Dashboard').then((m) => ({ default: m.Dashboard })))

function App() {
  const { cityId } = useParams<{ cityId?: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  // Legacy redirect: ?city=xxx → /city/xxx
  useEffect(() => {
    const legacyCityId = searchParams.get('city')
    if (legacyCityId) {
      navigate(`/city/${legacyCityId}`, { replace: true })
    }
  }, [searchParams, navigate])

  // Derive city from route params
  const routeResult = useMemo(() => getCityById(cityId), [cityId])

  const [selectedCity, setSelectedCity] = useState<City | null>(routeResult.city)
  const [invalidCityId, setInvalidCityId] = useState<string | null>(routeResult.invalidId)

  // Sync route params → state when URL changes
  useEffect(() => {
    const { city, invalidId } = getCityById(cityId)
    setSelectedCity(city)
    setInvalidCityId(invalidId)
  }, [cityId])

  const markerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const lastSelectedRef = useRef<string | null>(null)
  const activeCity = selectedCity ?? DEFAULT_CITY
  const { current, forecast, hourly, isLoading, isRefreshing, isStale, error, source, refetch } = useWeather(activeCity)

  // Announce loading / error / refresh / stale status changes for assistive tech
  const [announcement, setAnnouncement] = useStatusAnnouncement({ isLoading, isRefreshing, isStale, error })

  // Announce city selection (overrides current status announcement)
  useEffect(() => {
    if (selectedCity) {
      setAnnouncement(`${selectedCity.name} selected, weather panel opened`)
    }
  }, [selectedCity, setAnnouncement])

  const selectCity = useCallback((city: City | null) => {
    setSelectedCity(city)
    setInvalidCityId(null)
    if (city) {
      navigate(`/city/${city.id}`)
    } else {
      navigate('/')
    }
  }, [navigate])

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
              isRefreshing={isRefreshing}
              isStale={isStale}
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
