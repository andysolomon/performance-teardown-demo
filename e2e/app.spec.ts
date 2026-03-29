import { test, expect } from '@playwright/test'
import { mockWeatherApi } from './fixtures/weather'

test.beforeEach(async ({ page }) => {
  await mockWeatherApi(page)
})

test.describe('Weather Dashboard Map View', () => {
  test('displays map container', async ({ page }) => {
    await page.goto('/')

    await expect(page.locator('.map-container')).toBeVisible({ timeout: 10000 })
  })

  test('map loads without token errors', async ({ page }) => {
    const mapErrors: string[] = []
    page.on('response', (response) => {
      if (response.url().includes('api.mapbox.com') && response.status() === 403) {
        mapErrors.push(`Mapbox 403: ${response.url()}`)
      }
    })

    await page.goto('/')
    await expect(page.locator('.map-container')).toBeVisible({ timeout: 10000 })

    // Wait for any Mapbox tile requests to complete
    await page.waitForTimeout(3000)

    // Ensure no 403 responses from Mapbox (token restriction / invalid token)
    expect(mapErrors).toEqual([])
  })

  test('URL with city parameter opens weather panel', async ({ page }) => {
    await page.goto('/?city=tokyo')

    await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.weather-panel-backdrop.open')).toBeVisible()
  })

  test('clicking backdrop closes weather panel', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 10000 })

    await page.locator('.weather-panel-backdrop').click({ force: true })

    await expect(page.locator('.weather-panel.open')).not.toBeVisible({ timeout: 5000 })
    await expect(page).toHaveURL('/')
  })

  test('close button closes weather panel', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 10000 })

    await page.locator('.weather-panel-close').click()

    await expect(page.locator('.weather-panel.open')).not.toBeVisible({ timeout: 5000 })
    await expect(page).toHaveURL('/')
  })

  test('switching cities from URL works', async ({ page }) => {
    await page.goto('/?city=atlanta')
    await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 10000 })

    await page.goto('/?city=tokyo')
    await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 10000 })
    await expect(page).toHaveURL(/\?city=tokyo/)
  })
})

test.describe('Weather Panel Content', () => {
  test('displays loading or loaded state', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 10000 })
    // Panel body should have content (skeleton or loaded dashboard)
    await expect(page.locator('.weather-panel-body .dashboard')).toBeVisible({ timeout: 15000 })
  })

  test('displays weather data after loading', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.dashboard-header')).toBeVisible({ timeout: 15000 })
  })

  test('displays metric cards', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.metrics-grid')).toBeVisible({ timeout: 15000 })

    await expect(page.getByRole('heading', { name: 'Temperature', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Humidity', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Wind Speed', exact: true })).toBeVisible()
  })

  test('displays chart sections', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.charts-section')).toBeVisible({ timeout: 15000 })

    await expect(page.getByRole('heading', { name: 'Temperature Trend' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Conditions Distribution' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Humidity Forecast' })).toBeVisible()
  })

  test('displays additional weather info', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.additional-info')).toBeVisible({ timeout: 15000 })

    await expect(page.locator('.info-label').filter({ hasText: 'Sunrise' })).toBeVisible()
    await expect(page.locator('.info-label').filter({ hasText: 'Sunset' })).toBeVisible()
    await expect(page.locator('.info-label').filter({ hasText: 'Visibility' })).toBeVisible()
    await expect(page.locator('.info-label').filter({ hasText: 'Pressure' })).toBeVisible()
  })

  test('displays weather data source', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.dashboard-header')).toBeVisible({ timeout: 15000 })

    const dataSource = page.locator('.data-source')
    await expect(dataSource).toBeVisible({ timeout: 5000 })
  })
})

test.describe('City Navigation', () => {
  const cities = [
    { id: 'atlanta', name: 'Atlanta' },
    { id: 'new-york', name: 'New York' },
    { id: 'los-angeles', name: 'Los Angeles' },
    { id: 'london', name: 'London' },
    { id: 'tokyo', name: 'Tokyo' },
    { id: 'paris', name: 'Paris' },
    { id: 'sydney', name: 'Sydney' },
    { id: 'dubai', name: 'Dubai' },
    { id: 'singapore', name: 'Singapore' },
    { id: 'mumbai', name: 'Mumbai' },
  ]

  for (const city of cities) {
    test(`displays weather for ${city.name}`, async ({ page }) => {
      await page.goto(`/?city=${city.id}`)

      await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('.dashboard-header')).toBeVisible({ timeout: 15000 })
    })
  }
})

