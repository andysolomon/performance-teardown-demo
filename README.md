# Weather Teardown

An interactive weather dashboard built with React 19 and Mapbox GL. Select cities on a full-screen globe, view real-time weather conditions, and explore 5-day forecasts — all in a responsive, accessible interface.

<!-- TODO: Replace with actual screenshot once captured -->
![App screenshot](docs/screenshot.png)

**[Live Demo →](https://performance-teardown-demo.vercel.app)**

## Features

- 🌍 **Interactive Mapbox globe** — full-screen map with custom-styled land, water, and boundaries (lazy-loaded so the engine never blocks first paint)
- 📍 **10 city markers** — keyboard-navigable pins with pulse animation on selection
- 🌤️ **Real-time weather** — current conditions via Open-Meteo (free, no key required) with OpenWeatherMap and offline mock fallbacks
- 📊 **Hourly + 5-day forecast charts** — Chart.js visuals with `<table class="sr-only">` data tables for screen readers
- 🌡️ **Rich location details** — feels-like, sunrise/sunset, daylight duration, compass wind direction, visibility, pressure, precipitation amount and chance (each with an "Unavailable" fallback)
- 🚨 **Derived weather advisories** — client-side severity-coloured banners (severe / warning / info) computed from the existing payload, clearly labelled "Derived advisory"
- 🖼️ **City hero banner** — lazy-loaded location image with dark gradient overlay, fixed-height container avoids CLS, errors fall back silently
- 🌗 **Unit toggle** — switch between °F/°C and mph/km/h, persisted in localStorage
- 📱 **Responsive bottom sheet** — swipe-to-dismiss panel on mobile with touch gestures
- ♿ **Accessible** — ARIA labels, keyboard navigation, focus management, and an `aria-live` region announcing loading / refreshing / stale / error transitions
- 🔗 **URL sync** — shareable city links via `/city/:cityId` (legacy `?city=<id>` redirects)
- 🔄 **Offline fallback** — graceful degradation with mock data when APIs are unavailable

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + TypeScript 5.9 |
| Build | Vite 8 |
| Map | Mapbox GL JS 3 + react-map-gl 8 |
| Charts | Chart.js 4.5 + react-chartjs-2 |
| Routing | react-router-dom 7 |
| Unit Tests | Vitest 4 + React Testing Library 16 |
| E2E Tests | Playwright 1.58 |
| CI | GitHub Actions |
| Deployment | Vercel |

## Getting Started

### Prerequisites

- Node.js 20+
- A [Mapbox](https://www.mapbox.com/) access token (free tier available)

### Setup

```bash
# Clone the repository
git clone https://github.com/andysolomon/performance-teardown-demo.git
cd performance-teardown-demo

# Copy environment variables
cp .env.example .env

# Add your Mapbox token to .env (see Environment Variables below)

# Install dependencies
npm install

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:5173`.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_MAPBOX_TOKEN` | **Yes** | Mapbox GL access token. [Create a free account →](https://account.mapbox.com/auth/signup/) |
| `VITE_OPENWEATHER_API_KEY` | No | OpenWeatherMap API key. The app uses Open-Meteo by default (no key needed) and falls back to mock data if unavailable. |

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite dev server with HMR |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |
| `npm run test` | Run unit tests in watch mode |
| `npm run test:run` | Run unit tests once (CI) |
| `npm run test:e2e` | Run Playwright E2E tests |
| `npm run test:e2e:ui` | Open Playwright UI mode |

## Project Structure

```
src/
├── components/       # React components (Dashboard, MapView, WeatherPanel, etc.)
├── hooks/            # Custom hooks (useWeather)
├── services/         # Weather API adapters (Open-Meteo, OpenWeatherMap)
├── types/            # TypeScript types and city data
├── utils/            # Unit conversion helpers
├── App.tsx           # Root component with city selection + URL sync
└── main.tsx          # Entry point
e2e/                  # Playwright E2E tests
.github/workflows/    # CI pipeline (lint, typecheck, test, build)
```

## Deployment

The app is deployed on [Vercel](https://vercel.com). Any push to `main` triggers an automatic deployment.

To deploy your own instance:

1. Fork this repository
2. Import the project in the [Vercel dashboard](https://vercel.com/new)
3. Add `VITE_MAPBOX_TOKEN` to the project's environment variables
4. Deploy

## License

MIT
