import type { Page } from '@playwright/test'

function buildHourlyFixture() {
  const time: string[] = []
  const temperature_2m: number[] = []
  const weather_code: number[] = []
  for (let i = 0; i < 168; i++) {
    const d = new Date('2025-03-13T00:00')
    d.setHours(d.getHours() + i)
    time.push(d.toISOString().slice(0, 16))
    temperature_2m.push(50 + (i % 24))
    weather_code.push(i % 3 === 0 ? 0 : i % 3 === 1 ? 2 : 61)
  }
  return { time, temperature_2m, weather_code }
}

export const OPEN_METEO_FIXTURE = {
  current: {
    temperature_2m: 72,
    relative_humidity_2m: 65,
    wind_speed_10m: 12,
    weather_code: 0,
    pressure_msl: 1015,
    apparent_temperature: 70,
    wind_direction_10m: 180,
    visibility: 16090,
    uv_index: 5,
  },
  daily: {
    time: ['2025-03-13', '2025-03-14', '2025-03-15', '2025-03-16', '2025-03-17'],
    temperature_2m_max: [75, 78, 80, 76, 74],
    temperature_2m_min: [55, 58, 60, 54, 52],
    weather_code: [0, 3, 0, 2, 1],
    relative_humidity_2m_mean: [60, 55, 50, 62, 58],
    sunrise: ['2025-03-13T06:30', '2025-03-14T06:29', '2025-03-15T06:28', '2025-03-16T06:27', '2025-03-17T06:26'],
    sunset: ['2025-03-13T19:45', '2025-03-14T19:46', '2025-03-15T19:47', '2025-03-16T19:48', '2025-03-17T19:49'],
  },
  hourly: buildHourlyFixture(),
  timezone: 'America/New_York',
}

export async function mockWeatherApi(page: Page) {
  await page.route('**/api.open-meteo.com/**', (route) =>
    route.fulfill({ status: 200, body: JSON.stringify(OPEN_METEO_FIXTURE), contentType: 'application/json' })
  )
}
