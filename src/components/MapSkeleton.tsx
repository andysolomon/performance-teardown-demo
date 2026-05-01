import './MapSkeleton.css'

/**
 * Lightweight placeholder shown while the heavy `mapbox-gl` chunk loads.
 * Has zero JS dependencies of its own so it ships with the eager bundle and
 * paints immediately, preventing layout shift when the real map mounts.
 */
export function MapSkeleton() {
  return (
    <div
      className="map-skeleton"
      role="status"
      aria-label="Loading map"
      data-testid="map-skeleton"
    >
      <div className="map-skeleton-shimmer" aria-hidden="true" />
    </div>
  )
}
