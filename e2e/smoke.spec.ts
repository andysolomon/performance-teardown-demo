import { test, expect } from '@playwright/test'

test.describe('Live API Smoke Tests', { tag: '@smoke' }, () => {
  test.describe.configure({ retries: 3 })

  test('loads weather data from live API', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.weather-panel.open')).toBeVisible({ timeout: 15000 })
    await expect(page.locator('.dashboard-header')).toBeVisible({ timeout: 20000 })
  })

  test('displays data source indicator', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.dashboard-header')).toBeVisible({ timeout: 20000 })
    await expect(page.locator('.data-source')).toBeVisible({ timeout: 5000 })
  })

  test('forecast section renders with live data', async ({ page }) => {
    await page.goto('/?city=atlanta')

    await expect(page.locator('.charts-section')).toBeVisible({ timeout: 20000 })
  })
})
