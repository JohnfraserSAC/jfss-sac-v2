export function ClubCardSkeleton() {
  return (
    <article className="club-card club-card--skeleton" aria-hidden="true">
      <div className="club-card__media">
        <div className="skeleton skeleton--logo" />
      </div>
      <div className="club-card__body">
        <div className="skeleton skeleton--title" />
        <div className="skeleton skeleton--line" />
        <div className="skeleton skeleton--line skeleton--line-short" />
        <div className="skeleton skeleton--meta" />
        <div className="skeleton skeleton--link" />
      </div>
    </article>
  );
}

export function ClubGridSkeleton({ count = 6 }) {
  return (
    <div
      className="club-grid"
      aria-busy="true"
      aria-label="Loading clubs"
    >
      {Array.from({ length: count }, (_, index) => (
        <ClubCardSkeleton key={`club-skeleton-${index}`} />
      ))}
    </div>
  );
}
