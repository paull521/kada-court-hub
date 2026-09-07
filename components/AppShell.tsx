import KchLogo from "@/components/KchLogo";
import { ReactNode } from "react";
import NotificationCenter from "@/components/NotificationCenter";
import FastBottomNav from "@/components/FastBottomNav";
import { captainNavLinks, ownerNavLinks, playerNavLinks } from "@/lib/nav-links";
import {
  AlertDot,
  BadgeSlot,
  NAV_ALERT,
  NotificationSlot,
  TeamDot,
  type ShellChrome,
} from "@/components/NavBadges";
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

/**
 * Pass `chrome` an unresolved portal read and the shell paints straight away:
 * the logo, the tab bar and the page body appear, and the bell and nav badges
 * stream in behind their own boundaries. Pages that already hold the resolved
 * data can keep passing the plain props instead - app/more has no portal read
 * at all and passes neither.
 */
export default function AppShell({
  children,
  active,
  chrome,
  notifications = [],
  profileNeedsAttention = false,
  paymentNeedsAttention = false,
  teamHasUnavailable = false,
  role = "player",
  headerAction,
  headerNotification,
  contentClass = "",
}: {
  children: ReactNode;
  active: string;
  /** The portal read, unresolved. Streams the bell and the badges. */
  chrome?: Promise<ShellChrome>;
  notifications?: PlayerNotification[];
  profileNeedsAttention?: boolean;
  paymentNeedsAttention?: boolean;
  teamHasUnavailable?: boolean;
  /** Which workspace the page is being viewed as. Profile is reachable as any
      of the three, and the bottom nav has to lead back into that one. */
  role?: "player" | "captain" | "owner";
  headerAction?: ReactNode;
  headerNotification?: ReactNode;
  contentClass?: string;
}) {
  const { links, className: navClass, label: navLabel } = nav[role];
  const items = links.map(({ href, key, icon, label }) => ({
    href,
    key,
    icon,
    label,
    dot: chrome ? (
      key === "team" ? (
        <BadgeSlot>
          <TeamDot chrome={chrome} />
        </BadgeSlot>
      ) : key === "profile" || key === "payments" ? (
        <BadgeSlot>
          <AlertDot
            chrome={chrome}
            field={key === "profile" ? "profileNeedsAttention" : "paymentNeedsAttention"}
          />
        </BadgeSlot>
      ) : undefined
    ) : key === "team" ? (
      <i className={`nav-team-dot ${teamHasUnavailable ? "no" : "yes"}`} />
    ) : (key === "profile" && profileNeedsAttention) ||
      (key === "payments" && paymentNeedsAttention) ? (
      NAV_ALERT
    ) : undefined,
  }));
  return (
    <div className="shell">
      <header className="topbar">
        <KchLogo className="logo" />
        <div className="topbar-actions">
          {headerAction}
          {headerNotification ??
            (chrome ? (
              <NotificationSlot chrome={chrome} />
            ) : (
              <NotificationCenter notifications={notifications} />
            ))}
        </div>
      </header>
      <FastBottomNav items={items} active={active} className={navClass} label={navLabel} />
      <main className={`content ${contentClass}`.trim()}>{children}</main>
    </div>
  );
}
