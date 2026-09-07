import KchLogo from "@/components/KchLogo";
import NotificationCenter from "@/components/NotificationCenter";
import FastBottomNav from "@/components/FastBottomNav";
import { captainNavLinks } from "@/lib/nav-links";
import CaptainDashboardFrame from "@/components/CaptainDashboardFrame";
import { SkeletonText } from "@/components/Skeleton";

// CaptainShell requires a full CaptainPortalData, which this boundary renders
// before there is any data to give it, so the nav is built from the same table.
const items = captainNavLinks.map((link) => ({ ...link }));

/**
 * The dashboard, without its numbers. The bell is the bell rather than a grey
 * chip, the four tiles are the four tiles, and only the team name, the fixtures
 * and the counts are waiting.
 */
export default function Loading() {
  return (
    <div className="shell captain-shell">
      <header className="topbar">
        <KchLogo className="logo" />
        <div className="topbar-actions">
          <NotificationCenter notifications={[]} />
        </div>
      </header>
      {/* The captain-bottom class was missing here, so the nav restyled itself
          the moment the real shell took over. */}
      <FastBottomNav
        items={items}
        active="home"
        className="bottom captain-bottom"
        label="Captain navigation"
      />
      <main className="content captain-content">
        <h1 className="title">
          <SkeletonText width="7em" />
        </h1>
        <p className="subtitle">
          <SkeletonText width="13em" />
        </p>
        <CaptainDashboardFrame />
      </main>
    </div>
  );
}
