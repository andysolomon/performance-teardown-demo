import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MapSkeleton } from './MapSkeleton'

describe('MapSkeleton', () => {
  it('renders a status landmark with an accessible name', () => {
    render(<MapSkeleton />)
    const status = screen.getByRole('status', { name: 'Loading map' })
    expect(status).toBeInTheDocument()
  })

  it('renders a shimmer element marked aria-hidden', () => {
    const { container } = render(<MapSkeleton />)
    const shimmer = container.querySelector('.map-skeleton-shimmer')
    expect(shimmer).not.toBeNull()
    expect(shimmer).toHaveAttribute('aria-hidden', 'true')
  })
})
