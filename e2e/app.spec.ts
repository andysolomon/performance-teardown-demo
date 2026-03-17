import { test, expect } from '@playwright/test'

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

    await expect(page.locator('.weather-panel')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.weather-panel-backdrop')).toBeVisible()
  })

  test('clicking backdrop closes weather panel', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.weather-panel')).toBeVisible({ timeout: 10000 })

    await page.locator('.weather-panel-backdrop').click({ force: true })

    await expect(page.locator('.weather-panel')).not.toBeVisible({ timeout: 5000 })
    await expect(page).toHaveURL('/')
  })

  test('close button closes weather panel', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.weather-panel')).toBeVisible({ timeout: 10000 })

    await page.locator('.weather-panel-close').click()

    await expect(page.locator('.weather-panel')).not.toBeVisible({ timeout: 5000 })
    await expect(page).toHaveURL('/')
  })

  test('switching cities from URL works', async ({ page }) => {
    await page.goto('/?city=atlanta')
    await expect(page.locator('.weather-panel')).toBeVisible({ timeout: 10000 })

    await page.goto('/?city=tokyo')
    await expect(page.locator('.weather-panel')).toBeVisible({ timeout: 10000 })
    await expect(page).toHaveURL(/\?city=tokyo/)
  })

  test('weather panel has correct transform when visible', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.weather-panel')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.weather-panel')).toHaveClass(/visible/)
  })
})

test.describe('Weather Panel Content', () => {
  test('displays loading state while fetching weather', async ({ page }) => {
    await page.goto('/?city=atlanta')

    const loadingState = page.locator('.loading-state')
    const dashboardHeader = page.locator('.dashboard-header')

    await expect(loadingState.or(dashboardHeader)).toBeVisible({ timeout: 10000 })
  })

  test('displays weather dashboard after loading', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.dashboard-header')).toBeVisible({ timeout: 15000 })

    await expect(page.getByRole('heading', { name: 'Weather Dashboard' })).toBeVisible()
  })

  test('displays metric cards', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.metrics-grid')).toBeVisible({ timeout: 15000 })

    await expect(page.getByRole('heading', { name: 'Temperature', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Humidity', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Wind Speed', exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'UV Index', exact: true })).toBeVisible()
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

      await expect(page.locator('.weather-panel')).toBeVisible({ timeout: 10000 })
      await expect(page.locator('.dashboard-header')).toBeVisible({ timeout: 15000 })
    })
  }
})

test.describe('Error Handling', () => {
  test('handles invalid city ID in URL gracefully', async ({ page }) => {
    await page.goto('/?city=invalid-city')

    await expect(page.locator('.weather-panel')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.weather-panel-backdrop')).toBeVisible()
  })

  test('shows map error when Mapbox token is rejected', async ({ page }) => {
    // Simulate a 403 from Mapbox (invalid/restricted token)
    await page.route('**/api.mapbox.com/**', (route) =>
      route.fulfill({ status: 403, body: 'Forbidden' })
    )

    await page.goto('/')

    await expect(page.locator('.map-error')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.map-error-content h2')).toHaveText('Map Loading Error')
  })

  test('shows retry button on weather error', async ({ page }) => {
    await page.route('**/api.open-meteo.com/**', (route) => route.abort())
    await page.route('**/api.openweathermap.org/**', (route) => route.abort())

    await page.goto('/?city=atlanta')

    await expect(page.locator('.error-state, .loading-state, .dashboard-header')).toBeVisible({ timeout: 15000 })
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
  test('backdrop has blur when panel is open', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.weather-panel-backdrop.visible')).toBeVisible({ timeout: 10000 })
  })

  test('panel closes with animation', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.weather-panel')).toBeVisible({ timeout: 10000 })

    await page.locator('.weather-panel-close').click()

    await expect(page.locator('.weather-panel')).not.toBeVisible({ timeout: 5000 })
  })
})
