/**
 * Placeholder blocks used by route-level loading.tsx files. Purely presentational
 * and aria-hidden: the surrounding loading.tsx carries the live-region label.
 */
export function SkeletonTitle() {
  return <span className="skeleton skeleton-title" aria-hidden="true" />;
}

export function SkeletonChip() {
  return <span className="skeleton skeleton-chip" aria-hidden="true" />;
}

export function SkeletonCard({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className="skeleton skeleton-card" aria-hidden="true" />
      ))}
    </>
  );
}

export function SkeletonRow({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, index) => (
        <span key={index} className="skeleton skeleton-row" aria-hidden="true" />
      ))}
    </>
  );
}

export function SkeletonBell() {
  return <span className="skeleton skeleton-bell" aria-hidden="true" />;
}
