import AppShell from "@/components/AppShell";
import { SkeletonBell, SkeletonTitle, SkeletonCard, SkeletonRow } from "@/components/Skeleton";

export default function Loading() {
  return (
    <AppShell active="profile" headerNotification={<SkeletonBell />}>
      <div role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading</span>
        <SkeletonTitle />
        <SkeletonCard count={1} />
        <SkeletonRow count={4} />
      </div>
    </AppShell>
  );
}
