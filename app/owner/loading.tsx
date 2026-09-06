import KchLogo from "@/components/KchLogo";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import { SkeletonChip, SkeletonTitle, SkeletonCard, SkeletonRow } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="shell owner-shell guided-owner-shell">
      <header className="topbar">
        <KchLogo className="logo" />
        <div className="topbar-actions">
          <SkeletonChip />
        </div>
      </header>
      <OwnerBottomNav active="home" />
      <main className="content">
        <div role="status" aria-live="polite" aria-busy="true">
          <span className="sr-only">Loading</span>
          <SkeletonTitle />
          <SkeletonCard count={2} />
          <SkeletonRow count={4} />
        </div>
      </main>
    </div>
  );
}
