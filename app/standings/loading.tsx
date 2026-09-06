import AppShell from "@/components/AppShell";
import { SkeletonBell, SkeletonCard, SkeletonRow } from "@/components/Skeleton";

export default function Loading() {
  return (
    <AppShell active="standings" headerNotification={<SkeletonBell />}>
      <div role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading</span>
        <SkeletonCard count={1} />
        <SkeletonRow count={6} />
      </div>
    </AppShell>
  );
}
