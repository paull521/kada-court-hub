/**
 * Placeholder blocks used by route-level loading.tsx files and by the in-page
 * <Suspense> boundaries that stream slow sections. Purely presentational and
 * aria-hidden: the surrounding loading.tsx or OwnerContentPlaceholder carries
 * the live-region label.
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

/**
 * The body of an owner page while its data is still in flight.
 *
 * Shared by app/owner/loading.tsx and by the <Suspense> boundary each owner
 * page wraps its content in, so the two loading phases look the same and the
 * screen does not reshuffle between them: the route skeleton covers the short
 * wait for the conference header, and this same block stays in place under the
 * real header while the heavy read finishes.
 */
export function OwnerContentPlaceholder() {
  return (
    <div role="status" aria-live="polite" aria-busy="true">
      <span className="sr-only">Loading</span>
      <SkeletonCard count={2} />
      <SkeletonRow count={4} />
    </div>
  );
}
