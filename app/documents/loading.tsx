import AppShell from "@/components/AppShell";
import { SkeletonCard, SkeletonTitle } from "@/components/Skeleton";

export default function Loading() {
  return (
    <AppShell active="profile">
      <div role="status" aria-live="polite" aria-busy="true">
        <span className="sr-only">Loading</span>
        <SkeletonTitle />
        <SkeletonCard count={2} />
      </div>
    </AppShell>
  );
}
