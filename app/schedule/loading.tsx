import AppShell from "@/components/AppShell";
import { SkeletonChip, SkeletonTitle, SkeletonCard, SkeletonRow } from "@/components/Skeleton";

/**
 * Rendered instantly while /schedule resolves its server data. The real bottom nav
 * is kept so the tapped tab highlights straight away; the header switcher is
 * replaced by a chip because it needs data this boundary does not have.
 */
export default function Loading() {
  return (
    <AppShell active="schedule" headerAction={<SkeletonChip />}>
      <div role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading</span>
        <SkeletonTitle />
        <SkeletonCard count={2} />
        <SkeletonRow count={4} />
      </div>
    </AppShell>
  );
}
