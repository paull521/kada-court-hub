import AppShell from "@/components/AppShell";
import {
  SkeletonBell,
  SkeletonChip,
  SkeletonTitle,
  SkeletonCard,
  SkeletonRow,
} from "@/components/Skeleton";

/**
 * Rendered instantly while /schedule resolves its server data. The real bottom nav
 * is kept so the tapped tab highlights straight away. Both header controls are
 * replaced by placeholders - the switcher needs contexts and the bell needs
 * notifications, neither of which this boundary has - so the header greys out
 * with the rest of the page instead of the bell staying live above a skeleton.
 */
export default function Loading() {
  return (
    <AppShell
      active="schedule"
      headerAction={<SkeletonChip />}
      headerNotification={<SkeletonBell />}
    >
      <div role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading</span>
        <SkeletonTitle />
        <SkeletonCard count={2} />
        <SkeletonRow count={4} />
      </div>
    </AppShell>
  );
}
