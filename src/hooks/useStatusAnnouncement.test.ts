import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useStatusAnnouncement } from './useStatusAnnouncement'
import type { WeatherError } from '../types'

const baseProps = {
  isLoading: false,
  isRefreshing: false,
  isStale: false,
  error: null as WeatherError | null,
}

describe('useStatusAnnouncement', () => {
  it('starts with empty announcement', () => {
    const { result } = renderHook(() => useStatusAnnouncement(baseProps))
    expect(result.current[0]).toBe('')
  })

  it('announces loading when isLoading transitions to true', () => {
    const { result, rerender } = renderHook((props) => useStatusAnnouncement(props), {
      initialProps: baseProps,
    })
    rerender({ ...baseProps, isLoading: true })
    expect(result.current[0]).toBe('Loading weather data')
  })

  it('announces error with recovery action when error appears', () => {
    const error: WeatherError = { type: 'network', message: 'Network unavailable' }
    const { result, rerender } = renderHook((props) => useStatusAnnouncement(props), {
      initialProps: baseProps,
    })
    rerender({ ...baseProps, error })
    expect(result.current[0]).toBe('Error: Network unavailable. Activate Try Again to retry.')
  })

  it('does not re-announce the same error on every render', () => {
    const error: WeatherError = { type: 'network', message: 'Network unavailable' }
    const { result, rerender } = renderHook((props) => useStatusAnnouncement(props), {
      initialProps: { ...baseProps, error },
    })
    expect(result.current[0]).toBe('Error: Network unavailable. Activate Try Again to retry.')

    // Manually clear announcement; same error reference should not trigger again
    act(() => result.current[1](''))
    rerender({ ...baseProps, error })
    expect(result.current[0]).toBe('')
  })

  it('announces "Weather data updated" once after refresh completes', () => {
    const { result, rerender } = renderHook((props) => useStatusAnnouncement(props), {
      initialProps: { ...baseProps, isRefreshing: true },
    })
    rerender({ ...baseProps, isRefreshing: false })
    expect(result.current[0]).toBe('Weather data updated')
  })

  it('does not announce refresh complete when an error is present', () => {
    const error: WeatherError = { type: 'network', message: 'Failed' }
    const { result, rerender } = renderHook((props) => useStatusAnnouncement(props), {
      initialProps: { ...baseProps, isRefreshing: true },
    })
    rerender({ ...baseProps, isRefreshing: false, error })
    expect(result.current[0]).toBe('Error: Failed. Activate Try Again to retry.')
  })

  it('announces stale data once when transitioning into stale state', () => {
    const { result, rerender } = renderHook((props) => useStatusAnnouncement(props), {
      initialProps: baseProps,
    })
    rerender({ ...baseProps, isStale: true })
    expect(result.current[0]).toBe('Weather data may be outdated')

    // Re-rendering while still stale should not re-announce
    act(() => result.current[1](''))
    rerender({ ...baseProps, isStale: true })
    expect(result.current[0]).toBe('')
  })
})
