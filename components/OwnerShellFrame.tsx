import type { ReactNode } from "react";
import KchLogo from "@/components/KchLogo";
import OwnerBottomNav, { type OwnerNavKey } from "@/components/OwnerBottomNav";
import { SkeletonChip, SkeletonText } from "@/components/Skeleton";

/**
 * The owner shell for a route-level boundary. OwnerPageShell needs the
 * conference list for its switcher, which is a read; everything else it draws -
 * the logo, the nav and this page's title and subtitle - is fixed, and the
 * title and subtitle have always been plain strings the page passes in.
 *
 * It exists so that each owner page can have a loading.tsx of its own.
 * app/owner/loading.tsx sits at the top of the segment and covers all of them,
 * so pressing Schedule drew the dashboard's skeleton first and the schedule
 * page's frame second - the wrong screen, then the right one. That file is left
 * exactly as it was: it is the dashboard's own boundary, and the dashboard is
 * the one page here that was already loading the way it should.
 */
export default function OwnerShellFrame({
  title,
  subtitle,
  active,
  children,
}: {
  /** Omit only where the heading itself depends on the read or on a param this
      boundary cannot see - /owner/roster is titled from ?view=. */
  title?: string;
  subtitle?: string;
  active: OwnerNavKey;
  children: ReactNode;
}) {
  return (
    <div className="shell owner-shell guided-owner-shell">
      <header className="topbar">
        <KchLogo className="logo" href="/owner" />
        {/* The switcher names the conference, which is the read this is waiting
            on, so it is the one thing here that cannot be drawn. */}
        <SkeletonChip />
      </header>
      <OwnerBottomNav active={active} />
      <main className="content owner-content">
        <h1 className="title">{title ?? <SkeletonText width="7em" />}</h1>
        <p className="subtitle">{subtitle ?? <SkeletonText width="15em" />}</p>
        {children}
      </main>
    </div>
  );
}
