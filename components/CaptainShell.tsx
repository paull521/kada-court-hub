import KchLogo from "@/components/KchLogo";
import { CalendarDays, Home, User, Users, Wallet } from "lucide-react";
import type { ReactNode } from "react";
import CaptainContextSwitcher from "@/components/CaptainContextSwitcher";
import FastBottomNav from "@/components/FastBottomNav";
import type { CaptainPortalData } from "@/lib/captain-data";

const links = [
  { href: "/captain", key: "home", icon: <Home />, label: "Home" },
  { href: "/captain/team", key: "team", icon: <Users />, label: "Teams" },
  { href: "/captain/schedule", key: "schedule", icon: <CalendarDays />, label: "Schedule" },
  { href: "/captain/payments", key: "payments", icon: <Wallet />, label: "Payments" },
  { href: "/profile", key: "profile", icon: <User />, label: "Profile" },
] as const;
export type CaptainNavKey = (typeof links)[number]["key"] | "dashboard" | "more";

export default function CaptainShell({
  data,
  active,
  title,
  subtitle,
  children,
  contentClass = "",
}: {
  data: CaptainPortalData;
  active: CaptainNavKey;
  title: string;
  subtitle: string;
  children: ReactNode;
  contentClass?: string;
}) {
  const selected = active === "dashboard" ? "home" : active === "more" ? "profile" : active;
  const items = links.map(({ href, key, icon, label }) => ({
    href,
    key,
    icon,
    label,
    dot: key === "team" && data.hasUnavailable ? "alert" : undefined,
  }));
  return (
    <div className="shell captain-shell">
      <header className="topbar">
        <KchLogo className="logo" />
        <CaptainContextSwitcher
          contexts={data.contexts}
          activeRegistrationId={data.activeRegistrationId}
        />
      </header>
      <main className={`content captain-content ${contentClass}`.trim()}>
        <p className="eyebrow">CONFERENCE: {data.conferenceName}</p>
        <h1 className="title">{title}</h1>
        <p className="subtitle">{subtitle}</p>
        {children}
      </main>
      <FastBottomNav
        items={items}
        active={selected}
        className="bottom captain-bottom"
        label="Captain navigation"
      />
    </div>
  );
}
