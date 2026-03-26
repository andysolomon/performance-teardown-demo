# Weather Teardown — Case Study

## Overview
An interactive weather dashboard built with React 19, TypeScript, and Mapbox GL. Features a full-screen globe with city markers, a sliding weather panel with real-time conditions and 5-day forecast charts, responsive mobile bottom-sheet with swipe gestures, and full keyboard/screen-reader accessibility.

## Tech Stack
- **Framework**: React 19.2.4 + TypeScript 5.9.3
- **Build Tool**: Vite 8.0.0
- **Map**: Mapbox GL JS 3 + react-map-gl 8
- **Charts**: Chart.js 4.5 + react-chartjs-2
- **Unit Testing**: Vitest 4.1 + React Testing Library 16
- **E2E Testing**: Playwright 1.58
- **CI**: GitHub Actions
- **Deployment**: Vercel

## Features
- Full-screen interactive Mapbox globe with custom-styled layers
- 10 city markers with keyboard navigation and pulse animation
- Real-time weather via Open-Meteo with offline fallback to mock data
- 5-day forecast with temperature trend charts
- Unit toggle (°F/°C, mph/km/h)
- Responsive bottom-sheet panel with swipe-to-dismiss on mobile
- ARIA labels, focus management, and live regions for accessibility
- URL sync via `?city=<id>` query params for shareable links

## Quality Metrics
- **Bundle Size**: 139 KB JS gzipped (+ 452 KB Mapbox GL)
- **Tests**: 63 passing (Vitest + React Testing Library)
- **Lint**: 0 errors (ESLint 9.39)
- **TypeScript**: Strict mode enabled, 0 errors
- **CI**: Lint, typecheck, test, build on every PR

## Links
- **Live Demo**: https://performance-teardown-demo.vercel.app
- **Repository**: https://github.com/andysolomon/performance-teardown-demo

## Key Decisions
1. **Mapbox GL over Leaflet**: Selected for globe projection, custom layer styling, and smooth 3D interactions
2. **Open-Meteo as primary weather API**: Free, no API key required — reduces setup friction for contributors
3. **Chart.js over Recharts**: Greater customization options for forecast visualizations
4. **CSS Variables**: Native dark mode support and themed map colors without CSS-in-JS overhead
5. **Bottom-sheet pattern on mobile**: Touch-friendly swipe gestures instead of modal dialogs
