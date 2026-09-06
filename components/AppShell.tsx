import KchLogo from "@/components/KchLogo";
import { ReactNode } from "react";
import NotificationCenter from "@/components/NotificationCenter";
import FastBottomNav from "@/components/FastBottomNav";
import { captainNavLinks, ownerNavLinks, playerNavLinks } from "@/lib/nav-links";
import type { PlayerNotification } from "@/lib/kch-data";

const nav = {
  player: { links: playerNavLinks, className: "bottom", label: "Player navigation" },
  captain: {
    links: captainNavLinks,
    className: "bottom captain-bottom",
    label: "Captain navigation",
  },
  owner: { links: ownerNavLinks, className: "bottom owner-bottom", label: "Owner navigation" },
};

export default function AppShell({
  children,
  active,
  notifications = [],
  profileNeedsAttention = false,
  paymentNeedsAttention = false,
  teamHasUnavailable = false,
  role = "player",
  headerAction,
  headerNotification,
  title = "",
  subtitle = "",
  contentClass = "",
}: {
  children: ReactNode;
  active: string;
  notifications?: PlayerNotification[];
  profileNeedsAttention?: boolean;
  paymentNeedsAttention?: boolean;
  teamHasUnavailable?: boolean;
  /** Which workspace the page is being viewed as. Profile is reachable as any
      of the three, and the bottom nav has to lead back into that one. */
  role?: "player" | "captain" | "owner";
  headerAction?: ReactNode;
  headerNotification?: ReactNode;
  /** Page heading. Names the team the page is showing, as the captain shell does. */
  title?: string;
  subtitle?: string;
  contentClass?: string;
}) {
  const { links, className: navClass, label: navLabel } = nav[role];
  const items = links.map(({ href, key, icon, label }) => ({
    href,
    key,
    icon,
    label,
    dot:
      key === "team"
        ? teamHasUnavailable
          ? "team-no"
          : "team-yes"
        : (key === "profile" && profileNeedsAttention) ||
            (key === "payments" && paymentNeedsAttention)
          ? "alert"
          : undefined,
  }));
  return (
    <div className="shell">
      <header className="topbar">
        <KchLogo className="logo" />
        <div className="topbar-actions">
          {headerAction}
          {headerNotification ?? <NotificationCenter notifications={notifications} />}
        </div>
      </header>
      <FastBottomNav items={items} active={active} className={navClass} label={navLabel} />
      <main className={`content ${contentClass}`.trim()}>
        {title && <h1 className="title">{title}</h1>}
        {subtitle && <p className="subtitle">{subtitle}</p>}
        {children}
      </main>
    </div>
  );
}
