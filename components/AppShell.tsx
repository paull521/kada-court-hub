import KchLogo from "@/components/KchLogo";
import { CalendarDays, Home, User, Users, Wallet } from "lucide-react";
import { ReactNode } from "react";
import NotificationCenter from "@/components/NotificationCenter";
import FastBottomNav from "@/components/FastBottomNav";
import type { PlayerNotification } from "@/lib/kch-data";

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
  notifications = [],
  profileNeedsAttention = false,
  paymentNeedsAttention = false,
  teamHasUnavailable = false,
  homeHref = "/home",
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
  homeHref?: string;
  headerAction?: ReactNode;
  headerNotification?: ReactNode;
  /** Page heading. Names the team the page is showing, as the captain shell does. */
  title?: string;
  subtitle?: string;
  contentClass?: string;
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
        <KchLogo className="logo" />
        <div className="topbar-actions">
          {headerAction}
          {headerNotification ?? <NotificationCenter notifications={notifications} />}
        </div>
      </header>
      <FastBottomNav items={items} active={active} label="Player navigation" />
      <main className={`content ${contentClass}`.trim()}>
        {title && <h1 className="title">{title}</h1>}
        {subtitle && <p className="subtitle">{subtitle}</p>}
        {children}
      </main>
    </div>
  );
}
