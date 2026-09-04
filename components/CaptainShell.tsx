import Image from "next/image";
import type { ReactNode } from "react";
import CaptainContextSwitcher from "@/components/CaptainContextSwitcher";
import FastBottomNav from "@/components/FastBottomNav";
import type { CaptainPortalData } from "@/lib/captain-data";

const links = [
  ["/captain", "home", "⌂", "Home"],
  ["/captain/team", "team", "♟", "Teams"],
  ["/captain/schedule", "schedule", "▦", "Schedule"],
  ["/captain/payments", "payments", "▣", "Payments"],
  ["/profile", "profile", "♙", "Profile"],
] as const;
export type CaptainNavKey = (typeof links)[number][1] | "dashboard" | "more";

export default function CaptainShell({
  data,
  active,
  title,
  subtitle,
  children,
}: {
  data: CaptainPortalData;
  active: CaptainNavKey;
  title: string;
  subtitle: string;
  children: ReactNode;
}) {
  const selected = active === "dashboard" ? "home" : active === "more" ? "profile" : active;
  const items = links.map(([href, key, icon, label]) => ({
    href,
    key,
    icon,
    label,
    dot: key === "team" && data.hasUnavailable ? "alert" : undefined,
  }));
  return (
    <div className="shell captain-shell">
      <header className="topbar">
        <Image
          src="/kch-logo.png"
          alt="KadaCourtHub"
          width={340}
          height={130}
          className="logo"
          priority
        />
        <CaptainContextSwitcher
          contexts={data.contexts}
          activeRegistrationId={data.activeRegistrationId}
        />
      </header>
      <main className="content captain-content">
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
