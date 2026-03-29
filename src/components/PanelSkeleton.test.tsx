import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import { PanelSkeleton } from './PanelSkeleton'

describe('PanelSkeleton', () => {
  it('renders skeleton elements with aria-busy', () => {
    const { container } = render(<PanelSkeleton />)

    expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument()
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThanOrEqual(10)
  })

  it('renders all skeleton sections', () => {
    const { container } = render(<PanelSkeleton />)

    expect(container.querySelector('.dashboard-header')).toBeInTheDocument()
    expect(container.querySelector('.metrics-grid')).toBeInTheDocument()
    expect(container.querySelector('.charts-section')).toBeInTheDocument()
    expect(container.querySelector('.additional-info')).toBeInTheDocument()
  })
})
