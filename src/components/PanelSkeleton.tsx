import './PanelSkeleton.css'

export function PanelSkeleton() {
  return (
    <div className="dashboard" aria-busy="true" aria-label="Loading weather data">
      <header className="dashboard-header">
        <div className="skeleton skeleton-heading" />
        <div className="skeleton skeleton-text" />
        <div className="skeleton skeleton-text-sm" />
      </header>

      <section className="metrics-grid">
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
        <div className="skeleton skeleton-card" />
      </section>

      <section className="charts-section">
        <div className="skeleton skeleton-chart" />
        <div className="chart-row">
          <div className="skeleton skeleton-chart-sm" />
          <div className="skeleton skeleton-chart-sm" />
        </div>
      </section>

      <section className="additional-info">
        <div className="skeleton skeleton-info" />
        <div className="skeleton skeleton-info" />
        <div className="skeleton skeleton-info" />
        <div className="skeleton skeleton-info" />
      </section>
    </div>
  )
}
