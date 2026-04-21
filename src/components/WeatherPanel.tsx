import { useRef, useState, useCallback, useEffect, type ReactNode } from 'react'
import './WeatherPanel.css'

interface WeatherPanelProps {
  isOpen: boolean
  onClose: () => void
  cityName?: string
  children: ReactNode
}

const DISMISS_THRESHOLD = 0.3
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'

export function WeatherPanel({ isOpen, onClose, cityName, children }: WeatherPanelProps) {
  const panelRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [dragging, setDragging] = useState(false)
  const [translateY, setTranslateY] = useState(0)
  const touchStart = useRef<{ y: number; time: number } | null>(null)
  const isMobileRef = useRef(false)
  const previousFocusRef = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const check = () => { isMobileRef.current = window.innerWidth <= 768 }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Focus-on-open + capture previous focus for restore
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement as HTMLElement | null
      requestAnimationFrame(() => {
        const panel = panelRef.current
        if (!panel) return
        const firstFocusable = panel.querySelector<HTMLElement>(FOCUSABLE_SELECTOR)
        if (firstFocusable) {
          firstFocusable.focus()
        } else {
          panel.focus()
        }
      })
    }
  }, [isOpen])

  // Reset state when panel closes — syncing internal state to the isOpen prop
  useEffect(() => {
    if (!isOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional reset on prop change
      setExpanded(false)
      setTranslateY(0)
      setDragging(false)
    }
  }, [isOpen])

  // Focus restore on close — deferred until the slide-out transition ends
  const handleClose = useCallback(() => {
    const elToRestore = previousFocusRef.current
    const panel = panelRef.current
    onClose()

    if (panel) {
      const restore = () => {
        clearTimeout(fallback)
        panel.removeEventListener('transitionend', onEnd)
        elToRestore?.focus()
      }
      const onEnd = (e: TransitionEvent) => {
        if (e.target === panel) restore()
      }
      panel.addEventListener('transitionend', onEnd)
      // Fallback in case transitionend never fires (e.g. prefers-reduced-motion)
      const fallback = setTimeout(restore, 400)
    } else {
      elToRestore?.focus()
    }
  }, [onClose])

  // Escape key + focus trap
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        handleClose()
        return
      }

      if (e.key !== 'Tab') return

      const panel = panelRef.current
      if (!panel) return

      const focusable = Array.from(panel.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR))
        .filter((el) => el.offsetParent !== null)
      if (focusable.length === 0) return

      const first = focusable[0]
      const last = focusable[focusable.length - 1]

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault()
          last.focus()
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [isOpen, handleClose])

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
      handleClose()
    }

    setTranslateY(0)
    setDragging(false)
    touchStart.current = null
  }, [translateY, expanded, handleClose])

  // Prevent body scroll when panel is open (all viewports)
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => { document.body.style.overflow = '' }
    }
  }, [isOpen])

  const panelStyle = dragging && translateY > 0
    ? { transform: `translateY(${translateY}px)` }
    : undefined

  const headingId = 'weather-panel-title'

  return (
    <>
      <div
        className={`weather-panel-backdrop ${isOpen ? 'open' : ''}`}
        onClick={handleClose}
      />
      <div
        ref={panelRef}
        className={`weather-panel ${isOpen ? 'open' : ''} ${expanded ? 'expanded' : ''} ${dragging ? 'dragging' : ''}`}
        style={panelStyle}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        tabIndex={-1}
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
          <h2 id={headingId}>{cityName || 'Weather'}</h2>
          <button className="weather-panel-close" onClick={handleClose} aria-label="Close panel">
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
