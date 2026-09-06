import KchLogo from "@/components/KchLogo";
import type { ReactNode } from "react";
import CaptainContextSwitcher from "@/components/CaptainContextSwitcher";
import FastBottomNav from "@/components/FastBottomNav";
import { captainNavLinks } from "@/lib/nav-links";
import type { CaptainPortalData } from "@/lib/captain-data";

export type CaptainNavKey = (typeof captainNavLinks)[number]["key"] | "dashboard" | "more";

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
  const items = captainNavLinks.map(({ href, key, icon, label }) => ({
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