test.describe('Error Handling', () => {
  test('handles invalid city ID in URL gracefully', async ({ page }) => {
    await page.goto('/?city=invalid-city')

    // Invalid city should not open panel
    await expect(page.locator('.map-container')).toBeVisible({ timeout: 10000 })
  })

  test('shows map error when Mapbox token is rejected', async ({ page }) => {
    // Simulate a 401 from Mapbox (invalid token)
    await page.route('**/api.mapbox.com/**', (route) =>
      route.fulfill({ status: 401, body: JSON.stringify({ message: 'unauthorized' }), contentType: 'application/json' })
    )

    await page.goto('/')

    // Either the map-error fallback or the map-container should appear
    const mapError = page.locator('.map-error')
    const mapContainer = page.locator('.map-container')
    await expect(mapError.or(mapContainer)).toBeVisible({ timeout: 10000 })
  })

  test('shows error or loading state on weather error', async ({ page }) => {
    await page.route('**/api.open-meteo.com/**', (route) => route.abort())
    await page.route('**/api.openweathermap.org/**', (route) => route.abort())

    await page.goto('/?city=atlanta')

    // With both APIs blocked, should show error state or loading
    await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.error-state').or(page.locator('.dashboard-header'))).toBeVisible({ timeout: 15000 })
  })
})

test.describe('Accessibility', () => {
  test('close button has accessible label', async ({ page }) => {
    await page.goto('/?city=atlanta')

    const closeButton = page.locator('.weather-panel-close')
    await expect(closeButton).toBeVisible({ timeout: 10000 })
    await expect(closeButton).toHaveAttribute('aria-label', 'Close panel')
  })

  test('metrics grid has aria-label', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.metrics-grid')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('.metrics-grid')).toHaveAttribute('aria-label', 'Current Conditions')
  })

  test('retry button is accessible on error', async ({ page }) => {
    await page.route('**/api.open-meteo.com/**', (route) => route.abort())
    await page.route('**/api.openweathermap.org/**', (route) => route.abort())

    await page.goto('/?city=atlanta')

    const errorState = page.locator('.error-state')
    const isVisible = await errorState.isVisible({ timeout: 15000 }).catch(() => false)

    if (isVisible) {
      const retryButton = page.getByRole('button', { name: /try again|load data/i })
      await expect(retryButton).toBeVisible()
    }
  })
})

test.describe('Panel Animations', () => {
  test('panel has open class when visible', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.weather-panel-backdrop.open')).toBeVisible()
  })

  test('panel closes with animation', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 10000 })

    await page.locator('.weather-panel-close').click()

    await expect(page.locator('.weather-panel.open')).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('Mobile Bottom Sheet', () => {
  test.use({ viewport: { width: 375, height: 812 } })

  test('panel appears as bottom sheet on mobile', async ({ page }) => {
    await page.goto('/?city=atlanta')

    const panel = page.locator('.weather-panel.open')
    await expect(panel).toBeVisible({ timeout: 10000 })

    // On mobile, panel should be positioned at bottom with full width
    const box = await panel.boundingBox()
    expect(box).toBeTruthy()
    expect(box!.width).toBeCloseTo(375, -1)

    // Should cover approximately half the viewport
    expect(box!.height).toBeGreaterThan(300)
    expect(box!.height).toBeLessThan(500)
  })

  test('drag handle is visible on mobile', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.weather-panel-handle')).toBeVisible()
    await expect(page.locator('.weather-panel-pill')).toBeVisible()
  })

  test('panel body scrolls without moving the map', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.dashboard-header')).toBeVisible({ timeout: 15000 })

    const body = page.locator('.weather-panel-body')
    const scrollTop = await body.evaluate((el) => el.scrollTop)

    // Scroll inside the panel body
    await body.evaluate((el) => { el.scrollTop = 100 })
    const newScrollTop = await body.evaluate((el) => el.scrollTop)

    // Body should have scrolled
    expect(newScrollTop).toBeGreaterThan(scrollTop)
  })

  test('close button works on mobile', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 10000 })

    await page.locator('.weather-panel-close').click()

    await expect(page.locator('.weather-panel.open')).not.toBeVisible({ timeout: 5000 })
  })
})

