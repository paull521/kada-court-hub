import KchLogo from "@/components/KchLogo";
import FastBottomNav from "@/components/FastBottomNav";
import { captainNavLinks } from "@/lib/nav-links";
import NotificationCenter from "@/components/NotificationCenter";
import { SkeletonTitle, SkeletonCard, SkeletonRow } from "@/components/Skeleton";

// CaptainShell requires a full CaptainPortalData, which this boundary renders
// before there is any data to give it, so the nav is built from the same table.
const items = captainNavLinks.map((link) => ({ ...link }));

export default function Loading() {
  return (
    <div className="shell captain-shell">
      <header className="topbar">
        <KchLogo className="logo" />
        {/* The bell itself, not a grey chip standing in for it: the button and
            the sheet it opens are markup, and only the unread count needs the
            read the shell is waiting on. */}
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
