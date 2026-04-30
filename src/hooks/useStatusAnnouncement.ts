import { useEffect, useRef, useState } from 'react'
import type { WeatherError } from '../types'

interface StatusInputs {
  isLoading: boolean
  isRefreshing: boolean
  isStale: boolean
  error: WeatherError | null
}

/**
 * Produces a polite live-region announcement string that reflects
 * weather data status changes (loading, refresh complete, error, stale).
 *
 * - "Loading weather data" on transition into loading
 * - "Weather data updated" once after a background refresh completes
 * - "Error: <message>. Activate Try Again to retry." on a new error
 * - "Weather data may be outdated" when entering a stale state
 *
 * The hook avoids repeated announcements by tracking previous state and
 * only emitting when the relevant transition occurs.
 */
export function useStatusAnnouncement({ isLoading, isRefreshing, isStale, error }: StatusInputs): [string, (msg: string) => void] {
  const [announcement, setAnnouncement] = useState('')
  const prev = useRef({ isLoading: false, isRefreshing: false, isStale: false, error: null as WeatherError | null })

  useEffect(() => {
    const p = prev.current
    if (isLoading && !p.isLoading) {
      setAnnouncement('Loading weather data')
    } else if (error && error !== p.error) {
      setAnnouncement(`Error: ${error.message}. Activate Try Again to retry.`)
    } else if (p.isRefreshing && !isRefreshing && !error) {
      setAnnouncement('Weather data updated')
    } else if (isStale && !p.isStale) {
      setAnnouncement('Weather data may be outdated')
    }
    prev.current = { isLoading, isRefreshing, isStale, error }
  }, [isLoading, isRefreshing, isStale, error])

  return [announcement, setAnnouncement]
}
