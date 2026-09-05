import Image from "next/image";
import { CalendarDays, Home, User, Users, Wallet } from "lucide-react";
import { ReactNode } from "react";
import PlayerContextSwitcher from "@/components/PlayerContextSwitcher";
import NotificationCenter from "@/components/NotificationCenter";
import FastBottomNav from "@/components/FastBottomNav";
import type { PlayerContextOption, PlayerNotification } from "@/lib/kch-data";

const links = [
  { href: "/home", key: "home", icon: <Home />, label: "Home" },
  { href: "/my-team", key: "team", icon: <Users />, label: "Teams" },
  { href: "/schedule", key: "schedule", icon: <CalendarDays />, label: "Schedule" },
  { href: "/payments", key: "payments", icon: <Wallet />, label: "Payments" },
  { href: "/profile", key: "profile", icon: <User />, label: "Profile" },
];

export default function AppShell({
  children,
  active,
  contexts = [],
  activeRegistrationId = "",
  notifications = [],
  profileNeedsAttention = false,
  paymentNeedsAttention = false,
  teamHasUnavailable = false,
  homeHref = "/home",
  conferenceName = "",
  headerAction,
}: {
  children: ReactNode;
  active: string;
  contexts?: PlayerContextOption[];
  activeRegistrationId?: string;
  notifications?: PlayerNotification[];
  profileNeedsAttention?: boolean;
  paymentNeedsAttention?: boolean;
  teamHasUnavailable?: boolean;
  homeHref?: string;
  conferenceName?: string;
  headerAction?: ReactNode;
}) {
  const items = links.map(({ href, key, icon, label }) => ({
    href: key === "home" ? homeHref : href,
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
        <Image
          src="/kch-logo.png"
          alt="KadaCourtHub"
          width={340}
          height={130}
          className="logo"
          priority
        />
        <div className="topbar-actions">
          {headerAction ?? (
            <PlayerContextSwitcher
              contexts={contexts}
              activeRegistrationId={activeRegistrationId}
            />
          )}
          <NotificationCenter notifications={notifications} />
        </div>
      </header>
      <main className="content">
        {conferenceName && <p className="eyebrow">CONFERENCE: {conferenceName}</p>}
        {children}
      </main>
      <FastBottomNav items={items} active={active} label="Player navigation" />
    </div>
  );
}
