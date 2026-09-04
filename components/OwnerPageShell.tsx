import Image from "next/image";
import type { ReactNode } from "react";
import OwnerBottomNav, { type OwnerNavKey } from "@/components/OwnerBottomNav";
import OwnerConferenceSwitcher from "@/components/OwnerConferenceSwitcher";
import type { OwnerConferenceOption } from "@/lib/owner-data";

export default function OwnerPageShell({
  title,
  subtitle,
  active,
  conferenceName,
  conferenceId,
  conferences,
  children,
}: {
  title: string;
  subtitle: string;
  active: OwnerNavKey;
  conferenceName: string;
  conferenceId: string;
  conferences: OwnerConferenceOption[];
  children: ReactNode;
}) {
  return (
    <div className="shell owner-shell guided-owner-shell">
      <header className="topbar">
        <Image
          src="/kch-logo.png"
          alt="KadaCourtHub"
          width={340}
          height={130}
          className="logo"
          priority
        />
        <OwnerConferenceSwitcher conferences={conferences} currentId={conferenceId} />
      </header>
      <main className="content owner-content">
        <p className="eyebrow">CONFERENCE: {conferenceName}</p>
        <h1 className="title">{title}</h1>
        <p className="subtitle">{subtitle}</p>
        {children}
      </main>
      <OwnerBottomNav active={active} />
    </div>
  );
}
