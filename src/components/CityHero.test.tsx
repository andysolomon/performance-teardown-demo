import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { CityHero } from './CityHero'
import { DEFAULT_CITY } from '../types'
import type { City } from '../types'

describe('CityHero', () => {
  it('renders an img with the city background URL', () => {
    render(<CityHero city={DEFAULT_CITY} />)
    const img = screen.getByRole('presentation', { hidden: true })
    expect(img).toBeInTheDocument()
    expect(img.getAttribute('src')).toBe(DEFAULT_CITY.backgroundImage)
  })

  it('uses empty alt and aria-hidden so the image is decorative', () => {
    render(<CityHero city={DEFAULT_CITY} />)
    const hero = screen.getByTestId('city-hero')
    expect(hero).toHaveAttribute('aria-hidden', 'true')
    const img = hero.querySelector('img')
    expect(img).toHaveAttribute('alt', '')
  })

  it('renders the gradient overlay element', () => {
    render(<CityHero city={DEFAULT_CITY} />)
    expect(screen.getByTestId('city-hero').querySelector('.city-hero-overlay')).not.toBeNull()
  })

  it('starts in the loading state and switches to loaded after onLoad', () => {
    render(<CityHero city={DEFAULT_CITY} />)
    const hero = screen.getByTestId('city-hero')
    expect(hero).toHaveClass('loading')
    expect(hero).not.toHaveClass('loaded')

    const img = hero.querySelector('img')!
    fireEvent.load(img)

    expect(hero).toHaveClass('loaded')
    expect(hero).not.toHaveClass('loading')
  })

  it('renders nothing once the image fails to load', () => {
    const { container } = render(<CityHero city={DEFAULT_CITY} />)
    const img = container.querySelector('img')!
    fireEvent.error(img)
    expect(container.querySelector('[data-testid="city-hero"]')).toBeNull()
  })

  it('renders nothing when no city is supplied', () => {
    const { container } = render(<CityHero city={null} />)
    expect(container.querySelector('[data-testid="city-hero"]')).toBeNull()
  })

  it('renders nothing when the city has no backgroundImage', () => {
    const cityNoImg: City = { ...DEFAULT_CITY, backgroundImage: '' }
    const { container } = render(<CityHero city={cityNoImg} />)
    expect(container.querySelector('[data-testid="city-hero"]')).toBeNull()
  })

  it('uses lazy loading on the image', () => {
    render(<CityHero city={DEFAULT_CITY} />)
    const img = screen.getByTestId('city-hero').querySelector('img')!
    expect(img).toHaveAttribute('loading', 'lazy')
  })
})
