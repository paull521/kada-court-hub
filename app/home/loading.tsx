import AppShell from "@/components/AppShell";
import { SkeletonBell, SkeletonTitle, SkeletonCard, SkeletonRow } from "@/components/Skeleton";

/**
 * Rendered instantly while /home resolves its server data. The real bottom nav
 * is kept so the tapped tab highlights straight away. The bell is replaced by a
 * placeholder - it needs notifications, which this boundary does not have - so
 * the header greys out with the rest of the page instead of staying live above
 * a skeleton.
 */
export default function Loading() {
  return (
    <AppShell active="home" headerNotification={<SkeletonBell />}>
      <div role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading</span>
        <SkeletonTitle />
        <SkeletonCard count={1} />
        <SkeletonRow count={3} />
      </div>
    </AppShell>
  );
}
