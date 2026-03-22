import { useCallback, useEffect, useRef, useState } from 'react'
import { BrowserRouter, Routes, Route, useSearchParams, useNavigate } from 'react-router-dom'
import { MapView } from './components/MapView'
import { WeatherPanel } from './components/WeatherPanel'
import './App.css'

function AppContent() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const cityId = searchParams.get('city')

  const markerRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const [pendingFocusCityId, setPendingFocusCityId] = useState<string | null>(null)

  const registerMarkerRef = useCallback((cityId: string, node: HTMLDivElement | null) => {
    markerRefs.current[cityId] = node
  }, [])

  const closePanelAndRestoreFocus = useCallback((focusCityId: string) => {
    setPendingFocusCityId(focusCityId)
    navigate('/')
  }, [navigate])

  useEffect(() => {
    if (!cityId && pendingFocusCityId) {
      requestAnimationFrame(() => {
        markerRefs.current[pendingFocusCityId]?.focus()
        setPendingFocusCityId(null)
      })
    }
  }, [cityId, pendingFocusCityId])

  return (
    <>
      <MapView selectedCityId={cityId} registerMarkerRef={registerMarkerRef} />
      {cityId && <WeatherPanel cityId={cityId} onRequestClose={closePanelAndRestoreFocus} />}
    </>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppContent />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
