# Weather Teardown — Case Study

## Overview
An interactive weather dashboard built with React 19, TypeScript, and Mapbox GL. A full-screen globe with city markers leads into a sliding weather panel that surfaces real-time conditions, derived weather advisories, hourly and 5-day forecast charts, and rich location details (sunrise/sunset, daylight duration, compass wind direction, visibility, precipitation amount and chance). The UI is responsive — a swipe-dismissable bottom-sheet on mobile — and fully keyboard- and screen-reader-accessible, including an `aria-live` status region that announces loading, refresh, stale, and error transitions.

## Tech Stack
- **Framework**: React 19.2 + TypeScript 5.9 (strict)
- **Build Tool**: Vite 8
- **Map**: Mapbox GL JS 3 + react-map-gl 8 (lazy-loaded)
- **Charts**: Chart.js 4.5 + react-chartjs-2
- **Routing**: react-router-dom 7
- **Unit Testing**: Vitest 4 + React Testing Library 16
- **E2E Testing**: Playwright 1.58
- **CI**: GitHub Actions
- **Deployment**: Vercel

## Features
- Full-screen interactive Mapbox globe with custom-styled water, land, landcover, and admin-boundary layers
- 10 city markers with keyboard navigation, ARIA semantics, and pulse animation on selection
- Real-time weather via Open-Meteo, with OpenWeatherMap and an offline mock as graceful fallbacks
- Hourly and 5-day forecast charts (Chart.js) with `<table class="sr-only">` data tables for screen readers
- Rich current conditions: temperature, feels-like, humidity, UV, wind speed/direction (compass), visibility, pressure, precipitation amount/chance, sunrise/sunset, daylight duration — every optional field renders an "Unavailable" fallback rather than disappearing
- **Derived weather advisories**: client-side severity-coloured banners (severe / warning / info) for UV, wind, temperature extremes, precipitation, and thunderstorms — clearly labelled "Derived advisory" so they aren't confused with official government warnings
- **City hero banner**: lazy-loaded location image with dark gradient overlay; fixed-height container avoids CLS, errors silently fall back to the animated weather background
- Unit toggle (°F/°C, mph/km/h) persisted to localStorage
- Responsive bottom-sheet panel with swipe-to-dismiss on mobile
- Shareable city URLs via `/city/:cityId` route (with legacy `?city=` redirect)
- `aria-live` polite region announces loading / refreshing / stale / error / city-selected transitions

## Performance Teardown — Lazy-loaded Mapbox

The original build statically imported `mapbox-gl`, putting the entire 1.6 MB map engine and its CSS on the critical path of every page load — even though nothing on the page is interactive until the user picks a city. Splitting `MapView` and `Dashboard` behind `React.lazy` removes Mapbox (and its stylesheet) from the eager bundle and the `<link rel="modulepreload">` graph in `index.html`.

| Asset                  | Before (raw / gz)        | After (raw / gz)         | Δ gzipped       |
| ---------------------- | ------------------------ | ------------------------ | --------------- |
| Eager `index-*.js`     | 271 kB / 87 kB           | 239 kB / **77 kB**       | **−10 kB**      |
| `mapbox-gl-*.js`       | bundled into eager chunk | 1,666 kB / 452 kB (lazy) | off LCP path    |
| `MapView-*.css`        | bundled into eager CSS   | 42 kB / 6 kB (lazy)      | off LCP path    |
| `Dashboard-*.js`       | bundled into eager chunk | 208 kB / 71 kB (lazy)    | off LCP path    |

Net effect: **~470 kB gzipped of JS + CSS** no longer blocks LCP on first paint. While the map chunk is fetching, a zero-dependency `<MapSkeleton>` paints immediately so the layout is stable and the panel/route transitions remain interactive.

Verified post-build:
- `grep mapbox-gl dist/assets/index-*.js` → **0 matches** (was 2 before the split)
- `dist/index.html` no longer `modulepreload`s the mapbox chunk

Vite still warns about the >500 kB Mapbox chunk; that warning is now informational because the chunk is no longer eager.

## Quality Metrics
- **Eager JS**: 239 kB raw / **77 kB gzipped** (`index-*.js`)
- **Lazy chunks**: `Dashboard` (208 kB / 71 kB gz), `MapView` (22 kB / 8 kB gz), `mapbox-gl` (1,666 kB / 452 kB gz)
- **Tests**: **242 passing** across 21 Vitest files (unit + component); Playwright E2E in CI
- **Lint**: 0 errors (ESLint 9.39)
- **TypeScript**: strict mode, 0 errors
- **CI**: lint, typecheck, test, build on every PR

## Links
- **Live Demo**: https://performance-teardown-demo.vercel.app
- **Repository**: https://github.com/andysolomon/performance-teardown-demo

## Key Decisions
1. **Mapbox GL over Leaflet**: globe projection, custom layer styling, and smooth 3D interactions — at the cost of a 1.6 MB chunk, which is mitigated by lazy-loading.
2. **`React.lazy` over manual `rollupOptions.manualChunks`**: route-aware code splitting that mirrors the user journey (skeleton → map → panel) instead of hand-tuning bundler config.
3. **Open-Meteo as primary weather API**: free, no key required, zero contributor friction; OpenWeatherMap and a mock dataset cover fallback paths.
4. **Derived advisories instead of an official alerts feed**: Open-Meteo has no alerts endpoint and weather.gov is US-only. Computing advisories from the existing payload keeps the feature global, deterministic in tests, and clearly labelled in the UI.
5. **Chart.js over Recharts**: greater customization for forecast visualizations, with `<table class="sr-only">` data tables backing every chart for screen-reader parity.
6. **CSS variables**: native dark mode and themed map colors without CSS-in-JS overhead.
7. **`aria-live` status announcements via a small `useStatusAnnouncement` hook**: testable in isolation with `renderHook`, keeps announcement logic out of `App.tsx`.
8. **Bottom-sheet pattern on mobile**: touch-friendly swipe gestures over modal dialogs.
