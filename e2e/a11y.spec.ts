import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { mockWeatherApi } from './fixtures/weather'

test.beforeEach(async ({ page }) => {
  await mockWeatherApi(page)
})

test.describe('Accessibility – axe-core audit', () => {
  test('home page has no a11y violations', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.map-container')).toBeVisible({ timeout: 10000 })

    const results = await new AxeBuilder({ page }).analyze()

    expect(results.violations).toEqual([])
  })

  test('weather panel open state has no a11y violations', async ({ page }) => {
    await page.goto('/?city=atlanta')
    await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 10000 })
    await expect(page.locator('.dashboard-header')).toBeVisible({ timeout: 15000 })

    const results = await new AxeBuilder({ page }).analyze()

    expect(results.violations).toEqual([])
  })
})
