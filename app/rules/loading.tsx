import AppShell from "@/components/AppShell";
import {
  SkeletonBell,
  SkeletonChip,
  SkeletonTitle,
  SkeletonCard,
  SkeletonRow,
} from "@/components/Skeleton";

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
        <SkeletonRow count={3} />
      </div>
    </AppShell>
  );
}
