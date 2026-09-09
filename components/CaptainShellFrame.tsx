import type { ReactNode } from "react";
import KchLogo from "@/components/KchLogo";
import NotificationCenter from "@/components/NotificationCenter";
import FastBottomNav from "@/components/FastBottomNav";
import { captainNavLinks } from "@/lib/nav-links";
import { SkeletonText } from "@/components/Skeleton";
import type { CaptainNavKey } from "@/components/CaptainShell";
import { topbarActions } from "@/components/ui/shared-classes";

// CaptainShell requires a resolved CaptainPortalData, and a loading.tsx has no
// data at all, so the chrome is rebuilt here from the same nav table.
const items = captainNavLinks.map((link) => ({ ...link }));

/**
 * The captain shell for a route-level boundary: logo, live bell, real tab bar,
 * and the page's heading if that heading is a fixed string.
 *
 * It exists so that every captain route can have a loading.tsx of its own.
 * app/captain/loading.tsx sits at the top of the segment and therefore covers
 * all of them, so without one per route, pressing Teams drew the dashboard's
 * tiles for a moment and then the team page's frame - the wrong screen first,
 * then the right one.
 */
export default function CaptainShellFrame({
  active,
  title,
  subtitle,
  contentClass = "",
  children,
}: {
  active: CaptainNavKey;
  /** Omit where the page is headed by the team name, which has to be read. */
  title?: string;
  subtitle?: string;
  contentClass?: string;
  children: ReactNode;
}) {
  const selected = active === "dashboard" ? "home" : active === "more" ? "profile" : active;
  return (
    <div className="shell captain-shell">
      <header className="topbar">
        <KchLogo className="logo" href="/captain" />
        <div className={topbarActions}>
          <NotificationCenter notifications={[]} />
        </div>
      </header>
      {/* The captain-bottom class was missing here once, and the nav restyled
          itself the moment the real shell took over. */}
      <FastBottomNav
        items={items}
        active={selected}
        className="bottom captain-bottom"
        label="Captain navigation"
      />
      <main className={`content captain-content ${contentClass}`.trim()}>
        <h1 className="title">{title ?? <SkeletonText width="7em" />}</h1>
        <p className="subtitle">{subtitle ?? <SkeletonText width="13em" />}</p>
        {children}
      </main>
    </div>
  );
}
