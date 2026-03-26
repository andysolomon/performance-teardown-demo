import { useRef, useState, useCallback, useEffect, type ReactNode } from 'react'
import './WeatherPanel.css'

interface WeatherPanelProps {
  isOpen: boolean
  onClose: () => void
  cityName?: string
  children: ReactNode
}

const DISMISS_THRESHOLD = 0.3

export function WeatherPanel({ isOpen, onClose, cityName, children }: WeatherPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [translateY, setTranslateY] = useState(0)
  const touchStart = useRef<{ y: number; time: number } | null>(null)
  const isMobileRef = useRef(false)

  useEffect(() => {
    const check = () => { isMobileRef.current = window.innerWidth <= 768 }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Reset state when panel closes — syncing internal state to the isOpen prop
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on prop change
      setExpanded(false)
      setTranslateY(0)
      setDragging(false)
    }
  }, [isOpen])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!isMobileRef.current) return
    touchStart.current = { y: e.touches[0].clientY, time: Date.now() }
    setDragging(true)
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isMobileRef.current || !touchStart.current) return
    const delta = e.touches[0].clientY - touchStart.current.y
    // Only allow dragging down (or up if not expanded)
    if (delta > 0 || !expanded) {
      setTranslateY(Math.max(0, delta))
    }
  }, [expanded])

  const handleTouchEnd = useCallback(() => {
    if (!isMobileRef.current || !touchStart.current) return
    const panel = panelRef.current
    if (!panel) return

    const panelHeight = panel.offsetHeight
    const threshold = panelHeight * DISMISS_THRESHOLD

    if (translateY > threshold) {
      // Dismiss
      onClose()
    } else if (translateY < -50 && !expanded) {
      // Swipe up → expand
      setExpanded(true)
    } else if (translateY > 50 && expanded) {
      // Swipe down from expanded → collapse to half
      setExpanded(false)
    }

    setTranslateY(0)
    setDragging(false)
    touchStart.current = null
  }, [translateY, expanded, onClose])

  // Prevent body scroll when panel is open on mobile
  useEffect(() => {
    if (isOpen && isMobileRef.current) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  const panelStyle = dragging && translateY > 0
    ? { transform: `translateY(${translateY}px)` }
    : undefined

  return (
    <>
      <div
        className={`weather-panel-backdrop ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />
      <div
        ref={panelRef}
        className={`weather-panel ${isOpen ? 'open' : ''} ${expanded ? 'expanded' : ''} ${dragging ? 'dragging' : ''}`}
        style={panelStyle}
      >
        <div
          className="weather-panel-handle"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="weather-panel-pill" />
        </div>
        <div className="weather-panel-header">
          <h2>{cityName || 'Weather'}</h2>
          <button className="weather-panel-close" onClick={onClose} aria-label="Close panel">
            ✕
          </button>
        </div>
        <div ref={bodyRef} className="weather-panel-body">
          {children}
        </div>
      </div>
    </>
  )
}
