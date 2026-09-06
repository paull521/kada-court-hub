import KchLogo from "@/components/KchLogo";
import type { ReactNode } from "react";
import OwnerBottomNav, { type OwnerNavKey } from "@/components/OwnerBottomNav";
import OwnerConferenceSwitcher from "@/components/OwnerConferenceSwitcher";
import type { OwnerConferenceOption } from "@/lib/owner-data";

export default function OwnerPageShell({
  title,
  subtitle,
  active,
  conferenceId,
  conferences,
  children,
}: {
  title: string;
  subtitle: string;
  active: OwnerNavKey;
  conferenceId: string;
  conferences: OwnerConferenceOption[];
  children: ReactNode;
}) {
  return (
    <div className="shell owner-shell guided-owner-shell">
      <header className="topbar">
        <KchLogo className="logo" />
        <OwnerConferenceSwitcher conferences={conferences} currentId={conferenceId} />
      </header>
      <OwnerBottomNav active={active} />
      <main className="content owner-content">
        <h1 className="title">{title}</h1>
        <p className="subtitle">{subtitle}</p>
        {children}
      </main>
    </div>
  );
}
