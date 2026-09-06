import KchLogo from "@/components/KchLogo";
import OwnerBottomNav from "@/components/OwnerBottomNav";
import { OwnerContentPlaceholder, SkeletonChip, SkeletonTitle } from "@/components/Skeleton";

/**
 * Covers the short wait for the conference header. Once that lands the real
 * shell takes over and each page's own <Suspense> keeps
 * OwnerContentPlaceholder on screen for the heavy read, so the body of the
 * page does not change shape between the two phases.
 */
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
        <SkeletonTitle />
        <OwnerContentPlaceholder />
      </main>
    </div>
  );
}