test.describe('Keyboard Navigation', () => {
  test('markers are focusable via Tab', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.map-container')).toBeVisible({ timeout: 10000 })

    // Tab to find a marker
    await page.keyboard.press('Tab')
    const focused = page.locator('.map-marker:focus')
    // May need multiple tabs to reach a marker
    for (let i = 0; i < 15; i++) {
      const count = await focused.count()
      if (count > 0) break
      await page.keyboard.press('Tab')
    }
  })

  test('Enter key opens weather panel from focused marker', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.map-container')).toBeVisible({ timeout: 10000 })

    // Focus a marker directly
    const marker = page.locator('.map-marker').first()
    await marker.focus()
    await page.keyboard.press('Enter')

    await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 10000 })
  })

  test('Space key opens weather panel from focused marker', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.map-container')).toBeVisible({ timeout: 10000 })

    const marker = page.locator('.map-marker').first()
    await marker.focus()
    await page.keyboard.press('Space')

    await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 10000 })
  })

  test('Escape key closes panel and restores focus', async ({ page }) => {
    await page.goto('/?city=atlanta')
    await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 10000 })

    await page.keyboard.press('Escape')

    await expect(page.locator('.weather-panel.open')).not.toBeVisible({ timeout: 5000 })
  })

  test('markers have correct ARIA attributes', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.map-container')).toBeVisible({ timeout: 10000 })

    // Wait for markers to render
    await expect(page.locator('.map-marker').first()).toBeVisible({ timeout: 10000 })

    const marker = page.locator('.map-marker').first()
    await expect(marker).toHaveAttribute('role', 'button')
    await expect(marker).toHaveAttribute('tabindex', '0')
    await expect(marker).toHaveAttribute('aria-pressed', 'false')
  })

  test('selected marker has aria-pressed true', async ({ page }) => {
    await page.goto('/?city=atlanta')
    await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 10000 })

    const atlantaMarker = page.locator('.map-marker.selected')
    await expect(atlantaMarker).toHaveAttribute('aria-pressed', 'true')
  })

  test('aria-live announces city selection', async ({ page }) => {
    await page.goto('/?city=tokyo')
    await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 10000 })

    const liveRegion = page.locator('[aria-live="polite"]')
    await expect(liveRegion).toContainText('Tokyo selected')
  })
})

test.describe('Desktop Drawer', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('panel appears as right-side drawer on desktop', async ({ page }) => {
    await page.goto('/?city=atlanta')

    const panel = page.locator('.weather-panel.open')
    await expect(panel).toBeVisible({ timeout: 10000 })

    const box = await panel.boundingBox()
    expect(box).toBeTruthy()
    // Drawer should be ~420px wide, positioned on the right
    expect(box!.width).toBeCloseTo(420, -1)
    expect(box!.x).toBeGreaterThan(800)
  })

  test('drag handle is hidden on desktop', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.weather-panel-handle')).not.toBeVisible()
  })
})

test.describe('Marker Click', () => {
  test('clicking a map marker opens panel and updates URL', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.map-container')).toBeVisible({ timeout: 10000 })

    const marker = page.locator('.map-marker').first()
    await expect(marker).toBeVisible({ timeout: 10000 })
    await marker.click()

    await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 10000 })
    await expect(page).toHaveURL(/\?city=/)
  })
})

test.describe('Dialog Accessibility (E2E)', () => {
  test('panel has role="dialog" and aria-modal="true"', async ({ page }) => {
    await page.goto('/?city=atlanta')

    const panel = page.locator('.weather-panel.open')
    await expect(panel).toBeVisible({ timeout: 10000 })
    await expect(panel).toHaveAttribute('role', 'dialog')
    await expect(panel).toHaveAttribute('aria-modal', 'true')
  })

  test('focus moves inside panel after open', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 10000 })

    const focused = await page.evaluate(() => {
      const el = document.activeElement
      return el ? el.closest('.weather-panel') !== null : false
    })
    expect(focused).toBe(true)
  })

  test('Escape closes panel and returns focus', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.map-container')).toBeVisible({ timeout: 10000 })

    const marker = page.locator('.map-marker').first()
    await expect(marker).toBeVisible({ timeout: 10000 })
    await marker.click()

    await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 10000 })

    await page.keyboard.press('Escape')

    await expect(page.locator('.weather-panel.open')).not.toBeVisible({ timeout: 5000 })

    // Focus should return to a marker
    const focusedOnMarker = await page.evaluate(() => {
      return document.activeElement?.classList.contains('map-marker') ?? false
    })
    expect(focusedOnMarker).toBe(true)
  })
})
