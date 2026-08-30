/** Marcadores de posición mientras Firestore conecta por primera vez. */
export default function DashboardSkeleton() {
  return (
    <div className="skeleton-wrap" aria-hidden="true">
      <div className="stats-hero">
        <div className="skeleton-block hero-card" style={{ gridColumn: 'span 2' }} />
        <div className="skeleton-block hero-card" />
        <div className="skeleton-block hero-card" />
        <div className="skeleton-block hero-card" />
      </div>
      <div className="stats-grid">
        {Array.from({ length: 5 }).map((_, i) => (
          <div className="skeleton-block stat-card" key={i} />
        ))}
      </div>
      <div className="skeleton-block" style={{ height: 200, borderRadius: 12, marginBottom: 14 }} />
      <div className="skeleton-block" style={{ height: 260, borderRadius: 12 }} />
    </div>
  );
}
